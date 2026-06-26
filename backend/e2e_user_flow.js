require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

async function login(username, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed for ${username}: ${data.error}`);
  return data.token;
}

async function request(method, endpoint, token, body = null) {
  const options = {
    method,
    headers: { 'Authorization': `Bearer ${token}` }
  };
  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(`API Error [${method} ${endpoint}]: ${data.error || JSON.stringify(data)}`);
  return data;
}

(async () => {
  try {
    console.log('--- STARTING E2E API DATA VALIDATION ---');
    const suffix = Date.now().toString().slice(-4);
    
    // ----------------------------------------------------
    // PHASE 1: KAKKANAD BRANCH OPERATIONS
    // ----------------------------------------------------
    console.log('\\n[1] Logging in as Kakkanad Branch User...');
    const kbToken = await login('kakkanadbranch', 'admin123');
    console.log('✔ Logged in as Kakkanad Branch');

    console.log('\\n[1a] Kakkanad adding Part, Brand, Model, Technician...');
    const partKb = await request('POST', '/parts', kbToken, { 
      name: `KB Test Screen ${suffix}`, price: 50, stock: 10, lowStockThreshold: 2 
    });
    
    // Pass branchId. The user is a branch user, so the backend handles it or we send the branch ID
    // Wait, for branch users, the backend takes their branchId automatically, but the UI might send it.
    // Let's get the branchId from the user profile.
    const kbProfile = await request('GET', '/auth/me', kbToken);
    const kbBranchId = kbProfile.user.branch_id;

    const brandKb = await request('POST', '/models/brands', kbToken, { name: `KB Test Apple ${suffix}`, branchId: kbBranchId });
    const modelKb = await request('POST', `/models/brands/${brandKb.brand.id}/models`, kbToken, { name: `KB iPhone X ${suffix}`, branchId: kbBranchId });
    const techKb = await request('POST', '/technicians', kbToken, { name: `KB Tech John ${suffix}`, phone: '1234567890', branchId: kbBranchId });
    console.log('✔ Parts, Brands, Models, Technicians added successfully by Sub-Branch.');

    console.log('\\n[1b] Kakkanad adding a Service...');
    const serviceKb = await request('POST', '/services', kbToken, {
      customerName: 'KB Test Customer',
      customerPhone: '555123456',
      deviceType: 'Phone',
      brand: brandKb.brand.name,
      model: modelKb.model.name,
      imei: 'KB123456789',
      problemDescription: 'Screen broken',
      estimatedCost: 150,
      branchId: kbBranchId
    });
    console.log('✔ Service added successfully by Sub-Branch.');

    console.log('\\n[1c] Kakkanad updating Service Status...');
    await request('PATCH', `/services/${serviceKb.service.id}/status`, kbToken, { status: 'checking' });
    console.log('✔ Service updated to checking successfully.');

    // ----------------------------------------------------
    // PHASE 2: MAIN BRANCH VERIFICATION & OPERATIONS
    // ----------------------------------------------------
    console.log('\\n[2] Logging in as Main Branch Admin (branch2)...');
    const mbToken = await login('branch2', 'admin123');
    const mbProfile = await request('GET', '/auth/me', mbToken);
    // tenant_admin doesn't have branchId inherently, they query by branch
    console.log('✔ Logged in as Main Branch Admin');

    console.log('\\n[2a] Main Branch verifying Kakkanad Data...');
    const mbServices = await request('GET', `/services?branchId=${kbBranchId}`, mbToken);
    if (!mbServices.services.find(s => s.id === serviceKb.service.id)) {
      throw new Error('Main branch could not see Kakkanad branch service!');
    }
    console.log('✔ Main branch perfectly views Sub-Branch services.');

    console.log('\\n[2b] Main Branch adding Part, Brand, Model, Technician, Service...');
    // We need to pick a branch for the main branch user to add to. The main branch user's physical branch ID is usually the first one.
    // Let's get the branches list
    const mbBranches = await request('GET', '/tenant/branches', mbToken);
    // Actually the main branch is hidden from GET /tenant/branches, but they can still query services by leaving branchId blank or using their physical branch code
    // Let's just create a part without branchId if it's optional, but services require branchId
    
    // We will query the DB for the main branch ID since we hid it from the API list
    const { query } = require('./config/db.js');
    const mbMainBranchIdRes = await query("SELECT id FROM branches WHERE tenant_id = $1 ORDER BY created_at ASC LIMIT 1", [mbProfile.user.tenant_id]);
    const mbBranchId = mbMainBranchIdRes.rows[0].id;

    const partMb = await request('POST', '/parts', mbToken, { name: `MB Test Battery ${suffix}`, price: 30, stock: 5, branchId: mbBranchId });
    const brandMb = await request('POST', '/models/brands', mbToken, { name: `MB Test Samsung ${suffix}`, branchId: mbBranchId });
    const modelMb = await request('POST', `/models/brands/${brandMb.brand.id}/models`, mbToken, { name: `MB Galaxy S20 ${suffix}`, branchId: mbBranchId });
    const techMb = await request('POST', '/technicians', mbToken, { name: `MB Tech Jane ${suffix}`, branchId: mbBranchId });
    
    const serviceMb = await request('POST', '/services', mbToken, {
      customerName: 'MB Test Customer',
      customerPhone: '555987654',
      deviceType: 'Phone',
      brand: brandMb.brand.name,
      model: modelMb.model.name,
      problemDescription: 'Battery dead',
      estimatedCost: 80,
      branchId: mbBranchId
    });
    console.log('✔ Main branch added its own data successfully.');

    console.log('\\n[2c] Main Branch updating its Service Status...');
    await request('PATCH', `/services/${serviceMb.service.id}/status`, mbToken, { status: 'repaired' });
    console.log('✔ Service updated to repaired successfully.');

    console.log('\\n[2d] Main Branch adding a new Sub-Branch...');
    try {
      await request('POST', '/tenant/branches', mbToken, {
        name: 'New Test Branch',
        branchCode: 'newbr',
        username: 'newbr_user',
        password: 'admin123'
      });
      console.log('✔ New sub-branch added successfully.');
    } catch(e) {
      if (e.message.includes('Limit of')) {
         console.log('ℹ Branch limit reached, safely ignoring for test.');
      } else {
         throw e;
      }
    }

    // ----------------------------------------------------
    // PHASE 3: SUPER ADMIN VERIFICATION
    // ----------------------------------------------------
    console.log('\n[3] Logging in as Super Admin...');
    const saToken = await login('stibe@superadmin', 'admin123');
    console.log('✔ Logged in as Super Admin');

    const saTenants = await request('GET', '/admin/tenants', saToken);
    const foundTenant = saTenants.tenants.find(t => t.id === mbProfile.user.tenant_id);
    if (!foundTenant) {
      console.log('Available tenants:', saTenants.tenants.map(t => t.id));
      console.log('Looking for:', mbProfile.user.tenant_id);
      throw new Error('Super Admin cannot see the Main Branch tenant!');
    }
    console.log('✔ Super Admin views Tenant list perfectly.');
    
    console.log('\\n✅ ALL E2E API TESTS PASSED SUCCESSFULLY! ✅');
    process.exit(0);
  } catch(e) {
    console.error('\\n❌ TEST FAILED ❌');
    console.error(e);
    process.exit(1);
  }
})();
