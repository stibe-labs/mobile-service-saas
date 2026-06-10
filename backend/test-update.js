require('dotenv').config();
const jwt = require('jsonwebtoken');
const { query } = require('./config/db.js');

(async () => {
  try {
    const userRes = await query(`SELECT id FROM users WHERE role = 'super_admin' LIMIT 1`);
    const token = jwt.sign({ userId: userRes.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    console.log('Sending PATCH request...');
    const res = await fetch('http://localhost:5000/api/admin/tenants/dfd28ba0-5c86-4ca5-9342-c11ef3636192/max-branches', {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ maxBranches: 2 })
    });
    
    const data = await res.json();
    console.log('STATUS:', res.status);
    console.log('BODY:', data);
    
    const tenants = await query('SELECT id, name, max_branches FROM tenants');
    console.log('DB Tenants:', tenants.rows);
    
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();
