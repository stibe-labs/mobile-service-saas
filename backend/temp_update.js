require('dotenv').config();
const { query, pool } = require('./config/db');
query("UPDATE users SET email = 'superadmin@gmail.com' WHERE role = 'super_admin';")
  .then(() => { console.log('Updated'); pool.end(); })
  .catch(console.error);
