// ─── JWT Authentication Middleware ──────────────────────
// Flow 1: Verifies JWT token, extracts user info & role.
// Provides requireRole() for route-level access control.

const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// Main auth middleware — verifies JWT and attaches user to request
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB to ensure they still exist and are active
    const result = await query(
      `SELECT u.id, u.email, u.full_name, u.role, u.tenant_id, u.branch_id, u.is_active,
              t.name AS tenant_name, t.status AS tenant_status,
              b.branch_code, b.name AS branch_name
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found.' });
    }

    const user = result.rows[0];

    // Check if user account is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    // For tenant users/admins, check if tenant is active
    if (user.role !== 'super_admin') {
      if (!user.tenant_status || user.tenant_status !== 'active') {
        return res.status(403).json({ error: 'Your company account is suspended. Contact the administrator.' });
      }
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      tenantId: user.tenant_id,
      tenantName: user.tenant_name,
      branchId: user.branch_id,
      branchName: user.branch_name,
      branchCode: user.branch_code,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Authentication failed.' });
  }
};

// Role-based access control middleware
// Usage: requireRole('super_admin') or requireRole('tenant_user')
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

module.exports = { authenticate, requireRole };
