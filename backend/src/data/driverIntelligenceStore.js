/**
 * driverIntelligenceStore.js
 * ─────────────────────────────────────────────────────────────────────────────
 * In-memory store for anonymous driver intelligence data.
 * Collects: route segments, speeds, stops, deviations, Africa-specific patterns.
 * Used for: route confidence scoring, adaptive routing, local pattern learning.
 *
 * Data is stored anonymously — no PII is collected.
 * Each session is identified by a random session_id generated on the frontend.
 */

// ─── Route Segment Intelligence ───────────────────────────────────────────────
// Maps "lat1,lng1→lat2,lng2" segment keys to speed/reliability stats
const segmentStats = new Map();

// ─── Route Path Intelligence ──────────────────────────────────────────────────
// Maps "startKey→endKey" to array of historical route variants
const routeHistory = new Map();

// ─── Session Feedback Store ───────────────────────────────────────────────────
// Short-lived per-session data (cleaned up after 2 hours)
const activeSessions = new Map();

// ─── Africa-specific road reliability scores ──────────────────────────────────
// Pre-seeded based on known road quality patterns in major African cities
const africanRoadPatterns = {
  // Lagos major arteries — high reliability
  'VI': { reliability: 0.92, commonMode: 'driving-car', congestionFactor: 1.4 },
  'Lekki': { reliability: 0.88, commonMode: 'driving-car', congestionFactor: 1.3 },
  'Ikeja': { reliability: 0.85, commonMode: 'driving-car', congestionFactor: 1.5 },
  'Ikorodu': { reliability: 0.75, commonMode: 'motorcycle', congestionFactor: 1.6 },
  'Agege': { reliability: 0.72, commonMode: 'motorcycle', congestionFactor: 1.7 },
  'Oshodi': { reliability: 0.70, commonMode: 'motorcycle', congestionFactor: 1.8 },
  // Defaults
  'default': { reliability: 0.78, commonMode: 'driving-car', congestionFactor: 1.3 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function segmentKey(lat1, lng1, lat2, lng2) {
  // Round to ~110m grid to cluster nearby segments
  const r = v => Math.round(v * 1000) / 1000;
  return `${r(lat1)},${r(lng1)}→${r(lat2)},${r(lng2)}`;
}

function routeKey(startLat, startLng, endLat, endLng) {
  const r = v => Math.round(v * 100) / 100; // ~1km grid for route keys
  return `${r(startLat)},${r(startLng)}→${r(endLat)},${r(endLng)}`;
}

function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const dφ = (lat2 - lat1) * Math.PI / 180;
  const dλ = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(dλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function now() { return Date.now(); }

// ─── Session Management ───────────────────────────────────────────────────────

export function startSession(sessionId, startLat, startLng, endLat, endLng, mode) {
  activeSessions.set(sessionId, {
    sessionId,
    startLat, startLng, endLat, endLng, mode,
    startTime: now(),
    positions: [],      // [{lat, lng, ts, speed_mps}]
    stops: [],          // [{lat, lng, duration_s}]
    deviations: [],     // [{lat, lng, expected_lat, expected_lng, ts}]
    totalDistance: 0,
    completed: false,
    cancelled: false,
  });
}

export function recordPosition(sessionId, lat, lng, speedMps = null) {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  const prev = session.positions[session.positions.length - 1];
  const ts = now();

  // Calculate speed from position delta if not provided
  let speed = speedMps;
  if (speed === null && prev) {
    const dist = haversineM(prev.lat, prev.lng, lat, lng);
    const dt = (ts - prev.ts) / 1000;
    speed = dt > 0 ? dist / dt : 0;
  }

  // Detect stop (< 0.5 m/s = stationary)
  if (speed !== null && speed < 0.5 && prev) {
    const lastStop = session.stops[session.stops.length - 1];
    if (lastStop && (ts - lastStop.ts) < 10000) {
      lastStop.duration_s = (ts - lastStop.ts) / 1000;
    } else {
      session.stops.push({ lat, lng, ts, duration_s: 0 });
    }
  }

  // Record segment stats
  if (prev && speed !== null && speed > 0.3) {
    const key = segmentKey(prev.lat, prev.lng, lat, lng);
    const existing = segmentStats.get(key) || { count: 0, totalSpeed: 0, avgSpeed: 0, lastUsed: ts };
    existing.count++;
    existing.totalSpeed += speed;
    existing.avgSpeed = existing.totalSpeed / existing.count;
    existing.lastUsed = ts;
    segmentStats.set(key, existing);

    const dist = haversineM(prev.lat, prev.lng, lat, lng);
    session.totalDistance += dist;
  }

  session.positions.push({ lat, lng, ts, speed });
}

export function recordDeviation(sessionId, driverLat, driverLng, routeLat, routeLng) {
  const session = activeSessions.get(sessionId);
  if (!session) return;
  session.deviations.push({
    lat: driverLat, lng: driverLng,
    expected_lat: routeLat, expected_lng: routeLng,
    ts: now(),
  });
}

export function completeSession(sessionId, reason = 'arrived') {
  const session = activeSessions.get(sessionId);
  if (!session) return;

  const duration = (now() - session.startTime) / 1000;
  session.completed = reason === 'arrived';
  session.cancelled = reason === 'cancelled';
  session.duration_s = duration;

  // Record the full route for future path learning
  if (session.positions.length >= 2) {
    const key = routeKey(session.startLat, session.startLng, session.endLat, session.endLng);
    const history = routeHistory.get(key) || [];

    const avgSpeed = session.positions
      .filter(p => p.speed !== null && p.speed > 0.3)
      .reduce((sum, p, _, arr) => sum + p.speed / arr.length, 0);

    history.push({
      timestamp: session.startTime,
      duration_s: duration,
      total_distance_m: session.totalDistance,
      avg_speed_mps: avgSpeed,
      stop_count: session.stops.length,
      deviation_count: session.deviations.length,
      mode: session.mode,
      completed: session.completed,
      path: session.positions.map(p => [p.lat, p.lng]), // compressed path
    });

    // Keep last 100 sessions per route pair
    if (history.length > 100) history.shift();
    routeHistory.set(key, history);
  }

  // Clean up active session after recording
  setTimeout(() => activeSessions.delete(sessionId), 7200000); // 2hr TTL
}

// ─── Route Confidence Scoring ─────────────────────────────────────────────────

export function calculateRouteConfidence(startLat, startLng, endLat, endLng, mode, routePolyline = []) {
  const key = routeKey(startLat, startLng, endLat, endLng);
  const history = routeHistory.get(key) || [];

  let score = 60; // Base confidence
  const factors = {};

  // 1. Historical usage factor (up to +20)
  const successfulTrips = history.filter(h => h.completed && h.mode === mode);
  if (successfulTrips.length >= 10) {
    score += 20;
    factors.historical_usage = 'high';
  } else if (successfulTrips.length >= 3) {
    score += 12;
    factors.historical_usage = 'medium';
  } else if (successfulTrips.length >= 1) {
    score += 5;
    factors.historical_usage = 'low';
  } else {
    factors.historical_usage = 'none';
  }

  // 2. Speed consistency factor (up to +10)
  if (successfulTrips.length >= 2) {
    const speeds = successfulTrips.map(t => t.avg_speed_mps).filter(Boolean);
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const variance = speeds.reduce((sum, s) => sum + (s - avgSpeed) ** 2, 0) / speeds.length;
    const cv = Math.sqrt(variance) / (avgSpeed || 1); // coefficient of variation
    if (cv < 0.2) { score += 10; factors.speed_consistency = 'excellent'; }
    else if (cv < 0.4) { score += 6; factors.speed_consistency = 'good'; }
    else { score += 2; factors.speed_consistency = 'variable'; }
  }

  // 3. Deviation rate factor (up to +5)
  if (history.length >= 3) {
    const avgDeviations = history.reduce((sum, h) => sum + (h.deviation_count || 0), 0) / history.length;
    if (avgDeviations < 0.5) { score += 5; factors.deviation_rate = 'low'; }
    else if (avgDeviations < 2) { score += 2; factors.deviation_rate = 'medium'; }
    else { factors.deviation_rate = 'high'; }
  }

  // 4. Road segment reliability from segment stats
  let segmentBonus = 0;
  let segmentCount = 0;
  for (let i = 0; i < routePolyline.length - 1; i++) {
    const [lat1, lng1] = routePolyline[i];
    const [lat2, lng2] = routePolyline[i + 1];
    const key2 = segmentKey(lat1, lng1, lat2, lng2);
    const stats = segmentStats.get(key2);
    if (stats && stats.count >= 3) {
      segmentBonus += Math.min(stats.count / 20, 1); // normalize
      segmentCount++;
    }
  }
  if (segmentCount > 0) {
    const avgBonus = (segmentBonus / segmentCount) * 5;
    score += avgBonus;
    factors.road_reliability = segmentCount > 5 ? 'high' : 'medium';
  }

  // 5. Mode-appropriate scoring
  if (mode === 'motorcycle' || mode === 'bike') {
    score += 3; // Motorcycles generally have more route flexibility in Africa
    factors.mode_bonus = 'applied';
  }

  // 6. Recency bonus — recent data is more trustworthy
  const recentTrips = history.filter(h => (now() - h.timestamp) < 7 * 24 * 60 * 60 * 1000); // last 7 days
  if (recentTrips.length >= 3) {
    score += 5;
    factors.recency = 'recent';
  }

  const finalScore = Math.min(Math.max(Math.round(score), 30), 99);

  return {
    score: finalScore,
    label: finalScore >= 85 ? 'Very High' : finalScore >= 70 ? 'High' : finalScore >= 55 ? 'Medium' : 'Low',
    color: finalScore >= 85 ? '#10b981' : finalScore >= 70 ? '#22c55e' : finalScore >= 55 ? '#f59e0b' : '#ef4444',
    factors,
    historical_trips: history.length,
    recent_trips: recentTrips.length,
  };
}

// ─── Africa-specific Route Suggestions ───────────────────────────────────────

export function getAfricaRoutingHints(startLat, startLng, endLat, endLng, mode) {
  const key = routeKey(startLat, startLng, endLat, endLng);
  const history = routeHistory.get(key) || [];

  // Find the most successful route by mode preference
  const modeHistory = history.filter(h => h.completed && h.mode === mode);
  const bestTrip = modeHistory.sort((a, b) => a.duration_s - b.duration_s)[0];

  // Determine if motorcycle is a better option based on local patterns
  const carTrips = history.filter(h => h.completed && h.mode === 'driving-car');
  const motoTrips = history.filter(h => h.completed && h.mode === 'motorcycle');

  let modeRecommendation = null;
  if (carTrips.length >= 3 && motoTrips.length >= 3) {
    const avgCarTime = carTrips.reduce((s, t) => s + t.duration_s, 0) / carTrips.length;
    const avgMotoTime = motoTrips.reduce((s, t) => s + t.duration_s, 0) / motoTrips.length;
    if (avgMotoTime < avgCarTime * 0.7 && mode === 'driving-car') {
      modeRecommendation = {
        suggestion: 'motorcycle',
        reason: `Motorcycles are ${Math.round((1 - avgMotoTime/avgCarTime) * 100)}% faster on this route based on driver data`,
      };
    }
  }

  // Time of day hints
  const hour = new Date().getHours();
  let trafficHint = null;
  if (hour >= 7 && hour <= 9) trafficHint = 'Morning rush hour detected. Expect 20-40% longer travel time.';
  else if (hour >= 17 && hour <= 20) trafficHint = 'Evening rush hour detected. Expect heavy traffic.';
  else if (hour >= 22 || hour <= 5) trafficHint = 'Night driving. Roads are clearer but exercise caution.';

  return {
    best_path: bestTrip?.path || null,
    mode_recommendation: modeRecommendation,
    traffic_hint: trafficHint,
    africa_optimized: true,
    data_points: history.length,
  };
}

// ─── Learning: Record driver-preferred route after deviation ──────────────────

export function learnAlternativeRoute(startLat, startLng, endLat, endLng, actualPath, mode, duration) {
  const key = routeKey(startLat, startLng, endLat, endLng);
  const history = routeHistory.get(key) || [];

  // If the driver completed a deviation route successfully, record it
  if (actualPath && actualPath.length >= 2) {
    history.push({
      timestamp: now(),
      duration_s: duration,
      total_distance_m: 0, // estimated
      avg_speed_mps: 0,
      stop_count: 0,
      deviation_count: 0,
      mode,
      completed: true,
      path: actualPath,
      source: 'learned_deviation',
    });

    if (history.length > 100) history.shift();
    routeHistory.set(key, history);

    // Also record segment popularity
    for (let i = 0; i < actualPath.length - 1; i++) {
      const [lat1, lng1] = actualPath[i];
      const [lat2, lng2] = actualPath[i + 1];
      const segKey = segmentKey(lat1, lng1, lat2, lng2);
      const existing = segmentStats.get(segKey) || { count: 0, totalSpeed: 0, avgSpeed: 0, lastUsed: now() };
      existing.count++;
      existing.lastUsed = now();
      segmentStats.set(segKey, existing);
    }
  }
}

// ─── Analytics snapshot (for admin dashboard) ─────────────────────────────────

export function getAnalyticsSnapshot() {
  const totalSessions = [...activeSessions.values()].length;
  const totalRoutes = routeHistory.size;
  const totalSegments = segmentStats.size;
  const totalTrips = [...routeHistory.values()].reduce((sum, h) => sum + h.length, 0);

  const allTrips = [...routeHistory.values()].flat();
  const completedTrips = allTrips.filter(t => t.completed);
  const avgDuration = completedTrips.length
    ? completedTrips.reduce((s, t) => s + t.duration_s, 0) / completedTrips.length
    : 0;

  return {
    active_sessions: totalSessions,
    unique_routes_learned: totalRoutes,
    road_segments_mapped: totalSegments,
    total_trips_recorded: totalTrips,
    completion_rate: allTrips.length ? Math.round((completedTrips.length / allTrips.length) * 100) : 0,
    avg_trip_duration_minutes: Math.round(avgDuration / 60),
    last_updated: new Date().toISOString(),
  };
}
