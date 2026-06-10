const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:admin123@localhost:5432/mobile_service_shop'
});

async function run() {
  try {
    await client.connect();
    console.log('Running Razorpay database migrations...');

    // Rename columns in tenants table
    await client.query(`
      ALTER TABLE tenants
      RENAME COLUMN stripe_customer_id TO razorpay_customer_id;
    `);
    
    await client.query(`
      ALTER TABLE tenants
      RENAME COLUMN stripe_subscription_id TO razorpay_subscription_id;
    `);

    // Rename columns in subscriptions table
    await client.query(`
      ALTER TABLE subscriptions
      RENAME COLUMN stripe_customer_id TO razorpay_customer_id;
    `);
    
    await client.query(`
      ALTER TABLE subscriptions
      RENAME COLUMN stripe_subscription_id TO razorpay_subscription_id;
    `);

    console.log('✅ Renamed stripe columns to razorpay columns.');
  } catch (err) {
    // If it fails because columns don't exist or already renamed, we log it and continue
    console.error('Migration note (might already be renamed):', err.message);
  } finally {
    await client.end();
  }
}

run();
