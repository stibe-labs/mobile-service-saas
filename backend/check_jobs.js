require('dotenv').config();
const { query } = require('./config/db');

async function check() {
  const res = await query(`
    SELECT id, serial_number, status, created_at
    FROM services
    ORDER BY created_at DESC
    LIMIT 5
  `);
  console.log(res.rows);
  
  const res2 = await query(`
    SELECT id, serial_number, status, created_at
    FROM services
    ORDER BY created_at ASC
    LIMIT 5
  `);
  console.log("ASC:", res2.rows);
  
  process.exit();
}
check();
