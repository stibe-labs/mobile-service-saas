const { Client } = require('pg');

async function seedTestData() {
  const client = new Client({ connectionString: 'postgresql://postgres:admin123@localhost:5432/mobile_service_shop' });
  await client.connect();

  try {
    console.log('Seeding test brands, models, and inventory...');
    
    // Get the first tenant
    const tenantRes = await client.query(`SELECT id FROM tenants LIMIT 1`);
    if (tenantRes.rows.length === 0) throw new Error('No tenant found');
    const tenantId = tenantRes.rows[0].id;

    // Get the first branch of the tenant
    const branchRes = await client.query(`SELECT id FROM branches WHERE tenant_id = $1 LIMIT 1`, [tenantId]);
    if (branchRes.rows.length === 0) throw new Error('No branch found');
    const branchId = branchRes.rows[0].id;

    // Insert Brand (Apple)
    let brandId;
    const brandRes = await client.query(`SELECT id FROM brands WHERE name = 'Apple' AND tenant_id = $1`, [tenantId]);
    if (brandRes.rows.length > 0) {
      brandId = brandRes.rows[0].id;
    } else {
      const newBrand = await client.query(`INSERT INTO brands (tenant_id, name) VALUES ($1, 'Apple') RETURNING id`, [tenantId]);
      brandId = newBrand.rows[0].id;
    }

    // Insert Model (iPhone 13)
    let modelId;
    const modelRes = await client.query(`SELECT id FROM device_models WHERE name = 'iPhone 13' AND brand_id = $1`, [brandId]);
    if (modelRes.rows.length > 0) {
      modelId = modelRes.rows[0].id;
    } else {
      const newModel = await client.query(`INSERT INTO device_models (brand_id, name) VALUES ($1, 'iPhone 13') RETURNING id`, [brandId]);
      modelId = newModel.rows[0].id;
    }

    // Insert Inventory Item (IMEI: 12345)
    const invRes = await client.query(`SELECT id FROM inventory WHERE imei_number = '12345' AND tenant_id = $1`, [tenantId]);
    if (invRes.rows.length === 0) {
      await client.query(`
        INSERT INTO inventory (tenant_id, branch_id, brand_id, model_id, category, condition_grade, imei_number, quantity, purchase_price, status)
        VALUES ($1, $2, $3, $4, 'new', 'A+', '12345', 1, 500, 'available')
      `, [tenantId, branchId, brandId, modelId]);
      console.log('Added iPhone 13 to inventory with IMEI: 12345');
    } else {
      console.log('iPhone 13 with IMEI 12345 already exists in inventory.');
    }

    console.log('Test data seeded successfully!');

  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await client.end();
  }
}

seedTestData();
