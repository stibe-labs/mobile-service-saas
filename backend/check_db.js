require('dotenv').config();
const { getClient } = require('./config/db');

async function run() {
  const client = await getClient();
  try {
    const res = await client.query('SELECT id, name, source, plan_tier, max_branches, max_technicians FROM tenants ORDER BY created_at DESC LIMIT 15');
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
