require('dotenv').config();
const jwt = require('jsonwebtoken');
const { query } = require('./config/db.js');

(async () => {
  try {
    const userRes = await query(`SELECT id FROM users WHERE role = 'tenant_admin' AND tenant_id = '26296a8a-05df-4798-af3e-2518f4b19d21' LIMIT 1`);
    const token = jwt.sign({ userId: userRes.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    const res = await fetch('http://localhost:5000/api/tenant/branches', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Branch',
        branchCode: 'TST1',
        username: 'tstuser',
        password: 'password123'
      })
    });
    
    const data = await res.json();
    console.log('STATUS:', res.status);
    console.log('BODY:', data);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();
