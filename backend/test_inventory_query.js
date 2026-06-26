require('dotenv').config();
const { query } = require('./config/db');

async function testQuery() {
  try {
    const res = await query(`
      SELECT i.id, i.imei_number, i.purchase_price, COALESCE(pm.margin, 0) as branch_margin,
             (i.purchase_price + COALESCE(pm.margin, 0)) as calculated_base_price
      FROM inventory i
      LEFT JOIN pricing_margins pm ON i.model_id = pm.model_id AND i.branch_id = pm.branch_id
    `);
    console.log("Inventory Query Results:");
    console.table(res.rows);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

testQuery();
