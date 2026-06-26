require('dotenv').config();
const { query } = require('./config/db.js');
const bcrypt = require('bcrypt');

(async () => {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    
    // Reset Kakkanad Branch User
    await query("UPDATE users SET password_hash = $1 WHERE username = 'kakkanadbranch'", [hash]);
    console.log('Reset kakkanadbranch password to admin123');
    
    // Reset Main Branch Admin
    await query("UPDATE users SET password_hash = $1 WHERE username = 'branch2'", [hash]);
    console.log('Reset branch2 password to admin123');
    
    // Reset Super Admin (just in case)
    await query("UPDATE users SET password_hash = $1 WHERE email = 'stibe@superadmin'", [hash]);
    console.log('Reset superadmin password to admin123');
    
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();
