const BASE_URL = 'http://localhost:5000/api';
let tokenBranch = '';
let tokenTech = '';
let techId = '';
let serviceId = '';

async function run() {
  console.log('--- 1. Login as branch1 ---');
  let res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'branch1@mobileshop.com', password: 'branch123' })
  });
  let data = await res.json();
  tokenBranch = data.token;
  console.log('Branch User Role:', data.user.role);

  // Fetch branch ID for BR1
  res = await fetch(`${BASE_URL}/tenant/branches`, {
    headers: { 'Authorization': `Bearer ${tokenBranch}` }
  });
  let branchesData = await res.json();
  let b1Branches = branchesData.branches || [];
  let b1Branch = b1Branches.find(b => b.branch_code === 'BR1');
  let branchId = b1Branch ? b1Branch.id : null;

  console.log('\n--- 2. Create Technician ---');
  res = await fetch(`${BASE_URL}/technicians`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenBranch}` },
    body: JSON.stringify({
      name: 'Bob the Builder',
      email: 'bobtech@test.com',
      password: 'bobpassword',
      branchId: branchId
    })
  });
  data = await res.json();
  if (res.status === 400 && data.error === 'Email already exists.') {
    console.log('Technician already exists. Attempting login instead...');
  } else {
    console.log('Technician created:', data.technician?.name);
    techId = data.technician?.id;
  }

  // Get tech ID if not set
  if (!techId) {
    res = await fetch(`${BASE_URL}/technicians`, {
      headers: { 'Authorization': `Bearer ${tokenBranch}` },
    });
    data = await res.json();
    const bob = data.technicians.find(t => t.email === 'bobtech@test.com');
    techId = bob.id;
  }

  console.log('\n--- 3. Create Service Assigned to Technician ---');
  res = await fetch(`${BASE_URL}/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenBranch}` },
    body: JSON.stringify({
      customerName: 'Tech Test Customer',
      customerPhone: '1234567890',
      problemDescription: 'Screen is cracked',
      assignedTechnicianId: techId,
      assignedTechnician: 'Bob the Builder',
      advancePayment: 0,
      branchId: branchId
    })
  });
  data = await res.json();
  serviceId = data.service.id;
  console.log('Service created:', data.service.serial_number, 'assigned to', data.service.assigned_technician_id);

  console.log('\\n--- 4. Login as Technician ---');
  res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'bobtech@test.com', password: 'bobpassword' })
  });
  data = await res.json();
  tokenTech = data.token;
  console.log('Technician Role:', data.user.role);

  console.log('\\n--- 5. Fetch Services as Technician ---');
  res = await fetch(`${BASE_URL}/services`, {
    headers: { 'Authorization': `Bearer ${tokenTech}` },
  });
  data = await res.json();
  console.log('Technician sees', data.services.length, 'services');
  if (data.services.length > 0) {
    console.log('First service ID matches:', data.services[0].id === serviceId);
  }

  console.log('\\n--- 6. Attempt to Add Parts as Technician (Should Fail) ---');
  res = await fetch(`${BASE_URL}/services/${serviceId}/parts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenTech}` },
    body: JSON.stringify({ source: 'outside', partName: 'Fake Part', costAtTime: 10 })
  });
  data = await res.json();
  console.log('Add part response:', res.status, data.error);

  console.log('\\n--- 7. Update Service Status as Technician ---');
  res = await fetch(`${BASE_URL}/services/${serviceId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenTech}` },
    body: JSON.stringify({ status: 'repaired' })
  });
  data = await res.json();
  console.log('Update status response:', res.status, data.message);

  console.log('\\nAll tests complete!');
}

run().catch(console.error);
