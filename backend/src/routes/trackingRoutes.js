import express from 'express';
import Address from '../models/Address.js';

const router = express.Router();
const activeSessions = new Map(); // In production, use Redis

const success = (message, data = {}) => ({ status: 'success', success: true, message, data });
const failure = (message) => ({ status: 'error', success: false, message });

// Start tracking session for a delivery
router.post('/session/start', async (req, res) => {
  try {
    const { ppoinnt_code, driver_id, vehicle_type, contact_number } = req.body;

    if (!ppoinnt_code || !driver_id) {
      return res.status(400).json(failure('Code and driver ID required'));
    }

    const address = await Address.findByCode(ppoinnt_code);
    if (!address) {
      return res.status(404).json(failure('PPOINNT not found'));
    }

    const sessionId = `${driver_id}-${ppoinnt_code}-${Date.now()}`;
    const session = {
      session_id: sessionId,
      ppoinnt_code,
      driver_id,
      vehicle_type: vehicle_type || 'motorcycle',
      contact_number,
      started_at: new Date().toISOString(),
      location_updates: [],
      status: 'active',
    };

    activeSessions.set(sessionId, session);

    res.json(success('Tracking session started', {
      session_id: sessionId,
      ppoinnt_code,
      destination: {
        latitude: address.latitude,
        longitude: address.longitude,
        address: address.address,
      },
      expires_in_seconds: 3600,
    }));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

// End tracking session
router.post('/session/:session_id/end', async (req, res) => {
  try {
    const session = activeSessions.get(req.params.session_id);
    if (!session) {
      return res.status(404).json(failure('Session not found'));
    }

    session.status = 'completed';
    session.completed_at = new Date().toISOString();

    res.json(success('Session ended', {
      session_id: req.params.session_id,
      duration_minutes: Math.round((new Date() - new Date(session.started_at)) / 60000),
      total_updates: session.location_updates.length,
    }));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

// Record location update
router.post('/location/update', async (req, res) => {
  try {
    const { session_id, latitude, longitude, accuracy, speed, heading } = req.body;

    if (!session_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json(failure('Session ID and coordinates required'));
    }

    const session = activeSessions.get(session_id);
    if (!session) {
      return res.status(404).json(failure('Session not found'));
    }

    const address = await Address.findByCode(session.ppoinnt_code);
    const latDiff = Math.abs(Number(latitude) - address.latitude);
    const lngDiff = Math.abs(Number(longitude) - address.longitude);
    const distanceMeters = Math.sqrt(latDiff ** 2 + lngDiff ** 2) * 111000;

    const update = {
      timestamp: new Date().toISOString(),
      latitude,
      longitude,
      accuracy: accuracy || 0,
      speed: speed || 0,
      heading: heading || 0,
      distance_to_destination: Math.round(distanceMeters),
      estimated_arrival_seconds: distanceMeters > 0 ? Math.round((distanceMeters / (speed || 5)) * 3.6) : 0,
    };

    session.location_updates.push(update);
    if (session.location_updates.length > 1000) {
      session.location_updates.shift(); // Keep only last 1000 updates
    }

    res.json(success('Location updated', update));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

// Get session tracking data
router.get('/session/:session_id', async (req, res) => {
  try {
    const session = activeSessions.get(req.params.session_id);
    if (!session) {
      return res.status(404).json(failure('Session not found'));
    }

    const lastUpdate = session.location_updates[session.location_updates.length - 1];
    const address = await Address.findByCode(session.ppoinnt_code);

    res.json(success('Session data retrieved', {
      session_id: req.params.session_id,
      driver_id: session.driver_id,
      ppoinnt_code: session.ppoinnt_code,
      status: session.status,
      started_at: session.started_at,
      current_location: lastUpdate || null,
      destination: {
        latitude: address.latitude,
        longitude: address.longitude,
        address: address.address,
      },
      vehicle_type: session.vehicle_type,
      contact_number: session.contact_number,
      total_location_updates: session.location_updates.length,
    }));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

// Get polyline (GPS tracking path)
router.get('/session/:session_id/polyline', async (req, res) => {
  try {
    const session = activeSessions.get(req.params.session_id);
    if (!session) {
      return res.status(404).json(failure('Session not found'));
    }

    const polyline = session.location_updates.map(u => ({
      latitude: u.latitude,
      longitude: u.longitude,
      timestamp: u.timestamp,
    }));

    res.json(success('Polyline retrieved', {
      session_id: req.params.session_id,
      path: polyline,
      total_points: polyline.length,
    }));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

// Share tracking link with recipient
router.post('/session/:session_id/share', async (req, res) => {
  try {
    const { recipient_phone } = req.body;
    const session = activeSessions.get(req.params.session_id);

    if (!session) {
      return res.status(404).json(failure('Session not found'));
    }

    // In production, send SMS via Twilio/AWS SNS
    const trackingLink = `https://ppoint.online/track/${req.params.session_id}`;

    // Simulated: Log for SMS sending
    console.log(`[SMS] To: ${recipient_phone}, Message: Your driver is on the way! Track: ${trackingLink}`);

    res.json(success('Tracking link shared', {
      session_id: req.params.session_id,
      recipient_phone: recipient_phone?.slice(-4), // Only show last 4 digits for privacy
      tracking_link: trackingLink,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
    }));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

// Get active sessions count (admin)
router.get('/stats/active', (req, res) => {
  try {
    const activeSessions_ = Array.from(activeSessions.values()).filter(s => s.status === 'active');
    const averageSpeed = activeSessions_.reduce((sum, s) => {
      const lastUpdate = s.location_updates[s.location_updates.length - 1];
      return sum + (lastUpdate?.speed || 0);
    }, 0) / (activeSessions_.length || 1);

    res.json(success('Active sessions stats', {
      active_sessions: activeSessions_.length,
      average_speed_kmh: Math.round(averageSpeed),
      last_update: new Date().toISOString(),
    }));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

export default router;
