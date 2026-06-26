require('dotenv').config();
const { query } = require('./config/db');

async function checkSchema() {
  try {
    const res = await query(`
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'pricing_margins' AND column_name = 'branch_id';
    `);
    console.log(res.rows);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkSchema();
