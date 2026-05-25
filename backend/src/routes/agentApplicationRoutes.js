import express from 'express';
import AgentApplicationService from '../services/agentApplicationService.js';
import AgentApplication from '../models/AgentApplication.js';

const router = express.Router();

const success = (message, data = {}) => ({ status: 'success', success: true, message, data });
const failure = (message) => ({ status: 'error', success: false, message });

// POST /api/agent-applications - Create new application
router.post('/agent-applications', async (req, res) => {
  try {
    const result = await AgentApplicationService.submitApplication(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json(failure(error.message || 'Failed to create application'));
  }
});

// GET /api/agent-applications - Get all applications (admin)
router.get('/agent-applications', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      country: req.query.country,
      state: req.query.state
    };

    const result = await AgentApplicationService.getApplications(filters);
    res.json(result);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json(failure(error.message || 'Failed to fetch applications'));
  }
});

// GET /api/agent-applications/stats - Get statistics
router.get('/agent-applications/stats', async (req, res) => {
  try {
    const result = await AgentApplicationService.getStatistics();
    res.json(result);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json(failure(error.message || 'Failed to fetch statistics'));
  }
});

// GET /api/agent-applications/:id - Get single application
router.get('/agent-applications/:id', async (req, res) => {
  try {
    const result = await AgentApplicationService.getApplication(req.params.id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json(failure(error.message || 'Failed to fetch application'));
  }
});

// GET /api/agent-applications/user/:userId - Get user's applications
router.get('/agent-applications/user/:userId', async (req, res) => {
  try {
    const result = await AgentApplicationService.getUserApplications(req.params.userId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching user applications:', error);
    res.status(500).json(failure(error.message || 'Failed to fetch user applications'));
  }
});

// PATCH /api/agent-applications/:id/approve - Approve application
router.patch('/agent-applications/:id/approve', async (req, res) => {
  try {
    const { reviewedBy, notes } = req.body;

    if (!reviewedBy) {
      return res.status(400).json(failure('Reviewed by is required'));
    }

    const result = await AgentApplicationService.reviewApplication(req.params.id, {
      status: 'approved',
      reviewedBy,
      notes
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json(failure(error.message || 'Failed to approve application'));
  }
});

// PATCH /api/agent-applications/:id/reject - Reject application
router.patch('/agent-applications/:id/reject', async (req, res) => {
  try {
    const { reviewedBy, notes } = req.body;

    if (!reviewedBy) {
      return res.status(400).json(failure('Reviewed by is required'));
    }

    const result = await AgentApplicationService.reviewApplication(req.params.id, {
      status: 'rejected',
      reviewedBy,
      notes
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json(failure(error.message || 'Failed to reject application'));
  }
});

// POST /api/agent-applications/mock/generate - Generate mock data (dev only)
router.post('/agent-applications/mock/generate', async (req, res) => {
  try {
    // Check if in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json(failure('This endpoint is not available in production'));
    }

    const result = await AgentApplicationService.generateMockData();
    res.json(result);
  } catch (error) {
    console.error('Error generating mock data:', error);
    res.status(500).json(failure(error.message || 'Failed to generate mock data'));
  }
});

export default router;
