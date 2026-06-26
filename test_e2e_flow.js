const http = require('http');

async function request(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: body ? JSON.parse(body) : null });
        } catch(e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING E2E LOGICAL TESTS ===\n');

  try {
    // 1. Sales Staff Login
    console.log('--- TEST 1: Sales Staff Flow ---');
    let res = await request('POST', '/api/auth/login', { email: 'sales_staff@test.com', password: 'password123' });
    console.log('Login Sales Staff:', res.status === 200 ? 'SUCCESS' : 'FAILED');
    const salesToken = res.data.token;

    // Sales staff accesses Inventory
    res = await request('GET', '/api/inventory', null, salesToken);
    console.log('Sales Inventory Access:', res.status === 200 ? 'SUCCESS' : 'FAILED');
    
    // Sales staff checks prices (Actually they shouldn't hit pricing directly, they get it during sales record)
    res = await request('GET', '/api/pricing', null, salesToken);
    console.log('Sales Check Prices (Should fail):', res.status === 403 ? 'SUCCESS (403)' : 'FAILED');

    // 2. Sub-Branch Manager Flow
    console.log('\n--- TEST 2: Sub-Branch Manager Flow ---');
    res = await request('POST', '/api/auth/login', { email: 'sub_manager@test.com', password: 'password123' });
    console.log('Login Sub-Branch Manager:', res.status === 200 ? 'SUCCESS' : 'FAILED');
    const subToken = res.data.token;

    res = await request('GET', '/api/analytics/sales', null, subToken);
    console.log('Sub-Manager Sales Analytics:', res.status === 200 ? 'SUCCESS' : 'FAILED');

    // 3. Main Branch Manager Flow
    console.log('\n--- TEST 3: Main Branch Manager Flow ---');
    res = await request('POST', '/api/auth/login', { email: 'main_manager@test.com', password: 'password123' });
    console.log('Login Main Branch Manager:', res.status === 200 ? 'SUCCESS' : 'FAILED');
    const mainToken = res.data.token;

    res = await request('GET', '/api/analytics/sales', null, mainToken);
    console.log('Main-Manager Cross-Branch Analytics:', res.status === 200 ? 'SUCCESS' : 'FAILED');
    
    res = await request('GET', '/api/tenant/branches', null, mainToken);
    console.log('Main-Manager Branches List:', res.status === 200 ? 'SUCCESS' : 'FAILED (Should be 200)');

    // 4. Super Admin Flow (Feature Toggles)
    console.log('\n--- TEST 4: Super Admin Toggles ---');
    res = await request('POST', '/api/auth/login', { email: 'stibe@superadmin', password: 'admin123' });
    console.log('Login Super Admin:', res.status === 200 ? 'SUCCESS' : 'FAILED');
    const adminToken = res.data.token;

    // Get Tenant
    res = await request('GET', '/api/admin/tenants', null, adminToken);
    const tenantId = res.data.tenants[0].id;

    // Turn off sales module
    res = await request('PATCH', `/api/admin/tenants/${tenantId}/toggles`, { sales_module: false }, adminToken);
    console.log('Admin Disable Sales Module:', res.status === 200 ? 'SUCCESS' : 'FAILED');

    // Verify Sales Staff can no longer hit record sales
    res = await request('POST', '/api/sales', { model_id: '1', imei: '111', customer_name: 'test', sale_price: 100 }, salesToken);
    console.log('Sales Staff Record Sale (when disabled):', res.status === 403 ? 'SUCCESS (Blocked by toggle)' : 'FAILED (Status: ' + res.status + ')');

    // Turn it back on
    res = await request('PATCH', `/api/admin/tenants/${tenantId}/toggles`, { sales_module: true }, adminToken);
    console.log('Admin Re-enable Sales Module:', res.status === 200 ? 'SUCCESS' : 'FAILED');

    console.log('\n=== ALL LOGICAL TESTS COMPLETED ===');
  } catch (err) {
    console.error('Test error:', err);
  }
}

runTests();
