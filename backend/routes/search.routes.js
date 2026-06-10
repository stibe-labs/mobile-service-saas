// ─── Search Routes ─────────────────────────────────────
// Flow 6: Search & Lookup Flow
// GET /api/search — Search by name, phone, IMEI, job#, date, status

const express = require('express');
const { query } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Requires authenticated tenant user
router.use(authenticate, requireRole('tenant_user'));

// ─── GET /api/search ───────────────────────────────────
// Flow 6: Multi-criteria search across services
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      q,              // General search term (searches name, phone, IMEI, serial)
      customerName,
      phone,
      imei,
      serialNumber,
      status,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE s.tenant_id = $1';
    const values = [tenantId];
    let paramIndex = 2;

    // General search — searches across multiple fields
    if (q) {
      whereClause += ` AND (
        s.customer_name ILIKE $${paramIndex} OR
        s.customer_phone ILIKE $${paramIndex} OR
        s.imei_number ILIKE $${paramIndex} OR
        s.serial_number ILIKE $${paramIndex}
      )`;
      values.push(`%${q}%`);
      paramIndex++;
    }

    // Specific field searches
    if (customerName) {
      whereClause += ` AND s.customer_name ILIKE $${paramIndex++}`;
      values.push(`%${customerName}%`);
    }

    if (phone) {
      whereClause += ` AND s.customer_phone ILIKE $${paramIndex++}`;
      values.push(`%${phone}%`);
    }

    if (imei) {
      whereClause += ` AND s.imei_number ILIKE $${paramIndex++}`;
      values.push(`%${imei}%`);
    }

    if (serialNumber) {
      whereClause += ` AND s.serial_number ILIKE $${paramIndex++}`;
      values.push(`%${serialNumber}%`);
    }

    if (status) {
      whereClause += ` AND s.status = $${paramIndex++}`;
      values.push(status);
    }

    // Date range filter
    if (dateFrom) {
      whereClause += ` AND s.created_at >= $${paramIndex++}`;
      values.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ` AND s.created_at <= $${paramIndex++}`;
      values.push(dateTo + 'T23:59:59.999Z');  // Include entire day
    }

    // Count total results
    const countResult = await query(
      `SELECT COUNT(*) AS total FROM services s ${whereClause}`,
      values
    );

    // Get paginated results
    values.push(parseInt(limit), offset);
    const result = await query(`
      SELECT s.id, s.serial_number, s.customer_name, s.customer_phone,
             s.imei_number, s.status, s.assigned_technician, 
             s.received_date, s.created_at,
             b.name AS brand_name, dm.name AS model_name
      FROM services s
      LEFT JOIN brands b ON s.brand_id = b.id
      LEFT JOIN device_models dm ON s.model_id = dm.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, values);

    res.json({
      results: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit),
      },
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed.' });
  }
});

module.exports = router;
