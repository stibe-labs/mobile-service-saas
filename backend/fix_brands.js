require('dotenv').config();
const { query } = require('./config/db');

async function fixBrands() {
  try {
    console.log('Updating brands to be global...');
    const brandRes = await query(`UPDATE brands SET branch_id = NULL RETURNING id, name`);
    console.log(`Updated ${brandRes.rowCount} brands to Global.`);

    console.log('Updating device models to be global...');
    const modelRes = await query(`UPDATE device_models SET branch_id = NULL RETURNING id, name`);
    console.log(`Updated ${modelRes.rowCount} models to Global.`);
    
    console.log('Done!');
  } catch (err) {
    console.error('Error fixing brands:', err);
  } finally {
    process.exit(0);
  }
}

fixBrands();
