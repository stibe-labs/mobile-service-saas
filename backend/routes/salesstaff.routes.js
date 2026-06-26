const express = require('express');
const bcrypt = require('bcrypt');
const { query } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireRole('tenant_admin', 'main_branch_manager', 'sub_branch_manager', 'branch_user'));

const getTargetBranchId = (req, bodyBranchId) => {
  if (['sub_branch_manager', 'branch_user'].includes(req.user.role)) {
    return req.user.branchId;
  }
  return bodyBranchId || null;
};

// ─── GET /api/sales-staff ──────────────────────────────
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
      ${whereClause} AND role = 'sales_staff'
      ORDER BY full_name ASC
    `, values);

    res.json({ salesStaff: result.rows });
  } catch (err) {
    console.error('List sales staff error:', err);
    res.status(500).json({ error: 'Failed to list sales staff.' });
  }
});

// ─── POST /api/sales-staff ─────────────────────────────
router.post('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, email, password, branchId } = req.body;

    const targetBranchId = getTargetBranchId(req, branchId);

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    
    // We only enforce limits on technicians currently, not on sales_staff, 
    // but they must be connected to a branch if a sub branch manager adds them.

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await query(
      `INSERT INTO users (tenant_id, branch_id, full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, 'sales_staff') RETURNING id, full_name as name, email, branch_id, is_active, created_at`,
      [tenantId, targetBranchId, name, email, passwordHash]
    );

    res.status(201).json({
      message: 'Sales staff added.',
      salesStaff: result.rows[0],
    });
  } catch (err) {
    console.error('Add sales staff error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists.' });
    }
    res.status(500).json({ error: 'Failed to add sales staff.' });
  }
});

// ─── DELETE /api/sales-staff/:id ───────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    let whereClause = 'WHERE id = $1 AND tenant_id = $2';
    const values = [id, tenantId];

    if (['sub_branch_manager', 'branch_user'].includes(req.user.role)) {
      whereClause += ' AND (branch_id = $3 OR branch_id IS NULL)';
      values.push(req.user.branchId);
    }

    const result = await query(
      `DELETE FROM users ${whereClause} AND role = 'sales_staff' RETURNING id, full_name as name`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sales staff not found.' });
    }

    res.json({ message: 'Sales staff deleted.', deleted: result.rows[0] });
  } catch (err) {
    console.error('Delete sales staff error:', err);
    res.status(500).json({ error: 'Failed to delete sales staff.' });
  }
});

module.exports = router;
