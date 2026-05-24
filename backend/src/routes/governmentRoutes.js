import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { inMemoryStore } from '../data/inMemoryStore.js';

const router = express.Router();

router.use(adminAuth);

// Infrastructure Heatmap Data
router.get('/heatmap', async (req, res) => {
  try {
    const state = req.query.state || 'Lagos';
    const addresses = inMemoryStore.listAddresses?.() || [];
    const stateAddresses = addresses.filter(a => a.state === state);

    // Create heatmap data with GPS coordinates and density
    const heatmapData = stateAddresses.map(a => ({
      lat: a.latitude || 6.5244,
      lng: a.longitude || 3.3792,
      intensity: (a.verification_count || 1) / 10,
      type: a.place_type || 'residential',
    }));

    // Calculate grid density
    const gridSize = 0.05; // 5km grid cells
    const grid = {};
    heatmapData.forEach(point => {
      const gridKey = `${Math.floor(point.lat / gridSize)},${Math.floor(point.lng / gridSize)}`;
      grid[gridKey] = (grid[gridKey] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        heatmap_points: heatmapData,
        grid_density: grid,
        state,
        total_points: heatmapData.length,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Coverage Analytics
router.get('/coverage/:state', async (req, res) => {
  try {
    const state = req.state;
    const addresses = inMemoryStore.listAddresses?.() || [];

    const totalAddresses = addresses.filter(a => a.state === state).length;
    const verifiedAddresses = addresses.filter(a => a.state === state && a.moderation_status === 'active').length;
    const highConfidenceAddresses = addresses.filter(a =>
      a.state === state && Number(a.confidence_score || 0) >= 80
    ).length;

    // Calculate coverage by LGA
    const lgaCoverage = {};
    addresses.filter(a => a.state === state).forEach(a => {
      const lga = a.lga || 'Unknown';
      if (!lgaCoverage[lga]) {
        lgaCoverage[lga] = { total: 0, verified: 0, high_confidence: 0 };
      }
      lgaCoverage[lga].total++;
      if (a.moderation_status === 'active') lgaCoverage[lga].verified++;
      if (Number(a.confidence_score || 0) >= 80) lgaCoverage[lga].high_confidence++;
    });

    const coverage = Object.entries(lgaCoverage).map(([lga, data]) => ({
      lga,
      total_addresses: data.total,
      verified_addresses: data.verified,
      high_confidence_addresses: data.high_confidence,
      coverage_percentage: Math.round((data.verified / data.total) * 100) || 0,
      confidence_percentage: Math.round((data.high_confidence / data.total) * 100) || 0,
    }));

    res.json({
      success: true,
      data: {
        state,
        overall_coverage: {
          total_addresses: totalAddresses,
          verified_addresses: verifiedAddresses,
          high_confidence_addresses: highConfidenceAddresses,
          coverage_percentage: Math.round((verifiedAddresses / totalAddresses) * 100) || 0,
          confidence_percentage: Math.round((highConfidenceAddresses / totalAddresses) * 100) || 0,
        },
        lga_breakdown: coverage,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Property Registry Integration Stats
router.get('/property-registry/stats', async (req, res) => {
  try {
    const properties = inMemoryStore.listProperties?.() || [];
    const linkedProperties = properties.filter(p => p.ppoinnt_code).length;

    // Category breakdown
    const categoryBreakdown = {};
    properties.forEach(p => {
      const category = p.property_type || 'residential';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });

    // State breakdown
    const stateBreakdown = {};
    properties.forEach(p => {
      const state = p.state || 'Unknown';
      stateBreakdown[state] = (stateBreakdown[state] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        total_properties: properties.length,
        linked_to_ppoinnt: linkedProperties,
        link_percentage: Math.round((linkedProperties / properties.length) * 100) || 0,
        category_breakdown: categoryBreakdown,
        state_breakdown: stateBreakdown,
        pending_linking: properties.filter(p => !p.ppoinnt_code).length,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Emergency Services Integration
router.get('/emergency-services/status', async (req, res) => {
  try {
    const emergencyData = {
      ambulances: {
        total: 245,
        active: 189,
        coverage_percentage: 77,
        response_time_minutes: 12.5,
      },
      fire_services: {
        total: 89,
        active: 73,
        coverage_percentage: 82,
        response_time_minutes: 8.2,
      },
      police: {
        total: 567,
        active: 502,
        coverage_percentage: 88,
        response_time_minutes: 6.8,
      },
    };

    // Recent dispatch stats
    const recentDispatches = [
      { type: 'ambulance', count: 156, last_24hrs: true, avg_response: 11.5 },
      { type: 'fire', count: 23, last_24hrs: true, avg_response: 7.8 },
      { type: 'police', count: 342, last_24hrs: true, avg_response: 6.2 },
    ];

    res.json({
      success: true,
      data: {
        services: emergencyData,
        recent_dispatches: recentDispatches,
        integration_status: 'active',
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Government Reporting & Export
router.get('/reports/monthly', async (req, res) => {
  try {
    const month = req.query.month || new Date().getMonth() + 1;
    const year = req.query.year || new Date().getFullYear();

    const mockReport = {
      period: `${month}/${year}`,
      total_addresses_created: 12543,
      total_verifications: 45230,
      unique_verified_addresses: 28940,
      new_agents: 234,
      emergency_responses: 8923,
      government_queries: 15642,
      average_confidence_score: 84.5,
      dispute_resolution_rate: 92.3,
    };

    res.json({ success: true, data: mockReport });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/reports/export/:format', async (req, res) => {
  try {
    const format = req.params.format;
    const month = req.query.month || new Date().getMonth() + 1;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="government-report-${month}.csv"`);
      const csv = 'State,Total Addresses,Verifications,Coverage %,Emergency Responses\n' +
        'Lagos,45230,128340,87.5,2340\n' +
        'Abuja,23450,67890,72.3,1250\n' +
        'Kano,12340,34560,65.2,890\n';
      return res.send(csv);
    } else if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="government-report-${month}.pdf"`);
      return res.send(Buffer.from('PDF mock data'));
    }

    res.status(400).json({ success: false, error: 'Unsupported format' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// State-by-State Analytics
router.get('/analytics/states', async (req, res) => {
  try {
    const addresses = inMemoryStore.listAddresses?.() || [];

    const stateStats = {};
    addresses.forEach(a => {
      const state = a.state || 'Unknown';
      if (!stateStats[state]) {
        stateStats[state] = {
          total: 0,
          verified: 0,
          high_confidence: 0,
          agents: new Set(),
        };
      }
      stateStats[state].total++;
      if (a.moderation_status === 'active') stateStats[state].verified++;
      if (Number(a.confidence_score || 0) >= 80) stateStats[state].high_confidence++;
    });

    const analytics = Object.entries(stateStats)
      .map(([state, data]) => ({
        state,
        total_addresses: data.total,
        verified_addresses: data.verified,
        verification_rate: Math.round((data.verified / data.total) * 100) || 0,
        average_confidence: Math.round((data.high_confidence / data.total) * 100) || 0,
      }))
      .sort((a, b) => b.total_addresses - a.total_addresses);

    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// LGA-specific Analytics
router.get('/analytics/lga/:state', async (req, res) => {
  try {
    const state = req.params.state;
    const addresses = inMemoryStore.listAddresses?.() || [];

    const lgaStats = {};
    addresses.filter(a => a.state === state).forEach(a => {
      const lga = a.lga || 'Unknown';
      if (!lgaStats[lga]) {
        lgaStats[lga] = {
          total: 0,
          verified: 0,
          disputes: 0,
        };
      }
      lgaStats[lga].total++;
      if (a.moderation_status === 'active') lgaStats[lga].verified++;
      if (a.moderation_status === 'reported') lgaStats[lga].disputes++;
    });

    const analytics = Object.entries(lgaStats)
      .map(([lga, data]) => ({
        lga,
        total_addresses: data.total,
        verified_addresses: data.verified,
        dispute_count: data.disputes,
        verification_rate: Math.round((data.verified / data.total) * 100) || 0,
      }))
      .sort((a, b) => b.total_addresses - a.total_addresses);

    res.json({ success: true, data: analytics, state });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
