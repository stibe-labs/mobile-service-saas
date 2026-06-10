const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:admin123@localhost:5432/mobile_service_shop'
});

async function run() {
  try {
    await client.connect();
    
    // Add max_technicians column, defaulting to 2
    await client.query(`
      ALTER TABLE tenants
      ADD COLUMN max_technicians INTEGER NOT NULL DEFAULT 2;
    `);

    console.log('Migration successful: Added max_technicians to tenants table.');
  } catch (err) {
    if (err.code === '42701') {
      console.log('Column max_technicians already exists.');
    } else {
      console.error('Migration failed:', err);
    }
  } finally {
    await client.end();
  }
}

run();
