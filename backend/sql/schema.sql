-- ============================================================
-- Mobile Service Shop — PostgreSQL Database Schema (v2.0 MVP)
-- ============================================================
-- Run this in your PostgreSQL database to create all tables.
-- Matches the simplified flowchart (8 flows, 2 roles).
-- ============================================================

-- ─── EXTENSIONS ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUMS ──────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM (
    'super_admin', 
    'tenant_admin', 
    'branch_user', 
    'technician', 
    'tenant_user', 
    'sales_staff', 
    'main_branch_manager', 
    'sub_branch_manager'
);

CREATE TYPE service_status AS ENUM (
    'received',
    'checking',
    'waiting_for_parts',
    'repaired',
    'delivered',
    'cancelled'
);

CREATE TYPE tenant_status AS ENUM ('pending', 'active', 'suspended');

CREATE TYPE part_source AS ENUM ('shop', 'outside');

CREATE TYPE note_type AS ENUM ('technician', 'customer_approval', 'repair', 'delivery');

-- ─── 1. TENANTS (Shop Accounts) ────────────────────────────
-- Flow 2: Super Admin manages these
CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    branch_code     VARCHAR(10) NOT NULL UNIQUE,   -- e.g. BR1, BR2...
    status          tenant_status NOT NULL DEFAULT 'pending',
    max_users       INTEGER NOT NULL DEFAULT 1,
    max_branches    INTEGER NOT NULL DEFAULT 1,
    max_technicians INTEGER NOT NULL DEFAULT 2,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    plan_tier       VARCHAR(50) DEFAULT 'free',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. USERS ──────────────────────────────────────────────
-- Flow 1: Login & Auth
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255),
    role            user_role NOT NULL DEFAULT 'tenant_user',
    tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id       UUID, -- Will be a FK to branches in Phase 2
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Super Admin has no tenant; Tenant User must have one
    CONSTRAINT user_role_check CHECK (
        (role = 'super_admin' AND tenant_id IS NULL AND branch_id IS NULL) OR
        (role IN ('tenant_admin', 'main_branch_manager') AND tenant_id IS NOT NULL AND branch_id IS NULL) OR
        (role IN ('branch_user', 'technician', 'sales_staff', 'sub_branch_manager') AND tenant_id IS NOT NULL AND branch_id IS NOT NULL) OR
        (role = 'tenant_user' AND tenant_id IS NOT NULL)
    )
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_role ON users(role);

-- ─── 3. FEATURE TOGGLES ────────────────────────────────────
-- Flow 2A: Super Admin controls per-tenant feature visibility
CREATE TABLE feature_toggles (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id               UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    add_service             BOOLEAN NOT NULL DEFAULT TRUE,
    add_part                BOOLEAN NOT NULL DEFAULT TRUE,
    add_device_model        BOOLEAN NOT NULL DEFAULT TRUE,
    service_status_update   BOOLEAN NOT NULL DEFAULT TRUE,
    parts_management        BOOLEAN NOT NULL DEFAULT TRUE,
    printable_job_card      BOOLEAN NOT NULL DEFAULT TRUE,
    printable_receipt       BOOLEAN NOT NULL DEFAULT FALSE,  -- disabled by default
    branch_dashboard        BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 4. BRANDS ─────────────────────────────────────────────
-- Flow 8: Device Model Management
CREATE TABLE brands (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_brands_tenant ON brands(tenant_id);

-- ─── 5. DEVICE MODELS ──────────────────────────────────────
-- Flow 8: Models under brands, appear in job card dropdowns
CREATE TABLE device_models (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id        UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name            VARCHAR(150) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(brand_id, name)
);

CREATE INDEX idx_models_brand ON device_models(brand_id);

-- ─── 6. PARTS ──────────────────────────────────────────────
-- Flow 7: Parts Management (name, cost, selling price)
CREATE TABLE parts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    cost_price      DECIMAL(10,2) NOT NULL DEFAULT 0,
    selling_price   DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_parts_tenant ON parts(tenant_id);

-- ─── 7. PART ↔ MODEL COMPATIBILITY ─────────────────────────
-- Flow 7: Assign compatible device models to parts
CREATE TABLE part_compatible_models (
    part_id         UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    model_id        UUID NOT NULL REFERENCES device_models(id) ON DELETE CASCADE,
    PRIMARY KEY (part_id, model_id)
);

-- ─── 8. SERVICES (Job Cards) ────────────────────────────────
-- Flow 3/4/5: Core service lifecycle
CREATE TABLE services (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_number       VARCHAR(50) NOT NULL UNIQUE,   -- e.g. BR1-20260603-001
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_name       VARCHAR(255) NOT NULL,
    customer_phone      VARCHAR(50) NOT NULL,
    brand_id            UUID REFERENCES brands(id) ON DELETE SET NULL,
    model_id            UUID REFERENCES device_models(id) ON DELETE SET NULL,
    imei_number         VARCHAR(50),
    problem_description TEXT NOT NULL,
    received_date       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivery_date       TIMESTAMPTZ,
    assigned_technician VARCHAR(255),
    assigned_technician_id UUID REFERENCES users(id) ON DELETE SET NULL,
    advance_payment     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status              service_status NOT NULL DEFAULT 'received',
    cancellation_reason TEXT,
    created_by          UUID NOT NULL REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_tenant ON services(tenant_id);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_customer_phone ON services(customer_phone);
CREATE INDEX idx_services_imei ON services(imei_number);
CREATE INDEX idx_services_serial ON services(serial_number);
CREATE INDEX idx_services_created ON services(created_at);

-- ─── 9. SERVICE PARTS (Parts Used Per Job) ──────────────────
-- Flow 4: Add Parts Used — shop catalogue OR outside purchase
CREATE TABLE service_parts (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id              UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    source                  part_source NOT NULL DEFAULT 'shop',
    part_id                 UUID REFERENCES parts(id) ON DELETE SET NULL,  -- null if outside
    part_name               VARCHAR(255) NOT NULL,  -- copied from catalogue or entered manually
    quantity                INTEGER NOT NULL DEFAULT 1,
    cost_at_time            DECIMAL(10,2) NOT NULL DEFAULT 0,   -- ⚠️ LOCKED at time of entry
    selling_price_at_time   DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_parts_service ON service_parts(service_id);

-- ─── 10. SERVICE NOTES ──────────────────────────────────────
-- Flow 4: Technician notes, repair notes, customer approval
CREATE TABLE service_notes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id      UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    note_type       note_type NOT NULL DEFAULT 'technician',
    content         TEXT NOT NULL,
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_notes_service ON service_notes(service_id);

-- ─── 11. SERVICE HISTORY (Status Change Log) ────────────────
-- Flow 4: Update Status → logged in service history
CREATE TABLE service_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id      UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    from_status     service_status,   -- null on initial creation
    to_status       service_status NOT NULL,
    changed_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_history_service ON service_history(service_id);

-- ─── AUTO-UPDATE TIMESTAMPS ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated    BEFORE UPDATE ON tenants         FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated      BEFORE UPDATE ON users           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_toggles_updated    BEFORE UPDATE ON feature_toggles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_parts_updated      BEFORE UPDATE ON parts           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_services_updated   BEFORE UPDATE ON services        FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── SERIAL NUMBER GENERATOR FUNCTION ───────────────────────
-- Generates: BR1-20260603-001 (branch_code + date + daily counter)
CREATE OR REPLACE FUNCTION generate_serial_number(p_branch_code VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_date VARCHAR;
    v_count INTEGER;
    v_serial VARCHAR;
BEGIN
    v_date := TO_CHAR(NOW(), 'YYYYMMDD');
    
    SELECT COUNT(*) + 1 INTO v_count
    FROM services
    WHERE serial_number LIKE p_branch_code || '-' || v_date || '-%';
    
    v_serial := p_branch_code || '-' || v_date || '-' || LPAD(v_count::TEXT, 3, '0');
    RETURN v_serial;
END;
$$ LANGUAGE plpgsql;

-- ─── SEED: DEFAULT SUPER ADMIN ──────────────────────────────
-- Password: admin123 (bcrypt hash — change in production!)
-- This hash is for 'admin123' with bcrypt rounds=10
INSERT INTO users (email, password_hash, full_name, role, tenant_id)
VALUES (
    'stibe@superadmin',
    '$2b$10$placeholder_hash_replace_after_running_seed_script',
    'Super Admin',
    'super_admin',
    NULL
) ON CONFLICT (email) DO NOTHING;

-- ─── 12. SUBSCRIPTIONS (SaaS Billing) ───────────────────────
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) NOT NULL,
    stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
    plan_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);

-- ─── 13. INVENTORY (Phase 1) ────────────────────────────────
CREATE TABLE inventory (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id       UUID, -- FK to branches to be added in Phase 2
    brand_id        UUID REFERENCES brands(id) ON DELETE SET NULL,
    model_id        UUID REFERENCES device_models(id) ON DELETE SET NULL,
    category        VARCHAR(50) NOT NULL DEFAULT 'new', -- 'new' or 'second-hand'
    condition_grade VARCHAR(50), 
    imei_number     VARCHAR(50) NOT NULL,
    quantity        INTEGER NOT NULL DEFAULT 1,
    purchase_price  DECIMAL(10,2) NOT NULL DEFAULT 0,
    status          VARCHAR(50) NOT NULL DEFAULT 'available', -- 'available', 'sold', 'returned'
    supplier        VARCHAR(255),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_inventory_imei ON inventory(imei_number);

-- ─── 14. SALES (Phase 1) ────────────────────────────────────
CREATE TABLE sales (
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

-- ─── 15. STAFF COMMISSIONS (Phase 1) ────────────────────────
CREATE TABLE staff_commissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sales_id        UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    sales_staff_id  UUID NOT NULL REFERENCES users(id),
    amount          DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_inventory_updated BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SCHEMA COMPLETE — Phase 1 additions included
-- ============================================================
