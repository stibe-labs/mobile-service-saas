require('dotenv').config();
const { getClient } = require('./config/db');

async function run() {
  const client = await getClient();
  try {
    const users = await client.query('SELECT * FROM users WHERE username ILIKE $1 OR full_name ILIKE $1', ['%dcs%']);
    console.log('Users:');
    console.table(users.rows.map(u => ({ id: u.id, username: u.username, role: u.role, tenant_id: u.tenant_id, branch_id: u.branch_id })));

    const tenants = await client.query('SELECT * FROM tenants WHERE name ILIKE $1', ['%dcs%']);
    console.log('Tenants:');
    console.table(tenants.rows.map(t => ({ id: t.id, name: t.name })));

    const branches = await client.query('SELECT * FROM branches WHERE name ILIKE $1 OR branch_code ILIKE $1', ['%dcs%']);
    console.log('Branches:');
    console.table(branches.rows.map(b => ({ id: b.id, name: b.name, tenant_id: b.tenant_id })));
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
