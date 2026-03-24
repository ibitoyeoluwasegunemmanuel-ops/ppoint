// buildingClaimRoutes.js
import express from 'express';
const router = express.Router();
import pool from '../config/database.js';

// POST /api/buildings/:id/claim
router.post('/buildings/:id/claim', async (req, res) => {
  const { building_name, business_name, delivery_instructions, landmark, phone_number } = req.body;
  try {
    await pool.query(
      'INSERT INTO building_claims (building_id, building_name, business_name, delivery_instructions, landmark, phone_number) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.params.id, building_name, business_name, delivery_instructions, landmark, phone_number]
    );
    await pool.query('UPDATE buildings SET status = $1 WHERE id = $2', ['claimed', req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit claim' });
  }
});

export default router;
