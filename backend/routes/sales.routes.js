const express = require('express');
const { getClient, query } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { featureGate } = require('../middleware/featureGate');

const router = express.Router();

router.use(authenticate, requireRole('tenant_admin', 'main_branch_manager', 'sub_branch_manager', 'sales_staff', 'branch_user'));
router.use(featureGate('sales_module'));

// ─── POST /api/sales ───────────────────────────────
router.post('/', async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const tenantId = req.user.tenantId;
    const salesStaffId = req.user.id;
    const { 
      inventoryId, customerName, customerPhone, 
      branchMargin, staffCommission, paymentMethod 
    } = req.body;

    // 1. Fetch inventory item and lock row
    const invResult = await client.query(`
      SELECT * FROM inventory 
      WHERE id = $1 AND tenant_id = $2 
      FOR UPDATE
    `, [inventoryId, tenantId]);

    if (invResult.rows.length === 0) {
      throw new Error('Inventory item not found.');
    }

    const inventory = invResult.rows[0];
    if (inventory.status !== 'available') {
      throw new Error('This item is no longer available.');
    }

    // 2. Fetch Pricing Margin from DB
    const marginResult = await client.query(`
      SELECT 
        CASE 
          WHEN $3 = 'new' THEN margin_new
          WHEN $3 = 'used' THEN margin_used
          WHEN $3 = 'refurbished' THEN margin_refurbished
          ELSE margin_new
        END as margin
      FROM pricing_margins 
      WHERE tenant_id = $4 AND model_id = $2 AND (branch_id = $1 OR branch_id IS NOT NULL)
      ORDER BY CASE WHEN branch_id = $1 THEN 0 ELSE 1 END
      LIMIT 1
    `, [inventory.branch_id, inventory.model_id, inventory.category, tenantId]);
    
    const margin = marginResult.rows.length > 0 ? parseFloat(marginResult.rows[0].margin) : 0;

    // 3. Calculate pricing
    const purchasePrice = parseFloat(inventory.purchase_price) || 0;
    const commission = parseFloat(staffCommission) || 0;
    
    const basePrice = purchasePrice + margin;
    const finalPrice = basePrice + commission;

    // 3. Create Sales Record
    const saleResult = await client.query(`
      INSERT INTO sales (
        tenant_id, branch_id, inventory_id, imei_number, customer_name, customer_phone,
        purchase_price, branch_margin, base_price, staff_commission, final_price,
        sales_staff_id, payment_method
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      tenantId, inventory.branch_id, inventory.id, inventory.imei_number, customerName || null, customerPhone || null,
      purchasePrice, margin, basePrice, commission, finalPrice,
      salesStaffId, paymentMethod || 'Cash'
    ]);
    const sale = saleResult.rows[0];

    // 4. Update Inventory Status
    await client.query(`
      UPDATE inventory SET status = 'sold', updated_at = NOW() WHERE id = $1
    `, [inventory.id]);

    // 5. Create Staff Commission Record (if applicable)
    if (commission > 0) {
      await client.query(`
        INSERT INTO staff_commissions (tenant_id, sales_id, sales_staff_id, amount)
        VALUES ($1, $2, $3, $4)
      `, [tenantId, sale.id, salesStaffId, commission]);
    }

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Sale recorded successfully.',
      sale,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Sale error:', err);
    res.status(400).json({ error: err.message || 'Failed to record sale.' });
  } finally {
    client.release();
  }
});

// ─── GET /api/sales ────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    let whereClause = 'WHERE s.tenant_id = $1';
    const values = [tenantId];
    
    // If sales staff, only see own sales. Else if branch user/manager, see branch sales.
    if (req.user.role === 'sales_staff') {
      whereClause += ' AND s.sales_staff_id = $2';
      values.push(req.user.id);
    } else if (['branch_user', 'sub_branch_manager'].includes(req.user.role)) {
      whereClause += ' AND s.branch_id = $2';
      values.push(req.user.branchId);
    }

    const result = await query(`
      SELECT s.*, 
             u.full_name AS staff_name,
             dm.name AS model_name,
             b.name AS brand_name
      FROM sales s
      JOIN users u ON s.sales_staff_id = u.id
      JOIN inventory i ON s.inventory_id = i.id
      LEFT JOIN device_models dm ON i.model_id = dm.id
      LEFT JOIN brands b ON i.brand_id = b.id
      ${whereClause}
      ORDER BY s.created_at DESC
    `, values);

    res.json({ sales: result.rows });
  } catch (err) {
    console.error('List sales error:', err);
    res.status(500).json({ error: 'Failed to list sales.' });
  }
});

module.exports = router;
