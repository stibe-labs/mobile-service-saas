// ─── Super Admin Routes ────────────────────────────────
// Flow 2: Super Admin Dashboard & Controls
// Flow 2A: Feature Toggle Controls (per tenant)

const express = require('express');
const bcrypt = require('bcrypt');
const { query, getClient } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { VALID_FEATURES } = require('../middleware/featureGate');

const router = express.Router();

// All routes require Super Admin role
router.use(authenticate, requireRole('super_admin'));

// ─── GET /api/admin/dashboard ──────────────────────────
// Flow 2: Overview panel — tenant list, active users, statuses
router.get('/dashboard', async (req, res) => {
  try {
    // Get all tenants with user counts
    const tenantsResult = await query(`
      SELECT t.id, t.name, t.status, t.max_branches, t.plan_tier, t.source, t.created_at,
             COUNT(u.id) FILTER (WHERE u.is_active = true) AS active_users,
             COUNT(u.id) AS total_users
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);

    // Get summary counts
    const summaryResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'active') AS active_tenants,
        COUNT(*) FILTER (WHERE status = 'suspended') AS suspended_tenants,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_tenants,
        COUNT(*) AS total_tenants
      FROM tenants
    `);

    res.json({
      summary: summaryResult.rows[0],
      tenants: tenantsResult.rows,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
});

// ─── GET /api/admin/tenants ────────────────────────────
// Flow 2: List all tenants with details
router.get('/tenants', async (req, res) => {
  try {
    const result = await query(`
      SELECT t.id, t.name, t.status, t.max_branches, t.max_technicians, 
             t.plan_tier, t.source, t.created_at, t.updated_at,
             COUNT(u.id) FILTER (WHERE u.is_active = true) AS active_users,
             COUNT(u.id) AS total_users
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      GROUP BY t.id
      ORDER BY t.created_at ASC
    `);

    res.json({ tenants: result.rows });
  } catch (err) {
    console.error('List tenants error:', err);
    res.status(500).json({ error: 'Failed to list tenants.' });
  }
});

// ─── POST /api/admin/tenants ───────────────────────────
// Flow 2: Approve/create a new tenant (shop account)
router.post('/tenants', async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { name, status, maxBranches, maxTechnicians, planTier, password, email, fullName } = req.body;

    // Validate
    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'name, email, and password are required.',
      });
    }

    // Create tenant
    const tenantResult = await client.query(
      `INSERT INTO tenants (name, status, max_branches, max_technicians, plan_tier, source)
       VALUES ($1, $2, $3, $4, $5, 'super_admin')
       RETURNING *`,
      [name, status || 'active', maxBranches || 1, maxTechnicians || 2, planTier || 'free']
    );

    const tenant = tenantResult.rows[0];

    // Create default feature toggles for this tenant
    await client.query(
      `INSERT INTO feature_toggles (tenant_id) VALUES ($1)`,
      [tenant.id]
    );

    // Generate a unique branch code base
    const baseCode = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'B') + Math.floor(Math.random() * 1000);

    // Auto-create Main Branch for the tenant
    const branchResult = await client.query(
      `INSERT INTO branches (tenant_id, name, branch_code, address)
       VALUES ($1, 'Main Branch', $2, 'HQ') RETURNING id`,
      [tenant.id, baseCode]
    );
    const branchId = branchResult.rows[0].id;

    // Create the tenant's user account (Main Branch Admin)
    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, full_name, role, tenant_id)
       VALUES ($1, $2, $3, 'tenant_admin', $4)
       RETURNING id, email, full_name, role, tenant_id`,
      [email, passwordHash, fullName || name, tenant.id]
    );

    // Seed default brands for this tenant (Branch-specific)
    const defaultBrands = ['Apple', 'Samsung', 'Xiaomi', 'Vivo', 'Oppo', 'Other'];
    for (const brandName of defaultBrands) {
      await client.query(
        `INSERT INTO brands (tenant_id, branch_id, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [tenant.id, branchId, brandName]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Tenant created successfully.',
      tenant,
      user: userResult.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      // Unique constraint violation
      return res.status(409).json({ error: 'Branch code or email already exists.' });
    }
    console.error('Create tenant error:', err);
    res.status(500).json({ error: 'Failed to create tenant.' });
  } finally {
    client.release();
  }
});

// ─── PATCH /api/admin/tenants/:id ──────────────────────
// Flow 2: Suspend or reactivate a tenant
router.patch('/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, name, planTier } = req.body;

    // Build dynamic update
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (status) {
      const validStatuses = ['pending', 'active', 'suspended'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Use: ${validStatuses.join(', ')}` });
      }
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }

    if (planTier) {
      updates.push(`plan_tier = $${paramIndex++}`);
      values.push(planTier);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    values.push(id);
    const result = await query(
      `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }

    res.json({ message: 'Tenant updated.', tenant: result.rows[0] });
  } catch (err) {
    console.error('Update tenant error:', err);
    res.status(500).json({ error: 'Failed to update tenant.' });
  }
});

// ─── PATCH /api/admin/tenants/:id/max-branches ─────────
// Flow 2: Set maximum number of branches per tenant
router.patch('/tenants/:id/max-branches', async (req, res) => {
  try {
    const { id } = req.params;
    const { maxBranches } = req.body;

    if (!maxBranches || maxBranches < 1) {
      return res.status(400).json({ error: 'maxBranches must be at least 1.' });
    }

    const result = await query(
      `UPDATE tenants SET max_branches = $1 WHERE id = $2 RETURNING *`,
      [maxBranches, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }

    res.json({ message: 'Max branches updated.', tenant: result.rows[0] });
  } catch (err) {
    console.error('Update max branches error:', err);
    res.status(500).json({ error: 'Failed to update max branches.' });
  }
});

// ─── PATCH /api/admin/tenants/:id/max-technicians ──────
// Flow 2: Set maximum number of technicians per tenant
router.patch('/tenants/:id/max-technicians', async (req, res) => {
  try {
    const { id } = req.params;
    const { maxTechnicians } = req.body;

    if (!maxTechnicians || maxTechnicians < 1) {
      return res.status(400).json({ error: 'maxTechnicians must be at least 1.' });
    }

    const result = await query(
      `UPDATE tenants SET max_technicians = $1 WHERE id = $2 RETURNING *`,
      [maxTechnicians, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }

    res.json({ message: 'Max technicians updated.', tenant: result.rows[0] });
  } catch (err) {
    console.error('Update max technicians error:', err);
    res.status(500).json({ error: 'Failed to update max technicians.' });
  }
});

// ─── POST /api/admin/tenants/:id/reset-password ────────
// Flow 2: Reset a tenant user's password
router.post('/tenants/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;  // tenant ID
    const { userId, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // If userId not provided, reset the first user of the tenant
    let targetUserId = userId;
    if (!targetUserId) {
      const userResult = await query(
        `SELECT id FROM users WHERE tenant_id = $1 AND role = 'tenant_admin' LIMIT 1`,
        [id]
      );
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'No user found for this tenant.' });
      }
      targetUserId = userResult.rows[0].id;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const result = await query(
      `UPDATE users SET password_hash = $1 WHERE id = $2 AND tenant_id = $3 RETURNING id, email`,
      [passwordHash, targetUserId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found for this tenant.' });
    }

    res.json({ message: 'Password reset successful.', user: result.rows[0] });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// ─── GET /api/admin/tenants/:id/toggles ────────────────
// Flow 2A: Get feature toggles for a specific tenant
router.get('/tenants/:id/toggles', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT ft.*, t.name AS tenant_name
       FROM feature_toggles ft
       JOIN tenants t ON t.id = ft.tenant_id
       WHERE ft.tenant_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feature toggles not found for this tenant.' });
    }

    res.json({ toggles: result.rows[0] });
  } catch (err) {
    console.error('Get toggles error:', err);
    res.status(500).json({ error: 'Failed to fetch feature toggles.' });
  }
});

// ─── PATCH /api/admin/tenants/:id/toggles ──────────────
// Flow 2A: Update feature toggles for a specific tenant
router.patch('/tenants/:id/toggles', async (req, res) => {
  try {
    const { id } = req.params;
    const toggleUpdates = req.body;

    // Validate: only allow valid feature names
    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(toggleUpdates)) {
      if (VALID_FEATURES.includes(key) && typeof value === 'boolean') {
        updates.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No valid toggle updates provided.',
        validFeatures: VALID_FEATURES,
      });
    }

    values.push(id);
    const result = await query(
      `UPDATE feature_toggles SET ${updates.join(', ')} WHERE tenant_id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feature toggles not found for this tenant.' });
    }

    res.json({ message: 'Feature toggles updated.', toggles: result.rows[0] });
  } catch (err) {
    console.error('Update toggles error:', err);
    res.status(500).json({ error: 'Failed to update feature toggles.' });
  }
});

// ─── GET /api/admin/tenants/:id/technicians ────────────
// Flow 2: Get technicians for a specific tenant
router.get('/tenants/:id/technicians', async (req, res) => {
  try {
    const { id } = req.params;
    const { branchId } = req.query;
    let q = `SELECT id, full_name as name, email, is_active, created_at FROM users WHERE tenant_id = $1 AND role = 'technician'`;
    const values = [id];
    if (branchId) {
      q += ` AND (branch_id = $2 OR branch_id IS NULL)`;
      values.push(branchId);
    }
    q += ` ORDER BY name ASC`;
    const result = await query(q, values);
    res.json({ technicians: result.rows });
  } catch (err) {
    console.error('Get tenant technicians error:', err);
    res.status(500).json({ error: 'Failed to fetch tenant technicians.' });
  }
});

// ─── GET /api/admin/tenants/:id/services ───────────────
// Flow 2: Get services for a specific tenant
router.get('/tenants/:id/services', async (req, res) => {
  try {
    const { id } = req.params;
    const { branchId } = req.query;
    let q = `SELECT s.id, s.serial_number, s.customer_name, s.status, s.received_date,
              b.name AS brand_name, m.name AS model_name, s.assigned_technician
       FROM services s
       LEFT JOIN brands b ON s.brand_id = b.id
       LEFT JOIN device_models m ON s.model_id = m.id
       WHERE s.tenant_id = $1`;
    const values = [id];
    if (branchId) {
      q += ` AND s.branch_id = $2`;
      values.push(branchId);
    }
    q += ` ORDER BY s.received_date DESC`;
    const result = await query(q, values);
    res.json({ services: result.rows });
  } catch (err) {
    console.error('Get tenant services error:', err);
    res.status(500).json({ error: 'Failed to fetch tenant services.' });
  }
});

// ─── GET /api/admin/tenants/:id/branches ───────────────
// Flow 2: Get branches for a specific tenant
router.get('/tenants/:id/branches', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT b.id, b.name, b.branch_code, b.status, b.created_at,
             COUNT(s.id) AS total_jobs,
             COUNT(s.id) FILTER (WHERE s.status NOT IN ('delivered', 'cancelled')) AS pending_jobs,
             COUNT(s.id) FILTER (WHERE s.status = 'delivered') AS delivered_jobs,
             COALESCE(
               (SELECT email FROM users WHERE branch_id = b.id AND role = 'branch_user' LIMIT 1),
               (SELECT email FROM users WHERE tenant_id = b.tenant_id AND role = 'tenant_admin' LIMIT 1)
             ) AS admin_email
      FROM branches b
      LEFT JOIN services s ON b.id = s.branch_id
      WHERE b.tenant_id = $1
      GROUP BY b.id
      ORDER BY b.created_at ASC
    `, [id]);
    res.json({ branches: result.rows });
  } catch (err) {
    console.error('Get tenant branches error:', err);
    res.status(500).json({ error: 'Failed to fetch tenant branches.' });
  }
});

module.exports = router;
