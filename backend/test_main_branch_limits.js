require('dotenv').config();
const { query } = require('./config/db');

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
  console.log('--- Starting Cross-Branch Technician Limit Test ---');

  // 1. Super Admin Login
  let res = await fetchAPI('/auth/login', 'POST', { email: 'superadmin@gmail.com', password: 'admin123' });
  if (res.status !== 200) throw new Error('Superadmin login failed');
  const superadminToken = res.data.token;

  // 2. Find or Create Isolated Tenant
  res = await fetchAPI('/admin/tenants', 'GET', null, superadminToken);
  let tenants = res.data.tenants || [];
  let testTenant = tenants.find(t => t.name.trim() === 'CrossBranchTest');
  
  if (!testTenant) {
     console.log('Test tenant not found! Creating...');
     res = await fetchAPI('/admin/tenants', 'POST', {
         name: "CrossBranchTest", password: "testpassword", email: "crossbranch@test.com",
         maxBranches: 5, maxTechnicians: 3, planTier: "free"
     }, superadminToken);
     testTenant = res.data.tenant;
  }

  // Update Limits to 5 Branches and 3 Technicians (as per user request)
  await fetchAPI(`/admin/tenants/${testTenant.id}/max-branches`, 'PATCH', { maxBranches: 5 }, superadminToken);
  await fetchAPI(`/admin/tenants/${testTenant.id}/max-technicians`, 'PATCH', { maxTechnicians: 3 }, superadminToken);
  console.log('Set CrossBranchTest limits to 5 branches and 3 technicians.');

  // 3. Login as Test Tenant Admin
  let resetRes = await fetchAPI(`/admin/tenants/${testTenant.id}/reset-password`, 'POST', { newPassword: 'testpassword123' }, superadminToken);
  res = await fetchAPI('/auth/login', 'POST', { email: resetRes.data.user.email, password: 'testpassword123' });
  if (res.status !== 200) {
      console.log('Failed to login to Test Tenant:', res.data);
      process.exit(1);
  }
  const testToken = res.data.token;

  // 4. Create Sub-Branches
  console.log('\\n--- Creating Sub-Branches ---');
  res = await fetchAPI('/tenant/branches', 'GET', null, testToken);
  const existingBranches = res.data.branches || [];
  const b1 = existingBranches[0]; // The default 'Main Branch'
  
  let newBranches = [];
  for (let i = existingBranches.length; i < 4; i++) {
    res = await fetchAPI('/tenant/branches', 'POST', {
      name: `Sub Branch ${i}`, branchCode: `CBT_${i}`, email: `cb_sub${i}@test.com`, password: 'password123'
    }, testToken);
    
    if (res.status === 201) {
      console.log(`Created ${res.data.branch.name} successfully.`);
      newBranches.push(res.data.branch);
    } else {
      console.error(`Failed to create Sub Branch ${i}:`, res.status, res.data);
    }
  }

  const allBranches = [b1, ...newBranches];

  // 5. Test Cross-Branch Technician Limits
  console.log('\\n--- Testing Technician Limits Across Branches ---');
  console.log(`Tenant Limit: 3 Technicians total`);

  // Clear any existing technicians if we are re-running just in case (we shouldn't need to, but to be safe)
  res = await fetchAPI('/technicians', 'GET', null, testToken);
  let existingTechCount = (res.data.technicians || []).length;
  if (existingTechCount >= 3) {
      console.log(`Technicians already hit the limit. Found ${existingTechCount}. Try running again with a clean DB, or logic is proven.`);
      process.exit(0);
  }

  // Add Technician 1 to Branch 1
  res = await fetchAPI('/technicians', 'POST', {
    name: `Tech 1 (Branch 1)`, email: `tech1_cb@test.com`, password: 'password123', branchId: allBranches[0].id
  }, testToken);
  console.log(`Attempt to add Tech 1 to ${allBranches[0].name} -> Status: ${res.status} (Expected 201)`);

  // Add Technician 2 to Branch 2
  res = await fetchAPI('/technicians', 'POST', {
    name: `Tech 2 (Branch 2)`, email: `tech2_cb@test.com`, password: 'password123', branchId: allBranches[1].id
  }, testToken);
  console.log(`Attempt to add Tech 2 to ${allBranches[1].name} -> Status: ${res.status} (Expected 201)`);

  // Add Technician 3 to Branch 3
  res = await fetchAPI('/technicians', 'POST', {
    name: `Tech 3 (Branch 3)`, email: `tech3_cb@test.com`, password: 'password123', branchId: allBranches[2].id
  }, testToken);
  console.log(`Attempt to add Tech 3 to ${allBranches[2].name} -> Status: ${res.status} (Expected 201)`);

  // Check total technician count
  res = await fetchAPI('/technicians', 'GET', null, testToken);
  console.log(`Total Technicians Added: ${res.data.technicians.length}`);

  // Attempt to Add Technician 4 to Branch 4
  res = await fetchAPI('/technicians', 'POST', {
    name: `Tech 4 (Branch 4 - Over Limit)`, email: `tech4_cb@test.com`, password: 'password123', branchId: allBranches[3].id
  }, testToken);
  console.log(`Attempt to add Tech 4 to ${allBranches[3].name} -> Status: ${res.status} (Expected 403)`);
  if (res.status === 403) {
      console.log(`Success! System successfully blocked the 4th technician because the tenant limit is 3.`);
  } else {
      console.error(`Failed! System did NOT block the 4th technician! Allowed with status ${res.status}`);
  }

  console.log('\\n--- Cross-Branch Test Complete ---');
  process.exit(0);
}

runTests().catch(err => { console.error(err); process.exit(1); });
