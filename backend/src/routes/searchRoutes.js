import express from 'express';
import SearchService from '../services/searchService.js';

const router = express.Router();

router.get('/global', async (req, res) => {
  try {
    const { q, limit } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const results = await SearchService.globalSearch(q, parseInt(limit) || 10);
    res.json({ status: 'success', success: true, data: results });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { q, limit, offset } = req.query;
    const results = await SearchService.searchUsers(
      q || '',
      parseInt(limit) || 20,
      parseInt(offset) || 0
    );
    res.json({ status: 'success', success: true, data: results });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.get('/addresses', async (req, res) => {
  try {
    const { q, limit, offset } = req.query;
    const results = await SearchService.searchAddresses(
      q || '',
      parseInt(limit) || 20,
      parseInt(offset) || 0
    );
    res.json({ status: 'success', success: true, data: results });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.get('/businesses', async (req, res) => {
  try {
    const { q, limit, offset } = req.query;
    const results = await SearchService.searchBusinesses(
      q || '',
      parseInt(limit) || 20,
      parseInt(offset) || 0
    );
    res.json({ status: 'success', success: true, data: results });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.get('/agents', async (req, res) => {
  try {
    const { q, limit, offset } = req.query;
    const results = await SearchService.searchAgents(
      q || '',
      parseInt(limit) || 20,
      parseInt(offset) || 0
    );
    res.json({ status: 'success', success: true, data: results });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.get('/emergencies', async (req, res) => {
  try {
    const { q, limit, offset } = req.query;
    const results = await SearchService.searchEmergencies(
      q || '',
      parseInt(limit) || 20,
      parseInt(offset) || 0
    );
    res.json({ status: 'success', success: true, data: results });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.post('/filter/users', async (req, res) => {
  try {
    const { filters, limit, offset } = req.body;
    const results = await SearchService.filterUsers(filters || {}, limit || 20, offset || 0);
    res.json({ status: 'success', success: true, data: results });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.post('/filter/addresses', async (req, res) => {
  try {
    const { filters, limit, offset } = req.body;
    const results = await SearchService.filterAddresses(filters || {}, limit || 20, offset || 0);
    res.json({ status: 'success', success: true, data: results });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.get('/suggestions', async (req, res) => {
  try {
    const { q, limit } = req.query;
    if (!q || q.length < 1) {
      return res.json({ status: 'success', success: true, data: [] });
    }

    const suggestions = await SearchService.getSearchSuggestions(q, parseInt(limit) || 5);
    res.json({ status: 'success', success: true, data: suggestions });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

export default router;
