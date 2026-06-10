// ─── Mobile Service Shop — Express Server ──────────────
// Main entry point. Mounts all route modules.
// Run: node server.js  or  npm run dev

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ─────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Webhooks must be parsed as raw body before express.json is applied
app.use('/api/webhooks', require('./routes/webhooks.routes'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// ─── ROUTES ─────────────────────────────────────────────
// Flow 1: Authentication
app.use('/api/auth', require('./routes/auth.routes'));

// Flow: SaaS Billing & Subscription
app.use('/api/billing', require('./routes/billing.routes'));

// Flow 2 & 2A: Super Admin Dashboard, Tenant Management, Feature Toggles
app.use('/api/admin', require('./routes/superadmin.routes'));

// Flow: Tenant Admin Management (Branches)
app.use('/api/tenant', require('./routes/tenantadmin.routes'));

// Flow 3: Tenant User Dashboard
app.use('/api/dashboard', require('./routes/dashboard.routes'));

// Flow 3/4/5: Services (Job Cards, Service Detail, Lifecycle)
app.use('/api/services', require('./routes/services.routes'));

// Flow 6: Search & Lookup
app.use('/api/search', require('./routes/search.routes'));

// Flow 7: Parts Management
app.use('/api/parts', require('./routes/parts.routes'));

// Flow 8: Device Model Management
app.use('/api/models', require('./routes/models.routes'));

// Flow: Technician Management
app.use('/api/technicians', require('./routes/technicians.routes'));

// ─── HEALTH CHECK ───────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Mobile Service Shop API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── ROOT ───────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '📱 Mobile Service Shop API — v2.0',
    docs: {
      auth: '/api/auth/login',
      health: '/api/health',
      admin: '/api/admin/dashboard',
      dashboard: '/api/dashboard',
      services: '/api/services',
      search: '/api/search',
      parts: '/api/parts',
      models: '/api/models/all',
    },
  });
});

// ─── 404 HANDLER ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ─── ERROR HANDLER ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error.',
    ...(process.env.NODE_ENV !== 'production' && { details: err.message }),
  });
});

// ─── START SERVER ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║  📱 Mobile Service Shop API                  ║
  ║  Version: 2.0.0 (Simplified MVP)             ║
  ║  Port:    ${PORT}                                ║
  ║  Mode:    ${process.env.NODE_ENV || 'development'}                      ║
  ╚══════════════════════════════════════════════╝
  `);
});

module.exports = app;
