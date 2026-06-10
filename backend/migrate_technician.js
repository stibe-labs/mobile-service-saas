const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:admin123@localhost:5432/mobile_service_shop' });
  await client.connect();
  
  try {
    await client.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'technician'");
  } catch (e) {
    if (e.code !== '42710') console.log(e.message);
  }

  try {
    await client.query("ALTER TABLE services ADD COLUMN IF NOT EXISTS assigned_technician_id UUID REFERENCES users(id) ON DELETE SET NULL");
    
    await client.query("ALTER TABLE users DROP CONSTRAINT IF EXISTS user_role_check");
    await client.query(`ALTER TABLE users ADD CONSTRAINT user_role_check CHECK ( 
      (role = 'super_admin' AND tenant_id IS NULL AND branch_id IS NULL) OR 
      (role = 'tenant_admin' AND tenant_id IS NOT NULL AND branch_id IS NULL) OR 
      (role = 'branch_user' AND tenant_id IS NOT NULL AND branch_id IS NOT NULL) OR 
      (role = 'technician' AND tenant_id IS NOT NULL AND branch_id IS NOT NULL) OR 
      (role = 'tenant_user' AND tenant_id IS NOT NULL) 
    )`);
    
    console.log('Migration successful');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
