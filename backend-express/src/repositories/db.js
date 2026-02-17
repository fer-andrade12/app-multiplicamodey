const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  max: Number(process.env.DB_POOL_MAX || 20),
  min: Number(process.env.DB_POOL_MIN || 2),
  idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_MS || 30000),
  connectionTimeoutMillis: Number(process.env.DB_POOL_CONN_TIMEOUT_MS || 5000),
  maxUses: Number(process.env.DB_POOL_MAX_USES || 7500),
});

module.exports = { pool };
