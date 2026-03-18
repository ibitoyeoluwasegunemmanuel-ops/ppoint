// buildingDetectionRoutes.js
const express = require('express');
const router = express.Router();

// POST /api/buildings/ingest
router.post('/buildings/ingest', async (req, res) => {
  // TODO: Ingest OSM, Sentinel-2, Mapbox data, or trigger AI detection pipeline
  // Accepts tile coordinates or bounding box
  // Returns detected buildings with polygons, confidence, etc.
  res.json({ message: 'Ingestion started' });
});

// POST /api/buildings/ai-detect
router.post('/buildings/ai-detect', async (req, res) => {
  // TODO: Call Python AI microservice for building detection
  // Accepts satellite image, returns detected polygons
  res.json({ message: 'AI detection started' });
});

module.exports = router;
