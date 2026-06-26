// ─── Service Routes ────────────────────────────────────
// Flow 3: Add Service, Service List
// Flow 4: Service Detail, Update Status, Add Parts, Add Notes, Print
// Flow 5: Complete Service Lifecycle

const express = require('express');
const { query, getClient } = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { featureGate } = require('../middleware/featureGate');

const router = express.Router();

// Both Main Branch Admins, Branch Users, and Technicians can access services (restricted internally)
router.use(authenticate, requireRole('tenant_admin', 'branch_user', 'main_branch_manager', 'sub_branch_manager', 'technician'));

// Helper to determine the branch_id for the operation
const getTargetBranchId = (req, bodyBranchId) => {
  if (['branch_user', 'sub_branch_manager'].includes(req.user.role)) {
    return req.user.branchId; // Branch user is restricted to their branch
  }
  // Tenant admin must specify the branch they are operating on, or it defaults to null if global
  return bodyBranchId || null;
};

// ─── POST /api/services ────────────────────────────────
// Flow 3: Create new job card
router.post('/', featureGate('add_service'), async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const tenantId = req.user.tenantId;
    const branchId = getTargetBranchId(req, req.body.branchId);

    if (req.user.role === 'technician') {
      return res.status(403).json({ error: 'Technicians cannot create job cards.' });
    }

    if (!branchId) {
      return res.status(400).json({ error: 'branchId is required to create a service.' });
    }

    const {
      customerName,
      customerPhone,
      brandId,
      modelId,
      imeiNumber,
      problemDescription,
      receivedDate,
      assignedTechnician,
      assignedTechnicianId,
      advancePayment,
    } = req.body;

    if (!customerName || !customerPhone || !problemDescription) {
      return res.status(400).json({
        error: 'customerName, customerPhone, and problemDescription are required.',
      });
    }

    // Get branch code for serial number
    const branchResult = await client.query(`SELECT branch_code FROM branches WHERE id = $1 AND tenant_id = $2`, [branchId, tenantId]);
    if (branchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found.' });
    }
    const branchCode = branchResult.rows[0].branch_code;

    // Generate serial number
    const serialResult = await client.query(
      `SELECT generate_serial_number($1) AS serial_number`,
      [branchCode]
    );
    const serialNumber = serialResult.rows[0].serial_number;

    // Create the service/job card
    const serviceResult = await client.query(
      `INSERT INTO services (
        serial_number, tenant_id, branch_id, customer_name, customer_phone,
        brand_id, model_id, imei_number, problem_description,
        received_date, assigned_technician, assigned_technician_id, advance_payment, status, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'received',$14)
      RETURNING *`,
      [
        serialNumber, tenantId, branchId, customerName, customerPhone,
        brandId || null, modelId || null, imeiNumber || null,
        problemDescription, receivedDate || new Date(),
        assignedTechnician || null, assignedTechnicianId || null, advancePayment || 0, req.user.id,
      ]
    );

    const service = serviceResult.rows[0];

    // Log initial status in service history
    await client.query(
      `INSERT INTO service_history (service_id, from_status, to_status, changed_by)
       VALUES ($1, NULL, 'received', $2)`,
      [service.id, req.user.id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Job card created successfully.',
      service,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create service error:', err);
    res.status(500).json({ error: 'Failed to create job card.' });
  } finally {
    client.release();
  }
});

// ─── GET /api/services ─────────────────────────────────
// Flow 3: List services (own shop only, with filters)
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { status, branchId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE s.tenant_id = $1';
    const values = [tenantId];
    let paramIndex = 2;

    // If branch user, restrict to their branch. If tenant admin, filter by optional branchId.
    const targetBranch = getTargetBranchId(req, branchId);
    if (targetBranch) {
      whereClause += ` AND s.branch_id = $${paramIndex++}`;
      values.push(targetBranch);
    }

    if (req.user.role === 'technician') {
      whereClause += ` AND s.assigned_technician_id = $${paramIndex++}`;
      values.push(req.user.id);
    }

    if (status) {
      whereClause += ` AND s.status = $${paramIndex++}`;
      values.push(status);
    }

    values.push(parseInt(limit), offset);
    const result = await query(`
      SELECT s.*, 
             b.name AS brand_name, 
             dm.name AS model_name,
             u.full_name AS created_by_name,
             br.name AS branch_name
      FROM services s
      LEFT JOIN brands b ON s.brand_id = b.id
      LEFT JOIN device_models dm ON s.model_id = dm.id
      LEFT JOIN users u ON s.created_by = u.id
      LEFT JOIN branches br ON s.branch_id = br.id
      ${whereClause}
      ORDER BY s.updated_at DESC, s.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `, values);

    const countValues = values.slice(0, paramIndex - 3);
    const countResult = await query(`
      SELECT COUNT(*) AS total
      FROM services s
      ${whereClause}
    `, countValues);

    res.json({
      services: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit),
      },
    });
  } catch (err) {
    console.error('List services error:', err);
    res.status(500).json({ error: 'Failed to list services.' });
  }
});

// ─── GET /api/services/:id ─────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    let whereClause = 'WHERE s.id = $1 AND s.tenant_id = $2';
    const values = [id, tenantId];
    if (['branch_user', 'sub_branch_manager'].includes(req.user.role) || req.user.role === 'technician') {
      whereClause += ' AND s.branch_id = $3';
      values.push(req.user.branchId);
    }
    if (req.user.role === 'technician') {
      whereClause += ` AND s.assigned_technician_id = $${values.length + 1}`;
      values.push(req.user.id);
    }

    const serviceResult = await query(`
      SELECT s.*, 
             b.name AS brand_name, 
             dm.name AS model_name,
             u.full_name AS created_by_name,
             br.name AS branch_name
      FROM services s
      LEFT JOIN brands b ON s.brand_id = b.id
      LEFT JOIN device_models dm ON s.model_id = dm.id
      LEFT JOIN users u ON s.created_by = u.id
      LEFT JOIN branches br ON s.branch_id = br.id
      ${whereClause}
    `, values);

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    const partsResult = await query(`
      SELECT sp.*, p.name AS catalogue_part_name
      FROM service_parts sp
      LEFT JOIN parts p ON sp.part_id = p.id
      WHERE sp.service_id = $1
      ORDER BY sp.created_at ASC
    `, [id]);

    const notesResult = await query(`
      SELECT sn.*, u.full_name AS author_name
      FROM service_notes sn
      LEFT JOIN users u ON sn.created_by = u.id
      WHERE sn.service_id = $1
      ORDER BY sn.created_at ASC
    `, [id]);

    const historyResult = await query(`
      SELECT sh.*, u.full_name AS changed_by_name
      FROM service_history sh
      LEFT JOIN users u ON sh.changed_by = u.id
      WHERE sh.service_id = $1
      ORDER BY sh.created_at ASC
    `, [id]);

    res.json({
      service: serviceResult.rows[0],
      parts: partsResult.rows,
      notes: notesResult.rows,
      history: historyResult.rows,
    });
  } catch (err) {
    console.error('Get service error:', err);
    res.status(500).json({ error: 'Failed to fetch service details.' });
  }
});

// ─── PATCH /api/services/:id/status ────────────────────
router.patch('/:id/status', featureGate('service_status_update'), async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { status, cancellationReason } = req.body;

    const validStatuses = ['received', 'checking', 'waiting_for_parts', 'repaired', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Use: ${validStatuses.join(', ')}` });
    }

    let whereClause = 'WHERE id = $1 AND tenant_id = $2';
    const values = [id, tenantId];
    if (['branch_user', 'sub_branch_manager'].includes(req.user.role) || req.user.role === 'technician') {
      whereClause += ' AND branch_id = $3';
      values.push(req.user.branchId);
    }
    if (req.user.role === 'technician') {
      whereClause += ` AND assigned_technician_id = $${values.length + 1}`;
      values.push(req.user.id);
    }

    const currentResult = await client.query(
      `SELECT status FROM services ${whereClause}`,
      values
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    const currentStatus = currentResult.rows[0].status;

    if (currentStatus === 'delivered' || currentStatus === 'cancelled') {
      return res.status(400).json({ error: `Cannot update status. Service is already '${currentStatus}'.` });
    }

    const updateValues = [
      status,
      status === 'cancelled' ? cancellationReason : null,
      status === 'delivered' ? new Date() : null
    ];
    let paramIndex = updateValues.length + 1;

    let updateWhereClause = `WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}`;
    updateValues.push(id, tenantId);

    if (['branch_user', 'sub_branch_manager'].includes(req.user.role)) {
      updateWhereClause += ` AND branch_id = $${paramIndex++}`;
      updateValues.push(req.user.branchId);
    }

    const updateResult = await client.query(
      `UPDATE services SET status = $1, 
       cancellation_reason = COALESCE($2, cancellation_reason),
       delivery_date = COALESCE($3, delivery_date)
       ${updateWhereClause} RETURNING *`,
      updateValues
    );

    await client.query(
      `INSERT INTO service_history (service_id, from_status, to_status, changed_by)
       VALUES ($1, $2, $3, $4)`,
      [id, currentStatus, status, req.user.id]
    );

    await client.query('COMMIT');

    res.json({
      message: `Status updated to '${status}'.`,
      service: updateResult.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  } finally {
    client.release();
  }
});

// ─── POST /api/services/:id/parts ──────────────────────
router.post('/:id/parts', featureGate('add_part'), async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { source, partId, partName, quantity, costAtTime, sellingPriceAtTime } = req.body;

    if (req.user.role === 'technician') {
      return res.status(403).json({ error: 'Technicians cannot add parts.' });
    }

    let whereClause = 'WHERE id = $1 AND tenant_id = $2';
    const values = [id, tenantId];
    if (['branch_user', 'sub_branch_manager'].includes(req.user.role)) {
      whereClause += ' AND branch_id = $3';
      values.push(req.user.branchId);
    }

    const serviceCheck = await query(
      `SELECT id FROM services ${whereClause}`,
      values
    );
    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    let finalPartName = partName;
    let finalCost = costAtTime || 0;
    let finalSellingPrice = sellingPriceAtTime || 0;

    if (source === 'shop') {
      if (!partId) {
        return res.status(400).json({ error: 'partId is required for shop parts.' });
      }

      const partResult = await query(
        `SELECT name, cost_price, selling_price FROM parts WHERE id = $1 AND tenant_id = $2`,
        [partId, tenantId]
      );
      if (partResult.rows.length === 0) {
        return res.status(404).json({ error: 'Part not found in catalogue.' });
      }

      const part = partResult.rows[0];
      finalPartName = part.name;
      finalCost = part.cost_price;
      finalSellingPrice = part.selling_price;
    } else if (source === 'outside') {
      if (!partName) {
        return res.status(400).json({ error: 'partName is required for outside purchases.' });
      }
      if (costAtTime === undefined || costAtTime === null) {
        return res.status(400).json({ error: 'costAtTime is required for outside purchases.' });
      }
    } else {
      return res.status(400).json({ error: "source must be 'shop' or 'outside'." });
    }

    const result = await query(
      `INSERT INTO service_parts (service_id, source, part_id, part_name, quantity, cost_at_time, selling_price_at_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, source, source === 'shop' ? partId : null, finalPartName, quantity || 1, finalCost, finalSellingPrice]
    );

    res.status(201).json({
      message: 'Part added to service.',
      servicePart: result.rows[0],
    });
  } catch (err) {
    console.error('Add service part error:', err);
    res.status(500).json({ error: 'Failed to add part to service.' });
  }
});

// ─── DELETE /api/services/:id/parts/:spId ────────────
router.delete('/:id/parts/:spId', featureGate('add_part'), async (req, res) => {
  try {
    const { id, spId } = req.params;
    const tenantId = req.user.tenantId;

    if (req.user.role === 'technician') {
      return res.status(403).json({ error: 'Technicians cannot remove parts.' });
    }

    let whereClause = 'WHERE id = $1 AND tenant_id = $2';
    const values = [id, tenantId];
    if (['branch_user', 'sub_branch_manager'].includes(req.user.role)) {
      whereClause += ' AND branch_id = $3';
      values.push(req.user.branchId);
    }

    const serviceCheck = await query(`SELECT id FROM services ${whereClause}`, values);
    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    const result = await query(
      `DELETE FROM service_parts WHERE id = $1 AND service_id = $2 RETURNING id`,
      [spId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service part not found.' });
    }

    res.json({ message: 'Part removed from service.' });
  } catch (err) {
    console.error('Delete service part error:', err);
    res.status(500).json({ error: 'Failed to remove part.' });
  }
});

// ─── POST /api/services/:id/notes ──────────────────────
router.post('/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { noteType, content } = req.body;

    let whereClause = 'WHERE id = $1 AND tenant_id = $2';
    const values = [id, tenantId];
    if (['branch_user', 'sub_branch_manager'].includes(req.user.role) || req.user.role === 'technician') {
      whereClause += ' AND branch_id = $3';
      values.push(req.user.branchId);
    }
    if (req.user.role === 'technician') {
      whereClause += ` AND assigned_technician_id = $${values.length + 1}`;
      values.push(req.user.id);
    }

    const serviceCheck = await query(`SELECT id FROM services ${whereClause}`, values);
    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    const validTypes = ['technician', 'customer_approval', 'repair', 'delivery'];
    if (!noteType || !validTypes.includes(noteType)) {
      return res.status(400).json({ error: `noteType must be: ${validTypes.join(', ')}` });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Note content is required.' });
    }

    const result = await query(
      `INSERT INTO service_notes (service_id, note_type, content, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, noteType, content.trim(), req.user.id]
    );

    res.status(201).json({
      message: 'Note added.',
      note: result.rows[0],
    });
  } catch (err) {
    console.error('Add note error:', err);
    res.status(500).json({ error: 'Failed to add note.' });
  }
});

// ─── GET /api/services/:id/history ─────────────────────
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    let whereClause = 'WHERE id = $1 AND tenant_id = $2';
    const values = [id, tenantId];
    if (['branch_user', 'sub_branch_manager'].includes(req.user.role)) {
      whereClause += ' AND branch_id = $3';
      values.push(req.user.branchId);
    }

    const serviceCheck = await query(`SELECT id FROM services ${whereClause}`, values);
    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    const result = await query(`
      SELECT sh.*, u.full_name AS changed_by_name
      FROM service_history sh
      LEFT JOIN users u ON sh.changed_by = u.id
      WHERE sh.service_id = $1
      ORDER BY sh.created_at ASC
    `, [id]);

    res.json({ history: result.rows });
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

// ─── GET /api/services/:id/print/jobcard ───────────────
router.get('/:id/print/jobcard', featureGate('printable_job_card'), async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    let whereClause = 'WHERE s.id = $1 AND s.tenant_id = $2';
    const values = [id, tenantId];
    if (['branch_user', 'sub_branch_manager'].includes(req.user.role)) {
      whereClause += ' AND s.branch_id = $3';
      values.push(req.user.branchId);
    }

    const result = await query(`
      SELECT s.*, 
             b.name AS brand_name, dm.name AS model_name,
             t.name AS company_name, br.name AS branch_name, br.branch_code,
             u.full_name AS created_by_name
      FROM services s
      LEFT JOIN brands b ON s.brand_id = b.id
      LEFT JOIN device_models dm ON s.model_id = dm.id
      JOIN tenants t ON s.tenant_id = t.id
      JOIN branches br ON s.branch_id = br.id
      LEFT JOIN users u ON s.created_by = u.id
      ${whereClause}
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    res.json({ jobCard: result.rows[0] });
  } catch (err) {
    console.error('Print job card error:', err);
    res.status(500).json({ error: 'Failed to generate job card.' });
  }
});

// ─── GET /api/services/:id/print/receipt ───────────────
router.get('/:id/print/receipt', featureGate('printable_receipt'), async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    let whereClause = 'WHERE s.id = $1 AND s.tenant_id = $2';
    const values = [id, tenantId];
    if (['branch_user', 'sub_branch_manager'].includes(req.user.role)) {
      whereClause += ' AND s.branch_id = $3';
      values.push(req.user.branchId);
    }

    const serviceResult = await query(`
      SELECT s.*, 
             b.name AS brand_name, dm.name AS model_name,
             t.name AS company_name, br.name AS branch_name, br.branch_code
      FROM services s
      LEFT JOIN brands b ON s.brand_id = b.id
      LEFT JOIN device_models dm ON s.model_id = dm.id
      JOIN tenants t ON s.tenant_id = t.id
      JOIN branches br ON s.branch_id = br.id
      ${whereClause}
    `, values);

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    const partsResult = await query(`
      SELECT * FROM service_parts WHERE service_id = $1 ORDER BY created_at ASC
    `, [id]);

    res.json({
      receipt: {
        service: serviceResult.rows[0],
        parts: partsResult.rows,
      },
    });
  } catch (err) {
    console.error('Print receipt error:', err);
    res.status(500).json({ error: 'Failed to generate receipt.' });
  }
});

// ─── PATCH /api/services/:id ───────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const { deliveryDate, assignedTechnician, customerName, customerPhone } = req.body;

    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (deliveryDate !== undefined) { updates.push(`delivery_date = $${paramIndex++}`); values.push(deliveryDate); }
    if (assignedTechnician !== undefined) { updates.push(`assigned_technician = $${paramIndex++}`); values.push(assignedTechnician); }
    if (customerName) { updates.push(`customer_name = $${paramIndex++}`); values.push(customerName); }
    if (customerPhone) { updates.push(`customer_phone = $${paramIndex++}`); values.push(customerPhone); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    let whereClause = `WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}`;
    values.push(id, tenantId);
    
    if (['branch_user', 'sub_branch_manager'].includes(req.user.role)) {
      whereClause += ` AND branch_id = $${paramIndex++}`;
      values.push(req.user.branchId);
    }

    const result = await query(
      `UPDATE services SET ${updates.join(', ')} ${whereClause} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    res.json({ message: 'Service updated.', service: result.rows[0] });
  } catch (err) {
    console.error('Update service error:', err);
    res.status(500).json({ error: 'Failed to update service.' });
  }
});

module.exports = router;
