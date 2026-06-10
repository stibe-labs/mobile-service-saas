require('dotenv').config();
const { query } = require('./config/db.js');
(async () => {
  try {
    const tenants = await query("SELECT id, name, max_branches FROM tenants WHERE name LIKE '%raju%'");
    console.log('Tenants:', tenants.rows);
    const branches = await query("SELECT tenant_id, COUNT(*) FROM branches GROUP BY tenant_id");
    console.log('Branches Count:', branches.rows);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();
