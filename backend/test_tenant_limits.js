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
  console.log('--- Starting Limit Tests ---');

  // 1. Super Admin Login
  let res = await fetchAPI('/auth/login', 'POST', { email: 'superadmin@gmail.com', password: 'admin123' });
  if (res.status !== 200) throw new Error('Superadmin login failed');
  const superadminToken = res.data.token;

  // 2. Setup or Retrieve ASUS Tenant
  res = await fetchAPI('/admin/tenants', 'GET', null, superadminToken);
  let tenants = res.data.tenants || [];
  let asusTenant = tenants.find(t => t.name.trim() === 'ASUS');
  
  if (!asusTenant) {
     console.log('Creating ASUS tenant...');
     res = await fetchAPI('/admin/tenants', 'POST', {
         name: "ASUS", password: "asuspassword", email: "asus@test.com",
         maxBranches: 999, maxTechnicians: 999, planTier: "enterprise"
     }, superadminToken);
     asusTenant = res.data.tenant;
  }
  
  // Clean up raju branch 2 branches just in case it's in a weird state
  let b2Tenant = tenants.find(t => t.name.trim() === 'raju branch 2');
  if (b2Tenant) {
     // keep only the Main Branch
     await query(`DELETE FROM branches WHERE tenant_id = $1 AND name != 'Main Branch'`, [b2Tenant.id]);
     await query(`DELETE FROM users WHERE tenant_id = $1 AND role = 'technician'`, [b2Tenant.id]);
  }

  // 3. Test RAJU BRANCH 2 Limits
  console.log('\\n--- Testing raju branch 2 (Max 3 Branches, Max 2 Technicians) ---');
  if (b2Tenant) {
    let resetB2 = await fetchAPI(`/admin/tenants/${b2Tenant.id}/reset-password`, 'POST', { newPassword: 'branch123' }, superadminToken);
    res = await fetchAPI('/auth/login', 'POST', { email: resetB2.data.user.email, password: 'branch123' });
    
    if (res.status === 200) {
      const b2Token = res.data.token;
      
      // Test Branches
      res = await fetchAPI('/tenant/branches', 'GET', null, b2Token);
      let b2BranchesCount = (res.data.branches || []).length;
      console.log(`Current raju branch 2 branches: ${b2BranchesCount}`); // should be 1
      
      while (b2BranchesCount < 3) {
        res = await fetchAPI('/tenant/branches', 'POST', {
          name: `Raju Branch ${b2BranchesCount + 1}`, branchCode: `R2_${b2BranchesCount}`, email: `rb2_${Date.now()}_${b2BranchesCount}@test.com`, password: 'password123'
        }, b2Token);
        if (res.status === 201) {
          b2BranchesCount++;
          console.log(`Added branch successfully. Current count: ${b2BranchesCount}`);
        } else {
          console.log(`Failed to add branch:`, res.status, res.data);
          break;
        }
      }
      
      // Test 4th Branch
      res = await fetchAPI('/tenant/branches', 'POST', {
        name: `Raju Branch 4 (Over Limit)`, branchCode: `RB2_OVER`, email: `rb2_over@test.com`, password: 'password123'
      }, b2Token);
      console.log(`Attempt to add 4th branch (limit 3) -> Status: ${res.status} (Expected 403)`);

      // Test Technicians
      const b2MainBranch = (await fetchAPI('/tenant/branches', 'GET', null, b2Token)).data.branches[0];
      res = await fetchAPI('/technicians', 'GET', null, b2Token);
      let b2TechCount = (res.data.technicians || []).length;
      console.log(`Current raju branch 2 technicians: ${b2TechCount}`); // should be 0
      
      while (b2TechCount < 2) {
        res = await fetchAPI('/technicians', 'POST', {
          name: `Raju Tech ${b2TechCount + 1}`, email: `rajutech_${Date.now()}_${b2TechCount}@test.com`, password: 'password123', branchId: b2MainBranch.id
        }, b2Token);
        if (res.status === 201) {
          b2TechCount++;
          console.log(`Added technician successfully. Current count: ${b2TechCount}`);
        } else {
          console.log(`Failed to add technician:`, res.status, res.data);
          break;
        }
      }
      
      // Test 3rd Technician
      res = await fetchAPI('/technicians', 'POST', {
        name: `Raju Tech 3 (Over Limit)`, email: `rajutech_over@test.com`, password: 'password123', branchId: b2MainBranch.id
      }, b2Token);
      console.log(`Attempt to add 3rd technician (limit 2) -> Status: ${res.status} (Expected 403)`);
    } else {
       console.log('Failed to login to raju branch 2');
    }
  }

  // 4. Test ASUS Limits (999 Branches, 999 Technicians)
  console.log('\\n--- Testing ASUS (Max 999 Branches, Max 999 Technicians) ---');
  let resetAsus = await fetchAPI(`/admin/tenants/${asusTenant.id}/reset-password`, 'POST', { newPassword: 'asuspassword' }, superadminToken);
  res = await fetchAPI('/auth/login', 'POST', { email: resetAsus.data.user.email, password: 'asuspassword' });
  
  if (res.status !== 200) {
      console.log('Failed to login to ASUS:', res.data);
      process.exit(1);
  }
  const asusToken = res.data.token;

  // Test ASUS Branches
  res = await fetchAPI('/tenant/branches', 'GET', null, asusToken);
  let asusBranches = res.data.branches || [];
  let asusBranchesCount = asusBranches.length;
  console.log(`Current ASUS branches: ${asusBranchesCount}`);

  if (asusBranchesCount < 999) {
    console.log(`Adding ${999 - asusBranchesCount} branches for ASUS... This might take a few moments.`);
    // Batch inserts for speed but limited to pool size
    let batchSize = 10;
    while (asusBranchesCount < 999) {
      let promises = [];
      let toAdd = Math.min(batchSize, 999 - asusBranchesCount);
      for (let i = 0; i < toAdd; i++) {
        let n = asusBranchesCount + i + 1;
        let p = fetchAPI('/tenant/branches', 'POST', {
          name: `ASUS Branch ${n}`, branchCode: `A_${n}`, email: `as_b_${Date.now()}_${n}@test.com`, password: 'password123'
        }, asusToken);
        // Delay slightly to prevent DB connection pool starvation
        await new Promise(r => setTimeout(r, 5));
        promises.push(p);
      }
      let results = await Promise.all(promises);
      let successCount = results.filter(r => r.status === 201).length;
      asusBranchesCount += successCount;
      process.stdout.write(`\rAdded ${asusBranchesCount}/999 branches`);
      if (successCount === 0) {
        console.log('\\nFailed to add branches, breaking loop.', results[0].data);
        break;
      }
    }
    console.log('');
  }
  
  // Test 1000th Branch
  res = await fetchAPI('/tenant/branches', 'POST', {
    name: `ASUS Branch 1000 (Over Limit)`, branchCode: `AS_OVER`, email: `as_b_over@test.com`, password: 'password123'
  }, asusToken);
  console.log(`Attempt to add 1000th branch (limit 999) -> Status: ${res.status} (Expected 403)`);

  // Test ASUS Technicians
  res = await fetchAPI('/tenant/branches', 'GET', null, asusToken);
  const asusMainBranch = res.data.branches[0];
  
  res = await fetchAPI('/technicians', 'GET', null, asusToken);
  let asusTechCount = (res.data.technicians || []).length;
  console.log(`Current ASUS technicians: ${asusTechCount}`);

  if (asusTechCount < 999) {
    console.log(`Adding ${999 - asusTechCount} technicians for ASUS...`);
    let batchSize = 10;
    while (asusTechCount < 999) {
      let promises = [];
      let toAdd = Math.min(batchSize, 999 - asusTechCount);
      for (let i = 0; i < toAdd; i++) {
        let n = asusTechCount + i + 1;
        let p = fetchAPI('/technicians', 'POST', {
          name: `ASUS Tech ${n}`, email: `astech_${Date.now()}_${n}@test.com`, password: 'password123', branchId: asusMainBranch.id
        }, asusToken);
        await new Promise(r => setTimeout(r, 5));
        promises.push(p);
      }
      let results = await Promise.all(promises);
      let successCount = results.filter(r => r.status === 201).length;
      asusTechCount += successCount;
      process.stdout.write(`\rAdded ${asusTechCount}/999 technicians`);
      if (successCount === 0) {
        console.log('\\nFailed to add technicians, breaking loop.', results[0].data);
        break;
      }
    }
    console.log('');
  }

  // Test 1000th Technician
  res = await fetchAPI('/technicians', 'POST', {
    name: `ASUS Tech 1000 (Over Limit)`, email: `astech_over@test.com`, password: 'password123', branchId: asusMainBranch.id
  }, asusToken);
  console.log(`Attempt to add 1000th technician (limit 999) -> Status: ${res.status} (Expected 403)`);

  console.log('\\n--- Limits Test Complete ---');
  process.exit(0);
}

runTests().catch(err => { console.error(err); process.exit(1); });
