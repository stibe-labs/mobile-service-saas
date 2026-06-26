const express = require('express');
const { query } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { featureGate } = require('../middleware/featureGate');

const router = express.Router();

router.use(authenticate, requireRole('tenant_admin', 'main_branch_manager', 'sub_branch_manager', 'sales_staff', 'branch_user'));
router.use(featureGate('imei_lookup'));

// ─── GET /api/imei/:imei ────────────────────────────────
router.get('/:imei', async (req, res) => {
  try {
    const { imei } = req.params;
    const tenantId = req.user.tenantId;

    if (!imei) {
      return res.status(400).json({ error: 'IMEI is required.' });
    }

    // 1. Fetch Inventory & Sales Info
    const invResult = await query(`
      SELECT i.*, 
             br.name AS branch_name,
             dm.name AS model_name,
             b.name AS brand_name,
             s.id AS sale_id,
             s.final_price AS sale_final_price,
             s.created_at AS sale_date,
             u.full_name AS sales_staff_name,
             CASE 
                WHEN i.category = 'new' THEN COALESCE(pm.margin_new, pm_fallback.margin_new, 0)
                WHEN i.category = 'used' THEN COALESCE(pm.margin_used, pm_fallback.margin_used, 0)
                WHEN i.category = 'refurbished' THEN COALESCE(pm.margin_refurbished, pm_fallback.margin_refurbished, 0)
                ELSE COALESCE(pm.margin_new, pm_fallback.margin_new, 0)
             END AS branch_margin
      FROM inventory i
      LEFT JOIN branches br ON i.branch_id = br.id
      LEFT JOIN device_models dm ON i.model_id = dm.id
      LEFT JOIN brands b ON i.brand_id = b.id
      LEFT JOIN sales s ON s.inventory_id = i.id
      LEFT JOIN users u ON s.sales_staff_id = u.id
      LEFT JOIN pricing_margins pm ON i.model_id = pm.model_id AND i.branch_id = pm.branch_id
      LEFT JOIN LATERAL (
          SELECT margin_new, margin_used, margin_refurbished
          FROM pricing_margins
          WHERE model_id = i.model_id AND tenant_id = i.tenant_id
          ORDER BY created_at ASC
          LIMIT 1
      ) pm_fallback ON true
      WHERE i.imei_number = $1 AND i.tenant_id = $2
    `, [imei, tenantId]);

    // 2. Fetch Repair History (Services)
    const repairsResult = await query(`
      SELECT s.id, s.serial_number, s.problem_description, s.status, s.received_date, s.delivery_date,
             u.full_name AS technician_name,
             br.name AS branch_name
      FROM services s
      LEFT JOIN users u ON s.assigned_technician_id = u.id
      LEFT JOIN branches br ON s.branch_id = br.id
      WHERE s.imei_number = $1 AND s.tenant_id = $2
      ORDER BY s.created_at DESC
    `, [imei, tenantId]);

    // Role-based filtering of sensitive fields
    const role = req.user.role;
    const canSeePurchasePrice = ['super_admin', 'tenant_admin', 'main_branch_manager', 'sub_branch_manager'].includes(role);

    const inventoryData = invResult.rows.map(item => {
      item.base_price = (parseFloat(item.purchase_price) || 0) + (parseFloat(item.branch_margin) || 0);

      // Hide purchase price and margin for non-managers
      if (!canSeePurchasePrice) {
        delete item.purchase_price;
        delete item.branch_margin;
      }
      return item;
    });

    res.json({
      device_info: inventoryData.length > 0 ? inventoryData[0] : null,
      inventory_records: inventoryData,
      repair_history: repairsResult.rows
    });
  } catch (err) {
    console.error('IMEI lookup error:', err);
    res.status(500).json({ error: 'Failed to perform IMEI lookup.' });
  }
});

module.exports = router;
