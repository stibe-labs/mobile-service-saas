require('dotenv').config();
const { getClient } = require('./config/db');

async function migrate() {
  const client = await getClient();
  try {
    console.log('Starting migration for pricing_margins...');
    await client.query('BEGIN');

    // 1. Add new columns if they don't exist
    console.log('Adding new margin columns...');
    await client.query(`
      ALTER TABLE pricing_margins
      ADD COLUMN IF NOT EXISTS margin_new DECIMAL(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS margin_used DECIMAL(10,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS margin_refurbished DECIMAL(10,2) NOT NULL DEFAULT 0
    `);

    // 2. Check if the old 'margin' column exists
    const checkRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'pricing_margins' AND column_name = 'margin'
    `);

    if (checkRes.rows.length > 0) {
      // 3. Migrate data from old margin column to the new ones
      console.log('Migrating existing margin data...');
      await client.query(`
        UPDATE pricing_margins
        SET margin_new = margin,
            margin_used = margin,
            margin_refurbished = margin
      `);

      // 4. Drop old margin column
      console.log('Dropping old margin column...');
      await client.query(`
        ALTER TABLE pricing_margins
        DROP COLUMN margin
      `);
    } else {
      console.log('Old margin column not found, skipping data migration.');
    }

    await client.query('COMMIT');
    console.log('Migration successful!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
