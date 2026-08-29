const { Pool } = require('pg');
require('dotenv').config();

// Support connection via DATABASE_URL / NEON_DATABASE_URL or individual parameters
const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: {
        rejectUnauthorized: false // Required for Neon serverless PostgreSQL connections
      }
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'smart_pharmacy',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

// Helper wrapper providing query method compatible with pool.query(sql, params)
// and returning [rows, fields] format to maintain clean compatibility with existing code
const db = {
  query: async (text, params) => {
    // Convert MySQL style ? placeholders to PostgreSQL $1, $2, etc. if present
    let paramIndex = 1;
    const pgText = text.replace(/\?/g, () => `$${paramIndex++}`);
    const res = await pool.query(pgText, params);
    return [res.rows, res.fields];
  },
  // Provide direct access to raw pool and client acquisition for transactions
  pool,
  getClient: async () => {
    const client = await pool.connect();
    return {
      query: async (text, params) => {
        let paramIndex = 1;
        const pgText = text.replace(/\?/g, () => `$${paramIndex++}`);
        const res = await client.query(pgText, params);
        return [res.rows, res.fields];
      },
      beginTransaction: () => client.query('BEGIN'),
      commit: () => client.query('COMMIT'),
      rollback: () => client.query('ROLLBACK'),
      release: () => client.release()
    };
  }
};

module.exports = db;
