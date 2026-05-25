import express from 'express';
import GovernmentService from '../services/governmentService.js';
import GovernmentHierarchy from '../models/GovernmentHierarchy.js';
import GovernmentAgent from '../models/GovernmentAgent.js';
import GovernmentMetrics from '../models/GovernmentMetrics.js';

const router = express.Router();

// Get government dashboard
router.get('/regions/:id/dashboard', async (req, res) => {
  try {
    const dashboard = await GovernmentService.getGovernmentDashboard(req.params.id);
    res.json({
      status: 'success',
      success: true,
      message: 'Dashboard retrieved',
      data: dashboard
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Get pan-African statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await GovernmentService.getPanAfricanStats();
    res.json({
      status: 'success',
      success: true,
      message: 'Pan-African statistics retrieved',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Get countries
router.get('/countries', async (req, res) => {
  try {
    const countries = await GovernmentHierarchy.getCountries();
    res.json({
      status: 'success',
      success: true,
      data: countries
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Get region by ID
router.get('/regions/:id', async (req, res) => {
  try {
    const region = await GovernmentHierarchy.findById(req.params.id);
    if (!region) {
      return res.status(404).json({
        status: 'error',
        success: false,
        message: 'Region not found'
      });
    }
    const children = await GovernmentHierarchy.getChildren(req.params.id);
    res.json({
      status: 'success',
      success: true,
      data: { ...region, children }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Get subregions
router.get('/regions/:id/subregions', async (req, res) => {
  try {
    const children = await GovernmentHierarchy.getChildren(req.params.id);
    res.json({
      status: 'success',
      success: true,
      data: children
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Create region admin
router.post('/regions/:id/agents', async (req, res) => {
  try {
    const { name, email, phone, role, department } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'name, email, and role are required'
      });
    }

    const agent = await GovernmentService.addRegionAdmin(req.params.id, {
      name, email, phone, role, department
    });

    res.status(201).json({
      status: 'success',
      success: true,
      message: 'Admin created',
      data: agent
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Get region agents
router.get('/regions/:id/agents', async (req, res) => {
  try {
    const agents = await GovernmentAgent.findByRegion(req.params.id);
    res.json({
      status: 'success',
      success: true,
      data: agents
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Record coverage metrics
router.post('/regions/:id/metrics', async (req, res) => {
  try {
    const metrics = await GovernmentService.recordCoverageData(req.params.id, req.body);
    res.status(201).json({
      status: 'success',
      success: true,
      message: 'Metrics recorded',
      data: metrics
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Get coverage metrics
router.get('/regions/:id/metrics', async (req, res) => {
  try {
    const metrics = await GovernmentMetrics.getMetricsByRegion(req.params.id);
    res.json({
      status: 'success',
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Get coverage trends
router.get('/regions/:id/trends/:metricType', async (req, res) => {
  try {
    const days = req.query.days || 30;
    const trends = await GovernmentMetrics.getTrendData(
      req.params.id,
      req.params.metricType,
      days
    );
    res.json({
      status: 'success',
      success: true,
      data: trends
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

export default router;
