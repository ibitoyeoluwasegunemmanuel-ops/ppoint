// adminBuildingRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Assumes a db.js for querying

// GET /api/admin/buildings
router.get('/admin/buildings', async (req, res) => {
  try {
    const buildings = await db.query('SELECT * FROM buildings ORDER BY created_at DESC');
    res.json({ data: buildings.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch buildings' });
  }
});

// POST /api/admin/buildings/:id/approve
router.post('/admin/buildings/:id/approve', async (req, res) => {
  try {
    await db.query('UPDATE buildings SET status = $1 WHERE id = $2', ['verified', req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve building' });
  }
});

// POST /api/admin/buildings/:id/remove
router.post('/admin/buildings/:id/remove', async (req, res) => {
  try {
    await db.query('DELETE FROM buildings WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove building' });
  }
});

// POST /api/admin/buildings/:id/edit
router.post('/admin/buildings/:id/edit', async (req, res) => {
  const { city, state, country, ppoint_code } = req.body;
  try {
    await db.query('UPDATE buildings SET city = $1, state = $2, country = $3, ppoint_code = $4 WHERE id = $5', [city, state, country, ppoint_code, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to edit building' });
  }
});

module.exports = router;
