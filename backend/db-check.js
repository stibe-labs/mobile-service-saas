require('dotenv').config();
const { query } = require('./config/db.js');

(async () => {
  try {
    const branches = await query("SELECT id, name, branch_code FROM branches WHERE tenant_id = 'dfd28ba0-5c86-4ca5-9342-c11ef3636192'");
    console.log('Branches:', branches.rows);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();
