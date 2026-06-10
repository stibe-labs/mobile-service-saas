const express = require('express');
const { query, getClient } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const bcrypt = require('bcrypt');

const router = express.Router();

// Only Main Branch Admins can access these routes
router.use(authenticate, requireRole('tenant_admin'));

// ─── GET /api/tenant/branches ────────────────────────────
router.get('/branches', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const result = await query(`
      SELECT b.id, b.name, b.branch_code, b.address, b.phone, b.created_at,
             COUNT(u.id) AS user_count
      FROM branches b
      LEFT JOIN users u ON u.branch_id = b.id AND u.is_active = true
      WHERE b.tenant_id = $1 
      GROUP BY b.id
      ORDER BY b.created_at ASC
    `, [tenantId]);

    res.json({ branches: result.rows });
  } catch (err) {
    console.error('List branches error:', err);
    res.status(500).json({ error: 'Failed to list branches.' });
  }
});

// ─── POST /api/tenant/branches ───────────────────────────
router.post('/branches', async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const tenantId = req.user.tenantId;
    const { name, branchCode, address, phone, password, email, fullName } = req.body;

    if (!name || !branchCode || !email || !password) {
      return res.status(400).json({ error: 'Name, branch code, email, and password are required.' });
    }

    // Check if max branches limit reached
    const tenantResult = await client.query(`SELECT max_branches FROM tenants WHERE id = $1`, [tenantId]);
    if (tenantResult.rows.length === 0) {
      throw new Error('Tenant not found');
    }
    const maxBranches = tenantResult.rows[0].max_branches;

    const countResult = await client.query(`SELECT COUNT(*) FROM branches WHERE tenant_id = $1`, [tenantId]);
    const currentBranches = parseInt(countResult.rows[0].count);

    if (currentBranches >= maxBranches) {
      return res.status(403).json({ error: `Cannot create branch. Limit of ${maxBranches} reached.` });
    }

    // Insert Branch
    const branchResult = await client.query(
      `INSERT INTO branches (tenant_id, name, branch_code, address, phone)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenantId, name, branchCode, address || null, phone || null]
    );
    const branch = branchResult.rows[0];

    // Insert Branch User
    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, full_name, role, tenant_id, branch_id)
       VALUES ($1, $2, $3, 'branch_user', $4, $5) RETURNING id, email, full_name, role`,
      [email, passwordHash, fullName || name, tenantId, branch.id]
    );

    // Seed default brands for this new branch
    const defaultBrands = ['Apple', 'Samsung', 'Xiaomi', 'Vivo', 'Oppo', 'Other'];
    for (const brandName of defaultBrands) {
      await client.query(
        `INSERT INTO brands (tenant_id, branch_id, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [tenantId, branch.id, brandName]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Branch created successfully.',
      branch,
      user: userResult.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Branch code or email already exists.' });
    }
    console.error('Create branch error:', err);
    res.status(500).json({ error: 'Failed to create branch.' });
  } finally {
    client.release();
  }
});

// ─── PATCH /api/tenant/branches/:id ────────────────────────
router.patch('/branches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { name, branchCode, address, phone } = req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name) { updates.push(`name = $${paramIndex++}`); values.push(name); }
    if (branchCode) { updates.push(`branch_code = $${paramIndex++}`); values.push(branchCode); }
    if (address !== undefined) { updates.push(`address = $${paramIndex++}`); values.push(address); }
    if (phone !== undefined) { updates.push(`phone = $${paramIndex++}`); values.push(phone); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    values.push(id, tenantId);
    const result = await query(
      `UPDATE branches SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found.' });
    }

    res.json({ message: 'Branch updated.', branch: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Branch code already exists.' });
    }
    console.error('Update branch error:', err);
    res.status(500).json({ error: 'Failed to update branch.' });
  }
});

// ─── DELETE /api/tenant/branches/:id ───────────────────────
router.delete('/branches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    // Prevent deleting the first/main branch
    const firstBranchResult = await query(
      `SELECT id FROM branches WHERE tenant_id = $1 ORDER BY created_at ASC LIMIT 1`,
      [tenantId]
    );
    if (firstBranchResult.rows.length > 0 && firstBranchResult.rows[0].id === id) {
      return res.status(400).json({ error: 'Cannot delete the Main Branch.' });
    }

    const result = await query(
      `DELETE FROM branches WHERE id = $1 AND tenant_id = $2 RETURNING id, name`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found.' });
    }

    res.json({ message: 'Branch deleted.', deleted: result.rows[0] });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Cannot delete branch because it contains data (services, parts, etc).' });
    }
    console.error('Delete branch error:', err);
    res.status(500).json({ error: 'Failed to delete branch.' });
  }
});

// ─── GET /api/tenant/branches/:id/users ──────────────────
router.get('/branches/:id/users', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const result = await query(`
      SELECT id, email, full_name, role, is_active, created_at
      FROM users
      WHERE branch_id = $1 AND tenant_id = $2
      ORDER BY created_at ASC
    `, [id, tenantId]);

    res.json({ users: result.rows });
  } catch (err) {
    console.error('List branch users error:', err);
    res.status(500).json({ error: 'Failed to list branch users.' });
  }
});

module.exports = router;
