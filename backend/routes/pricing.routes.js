const express = require('express');
const { query } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { featureGate } = require('../middleware/featureGate');

const router = express.Router();

router.use(authenticate, requireRole('tenant_admin', 'main_branch_manager', 'sub_branch_manager'));
router.use(featureGate('branch_pricing'));

// ─── GET /api/pricing ──────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { branchId } = req.query;

    let targetBranchId = branchId;
    if (req.user.role === 'sub_branch_manager') {
      targetBranchId = req.user.branchId;
    }

    if (!targetBranchId) {
      return res.status(400).json({ error: 'Branch ID is required.' });
    }

    const result = await query(`
      SELECT dm.id AS model_id, dm.name AS model_name, b.name AS brand_name,
             COALESCE(pm.margin_new, pm_fallback.margin_new, 0) AS margin_new,
             COALESCE(pm.margin_used, pm_fallback.margin_used, 0) AS margin_used,
             COALESCE(pm.margin_refurbished, pm_fallback.margin_refurbished, 0) AS margin_refurbished
      FROM device_models dm
      LEFT JOIN brands b ON dm.brand_id = b.id
      LEFT JOIN pricing_margins pm ON dm.id = pm.model_id AND pm.branch_id = $1
      LEFT JOIN LATERAL (
          SELECT margin_new, margin_used, margin_refurbished
          FROM pricing_margins
          WHERE model_id = dm.id AND tenant_id = $2
          ORDER BY created_at ASC
          LIMIT 1
      ) pm_fallback ON true
      WHERE b.tenant_id = $2
      ORDER BY b.name ASC, dm.name ASC
    `, [targetBranchId, tenantId]);

    res.json({ margins: result.rows });
  } catch (err) {
    console.error('Get pricing error:', err);
    res.status(500).json({ error: 'Failed to load pricing margins.' });
  }
});

// ─── POST /api/pricing ─────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { branchId, margins } = req.body; // margins is an array of { modelId, margin }

    let targetBranchId = branchId;
    if (req.user.role === 'sub_branch_manager') {
      targetBranchId = req.user.branchId;
    }

    if (!targetBranchId) {
      return res.status(400).json({ error: 'Branch ID is required.' });
    }

    if (!Array.isArray(margins)) {
      return res.status(400).json({ error: 'Margins array is required.' });
    }

    for (const item of margins) {
      await query(`
        INSERT INTO pricing_margins (tenant_id, branch_id, model_id, margin_new, margin_used, margin_refurbished)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (branch_id, model_id)
        DO UPDATE SET 
            margin_new = EXCLUDED.margin_new,
            margin_used = EXCLUDED.margin_used,
            margin_refurbished = EXCLUDED.margin_refurbished,
            updated_at = NOW()
      `, [tenantId, targetBranchId, item.modelId, item.marginNew || 0, item.marginUsed || 0, item.marginRefurbished || 0]);
    }

    res.json({ message: 'Pricing margins updated successfully.' });
  } catch (err) {
    console.error('Update pricing error:', err);
    res.status(500).json({ error: 'Failed to update pricing margins.' });
  }
});

module.exports = router;
