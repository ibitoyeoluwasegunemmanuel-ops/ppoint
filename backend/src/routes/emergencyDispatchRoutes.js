import express from 'express';
import EmergencyDispatchService from '../services/emergencyDispatchService.js';

const router = express.Router();

// Create incident report
router.post('/incidents', async (req, res) => {
  try {
    const incident = await EmergencyDispatchService.reportIncident(req.body);
    res.json({
      status: 'success',
      success: true,
      message: 'Incident reported successfully',
      data: incident
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Get all incidents with optional filters
router.get('/incidents', async (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.severity) filters.severity = req.query.severity;
    if (req.query.type) filters.incidentType = req.query.type;

    const incidents = await EmergencyDispatchService.getIncidents(filters);
    res.json({
      status: 'success',
      success: true,
      message: 'Incidents retrieved',
      data: incidents
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Get single incident
router.get('/incidents/:id', async (req, res) => {
  try {
    const incident = await EmergencyDispatchService.getIncidents({ id: req.params.id });
    if (!incident || incident.length === 0) {
      return res.status(404).json({
        status: 'error',
        success: false,
        message: 'Incident not found'
      });
    }
    res.json({
      status: 'success',
      success: true,
      message: 'Incident retrieved',
      data: incident[0]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Assign dispatcher
router.patch('/incidents/:id/assign', async (req, res) => {
  try {
    const { dispatcherId, dispatcherName } = req.body;
    if (!dispatcherId || !dispatcherName) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'dispatcherId and dispatcherName are required'
      });
    }

    const incident = await EmergencyDispatchService.assignDispatcher(
      req.params.id,
      dispatcherId,
      dispatcherName
    );

    res.json({
      status: 'success',
      success: true,
      message: 'Dispatcher assigned',
      data: incident
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Update incident status
router.patch('/incidents/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Status is required'
      });
    }

    const incident = await EmergencyDispatchService.updateIncidentStatus(req.params.id, status);
    res.json({
      status: 'success',
      success: true,
      message: 'Status updated',
      data: incident
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Close incident
router.patch('/incidents/:id/close', async (req, res) => {
  try {
    const { resolutionNotes } = req.body;
    const incident = await EmergencyDispatchService.closeIncident(req.params.id, resolutionNotes || '');

    res.json({
      status: 'success',
      success: true,
      message: 'Incident closed',
      data: incident
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

// Get dispatch statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await EmergencyDispatchService.getStats();
    res.json({
      status: 'success',
      success: true,
      message: 'Statistics retrieved',
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

// Generate mock data for testing
router.post('/mock/generate', async (req, res) => {
  try {
    const incidents = await EmergencyDispatchService.generateMockIncidents();
    res.json({
      status: 'success',
      success: true,
      message: 'Mock data generated',
      data: {
        count: incidents.length,
        incidents
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
