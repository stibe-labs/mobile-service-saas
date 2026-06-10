const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

async function fetchAPI(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  if (token) options.headers['Authorization'] = `Bearer ${token}`;
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  console.log('--- Starting API Tests ---');
  let superadminToken = '';
  let branch1Token = '';
  let branch2Token = '';
  let branch1Id = '';
  let branch2Id = '';
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Auth Phase
  console.log('\n--- Phase 1: Authentication ---');
  
  // Superadmin login
  let res = await fetchAPI('/auth/login', 'POST', { email: 'superadmin@gmail.com', password: 'admin123' });
  assert(res.status === 200 && res.data.token, 'Superadmin login successful');
  superadminToken = res.data.token;

  // Branch1 login
  res = await fetchAPI('/auth/login', 'POST', { email: 'branch1@mobileshop.com', password: 'branch123' });
  assert(res.status === 200 && res.data.token, 'Branch1 login successful');
  branch1Token = res.data.token;

  // Get Branch1's branch ID
  res = await fetchAPI('/tenant/branches', 'GET', null, branch1Token);
  let b1Branches = res.data.branches || [];
  let b1Branch = b1Branches.find(b => b.branch_code === 'BR1');
  branch1Id = b1Branch ? b1Branch.id : null;

  // 2. Setup Branch2 if not exists, or get its ID
  res = await fetchAPI('/admin/tenants', 'GET', null, superadminToken);
  let tenants = res.data.tenants || [];
  let b2Tenant = tenants.find(t => t.name.trim() === 'raju branch 2');
  if (!b2Tenant) {
     res = await fetchAPI('/admin/tenants', 'POST', {
         name: "raju branch 2", password: "branch123", email: "b2@test.com"
     }, superadminToken);
     console.log('Create Tenant2 response:', res.status, res.data);
     b2Tenant = res.data.tenant;
  }
  
  res = await fetchAPI('/auth/login', 'POST', { email: 'b2@test.com', password: 'branch123' });
  console.log('Login Branch2 response:', res.status, res.data);
  if (res.status !== 200) {
      // try resetting password if login fails
      await fetchAPI(`/admin/tenants/${b2Tenant.id}/reset-password`, 'POST', { newPassword: 'branch123' }, superadminToken);
      res = await fetchAPI('/auth/login', 'POST', { email: 'b2@test.com', password: 'branch123' });
  }
  assert(res.status === 200 && res.data.token, 'Branch2 login successful');
  branch2Token = res.data.token;

  // Setup Branch2's branch
  res = await fetchAPI('/tenant/branches', 'GET', null, branch2Token);
  let b2Branches = res.data.branches || [];
  let b2Branch = b2Branches[0];
  branch2Id = b2Branch.id;

  // 3. RBAC Phase
  console.log('\n--- Phase 2: RBAC ---');
  res = await fetchAPI('/admin/tenants', 'GET', null, branch1Token);
  assert(res.status === 403, 'Tenant blocked from /admin routes (403)');
  
  res = await fetchAPI('/services', 'GET', null, superadminToken);
  assert(res.status === 403, 'Superadmin blocked from tenant /services routes (403)');

  // 4. Data Isolation Phase
  console.log('\n--- Phase 3: Data Isolation ---');
  // Branch1 creates a brand
  let brandName = `TestBrand-${Date.now()}`;
  res = await fetchAPI('/models/brands', 'POST', { name: brandName, branchId: branch1Id }, branch1Token);
  assert(res.status === 201, 'Branch1 created brand successfully');
  const branch1BrandId = res.data.brand.id;

  // Branch2 attempts to list brands, shouldn't see Branch1's brand
  res = await fetchAPI('/models/brands', 'GET', null, branch2Token);
  let b2Brands = res.data.brands || [];
  assert(!b2Brands.find(b => b.name === brandName), 'Branch2 cannot see Branch1 brand');

  // Branch1 creates a service
  res = await fetchAPI('/services', 'POST', {
    customerName: 'Isolation Test', customerPhone: '9999999999', brandId: branch1BrandId, 
    modelId: null, imeiNumber: '1234', problemDescription: 'Test', advancePayment: 0,
    branchId: branch1Id
  }, branch1Token);
  assert(res.status === 201, 'Branch1 created service job');
  const serviceId = res.data.service.id;

  // Branch2 tries to read the service
  res = await fetchAPI(`/services/${serviceId}`, 'GET', null, branch2Token);
  assert(res.status === 404, 'Branch2 cannot fetch Branch1 service job (404)');

  // 5. Feature Toggles
  console.log('\n--- Phase 4: Feature Toggles ---');
  // Admin turns off add_service for Branch1
  let b1Tenant = tenants.find(t => t.name === 'Main Branch') || { id: res.data.tenant?.id };
  res = await fetchAPI(`/admin/tenants/${b1Tenant.id}/toggles`, 'PATCH', { add_service: false }, superadminToken);
  assert(res.status === 200, 'Superadmin disabled add_service toggle for Branch1');
  
  res = await fetchAPI('/services', 'POST', {
    customerName: 'Toggle Test', customerPhone: '9999999999', brandId: branch1BrandId, 
    modelId: null, imeiNumber: '1234', problemDescription: 'Test', advancePayment: 0,
    branchId: branch1Id
  }, branch1Token);
  assert(res.status === 403, 'Branch1 blocked from creating service when toggle is OFF (403)');

  // Admin turns add_service back on
  res = await fetchAPI(`/admin/tenants/${b1Tenant.id}/toggles`, 'PATCH', { add_service: true }, superadminToken);
  
  res = await fetchAPI('/services', 'POST', {
    customerName: 'Toggle Test 2', customerPhone: '9999999999', brandId: branch1BrandId, 
    modelId: null, imeiNumber: '1234', problemDescription: 'Test', advancePayment: 0,
    branchId: branch1Id
  }, branch1Token);
  assert(res.status === 201, 'Branch1 can create service when toggle is ON');

  console.log(`\n--- Test Summary: ${passed} Passed, ${failed} Failed ---`);
}

runTests();
