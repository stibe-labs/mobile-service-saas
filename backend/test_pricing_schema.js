require('dotenv').config();
const { query } = require('./config/db');

async function testQuery() {
  try {
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pricing_margins';
    `);
    console.table(res.rows);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

testQuery();
