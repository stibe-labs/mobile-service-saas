require('dotenv').config();
const { query } = require('./config/db.js');

(async () => {
  try {
    const superAdmin = await query("SELECT email FROM users WHERE role = 'super_admin' LIMIT 1");
    console.log('Super Admin:', superAdmin.rows[0]);

    const mainBranch = await query("SELECT email FROM users WHERE role = 'tenant_admin' AND tenant_id = 'dfd28ba0-5c86-4ca5-9342-c11ef3636192'");
    console.log('Main Branch Admin:', mainBranch.rows[0]);

    const subBranch = await query("SELECT email FROM users WHERE role = 'branch_user' AND branch_id = '3cd766de-73a2-473f-93f0-47975373b4cd'");
    console.log('Kakkanad Branch User:', subBranch.rows[0]);

    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();
