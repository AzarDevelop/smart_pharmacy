const fs = require('fs');
const path = require('path');
require(path.join(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const { Pool } = require(path.join(__dirname, '../backend/node_modules/pg'));

const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

if (!connectionString && !process.env.DB_HOST) {
  console.error('Error: DATABASE_URL or DB_HOST environment variables not defined in .env');
  process.exit(1);
}

const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: { rejectUnauthorized: false }
      }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
      }
);

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  console.log(`Reading SQL schema from ${schemaPath}...`);
  const sql = fs.readFileSync(schemaPath, 'utf8');

  try {
    console.log('Connecting to PostgreSQL / Neon database...');
    const client = await pool.connect();
    console.log('Connected! Executing schema script...');
    await client.query(sql);
    console.log('✅ Schema migration completed successfully.');
    client.release();
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
