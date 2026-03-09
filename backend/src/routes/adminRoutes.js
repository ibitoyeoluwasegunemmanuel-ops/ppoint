import express from 'express';
import pool from '../config/database.js';
import { inMemoryStore } from '../data/inMemoryStore.js';
import City from '../models/City.js';
import Address from '../models/Address.js';

const router = express.Router();

const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

router.use(adminAuth);

router.get('/stats', async (req, res) => {
  try {
    const stats = await Address.getStats();
    const totalAddresses = stats.reduce((sum, stat) => sum + parseInt(stat.total_addresses, 10), 0);

    res.json({
      success: true,
      data: {
        totalAddresses,
        cityBreakdown: stats,
        systemStatus: 'operational'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/hierarchy', async (req, res) => {
  try {
    if (inMemoryStore.isEnabled()) {
      res.json({ success: true, data: inMemoryStore.getHierarchy() });
      return;
    }

    const query = `
      SELECT
        ct.name AS continent,
        co.country_name,
        s.state_name,
        c.city_name,
        c.city_code,
        c.is_active,
        COUNT(a.id) as address_count
      FROM countries co
      LEFT JOIN continents ct ON co.continent_id = ct.id
      LEFT JOIN states s ON s.country_id = co.id
      LEFT JOIN cities c ON c.state_id = s.id
      LEFT JOIN addresses a ON a.city_code = c.city_code
      GROUP BY ct.name, co.country_name, s.state_name, c.city_name, c.city_code, c.is_active
      ORDER BY ct.name, co.country_name, s.state_name, c.city_name
    `;
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/city/:id/activate', async (req, res) => {
  try {
    const city = await City.activateCity(req.params.id);
    res.json({ success: true, data: city });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;