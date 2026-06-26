// ─── Feature Gate Middleware ────────────────────────────
// Flow 2A: Checks if a feature is enabled for the tenant.
// If disabled by Super Admin, the route returns 403.
// Usage: featureGate('add_service'), featureGate('parts_management'), etc.

const { query } = require('../config/db');

// Valid feature toggle column names (must match feature_toggles table)
const VALID_FEATURES = [
  'add_service',
  'add_part',
  'add_device_model',
  'service_status_update',
  'parts_management',
  'printable_job_card',
  'printable_receipt',
  'branch_dashboard',
  'sales_module',
  'inventory_module',
  'branch_pricing',
  'staff_commission',
  'sales_receipt',
  'imei_lookup'
];

const featureGate = (featureName) => {
  // Validate feature name at startup
  if (!VALID_FEATURES.includes(featureName)) {
    throw new Error(`Invalid feature name: ${featureName}. Valid: ${VALID_FEATURES.join(', ')}`);
  }

  return async (req, res, next) => {
    try {
      // Super Admin bypasses all feature gates
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Tenant user — check if feature is enabled for their tenant
      const tenantId = req.user.tenantId;
      if (!tenantId) {
        return res.status(403).json({ error: 'No tenant associated with this account.' });
      }

      const result = await query(
        `SELECT ${featureName} FROM feature_toggles WHERE tenant_id = $1`,
        [tenantId]
      );

      // If no toggle record exists, allow by default (shouldn't happen in practice)
      if (result.rows.length === 0) {
        return next();
      }

      const isEnabled = result.rows[0][featureName];

      if (!isEnabled) {
        return res.status(403).json({
          error: 'This feature is currently disabled for your shop.',
          feature: featureName,
        });
      }

      next();
    } catch (err) {
      console.error('Feature gate error:', err);
      return res.status(500).json({ error: 'Failed to check feature access.' });
    }
  };
};

module.exports = { featureGate, VALID_FEATURES };
