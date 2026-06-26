const express = require('express');
const { query } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Only Main Branch Admins, Tenant Admins, and Sub Branch Managers can access cross-branch/branch analytics
router.use(authenticate, requireRole('tenant_admin', 'main_branch_manager', 'sub_branch_manager'));

// ─── GET /api/analytics/sales ──────────────────────────────
router.get('/sales', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { branchId, startDate, endDate } = req.query;

    let whereClause = 'WHERE s.tenant_id = $1';
    const values = [tenantId];
    let paramIndex = 2;

    if (branchId) {
      whereClause += ` AND s.branch_id = $${paramIndex++}`;
      values.push(branchId);
    }

    if (startDate) {
      whereClause += ` AND s.created_at >= $${paramIndex++}`;
      values.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND s.created_at <= $${paramIndex++}`;
      values.push(endDate);
    }

    // Aggregate overall metrics
    const overallResult = await query(`
      SELECT 
        COUNT(s.id) AS total_sales,
        COALESCE(SUM(s.final_price), 0) AS total_revenue,
        COALESCE(SUM(s.base_price - s.purchase_price), 0) AS total_branch_profit,
        COALESCE(SUM(s.staff_commission), 0) AS total_commissions
      FROM sales s
      ${whereClause}
    `, values);

    // Sales by model (Top 10)
    const modelsResult = await query(`
      SELECT 
        dm.name AS model_name,
        b.name AS brand_name,
        COUNT(s.id) AS units_sold,
        COALESCE(SUM(s.final_price), 0) AS revenue,
        COALESCE(SUM(s.base_price - s.purchase_price), 0) AS profit
      FROM sales s
      JOIN inventory i ON s.inventory_id = i.id
      LEFT JOIN device_models dm ON i.model_id = dm.id
      LEFT JOIN brands b ON i.brand_id = b.id
      ${whereClause}
      GROUP BY dm.id, dm.name, b.name
      ORDER BY units_sold DESC
      LIMIT 10
    `, values);

    // Sales by branch
    const branchResult = await query(`
      SELECT 
        br.name AS branch_name,
        COUNT(s.id) AS units_sold,
        COALESCE(SUM(s.final_price), 0) AS revenue,
        COALESCE(SUM(s.base_price - s.purchase_price), 0) AS profit
      FROM sales s
      JOIN branches br ON s.branch_id = br.id
      ${whereClause}
      GROUP BY br.id, br.name
      ORDER BY revenue DESC
    `, values);

    res.json({
      overall: overallResult.rows[0],
      top_models: modelsResult.rows,
      by_branch: branchResult.rows
    });
  } catch (err) {
    console.error('Analytics sales error:', err);
    res.status(500).json({ error: 'Failed to load sales analytics.' });
  }
});

// ─── GET /api/analytics/commissions ────────────────────────
router.get('/commissions', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { branchId } = req.query;

    let whereClause = 'WHERE sc.tenant_id = $1';
    const values = [tenantId];
    let paramIndex = 2;

    if (branchId) {
      whereClause += ` AND s.branch_id = $${paramIndex++}`;
      values.push(branchId);
    }

    const result = await query(`
      SELECT 
        u.full_name AS staff_name,
        br.name AS branch_name,
        COUNT(sc.id) AS total_sales_with_commission,
        COALESCE(SUM(sc.amount), 0) AS total_commission_earned
      FROM staff_commissions sc
      JOIN users u ON sc.sales_staff_id = u.id
      JOIN sales s ON sc.sales_id = s.id
      JOIN branches br ON s.branch_id = br.id
      ${whereClause}
      GROUP BY u.id, u.full_name, br.name
      ORDER BY total_commission_earned DESC
    `, values);

    res.json({ commissions: result.rows });
  } catch (err) {
    console.error('Analytics commissions error:', err);
    res.status(500).json({ error: 'Failed to load commissions analytics.' });
  }
});

module.exports = router;
