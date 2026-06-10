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

// ─── GET /api/parts ────────────────────────────────────
router.get('/', featureGate('parts_management'), async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { search, branchId } = req.query;

    let whereClause = 'WHERE p.tenant_id = $1';
    const values = [tenantId];
    let paramIndex = 2;

    const targetBranch = getTargetBranchId(req, branchId);
    if (targetBranch) {
      whereClause += ` AND p.branch_id = $${paramIndex++}`;
      values.push(targetBranch);
    }

    if (search) {
      whereClause += ` AND p.name ILIKE $${paramIndex++}`;
      values.push(`%${search}%`);
    }

    const result = await query(`
      SELECT p.*,
             COALESCE(
               json_agg(
                 json_build_object('id', dm.id, 'name', dm.name, 'brand', b.name)
               ) FILTER (WHERE dm.id IS NOT NULL), 
               '[]'
             ) AS compatible_models
      FROM parts p
      LEFT JOIN part_compatible_models pcm ON pcm.part_id = p.id
      LEFT JOIN device_models dm ON pcm.model_id = dm.id
      LEFT JOIN brands b ON dm.brand_id = b.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.name ASC
    `, values);

    res.json({ parts: result.rows });
  } catch (err) {
    console.error('List parts error:', err);
    res.status(500).json({ error: 'Failed to list parts.' });
  }
});

// ─── POST /api/parts ───────────────────────────────────
router.post('/', featureGate('add_part'), async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { name, costPrice, sellingPrice, compatibleModelIds, branchId } = req.body;

    const targetBranchId = getTargetBranchId(req, branchId);

    if (!name) {
      return res.status(400).json({ error: 'Part name is required.' });
    }
    if (!targetBranchId) {
      return res.status(400).json({ error: 'branchId is required.' });
    }

    const partResult = await query(
      `INSERT INTO parts (tenant_id, branch_id, name, cost_price, selling_price)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [tenantId, targetBranchId, name, costPrice || 0, sellingPrice || 0]
    );

    const part = partResult.rows[0];

    if (compatibleModelIds && compatibleModelIds.length > 0) {
      const insertValues = compatibleModelIds
        .map((modelId) => `('${part.id}', '${modelId}')`)
        .join(', ');
      await query(
        `INSERT INTO part_compatible_models (part_id, model_id) VALUES ${insertValues} ON CONFLICT DO NOTHING`
      );
    }

    res.status(201).json({
      message: 'Part added to catalogue.',
      part,
    });
  } catch (err) {
    console.error('Add part error:', err);
    res.status(500).json({ error: 'Failed to add part.' });
  }
});

// ─── PATCH /api/parts/:id ──────────────────────────────
router.patch('/:id', featureGate('parts_management'), async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { name, costPrice, sellingPrice, compatibleModelIds } = req.body;

    let whereClause = `WHERE id = $1 AND tenant_id = $2`;
    const checkValues = [id, tenantId];
    if (req.user.role === 'branch_user') {
      whereClause += ` AND branch_id = $3`;
      checkValues.push(req.user.branchId);
    }

    const checkResult = await query(`SELECT id FROM parts ${whereClause}`, checkValues);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Part not found.' });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name) { updates.push(`name = $${paramIndex++}`); values.push(name); }
    if (costPrice !== undefined) { updates.push(`cost_price = $${paramIndex++}`); values.push(costPrice); }
    if (sellingPrice !== undefined) { updates.push(`selling_price = $${paramIndex++}`); values.push(sellingPrice); }

    if (updates.length > 0) {
      values.push(id, tenantId);
      let updateWhere = `WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}`;
      if (req.user.role === 'branch_user') {
        updateWhere += ` AND branch_id = $${paramIndex++}`;
        values.push(req.user.branchId);
      }
      
      await query(
        `UPDATE parts SET ${updates.join(', ')} ${updateWhere} RETURNING *`,
        values
      );
    }

    if (compatibleModelIds !== undefined) {
      await query(`DELETE FROM part_compatible_models WHERE part_id = $1`, [id]);

      if (compatibleModelIds.length > 0) {
        const insertValues = compatibleModelIds
          .map((modelId) => `('${id}', '${modelId}')`)
          .join(', ');
        await query(
          `INSERT INTO part_compatible_models (part_id, model_id) VALUES ${insertValues} ON CONFLICT DO NOTHING`
        );
      }
    }

    const updatedResult = await query(`
      SELECT p.*,
             COALESCE(
               json_agg(
                 json_build_object('id', dm.id, 'name', dm.name)
               ) FILTER (WHERE dm.id IS NOT NULL), 
               '[]'
             ) AS compatible_models
      FROM parts p
      LEFT JOIN part_compatible_models pcm ON pcm.part_id = p.id
      LEFT JOIN device_models dm ON pcm.model_id = dm.id
      WHERE p.id = $1 AND p.tenant_id = $2
      GROUP BY p.id
    `, [id, tenantId]);

    res.json({ message: 'Part updated.', part: updatedResult.rows[0] });
  } catch (err) {
    console.error('Update part error:', err);
    res.status(500).json({ error: 'Failed to update part.' });
  }
});

// ─── DELETE /api/parts/:id ─────────────────────────────
router.delete('/:id', featureGate('parts_management'), async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    let whereClause = `WHERE id = $1 AND tenant_id = $2`;
    const values = [id, tenantId];

    if (req.user.role === 'branch_user') {
      whereClause += ` AND branch_id = $3`;
      values.push(req.user.branchId);
    }

    const result = await query(
      `DELETE FROM parts ${whereClause} RETURNING id`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Part not found.' });
    }

    res.json({ message: 'Part deleted successfully.' });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Cannot delete part because it is used in existing job cards.' });
    }
    console.error('Delete part error:', err);
    res.status(500).json({ error: 'Failed to delete part.' });
  }
});

module.exports = router;
