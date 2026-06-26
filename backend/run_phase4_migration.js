const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:admin123@localhost:5432/mobile_service_shop' });
  await client.connect();

  try {
    console.log('Altering feature_toggles table...');
    const sql = `
ALTER TABLE feature_toggles 
ADD COLUMN IF NOT EXISTS sales_module BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS inventory_module BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS branch_pricing BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS staff_commission BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sales_receipt BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS imei_lookup BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS branch_dashboard BOOLEAN DEFAULT true;
    `;
    await client.query(sql);
    console.log('Phase 4 Migration successful.');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

run();
