const express = require('express');
const bcrypt = require('bcrypt');
const { query } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireRole('tenant_admin', 'branch_user', 'main_branch_manager', 'sub_branch_manager'));

const getTargetBranchId = (req, bodyBranchId) => {
  if (['branch_user', 'sub_branch_manager'].includes(req.user.role)) {
    return req.user.branchId;
  }
  return bodyBranchId || null;
};

// ─── GET /api/technicians ──────────────────────────────
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { branchId } = req.query;

    let whereClause = 'WHERE tenant_id = $1';
    const values = [tenantId];
    let paramIndex = 2;

    const targetBranch = getTargetBranchId(req, branchId);
    if (targetBranch) {
      whereClause += ` AND (branch_id = $${paramIndex++} OR branch_id IS NULL)`;
      values.push(targetBranch);
    }

    const result = await query(`
      SELECT id, full_name as name, email, is_active, branch_id, created_at 
      FROM users 
      ${whereClause} AND role = 'technician'
      ORDER BY full_name ASC
    `, values);

    res.json({ technicians: result.rows });
  } catch (err) {
    console.error('List technicians error:', err);
    res.status(500).json({ error: 'Failed to list technicians.' });
  }
});

// ─── POST /api/technicians ─────────────────────────────
router.post('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, email, password, branchId } = req.body;

    const targetBranchId = getTargetBranchId(req, branchId);

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    
    // Allow targetBranchId to be null for Global Technicians

    // Check limits
    const limitCheck = await query(`
      SELECT t.max_technicians, 
             (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id AND u.role = 'technician') as current_count
      FROM tenants t
      WHERE t.id = $1
    `, [tenantId]);

    if (limitCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }

    const { max_technicians, current_count } = limitCheck.rows[0];
    if (parseInt(current_count) >= max_technicians) {
      return res.status(403).json({ error: `Technician limit reached. Maximum allowed for your shop is ${max_technicians}. Please upgrade your plan.` });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await query(
      `INSERT INTO users (tenant_id, branch_id, full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, 'technician') RETURNING id, full_name as name, email, branch_id, is_active, created_at`,
      [tenantId, targetBranchId, name, email, passwordHash]
    );

    res.status(201).json({
      message: 'Technician added.',
      technician: result.rows[0],
    });
  } catch (err) {
    console.error('Add technician error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists.' });
    }
    res.status(500).json({ error: 'Failed to add technician.' });
  }
});

// ─── DELETE /api/technicians/:id ───────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    let whereClause = 'WHERE id = $1 AND tenant_id = $2';
    const values = [id, tenantId];

    if (['branch_user', 'sub_branch_manager'].includes(req.user.role)) {
      whereClause += ' AND (branch_id = $3 OR branch_id IS NULL)';
      values.push(req.user.branchId);
    }

    const result = await query(
      `DELETE FROM users ${whereClause} AND role = 'technician' RETURNING id, full_name as name`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Technician not found.' });
    }

    res.json({ message: 'Technician deleted.', deleted: result.rows[0] });
  } catch (err) {
    console.error('Delete technician error:', err);
    res.status(500).json({ error: 'Failed to delete technician.' });
  }
});

module.exports = router;
