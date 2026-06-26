const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:admin123@localhost:5432/mobile_service_shop' });
  await client.connect();

  try {
    console.log('Creating Phase 2 tables...');
    const sql = `
CREATE TABLE IF NOT EXISTS pricing_margins (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    model_id        UUID NOT NULL REFERENCES device_models(id) ON DELETE CASCADE,
    margin          DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(branch_id, model_id)
);

DROP TRIGGER IF EXISTS trg_pricing_margins_updated ON pricing_margins;
CREATE TRIGGER trg_pricing_margins_updated BEFORE UPDATE ON pricing_margins FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `;
    await client.query(sql);
    console.log('Phase 2 Migration successful.');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

run();
