const express = require('express');
const { query } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { featureGate } = require('../middleware/featureGate');

const router = express.Router();

router.use(authenticate, requireRole('tenant_admin', 'branch_user'));

const getTargetBranchId = (req, bodyBranchId) => {
  if (req.user.role === 'branch_user') {
    return req.user.branchId;
  }
  return bodyBranchId || null;
};

// ─── GET /api/brands ───────────────────────────────────
router.get('/brands', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { branchId } = req.query;

    let whereClause = 'WHERE b.tenant_id = $1';
    const values = [tenantId];
    let paramIndex = 2;

    const targetBranch = getTargetBranchId(req, branchId);
    if (targetBranch) {
      whereClause += ` AND (b.branch_id = $${paramIndex++} OR b.branch_id IS NULL)`;
      values.push(targetBranch);
    }

    const result = await query(`
      SELECT b.id, b.name, b.branch_id, b.created_at,
             COUNT(dm.id) AS model_count
      FROM brands b
      LEFT JOIN device_models dm ON dm.brand_id = b.id
      ${whereClause}
      GROUP BY b.id
      ORDER BY b.name ASC
    `, values);

    res.json({ brands: result.rows });
  } catch (err) {
    console.error('List brands error:', err);
    res.status(500).json({ error: 'Failed to list brands.' });
  }
});

// ─── POST /api/brands ──────────────────────────────────
router.post('/brands', featureGate('add_device_model'), async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, branchId } = req.body;

    const targetBranchId = getTargetBranchId(req, branchId);

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Brand name is required.' });
    }
    
    // We allow targetBranchId to be null for Global brands
    // Only tenant_admin/super_admin can omit it, branch_user automatically gets their branch assigned.

    const result = await query(
      `INSERT INTO brands (tenant_id, branch_id, name) VALUES ($1, $2, $3) RETURNING *`,
      [tenantId, targetBranchId, name.trim()]
    );

    res.status(201).json({
      message: 'Brand added.',
      brand: result.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Brand already exists for this branch.' });
    }
    console.error('Add brand error:', err);
    res.status(500).json({ error: 'Failed to add brand.' });
  }
});

// ─── GET /api/brands/:id/models ────────────────────────
router.get('/brands/:id/models', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    let whereClause = 'WHERE id = $1 AND tenant_id = $2';
    const values = [id, tenantId];

    if (req.user.role === 'branch_user') {
      whereClause += ' AND (branch_id = $3 OR branch_id IS NULL)';
      values.push(req.user.branchId);
    }

    const brandCheck = await query(`SELECT id, name, branch_id FROM brands ${whereClause}`, values);
    if (brandCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Brand not found.' });
    }

    const result = await query(
      `SELECT id, name, branch_id, created_at FROM device_models WHERE brand_id = $1 ORDER BY name ASC`,
      [id]
    );

    res.json({
      brand: brandCheck.rows[0],
      models: result.rows,
    });
  } catch (err) {
    console.error('List models error:', err);
    res.status(500).json({ error: 'Failed to list models.' });
  }
});

// ─── POST /api/brands/:id/models ───────────────────────
router.post('/brands/:id/models', featureGate('add_device_model'), async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { name, branchId } = req.body;

    const targetBranchId = getTargetBranchId(req, branchId);

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Model name is required.' });
    }

    let whereClause = 'WHERE id = $1 AND tenant_id = $2';
    const values = [id, tenantId];

    if (req.user.role === 'branch_user') {
      whereClause += ' AND (branch_id = $3 OR branch_id IS NULL)';
      values.push(req.user.branchId);
    }

    const brandCheck = await query(`SELECT id FROM brands ${whereClause}`, values);
    if (brandCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Brand not found.' });
    }

    const result = await query(
      `INSERT INTO device_models (brand_id, branch_id, name) VALUES ($1, $2, $3) RETURNING *`,
      [id, targetBranchId, name.trim()]
    );

    res.status(201).json({
      message: 'Model added.',
      model: result.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Model already exists under this brand.' });
    }
    console.error('Add model error:', err);
    res.status(500).json({ error: 'Failed to add model.' });
  }
});

// ─── PATCH /api/models/:id ─────────────────────────────
router.patch('/models/:id', featureGate('add_device_model'), async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Model name is required.' });
    }

    let whereClause = 'WHERE dm.id = $2 AND dm.brand_id = b.id AND b.tenant_id = $3';
    const values = [name.trim(), id, tenantId];

    if (req.user.role === 'branch_user') {
      whereClause += ' AND (dm.branch_id = $4 OR dm.branch_id IS NULL)';
      values.push(req.user.branchId);
    }

    const result = await query(`
      UPDATE device_models dm
      SET name = $1
      FROM brands b
      ${whereClause}
      RETURNING dm.*
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Model not found.' });
    }

    res.json({ message: 'Model updated.', model: result.rows[0] });
  } catch (err) {
    console.error('Update model error:', err);
    res.status(500).json({ error: 'Failed to update model.' });
  }
});

// ─── DELETE /api/models/:id ────────────────────────────
router.delete('/models/:id', featureGate('add_device_model'), async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    let whereClause = 'WHERE dm.id = $1 AND dm.brand_id = b.id AND b.tenant_id = $2';
    const values = [id, tenantId];

    if (req.user.role === 'branch_user') {
      whereClause += ' AND (dm.branch_id = $3 OR dm.branch_id IS NULL)';
      values.push(req.user.branchId);
    }

    const result = await query(`
      DELETE FROM device_models dm
      USING brands b
      ${whereClause}
      RETURNING dm.id, dm.name
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Model not found.' });
    }

    res.json({ message: 'Model deleted.', deleted: result.rows[0] });
  } catch (err) {
    console.error('Delete model error:', err);
    res.status(500).json({ error: 'Failed to delete model.' });
  }
});

// ─── GET /api/models/all ───────────────────────────────
router.get('/all', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { branchId } = req.query;

    let whereClause = 'WHERE b.tenant_id = $1';
    const values = [tenantId];
    let paramIndex = 2;

    const targetBranch = getTargetBranchId(req, branchId);
    if (targetBranch) {
      whereClause += ` AND (b.branch_id = $${paramIndex++} OR b.branch_id IS NULL)`;
      values.push(targetBranch);
    }

    const result = await query(`
      SELECT b.id AS brand_id, b.name AS brand_name,
             COALESCE(
               json_agg(
                 json_build_object('id', dm.id, 'name', dm.name)
                 ORDER BY dm.name
               ) FILTER (WHERE dm.id IS NOT NULL),
               '[]'
             ) AS models
      FROM brands b
      LEFT JOIN device_models dm ON dm.brand_id = b.id
      ${whereClause}
      GROUP BY b.id
      ORDER BY b.name ASC
    `, values);

    res.json({ brandsWithModels: result.rows });
  } catch (err) {
    console.error('Get all models error:', err);
    res.status(500).json({ error: 'Failed to fetch brands and models.' });
  }
});

module.exports = router;
