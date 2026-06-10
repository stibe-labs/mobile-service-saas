// ─── Auth Routes ───────────────────────────────────────
// Flow 1: Login & Authentication
// POST /api/auth/login   — Login with email & password
// POST /api/auth/logout  — Logout (client-side token removal)
// GET  /api/auth/me      — Get current user profile

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ─── POST /api/auth/login ──────────────────────────────
// Flow 1: User enters email & password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user by email
    const result = await query(
      `SELECT u.id, u.email, u.full_name, u.password_hash, u.role, 
              u.tenant_id, u.branch_id, u.is_active,
              t.name AS tenant_name, t.status AS tenant_status,
              b.name AS branch_name, b.branch_code
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Your account has been deactivated. Contact the administrator.' });
    }

    // For tenant users/admins, check tenant status
    if (user.role !== 'super_admin' && user.tenant_status !== 'active') {
      return res.status(403).json({ error: 'Your company account is suspended. Contact the administrator.' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        tenantId: user.tenant_id,
        branchId: user.branch_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return user info + token
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name,
        branchId: user.branch_id,
        branchName: user.branch_name,
        branchCode: user.branch_code,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ─── POST /api/auth/logout ─────────────────────────────
// Logout is client-side (remove token). This is a no-op endpoint.
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully. Please remove the token on client side.' });
});

// ─── GET /api/auth/me ──────────────────────────────────
// Get current authenticated user's profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.full_name, u.role, u.tenant_id, u.branch_id, u.created_at,
              t.name AS tenant_name, b.name AS branch_name, b.branch_code
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // If tenant user/admin, also fetch their feature toggles
    let featureToggles = null;
    if (req.user.role !== 'super_admin' && req.user.tenantId) {
      const toggleResult = await query(
        `SELECT add_service, add_part, add_device_model, service_status_update,
                parts_management, printable_job_card, printable_receipt, branch_dashboard
         FROM feature_toggles WHERE tenant_id = $1`,
        [req.user.tenantId]
      );
      if (toggleResult.rows.length > 0) {
        featureToggles = toggleResult.rows[0];
      }
    }

    res.json({
      user: result.rows[0],
      featureToggles,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// ─── POST /api/auth/register ───────────────────────────
// Flow: Public SaaS Registration
router.post('/register', async (req, res) => {
  const client = await require('../config/db').getClient();
  try {
    await client.query('BEGIN');

    const { shopName, email, password, fullName } = req.body;

    if (!shopName || !password || !email) {
      return res.status(400).json({ error: 'Shop name, email, and password are required.' });
    }

    // Generate a unique branch code base
    const baseCode = shopName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'B') + Math.floor(Math.random() * 1000);

    // Create pending tenant
    const tenantResult = await client.query(
      `INSERT INTO tenants (name, status, max_branches, max_technicians, plan_tier, source)
       VALUES ($1, 'pending', 1, 2, 'free', 'self_registered')
       RETURNING *`,
      [shopName]
    );

    const tenant = tenantResult.rows[0];

    // Auto-create Main Branch for the tenant
    const branchResult = await client.query(
      `INSERT INTO branches (tenant_id, name, branch_code, address)
       VALUES ($1, 'Main Branch', $2, 'HQ') RETURNING id`,
      [tenant.id, baseCode]
    );
    const branchId = branchResult.rows[0].id;

    // Create default feature toggles
    await client.query(`INSERT INTO feature_toggles (tenant_id) VALUES ($1)`, [tenant.id]);

    // Create the tenant_admin user
    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, full_name, role, tenant_id)
       VALUES ($1, $2, $3, 'tenant_admin', $4)
       RETURNING id, email, full_name, role, tenant_id`,
      [email, passwordHash, fullName || shopName, tenant.id]
    );

    // Seed default brands
    const defaultBrands = ['Apple', 'Samsung', 'Xiaomi', 'Vivo', 'Oppo', 'Other'];
    for (const brandName of defaultBrands) {
      await client.query(
        `INSERT INTO brands (tenant_id, branch_id, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [tenant.id, branchId, brandName]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Registration successful. Account pending payment.',
      tenant: tenant,
      user: userResult.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists.' });
    }
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register account.' });
  } finally {
    client.release();
  }
});

module.exports = router;
