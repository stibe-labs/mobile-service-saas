require('dotenv').config();
const { query } = require('./config/db.js');

(async () => {
  try {
    await query(`ALTER TABLE device_models ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE CASCADE`);
    await query(`UPDATE device_models dm SET branch_id = b.branch_id FROM brands b WHERE dm.brand_id = b.id AND dm.branch_id IS NULL`);
    console.log('Successfully updated device_models schema');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();
