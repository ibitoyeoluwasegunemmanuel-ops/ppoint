// routeRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/route', async (req, res) => {
  const { start_lat, start_lng, end_lat, end_lng } = req.body;
  if (!start_lat || !start_lng || !end_lat || !end_lng) {
    return res.status(400).json({ error: 'Missing coordinates' });
  }
  try {
    const apiKey = process.env.OPENROUTESERVICE_API_KEY;
    const url = `https://api.openrouteservice.org/v2/directions/driving-car`;
    const response = await axios.post(url, {
      coordinates: [
        [parseFloat(start_lng), parseFloat(start_lat)],
        [parseFloat(end_lng), parseFloat(end_lat)]
      ]
    }, {
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      }
    });
    const data = response.data;
    const routeCoords = data.features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    const summary = data.features[0].properties.summary;
    const steps = data.features[0].properties.segments[0].steps.map(step => ({
      instruction: step.instruction,
      distance: step.distance,
      duration: step.duration
    }));
    res.json({
      polyline: routeCoords,
      distance: summary.distance,
      duration: summary.duration,
      steps
    });
  } catch (err) {
    res.status(500).json({ error: 'Route calculation failed', details: err.message });
  }
});

module.exports = router;
