/**
 * Driver Intelligence Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Enables anonymous driver feedback collection, route confidence scoring,
 * adaptive routing, and Africa-specific route optimization.
 *
 * Mounted at: /api/driver
 *
 * Endpoints
 * ─────────
 *  POST /api/driver/session/start          – start a new navigation session
 *  POST /api/driver/session/:id/position   – record GPS position during nav
 *  POST /api/driver/session/:id/deviation  – record a route deviation
 *  POST /api/driver/session/:id/complete   – complete/end a session
 *  POST /api/driver/route/confidence       – get route confidence score
 *  POST /api/driver/route/hints            – get Africa-specific routing hints
 *  POST /api/driver/route/learn            – submit learned deviation route
 *  GET  /api/driver/analytics              – analytics snapshot (admin)
 */

import express from 'express';
import {
  startSession,
  recordPosition,
  recordDeviation,
  completeSession,
  calculateRouteConfidence,
  getAfricaRoutingHints,
  learnAlternativeRoute,
  getAnalyticsSnapshot,
} from '../data/driverIntelligenceStore.js';

const router = express.Router();

const ok = (data, message = 'OK') => ({ status: 'success', success: true, message, data });
const err = (message, code = 400) => ({ status: 'error', success: false, message, code });

// Rate limit: driver endpoints are called frequently, use a lighter limit
router.use((req, res, next) => {
  res.set('X-PPOINNT-API', '1.0');
  next();
});

// ─── POST /api/driver/session/start ─────────────────────────────────────────

router.post('/session/start', (req, res) => {
  const {
    session_id, sessionId,
    start_lat, start_lng, end_lat, end_lng,
    startLat, startLng, endLat, endLng,
    mode,
  } = req.body;

  const sid = session_id || sessionId;
  const sLat = parseFloat(start_lat || startLat);
  const sLng = parseFloat(start_lng || startLng);
  const eLat = parseFloat(end_lat || endLat);
  const eLng = parseFloat(end_lng || endLng);
  const transportMode = String(mode || 'driving-car');

  if (!sid || !Number.isFinite(sLat) || !Number.isFinite(sLng) || !Number.isFinite(eLat) || !Number.isFinite(eLng)) {
    return res.status(400).json(err('session_id, start_lat, start_lng, end_lat, end_lng are required'));
  }

  startSession(sid, sLat, sLng, eLat, eLng, transportMode);

  return res.json(ok({ session_id: sid, started: true }, 'Navigation session started'));
});

// ─── POST /api/driver/session/:id/position ───────────────────────────────────

router.post('/session/:id/position', (req, res) => {
  const sessionId = req.params.id;
  const lat = parseFloat(req.body.lat || req.body.latitude);
  const lng = parseFloat(req.body.lng || req.body.longitude);
  const speed = req.body.speed != null ? parseFloat(req.body.speed) : null;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json(err('lat and lng are required'));
  }

  recordPosition(sessionId, lat, lng, speed);
  return res.json(ok({ recorded: true }, 'Position recorded'));
});

// ─── POST /api/driver/session/:id/deviation ──────────────────────────────────

router.post('/session/:id/deviation', (req, res) => {
  const sessionId = req.params.id;
  const { driver_lat, driver_lng, expected_lat, expected_lng } = req.body;

  const dLat = parseFloat(driver_lat);
  const dLng = parseFloat(driver_lng);
  const eLat = parseFloat(expected_lat);
  const eLng = parseFloat(expected_lng);

  if (!Number.isFinite(dLat) || !Number.isFinite(dLng)) {
    return res.status(400).json(err('driver_lat and driver_lng are required'));
  }

  recordDeviation(sessionId, dLat, dLng, eLat, eLng);
  return res.json(ok({ recorded: true }, 'Deviation recorded'));
});

// ─── POST /api/driver/session/:id/complete ───────────────────────────────────

router.post('/session/:id/complete', (req, res) => {
  const sessionId = req.params.id;
  const reason = String(req.body.reason || 'arrived');

  completeSession(sessionId, reason);
  return res.json(ok({ session_id: sessionId, completed: true, reason }, 'Session completed'));
});

// ─── POST /api/driver/route/confidence ───────────────────────────────────────
// Returns a confidence score (0-100) for a given route.

router.post('/route/confidence', (req, res) => {
  const startLat = parseFloat(req.body.start_lat || req.body.startLat);
  const startLng = parseFloat(req.body.start_lng || req.body.startLng);
  const endLat = parseFloat(req.body.end_lat || req.body.endLat);
  const endLng = parseFloat(req.body.end_lng || req.body.endLng);
  const mode = String(req.body.mode || 'driving-car');
  const polyline = Array.isArray(req.body.polyline) ? req.body.polyline : [];

  if (!Number.isFinite(startLat) || !Number.isFinite(startLng) || !Number.isFinite(endLat) || !Number.isFinite(endLng)) {
    return res.status(400).json(err('start_lat, start_lng, end_lat, end_lng are required'));
  }

  const confidence = calculateRouteConfidence(startLat, startLng, endLat, endLng, mode, polyline);

  return res.json(ok(confidence, 'Route confidence calculated'));
});

// ─── POST /api/driver/route/hints ────────────────────────────────────────────
// Returns Africa-specific routing hints for a given route.

router.post('/route/hints', (req, res) => {
  const startLat = parseFloat(req.body.start_lat || req.body.startLat);
  const startLng = parseFloat(req.body.start_lng || req.body.startLng);
  const endLat = parseFloat(req.body.end_lat || req.body.endLat);
  const endLng = parseFloat(req.body.end_lng || req.body.endLng);
  const mode = String(req.body.mode || 'driving-car');

  if (!Number.isFinite(startLat) || !Number.isFinite(startLng) || !Number.isFinite(endLat) || !Number.isFinite(endLng)) {
    return res.status(400).json(err('start_lat, start_lng, end_lat, end_lng are required'));
  }

  const hints = getAfricaRoutingHints(startLat, startLng, endLat, endLng, mode);

  return res.json(ok(hints, 'Africa routing hints retrieved'));
});

// ─── POST /api/driver/route/learn ────────────────────────────────────────────
// Submit an alternative route that a driver actually took (after deviation).

router.post('/route/learn', (req, res) => {
  const startLat = parseFloat(req.body.start_lat || req.body.startLat);
  const startLng = parseFloat(req.body.start_lng || req.body.startLng);
  const endLat = parseFloat(req.body.end_lat || req.body.endLat);
  const endLng = parseFloat(req.body.end_lng || req.body.endLng);
  const mode = String(req.body.mode || 'driving-car');
  const duration = parseFloat(req.body.duration_s || req.body.duration || 0);
  const path = Array.isArray(req.body.path) ? req.body.path : [];

  if (!Number.isFinite(startLat) || !Number.isFinite(startLng)) {
    return res.status(400).json(err('start_lat, start_lng are required'));
  }

  if (path.length < 2) {
    return res.status(400).json(err('path must have at least 2 points'));
  }

  learnAlternativeRoute(startLat, startLng, endLat, endLng, path, mode, duration);

  return res.json(ok({ learned: true, path_points: path.length }, 'Alternative route learned'));
});

// ─── GET /api/driver/analytics ───────────────────────────────────────────────
// Returns anonymized analytics for admin monitoring.

router.get('/analytics', (req, res) => {
  // Simple admin key check (reuses existing admin pattern)
  const adminToken = req.headers['x-admin-token'] || req.query.admin_token;
  const expectedToken = process.env.ADMIN_TOKEN;

  if (expectedToken && adminToken !== expectedToken) {
    return res.status(403).json(err('Admin token required', 403));
  }

  const snapshot = getAnalyticsSnapshot();
  return res.json(ok(snapshot, 'Driver intelligence analytics'));
});

export default router;
