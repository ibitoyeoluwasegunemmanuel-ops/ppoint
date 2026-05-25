import express from 'express';
import pool from '../db/pool.js';

const router = express.Router();

router.get('/system-stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM user_profiles) as total_users,
        (SELECT COUNT(*) FROM agent_applications WHERE status = 'approved') as approved_agents,
        (SELECT COUNT(*) FROM emergency_incidents WHERE status = 'closed') as resolved_incidents,
        (SELECT SUM(amount) FROM payments WHERE status = 'completed') as total_revenue
    `);
    res.json({ status: 'success', success: true, data: stats.rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, tier, created_at FROM user_profiles LIMIT 100');
    res.json({ status: 'success', success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

export default router;
