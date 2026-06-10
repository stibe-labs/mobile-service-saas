const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:admin123@localhost:5432/mobile_service_shop' });
  await client.connect();

  try {
    console.log('Updating Enums...');
    await client.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'tenant_admin'`);
    await client.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'branch_user'`);
    console.log('Enums updated.');

    // We must commit or end transaction block before using new enums, but Node pg client uses auto-commit by default
    // unless we explicitly call BEGIN.
  } catch (err) {
    if (err.code !== '42710') { // duplicate object
      console.log('Enum error (might already exist):', err.message);
    }
  }

  try {
    console.log('Running schema migration...');
    const sql = fs.readFileSync('sql/02_refactor_schema.sql', 'utf8');
    
    // Remove the enum lines from the sql file so we don't re-run them in the same transaction
    const lines = sql.split('\n');
    const filteredSql = lines.filter(l => !l.includes('ALTER TYPE')).join('\n');

    await client.query(filteredSql);
    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

run();
