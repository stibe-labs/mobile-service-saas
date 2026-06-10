-- ─── 1. Update Enums ──────────────────────────────────────────
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'tenant_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'branch_user';

-- ─── 2. Create Branches Table ───────────────────────────────
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    branch_code VARCHAR(10) NOT NULL,
    status tenant_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, branch_code)
);

CREATE TRIGGER trg_branches_updated BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Migrate existing tenants to have at least one branch
INSERT INTO branches (tenant_id, name, branch_code)
SELECT id, name || ' Main Branch', branch_code FROM tenants
ON CONFLICT DO NOTHING;

-- ─── 3. Modify Tenants Table ────────────────────────────────
ALTER TABLE tenants RENAME COLUMN max_users TO max_branches;
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_branch_code_key;
-- We keep branch_code temporarily or drop it. Let's drop it.
ALTER TABLE tenants DROP COLUMN IF EXISTS branch_code;

-- ─── 4. Modify Users Table ──────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;

-- Drop old constraint BEFORE updating
ALTER TABLE users DROP CONSTRAINT IF EXISTS user_tenant_check;

-- Migrate existing users: Make them tenant_admin
UPDATE users SET role = 'tenant_admin' WHERE role = 'tenant_user';

ALTER TABLE users ADD CONSTRAINT user_role_check CHECK (
    (role = 'super_admin' AND tenant_id IS NULL AND branch_id IS NULL) OR
    (role = 'tenant_admin' AND tenant_id IS NOT NULL AND branch_id IS NULL) OR
    (role = 'branch_user' AND tenant_id IS NOT NULL AND branch_id IS NOT NULL) OR
    (role = 'tenant_user' AND tenant_id IS NOT NULL) -- Legacy
);

-- ─── 5. Modify Operational Tables ───────────────────────────
-- Add branch_id to tables
ALTER TABLE services ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE device_models ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;

-- Migrate existing data: Assign to the default branch for that tenant
UPDATE services SET branch_id = (SELECT id FROM branches WHERE branches.tenant_id = services.tenant_id LIMIT 1) WHERE branch_id IS NULL;
UPDATE parts SET branch_id = (SELECT id FROM branches WHERE branches.tenant_id = parts.tenant_id LIMIT 1) WHERE branch_id IS NULL;
UPDATE brands SET branch_id = (SELECT id FROM branches WHERE branches.tenant_id = brands.tenant_id LIMIT 1) WHERE branch_id IS NULL;
UPDATE technicians SET branch_id = (SELECT id FROM branches WHERE branches.tenant_id = technicians.tenant_id LIMIT 1) WHERE branch_id IS NULL;

-- Now make branch_id NOT NULL for services and technicians (Parts/Brands can be null if shared, but user said "add each branches and main branch admin can also", so if it's null it belongs to the whole tenant).
-- Actually, let's keep branch_id NULLABLE for parts, brands, and technicians so Main Branch Admin can add them globally.
-- For services, it must be tied to a branch.
ALTER TABLE services ALTER COLUMN branch_id SET NOT NULL;
