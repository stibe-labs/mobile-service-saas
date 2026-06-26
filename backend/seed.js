// ─── Seed Script ───────────────────────────────────────
// Creates the default Super Admin account.
// Run: npm run seed  or  node seed.js
//
// This script:
// 1. Creates a Super Admin user (superadmin / admin123)
// 2. Optionally creates a test tenant with default brands

require('dotenv').config();
const bcrypt = require('bcrypt');
const { query, pool } = require('./config/db');

const SUPER_ADMIN = {
  email: 'stibe@superadmin',
  password: 'admin123',
  fullName: 'Super Admin',
};

const TEST_TENANT = {
  name: 'Main Branch',
  branchCode: 'BR1',
  email: 'branch1@mobileshop.com',
  password: 'branch123',
  fullName: 'Branch 1 Staff',
};

const DEFAULT_BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'Vivo', 'Oppo', 'Other'];

async function seed() {
  try {
    console.log('🌱 Starting seed...\n');

    // 1. Create Super Admin
    const adminHash = await bcrypt.hash(SUPER_ADMIN.password, 10);
    const adminResult = await query(
      `INSERT INTO users (email, password_hash, full_name, role, tenant_id)
       VALUES ($1, $2, $3, 'super_admin', NULL)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2
       RETURNING id, email, role`,
      [SUPER_ADMIN.email, adminHash, SUPER_ADMIN.fullName]
    );
    console.log('✅ Super Admin created:', adminResult.rows[0]);
    console.log(`   Login: ${SUPER_ADMIN.email} / ${SUPER_ADMIN.password}`);

    // 2. Create Test Tenant
    let tenantResult = await query(`SELECT * FROM tenants WHERE name = $1 LIMIT 1`, [TEST_TENANT.name]);
    if (tenantResult.rows.length === 0) {
      tenantResult = await query(
        `INSERT INTO tenants (name, status, max_branches) VALUES ($1, 'active', 5) RETURNING *`,
        [TEST_TENANT.name]
      );
    }
    const tenant = tenantResult.rows[0];

    let branchResult = await query(`SELECT * FROM branches WHERE branch_code = $1 LIMIT 1`, [TEST_TENANT.branchCode]);
    if (branchResult.rows.length === 0) {
      branchResult = await query(
        `INSERT INTO branches (tenant_id, name, branch_code, status) VALUES ($1, $2, $3, 'active') RETURNING *`,
        [tenant.id, TEST_TENANT.name + ' Branch', TEST_TENANT.branchCode]
      );
    }
    const branch = branchResult.rows[0];
    console.log('\n✅ Test Tenant and Branch created:', tenant.name, `(${branch.branch_code})`);

    // 3. Create Feature Toggles for tenant
    await query(
      `INSERT INTO feature_toggles (tenant_id) VALUES ($1) ON CONFLICT (tenant_id) DO NOTHING`,
      [tenant.id]
    );
    console.log('✅ Feature toggles initialized (all defaults)');

    // 4. Create Tenant User
    const userHash = await bcrypt.hash(TEST_TENANT.password, 10);
    const userResult = await query(
      `INSERT INTO users (email, password_hash, full_name, role, tenant_id, branch_id)
       VALUES ($1, $2, $3, 'tenant_admin', $4, NULL)
       ON CONFLICT (email) DO UPDATE SET password_hash = $2
       RETURNING id, email, role`,
      [TEST_TENANT.email, userHash, TEST_TENANT.fullName, tenant.id]
    );
    console.log('✅ Tenant User created:', userResult.rows[0]);
    console.log(`   Login: ${TEST_TENANT.email} / ${TEST_TENANT.password}`);

    // 5. Seed Default Brands
    for (const brandName of DEFAULT_BRANDS) {
      await query(
        `INSERT INTO brands (tenant_id, name) VALUES ($1, $2) ON CONFLICT (tenant_id, name) DO NOTHING`,
        [tenant.id, brandName]
      );
    }
    console.log(`✅ Default brands seeded: ${DEFAULT_BRANDS.join(', ')}`);

    console.log('\n🎉 Seed complete!\n');
    console.log('═══════════════════════════════════════');
    console.log('  Accounts Ready:');
    console.log(`  👑 Super Admin:  ${SUPER_ADMIN.email} / ${SUPER_ADMIN.password}`);
    console.log(`  🏪 Tenant User:  ${TEST_TENANT.email} / ${TEST_TENANT.password}`);
    console.log('═══════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
    console.error(err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seed();
