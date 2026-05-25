import express from 'express';
import Analytics from '../models/Analytics.js';

const router = express.Router();

router.get('/dashboard', async (req, res) => {
  try {
    const days = req.query.days || 30;
    const metrics = await Analytics.getDashboardMetrics(days);
    res.json({ status: 'success', success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.get('/trends/:eventType', async (req, res) => {
  try {
    const days = req.query.days || 30;
    const trends = await Analytics.getTrendData(req.params.eventType, days);
    res.json({ status: 'success', success: true, data: trends });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

export default router;
