const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:admin123@localhost:5432/mobile_service_shop' });
  await client.connect();

  try {
    console.log('Adding Enum values...');
    const roles = ['sales_staff', 'main_branch_manager', 'sub_branch_manager'];
    for (const role of roles) {
      try {
        await client.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS '${role}'`);
      } catch (err) {
        if (err.code !== '42710' && err.code !== '42704') console.error('Enum error:', err.message);
      }
    }

    console.log('Altering users table constraint...');
    try {
      await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id UUID;`);
      await client.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS user_role_check;`);
      await client.query(`
        ALTER TABLE users ADD CONSTRAINT user_role_check CHECK (
          (role = 'super_admin' AND tenant_id IS NULL AND branch_id IS NULL) OR
          (role IN ('tenant_admin', 'main_branch_manager') AND tenant_id IS NOT NULL AND branch_id IS NULL) OR
          (role IN ('branch_user', 'technician', 'sales_staff', 'sub_branch_manager') AND tenant_id IS NOT NULL AND branch_id IS NOT NULL) OR
          (role = 'tenant_user' AND tenant_id IS NOT NULL)
        )
      `);
    } catch(err) {
      console.error('Error altering users table:', err.message);
    }

    console.log('Creating Phase 1 tables...');
    const sql = `
CREATE TABLE IF NOT EXISTS inventory (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id       UUID, 
    brand_id        UUID REFERENCES brands(id) ON DELETE SET NULL,
    model_id        UUID REFERENCES device_models(id) ON DELETE SET NULL,
    category        VARCHAR(50) NOT NULL DEFAULT 'new', 
    condition_grade VARCHAR(50), 
    imei_number     VARCHAR(50) NOT NULL,
    quantity        INTEGER NOT NULL DEFAULT 1,
    purchase_price  DECIMAL(10,2) NOT NULL DEFAULT 0,
    status          VARCHAR(50) NOT NULL DEFAULT 'available', 
    supplier        VARCHAR(255),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_imei ON inventory(imei_number);

CREATE TABLE IF NOT EXISTS sales (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id       UUID,
    inventory_id    UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    imei_number     VARCHAR(50) NOT NULL,
    customer_name   VARCHAR(255),
    customer_phone  VARCHAR(50),
    purchase_price  DECIMAL(10,2) NOT NULL DEFAULT 0,
    branch_margin   DECIMAL(10,2) NOT NULL DEFAULT 0,
    base_price      DECIMAL(10,2) NOT NULL DEFAULT 0,
    staff_commission DECIMAL(10,2) NOT NULL DEFAULT 0,
    final_price     DECIMAL(10,2) NOT NULL DEFAULT 0,
    sales_staff_id  UUID NOT NULL REFERENCES users(id),
    payment_method  VARCHAR(50) DEFAULT 'Cash',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_commissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sales_id        UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    sales_staff_id  UUID NOT NULL REFERENCES users(id),
    amount          DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_inventory_updated ON inventory;
CREATE TRIGGER trg_inventory_updated BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `;
    await client.query(sql);
    console.log('Phase 1 Migration successful.');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

run();
