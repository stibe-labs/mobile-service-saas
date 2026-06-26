const express = require('express');
const { query } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { featureGate } = require('../middleware/featureGate');

const router = express.Router();

router.use(authenticate, requireRole('tenant_admin', 'main_branch_manager', 'sub_branch_manager', 'sales_staff', 'branch_user'));
router.use(featureGate('inventory_module'));

const getTargetBranchId = (req, bodyBranchId) => {
  if (['branch_user', 'sub_branch_manager', 'sales_staff'].includes(req.user.role)) {
    return req.user.branchId;
  }
  return bodyBranchId || null;
};

// ─── GET /api/inventory ────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { branchId, status, category, search } = req.query;

    let whereClause = 'WHERE i.tenant_id = $1';
    const values = [tenantId];
    let paramIndex = 2;

    const targetBranch = getTargetBranchId(req, branchId);
    if (targetBranch) {
      whereClause += ` AND i.branch_id = $${paramIndex++}`;
      values.push(targetBranch);
    }

    if (status) {
      whereClause += ` AND i.status = $${paramIndex++}`;
      values.push(status);
    }

    if (category) {
      whereClause += ` AND i.category = $${paramIndex++}`;
      values.push(category);
    }

    if (search) {
      whereClause += ` AND (i.imei_number ILIKE $${paramIndex} OR dm.name ILIKE $${paramIndex} OR b.name ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    const result = await query(`
      SELECT i.*, 
             dm.name AS model_name, 
             b.name AS brand_name,
             br.name AS branch_name,
             CASE 
                WHEN i.category = 'new' THEN COALESCE(pm.margin_new, pm_fallback.margin_new, 0)
                WHEN i.category = 'used' THEN COALESCE(pm.margin_used, pm_fallback.margin_used, 0)
                WHEN i.category = 'refurbished' THEN COALESCE(pm.margin_refurbished, pm_fallback.margin_refurbished, 0)
                ELSE COALESCE(pm.margin_new, pm_fallback.margin_new, 0)
             END AS branch_margin
      FROM inventory i
      LEFT JOIN device_models dm ON i.model_id = dm.id
      LEFT JOIN brands b ON i.brand_id = b.id
      LEFT JOIN branches br ON i.branch_id = br.id
      LEFT JOIN pricing_margins pm ON i.model_id = pm.model_id AND i.branch_id = pm.branch_id
      LEFT JOIN LATERAL (
          SELECT margin_new, margin_used, margin_refurbished
          FROM pricing_margins
          WHERE model_id = i.model_id AND tenant_id = i.tenant_id
          ORDER BY created_at ASC
          LIMIT 1
      ) pm_fallback ON true
      ${whereClause}
      ORDER BY i.created_at DESC
    `, values);

    const role = req.user.role;
    const canSeePurchasePrice = ['super_admin', 'tenant_admin', 'main_branch_manager', 'sub_branch_manager'].includes(role);

    const mappedInventory = result.rows.map(item => {
      item.base_price = (parseFloat(item.purchase_price) || 0) + (parseFloat(item.branch_margin) || 0);

      // Hide purchase price and margin for non-managers
      if (!canSeePurchasePrice) {
        delete item.purchase_price;
        delete item.branch_margin;
      }
      return item;
    });

    res.json({ inventory: mappedInventory });
  } catch (err) {
    console.error('List inventory error:', err);
    res.status(500).json({ error: 'Failed to list inventory.' });
  }
});

// ─── POST /api/inventory ───────────────────────────────
router.post('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { 
      branchId, brandId, modelId, category, conditionGrade, 
      imeiNumber, quantity, purchasePrice, supplier, notes 
    } = req.body;

    const targetBranchId = getTargetBranchId(req, branchId);

    if (!targetBranchId) {
      return res.status(400).json({ error: 'Branch ID is required.' });
    }
    if (!imeiNumber) {
      return res.status(400).json({ error: 'IMEI number is required.' });
    }

    const result = await query(`
      INSERT INTO inventory (
        tenant_id, branch_id, brand_id, model_id, category, 
        condition_grade, imei_number, quantity, purchase_price, 
        supplier, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      tenantId, targetBranchId, brandId || null, modelId || null, category || 'new',
      conditionGrade || null, imeiNumber, quantity || 1, purchasePrice || 0,
      supplier || null, notes || null
    ]);

    res.status(201).json({
      message: 'Item added to inventory.',
      inventory: result.rows[0],
    });
  } catch (err) {
    console.error('Add inventory error:', err);
    res.status(500).json({ error: 'Failed to add inventory.' });
  }
});

module.exports = router;
