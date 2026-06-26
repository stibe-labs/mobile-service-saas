const express = require('express');
const { query } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { featureGate } = require('../middleware/featureGate');

const router = express.Router();

router.use(authenticate, requireRole('tenant_admin', 'branch_user', 'sub_branch_manager', 'main_branch_manager'));

const getTargetBranchId = (req, bodyBranchId) => {
  if (['branch_user', 'sub_branch_manager'].includes(req.user.role)) {
    return req.user.branchId;
  }
  return bodyBranchId || null;
};

// ─── GET /api/dashboard ────────────────────────────────
router.get('/', featureGate('branch_dashboard'), async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { branchId } = req.query;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    let whereClause = 'WHERE tenant_id = $1';
    const values = [tenantId];
    let paramIndex = 2;

    const targetBranch = getTargetBranchId(req, branchId);
    if (targetBranch) {
      whereClause += ` AND branch_id = $${paramIndex++}`;
      values.push(targetBranch);
    }

    const todayValues = [...values, today];

    const todayCountsResult = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE DATE(created_at) = $${paramIndex}) AS today_total,
        COUNT(*) FILTER (WHERE DATE(updated_at) = $${paramIndex} AND status = 'received') AS today_received,
        COUNT(*) FILTER (WHERE DATE(updated_at) = $${paramIndex} AND status = 'checking') AS today_checking,
        COUNT(*) FILTER (WHERE DATE(delivery_date) = $${paramIndex} AND status = 'delivered') AS today_delivered,
        COUNT(*) FILTER (WHERE DATE(updated_at) = $${paramIndex} AND status = 'repaired') AS today_repaired
      FROM services
      ${whereClause}
    `, todayValues);

    const pendingResult = await query(`
      SELECT COUNT(*) AS pending_count
      FROM services
      ${whereClause} 
        AND status NOT IN ('delivered', 'cancelled')
    `, values);

    const pendingJobsResult = await query(`
      SELECT id, serial_number, customer_name, customer_phone, status, 
             assigned_technician, created_at
      FROM services
      ${whereClause} 
        AND status NOT IN ('delivered', 'cancelled')
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 10
    `, values);

    const totalResult = await query(`
      SELECT 
        COUNT(*) AS total_jobs,
        COUNT(*) FILTER (WHERE status = 'delivered') AS total_delivered,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS total_cancelled
      FROM services
      ${whereClause}
    `, values);

    let branchStats = null;
    if (req.user.role === 'tenant_admin' && !targetBranch) {
      const branchStatsResult = await query(`
        SELECT 
          b.id, b.name, b.branch_code,
          COUNT(s.id) AS total_jobs,
          COUNT(s.id) FILTER (WHERE DATE(s.created_at) = $2) AS today_jobs,
          COUNT(s.id) FILTER (WHERE s.status NOT IN ('delivered', 'cancelled')) AS pending_jobs,
          COUNT(s.id) FILTER (WHERE DATE(s.delivery_date) = $2 AND s.status = 'delivered') AS delivered_today
        FROM branches b
        LEFT JOIN services s ON b.id = s.branch_id
        WHERE b.tenant_id = $1
        GROUP BY b.id, b.name, b.branch_code
        ORDER BY b.name
      `, [tenantId, today]);
      branchStats = branchStatsResult.rows;
    }

    res.json({
      today: todayCountsResult.rows[0],
      pending: {
        count: parseInt(pendingResult.rows[0].pending_count),
        recentJobs: pendingJobsResult.rows,
      },
      allTime: totalResult.rows[0],
      branchStats
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
});

module.exports = router;
