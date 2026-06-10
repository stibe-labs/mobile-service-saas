require('dotenv').config();
const { query } = require('./config/db.js');

(async () => {
  try {
    await query("UPDATE tenants SET max_branches = 5 WHERE name LIKE '%raju%'");
    console.log('Successfully updated max branches to 5');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();
