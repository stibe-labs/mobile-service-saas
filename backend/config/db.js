// ─── PostgreSQL Connection Pool ────────────────────────
// Uses 'pg' library with connection pooling for performance.
// All queries go through this pool.

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: 20,               // max number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log connection status
pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
  process.exit(-1);
});

// Helper: run a query
const query = (text, params) => pool.query(text, params);

// Helper: get a client for transactions
const getClient = () => pool.connect();

module.exports = { pool, query, getClient };
