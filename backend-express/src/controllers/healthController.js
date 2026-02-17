const express = require('express');
const { pool } = require('../repositories/db');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ ok: true, service: 'MultiplicaMoney Express API' });
});

router.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'up' });
  } catch (err) {
    res.status(500).json({ ok: false, db: 'down', error: err.message });
  }
});

module.exports = router;
