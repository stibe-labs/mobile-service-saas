require('dotenv').config();
const { query } = require('./config/db');

(async () => {
  try {
    const res = await query(`
      SELECT p.*,
             COALESCE(
               json_agg(
                 json_build_object('id', dm.id, 'name', dm.name, 'brand', b.name)
               ) FILTER (WHERE dm.id IS NOT NULL), 
               '[]'
             ) AS compatible_models
      FROM parts p
      LEFT JOIN part_compatible_models pcm ON pcm.part_id = p.id
      LEFT JOIN device_models dm ON pcm.model_id = dm.id
      LEFT JOIN brands b ON dm.brand_id = b.id
      WHERE p.tenant_id = '3e8ed1b0-c787-4a92-8547-15e0a8d3429a'
      GROUP BY p.id
      ORDER BY p.name ASC
    `);
    console.log('GET API Query Result:', res.rows);
  } catch(e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
})();
