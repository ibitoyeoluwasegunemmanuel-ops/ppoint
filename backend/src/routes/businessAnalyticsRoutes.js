import express from 'express';
import BusinessAnalyticsService from '../services/businessAnalyticsService.js';
import DeveloperAccount from '../models/DeveloperAccount.js';
import APIUsage from '../models/APIUsage.js';

const router = express.Router();

// Get developer dashboard
router.get('/developers/:id/dashboard', async (req, res) => {
  try {
    const dashboard = await BusinessAnalyticsService.getDeveloperDashboard(req.params.id);
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

// Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await BusinessAnalyticsService.getPlatformStats();
    res.json({
      status: 'success',
      success: true,
      message: 'Platform statistics retrieved',
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

// Create developer account
router.post('/developers', async (req, res) => {
  try {
    const { businessName, website, tier, email, contactPhone } = req.body;

    if (!businessName || !email) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'businessName and email are required'
      });
    }

    const account = await DeveloperAccount.create({
      businessName,
      website,
      tier: tier || 'free',
      email,
      contactPhone
    });

    res.status(201).json({
      status: 'success',
      success: true,
      message: 'Developer account created',
      data: account
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Get all developers
router.get('/developers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const developers = await DeveloperAccount.getAllDevelopers(limit);

    res.json({
      status: 'success',
      success: true,
      message: 'Developers retrieved',
      data: {
        count: developers.length,
        developers
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Get developer account
router.get('/developers/:id', async (req, res) => {
  try {
    const account = await DeveloperAccount.findById(req.params.id);
    if (!account) {
      return res.status(404).json({
        status: 'error',
        success: false,
        message: 'Developer account not found'
      });
    }

    res.json({
      status: 'success',
      success: true,
      message: 'Developer account retrieved',
      data: account
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Update developer tier
router.patch('/developers/:id/tier', async (req, res) => {
  try {
    const { tier } = req.body;
    if (!tier) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'tier is required'
      });
    }

    const account = await DeveloperAccount.updateTier(req.params.id, tier);
    res.json({
      status: 'success',
      success: true,
      message: 'Tier updated',
      data: account
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Regenerate API key
router.post('/developers/:id/regenerate-key', async (req, res) => {
  try {
    const result = await DeveloperAccount.regenerateApiKey(req.params.id);
    res.json({
      status: 'success',
      success: true,
      message: 'API key regenerated',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Get API usage stats
router.get('/developers/:id/usage', async (req, res) => {
  try {
    const account = await DeveloperAccount.findById(req.params.id);
    if (!account) {
      return res.status(404).json({
        status: 'error',
        success: false,
        message: 'Developer account not found'
      });
    }

    const stats = await APIUsage.getUsageStats(account.api_key);
    const endpoints = await APIUsage.getEndpointStats(account.api_key, 10);

    res.json({
      status: 'success',
      success: true,
      message: 'Usage statistics retrieved',
      data: {
        summary: stats,
        topEndpoints: endpoints
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Log API usage (internal endpoint)
router.post('/usage/log', async (req, res) => {
  try {
    const { apiKeyId, endpoint, method, statusCode, responseTime, requestSize, responseSize, ipAddress } = req.body;

    if (!apiKeyId || !endpoint) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'apiKeyId and endpoint are required'
      });
    }

    const log = await APIUsage.logUsage({
      apiKeyId,
      endpoint,
      method,
      statusCode,
      responseTime,
      requestSize,
      responseSize,
      ipAddress
    });

    res.status(201).json({
      status: 'success',
      success: true,
      message: 'Usage logged',
      data: log
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Get rate limits for tier
router.get('/rate-limits/:tier', async (req, res) => {
  try {
    const limits = BusinessAnalyticsService.calculateRateLimit(req.params.tier);
    res.json({
      status: 'success',
      success: true,
      message: 'Rate limits retrieved',
      data: limits
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Generate mock developers
router.post('/developers/mock/generate', async (req, res) => {
  try {
    const count = req.body.count || 5;
    const developers = [];

    for (let i = 0; i < count; i++) {
      const mock = BusinessAnalyticsService.generateMockDeveloperAccount();
      const account = await DeveloperAccount.create(mock);
      developers.push(account);
    }

    res.status(201).json({
      status: 'success',
      success: true,
      message: 'Mock developers generated',
      data: {
        count: developers.length,
        developers
      }
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
