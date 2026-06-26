const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function seed() {
  const client = new Client({ connectionString: 'postgresql://postgres:admin123@localhost:5432/mobile_service_shop' });
  await client.connect();

  try {
    console.log('Fixing constraint...');
    await client.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS user_role_check;
      ALTER TABLE users ADD CONSTRAINT user_role_check CHECK (role IN ('super_admin', 'tenant_admin', 'branch_user', 'technician', 'sales_staff', 'sub_branch_manager', 'main_branch_manager'));
    `);

    console.log('Seeding test users...');
    
    // Get the first tenant
    const tenantRes = await client.query(`SELECT id FROM tenants LIMIT 1`);
    if (tenantRes.rows.length === 0) throw new Error('No tenant found');
    const tenantId = tenantRes.rows[0].id;

    // Get the first branch of the tenant
    const branchRes = await client.query(`SELECT id FROM branches WHERE tenant_id = $1 LIMIT 1`, [tenantId]);
    if (branchRes.rows.length === 0) throw new Error('No branch found');
    const branchId = branchRes.rows[0].id;

    const passwordHash = await bcrypt.hash('password123', 10);

    const usersToCreate = [
      { email: 'sales_staff@test.com', name: 'Sales Staff Tester', role: 'sales_staff' },
      { email: 'sub_manager@test.com', name: 'Sub Manager Tester', role: 'sub_branch_manager' },
      { email: 'main_manager@test.com', name: 'Main Manager Tester', role: 'main_branch_manager' }
    ];

    for (const u of usersToCreate) {
      await client.query(`
        INSERT INTO users (email, password_hash, full_name, role, tenant_id, branch_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO NOTHING
      `, [u.email, passwordHash, u.name, u.role, tenantId, branchId]);
      console.log(`Created/Verified ${u.email} (${u.role})`);
    }

    console.log('Test users seeded successfully! Password for all is: password123');

  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await client.end();
  }
}

seed();
