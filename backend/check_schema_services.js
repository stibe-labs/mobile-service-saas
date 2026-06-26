require('dotenv').config();
const { query } = require('./config/db');

async function check() {
  const res = await query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'services'
  `);
  console.log(res.rows.map(r => r.column_name).join(', '));
  process.exit();
}
check();
