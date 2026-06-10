const BASE_URL = 'http://localhost:5000/api';
let tokenBranch = '';

async function run() {
  console.log('--- 1. Login as branch1 ---');
  let res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'branch1@mobileshop.com', password: 'branch123' })
  });
  let data = await res.json();
  tokenBranch = data.token;

  // Fetch branch ID for BR1
  res = await fetch(`${BASE_URL}/tenant/branches`, {
    headers: { 'Authorization': `Bearer ${tokenBranch}` }
  });
  let branchesData = await res.json();
  let b1Branches = branchesData.branches || [];
  let b1Branch = b1Branches.find(b => b.branch_code === 'BR1');
  let branchId = b1Branch ? b1Branch.id : null;

  console.log('\\n--- 2. Create Technicians to Hit Limit ---');
  for (let i = 1; i <= 3; i++) {
    const email = `newtech_${Math.random().toString(36).substring(7)}@test.com`;
    res = await fetch(`${BASE_URL}/technicians`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenBranch}` },
      body: JSON.stringify({
        name: `Tech ${i}`,
        email: email,
        password: 'password123',
        branchId: branchId
      })
    });
    data = await res.json();
    console.log(`Attempt ${i} -> Status: ${res.status}`, data);
  }
}

run().catch(console.error);
