require('dotenv').config();
const { query } = require('./config/db');
const bcrypt = require('bcrypt');

(async () => {
  try {
    const hash = await bcrypt.hash('password123', 10);
    await query('UPDATE users SET password_hash = $1 WHERE role = $2', [hash, 'tenant_admin']);
    
    // Also reset superadmin just in case
    const superHash = await bcrypt.hash('admin123', 10);
    await query('UPDATE users SET password_hash = $1 WHERE role = $2', [superHash, 'super_admin']);

    const res = await query(`
      SELECT u.email, u.role, t.name as tenant_name 
      FROM users u 
      LEFT JOIN tenants t ON u.tenant_id = t.id 
      WHERE u.role IN ('tenant_admin', 'super_admin')
    `);
    
    console.table(res.rows);
    console.log('\\n✅ ALL passwords have been reset!');
    console.log('Super Admin Password: admin123');
    console.log('Tenant Admin Passwords: password123');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
})();
