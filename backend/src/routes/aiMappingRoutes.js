/**
 * AI Mapping Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Exposes the backend AI building detection, address resolution, bulk geocoding,
 * and routing engine endpoints.
 *
 * Mounted at: /api
 *
 * Endpoints
 * ─────────
 *  GET  /api/resolve/:ppooint_code          – resolve code → coordinates
 *  GET  /api/buildings/detect               – detect buildings near a point
 *  GET  /api/buildings/tile                 – detect buildings in a tile
 *  POST /api/bulk/resolve                   – bulk geocode text addresses
 *  POST /api/route                          – calculate a driving route
 *  GET  /api/intelligence/:ppooint_code     – full address intelligence report
 *  POST /api/buildings/:id/auto-code        – assign PPOINNT code to a detected building
 *  GET  /api/landmarks                      – list nearby landmarks
 *  POST /api/landmarks                      – suggest a new landmark
 *  POST /api/snap                           – snap GPS coordinates to road
 */

import express from 'express';
import AddressService from '../services/addressService.js';
import { detectBuilding, detectBuildingsInTile, suggestEntrance } from '../services/aiBuildingDetectionService.js';
import { reverseGeocodeLocation } from '../services/reverseGeocodingService.js';
import { enrichLocationWithOsmData } from '../services/osmAddressingService.js';
import Road from '../models/Road.js';
import Landmark from '../models/Landmark.js';

const router = express.Router();

const ok = (data, message = 'OK') => ({ status: 'success', success: true, message, data });
const err = (message, code = 400) => ({ status: 'error', success: false, message, code });

// ─── Performance header ───────────────────────────────────────────────────────

router.use((req, res, next) => {
  res.set('X-PPOINNT-API', '1.0');
  res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
  next();
});

// ─── GET /api/resolve/:ppooint_code ──────────────────────────────────────────
// High-performance address resolution API for logistics companies.
// Target: < 200ms response time using in-memory lookup first.

router.get('/resolve/:ppooint_code', async (req, res) => {
  const start = Date.now();
  const code = String(req.params.ppooint_code || '').trim().toUpperCase();

  if (!code) {
    return res.status(400).json(err('PPOINNT code is required'));
  }

  try {
    const address = await AddressService.getAddressInfo(code);
    const elapsed = Date.now() - start;

    return res.set('X-Response-Time', `${elapsed}ms`).json(ok({
      ppooint_code: address.ppoint_code || address.code,
      latitude: address.latitude,
      longitude: address.longitude,
      coordinates: `${address.latitude},${address.longitude}`,
      place_type: address.place_type || null,
      display_place_type: address.display_place_type || null,
      building_name: address.building_name || null,
      city: address.city,
      state: address.state,
      country: address.country,
      confidence_score: address.confidence_score || 0,
      entrance_latitude: address.entrance_latitude || null,
      entrance_longitude: address.entrance_longitude || null,
      entrance_label: address.entrance_label || null,
      navigation_points: address.navigation_points || [],
      map_link: `https://maps.google.com/?q=${address.latitude},${address.longitude}`,
      share_url: `${process.env.PUBLIC_APP_URL || 'https://ppoint.online'}/${code}`,
      response_time_ms: elapsed,
    }, 'PPOINNT code resolved'));
  } catch (error) {
    return res.status(404).json(err(`PPOINNT code not found: ${code}`, 404));
  }
});

// ─── GET /api/buildings/detect ────────────────────────────────────────────────
// Single point building detection — returns footprint + entrances.

router.get('/buildings/detect', async (req, res) => {
  const lat = parseFloat(req.query.lat || req.query.latitude);
  const lng = parseFloat(req.query.lng || req.query.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json(err('lat and lng query parameters are required'));
  }

  try {
    const [building, geocoding] = await Promise.all([
      Promise.resolve(detectBuilding(lat, lng)),
      reverseGeocodeLocation(lat, lng).catch(() => null),
    ]);

    return res.json(ok({
      ...building,
      geocoding: geocoding
        ? {
            street_name: geocoding.streetName || null,
            community_name: geocoding.communityName || null,
            city: geocoding.city || null,
            state: geocoding.state || null,
            country: geocoding.country || null,
          }
        : null,
    }, 'Building detected'));
  } catch (error) {
    return res.status(400).json(err(error.message));
  }
});

// ─── GET /api/buildings/tile ──────────────────────────────────────────────────
// Satellite tile ingestion — detect buildings in a bounding box.

router.get('/buildings/tile', async (req, res) => {
  const minLat = parseFloat(req.query.min_lat || req.query.minLat);
  const maxLat = parseFloat(req.query.max_lat || req.query.maxLat);
  const minLng = parseFloat(req.query.min_lng || req.query.minLng);
  const maxLng = parseFloat(req.query.max_lng || req.query.maxLng);
  const limit = Math.min(parseInt(req.query.limit || '20', 10), 50);

  if (!Number.isFinite(minLat) || !Number.isFinite(maxLat) || !Number.isFinite(minLng) || !Number.isFinite(maxLng)) {
    return res.status(400).json(err('min_lat, max_lat, min_lng, max_lng are required'));
  }

  try {
    const result = detectBuildingsInTile({ minLat, maxLat, minLng, maxLng }, { limit });
    return res.json(ok(result, `Detected ${result.building_count} buildings in tile`));
  } catch (error) {
    return res.status(400).json(err(error.message));
  }
});

// ─── POST /api/buildings/:id/auto-code ───────────────────────────────────────
// Assign a PPOINNT code to a detected building automatically.

router.post('/buildings/:id/auto-code', async (req, res) => {
  const lat = parseFloat(req.body.latitude || req.body.lat);
  const lng = parseFloat(req.body.longitude || req.body.lng);
  const buildingId = String(req.params.id || '').trim();

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json(err('latitude and longitude are required'));
  }

  try {
    const detection = detectBuilding(lat, lng, {
      buildingType: req.body.building_type || req.body.buildingType || null,
    });

    const address = await AddressService.generateAddress(lat, lng, {
      placeType: req.body.place_type || req.body.placeType || 'Other',
      buildingPolygonId: buildingId || detection.building_id,
      entranceLabel: detection.main_entrance.label,
      entranceLatitude: detection.main_entrance.latitude,
      entranceLongitude: detection.main_entrance.longitude,
      autoGeneratedFlag: true,
      moderationStatus: 'active',
      addressType: 'ai_detected',
      createdBy: 'AI Pipeline',
      createdSource: 'ai_building_detection',
    });

    return res.status(201).json(ok({
      ppooint_code: address.ppoint_code || address.code,
      building_id: buildingId || detection.building_id,
      latitude: lat,
      longitude: lng,
      building_polygon: detection.building_polygon,
      confidence_score: detection.confidence_score,
      entrances: detection.entrances,
      address,
    }, 'PPOINNT code automatically assigned to building'));
  } catch (error) {
    return res.status(400).json(err(error.message));
  }
});

// ─── POST /api/bulk/resolve ───────────────────────────────────────────────────
// Bulk address conversion for logistics companies.

router.post('/bulk/resolve', async (req, res) => {
  const addresses = Array.isArray(req.body.addresses) ? req.body.addresses : [];
  const codes = Array.isArray(req.body.codes) ? req.body.codes : [];

  if (!addresses.length && !codes.length) {
    return res.status(400).json(err('Provide either addresses (text) or codes (PPOINNT codes) array'));
  }

  const limit = Math.min(addresses.length + codes.length, 50);
  const results = [];

  // Resolve PPOINNT codes directly
  for (const code of codes.slice(0, limit)) {
    try {
      const address = await AddressService.getAddressInfo(String(code).trim().toUpperCase());
      results.push({
        input: code,
        type: 'ppooint_code',
        success: true,
        ppooint_code: address.ppoint_code || address.code,
        latitude: address.latitude,
        longitude: address.longitude,
        city: address.city,
        state: address.state,
        country: address.country,
        place_type: address.place_type,
        confidence_score: address.confidence_score || 0,
        building_name: address.building_name || null,
        entrance_latitude: address.entrance_latitude || null,
        entrance_longitude: address.entrance_longitude || null,
      });
    } catch {
      results.push({ input: code, type: 'ppooint_code', success: false, error: 'Code not found' });
    }
  }

  // Geocode text addresses (using OpenStreetMap Nominatim)
  for (const textAddr of addresses.slice(0, limit - results.length)) {
    try {
      const encoded = encodeURIComponent(String(textAddr));
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=ng,gh,ke,za,tz,eg,et,ci`;
      
      const response = await fetch(nominatimUrl, {
        headers: { 'User-Agent': 'PPOINNT-Platform/1.0 (https://ppoint.online)' },
      }).then(r => r.json()).catch(() => []);

      if (response.length > 0) {
        const loc = response[0];
        const lat = parseFloat(loc.lat);
        const lng = parseFloat(loc.lon);

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          try {
            const address = await AddressService.generateAddress(lat, lng, {
              autoGeneratedFlag: true,
              moderationStatus: 'active',
              createdBy: 'Bulk API',
              createdSource: 'bulk_geocode',
            });
            results.push({
              input: textAddr,
              type: 'text_address',
              success: true,
              geocoded_name: loc.display_name,
              ppooint_code: address.ppoint_code || address.code,
              latitude: lat,
              longitude: lng,
              city: address.city,
              state: address.state,
              country: address.country,
              confidence_score: address.confidence_score || 0,
            });
          } catch (genErr) {
            results.push({ input: textAddr, type: 'text_address', success: true, geocoded_name: loc.display_name, latitude: lat, longitude: lng, ppooint_code: null, error: genErr.message });
          }
        } else {
          results.push({ input: textAddr, type: 'text_address', success: false, error: 'Invalid coordinates from geocoder' });
        }
      } else {
        results.push({ input: textAddr, type: 'text_address', success: false, error: 'Address not found by geocoder' });
      }
    } catch (geocodeErr) {
      results.push({ input: textAddr, type: 'text_address', success: false, error: 'Geocoding failed' });
    }
  }

  const successful = results.filter(r => r.success).length;
  return res.json(ok({
    total: results.length,
    successful,
    failed: results.length - successful,
    results,
  }, `Bulk resolved ${successful}/${results.length} addresses`));
});

// ─── GET /api/intelligence/:ppooint_code ──────────────────────────────────────
// Full address intelligence report for logistics + developer integrations.

router.get('/intelligence/:ppooint_code', async (req, res) => {
  const code = String(req.params.ppooint_code || '').trim().toUpperCase();

  if (!code) {
    return res.status(400).json(err('PPOINNT code is required'));
  }

  try {
    const address = await AddressService.getAddressInfo(code);
    const lat = Number(address.latitude);
    const lng = Number(address.longitude);

    // Enrich with live detection data
    const [osmData, buildingDetection] = await Promise.all([
      enrichLocationWithOsmData(lat, lng).catch(() => null),
      Promise.resolve(detectBuilding(lat, lng, {
        streetName: address.street_name,
        communityName: address.community_name,
      })),
    ]);

    const entranceSuggestion = suggestEntrance(lat, lng, address.street_name);

    return res.json(ok({
      ppooint_code: address.ppoint_code || address.code,
      coordinates: { latitude: lat, longitude: lng },
      place_info: {
        place_type: address.place_type,
        building_name: address.building_name,
        house_number: address.house_number,
        landmark: address.landmark,
      },
      location: {
        city: address.city,
        state: address.state,
        country: address.country,
        street_name: address.street_name,
        community_name: address.community_name,
      },
      confidence: {
        score: address.confidence_score || 0,
        level: address.confidence_level || 'medium',
        guidance: address.confidence_guidance || '',
        breakdown: address.confidence_breakdown || {},
      },
      ai_building_detection: {
        building_id: buildingDetection.building_id,
        building_polygon: buildingDetection.building_polygon,
        estimated_area_sqm: buildingDetection.estimated_area_sqm,
        building_orientation_deg: buildingDetection.building_orientation_deg,
        detection_confidence: buildingDetection.confidence_score,
      },
      entrances: {
        stored: address.entrance_latitude ? [{
          type: 'main entrance',
          label: address.entrance_label || 'Main Entrance',
          latitude: address.entrance_latitude,
          longitude: address.entrance_longitude,
        }] : [],
        suggested: entranceSuggestion.entrances,
        navigation_points: address.navigation_points || [],
      },
      osm_data: osmData ? {
        street_name: osmData.streetName,
        road_type: osmData.metadata?.road_type || null,
        building_detected: osmData.metadata?.building_detected || false,
        navigation_points: osmData.navigationPoints || [],
      } : null,
      share: {
        url: `${process.env.PUBLIC_APP_URL || 'https://ppoint.online'}/${code}`,
        whatsapp_message: `My PPOINNT delivery address:\n\n${code}\n${address.building_name || address.community_name || ''}, ${address.city} ${address.state}\n\nOpen location:\n${process.env.PUBLIC_APP_URL || 'https://ppoint.online'}/${code}`,
        map_link: `https://maps.google.com/?q=${lat},${lng}`,
      },
    }, 'Address intelligence report'));
  } catch (error) {
    return res.status(404).json(err(error.message, 404));
  }
});

// ─── POST /api/route (enhanced) ───────────────────────────────────────────────
// Routing engine — supports OSRM (free) with ORS fallback.
// Returns polyline + distance + duration + turn-by-turn steps.

router.post('/route', async (req, res) => {
  const startLat = parseFloat(req.body.start_lat || req.body.startLat);
  const startLng = parseFloat(req.body.start_lng || req.body.startLng);
  const endLat = parseFloat(req.body.end_lat || req.body.endLat);
  const endLng = parseFloat(req.body.end_lng || req.body.endLng);
  const mode = String(req.body.mode || req.body.transport_mode || 'driving-car').toLowerCase();

  if (!Number.isFinite(startLat) || !Number.isFinite(startLng) || !Number.isFinite(endLat) || !Number.isFinite(endLng)) {
    return res.status(400).json(err('start_lat, start_lng, end_lat, end_lng are required'));
  }

  // Map transport mode to OSRM profile
  const osrmProfiles = {
    'driving': 'car',
    'driving-car': 'car',
    'car': 'car',
    'motorcycle': 'car',
    'walking': 'foot',
    'foot': 'foot',
    'cycling': 'bike',
    'bike': 'bike',
    'public-transport': 'car',
    'transit': 'car',
  };
  const osrmProfile = osrmProfiles[mode] || 'car';

  // Try OSRM public demo (free, Africa-capable)
  const osrmUrl = `https://router.project-osrm.org/route/v1/${osrmProfile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true&annotations=false`;

  try {
    const response = await fetch(osrmUrl, {
      headers: { 'User-Agent': 'PPOINNT-Platform/1.0' },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) throw new Error(`OSRM returned ${response.status}`);
    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes?.length) {
      throw new Error('No route found by routing engine');
    }

    const route = data.routes[0];
    const coords = route.geometry.coordinates.map(([lng2, lat2]) => [lat2, lng2]);
    const distanceM = route.distance;
    const durationS = route.duration;

    // Fetch landmarks near the route for instruction enrichment
    const nearbyLandmarks = await Landmark.findNearby(endLat, endLng, 1000);

    // Extract turn-by-turn steps
    const steps = [];
    for (const leg of route.legs || []) {
      for (const step of leg.steps || []) {
        const maneuver = step.maneuver || {};
        const stepLat = maneuver.location ? maneuver.location[1] : null;
        const stepLng = maneuver.location ? maneuver.location[0] : null;
        
        let instruction = step.name
          ? `${formatManeuver(maneuver.type, maneuver.modifier)} onto ${step.name}`
          : formatManeuver(maneuver.type, maneuver.modifier);

        // Landmark enrichment
        if (stepLat && stepLng) {
          const closeLandmark = nearbyLandmarks.find(l => {
            const d = calculateDistance(stepLat, stepLng, l.latitude, l.longitude);
            return d < 50; // Landmark within 50m of turn
          });
          if (closeLandmark) {
            instruction += ` (after ${closeLandmark.name})`;
          }
        }

        steps.push({
          instruction,
          maneuver_type: maneuver.type || 'turn',
          maneuver_modifier: maneuver.modifier || null,
          distance: step.distance,
          duration: step.duration,
          name: step.name || null,
          mode: step.mode || osrmProfile,
          location: maneuver.location ? [maneuver.location[1], maneuver.location[0]] : null,
        });
      }
    }

    return res.json(ok({
      polyline: coords,
      distance: distanceM,
      duration: durationS,
      distance_km: +(distanceM / 1000).toFixed(2),
      duration_minutes: +(durationS / 60).toFixed(1),
      estimated_arrival: new Date(Date.now() + durationS * 1000).toISOString(),
      transport_mode: mode,
      steps,
      source: 'osrm',
    }, 'Route calculated'));
  } catch (osrmError) {
    // Fallback to OpenRouteService if API key is configured
    const orsKey = process.env.OPENROUTESERVICE_API_KEY;
    if (orsKey) {
      try {
        const orsProfile = mode.includes('walk') || mode === 'foot' ? 'foot-walking' : 'driving-car';
        const orsUrl = `https://api.openrouteservice.org/v2/directions/${orsProfile}`;
        const orsResponse = await fetch(orsUrl, {
          method: 'POST',
          headers: {
            Authorization: orsKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            coordinates: [[startLng, startLat], [endLng, endLat]],
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (!orsResponse.ok) throw new Error(`ORS returned ${orsResponse.status}`);
        const orsData = await orsResponse.json();
        const feature = orsData.features?.[0];
        if (!feature) throw new Error('No route from ORS');

        const coords = feature.geometry.coordinates.map(([lng2, lat2]) => [lat2, lng2]);
        const summary = feature.properties.summary;
        const orsSteps = feature.properties.segments?.[0]?.steps?.map(s => ({
          instruction: s.instruction,
          distance: s.distance,
          duration: s.duration,
          name: s.name || null,
          maneuver_type: 'turn',
          maneuver_modifier: null,
          mode,
        })) || [];

        return res.json(ok({
          polyline: coords,
          distance: summary.distance,
          duration: summary.duration,
          distance_km: +(summary.distance / 1000).toFixed(2),
          duration_minutes: +(summary.duration / 60).toFixed(1),
          estimated_arrival: new Date(Date.now() + summary.duration * 1000).toISOString(),
          transport_mode: mode,
          steps: orsSteps,
          source: 'openrouteservice',
        }, 'Route calculated'));
      } catch {
        // fall through to synthetic route
      }
    }

    // Last resort: synthetic straight-line route estimate
    return res.json(ok(syntheticRoute(startLat, startLng, endLat, endLng, mode), 'Estimated route (straight-line, routing engine unavailable)'));
  }
});

// ─── POST /api/snap ──────────────────────────────────────────────────────────
// Snap GPS coordinates to nearest road segment (Map Matching)

router.post('/snap', async (req, res) => {
  const lat = parseFloat(req.body.latitude || req.body.lat);
  const lng = parseFloat(req.body.longitude || req.body.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json(err('latitude and longitude are required'));
  }

  try {
    const snapped = await Road.findNearest(lat, lng, 100);
    if (!snapped) {
      return res.json(ok({ latitude: lat, longitude: lng, snapped: false }, 'No road found nearby to snap.'));
    }

    return res.json(ok({
      latitude: snapped.snappedPoint ? snapped.snappedPoint[0] : snapped.latitude || lat,
      longitude: snapped.snappedPoint ? snapped.snappedPoint[1] : snapped.longitude || lng,
      road_name: snapped.road?.road_name || snapped.road_name || 'Unknown Road',
      snapped: true,
      distance: snapped.distance || 0,
    }, 'Position snapped to road'));
  } catch (error) {
    return res.status(500).json(err(error.message));
  }
});

// ─── GET /api/landmarks ──────────────────────────────────────────────────────
// List landmarks near a point

router.get('/landmarks', async (req, res) => {
  const lat = parseFloat(req.query.lat || req.query.latitude);
  const lng = parseFloat(req.query.lng || req.query.longitude);
  const radius = parseInt(req.query.radius || '1000', 10);

  try {
    const data = (lat && lng) ? await Landmark.findNearby(lat, lng, radius) : await Landmark.list();
    return res.json(ok(data, 'Landmarks loaded'));
  } catch (error) {
    return res.status(500).json(err(error.message));
  }
});

// ─── POST /api/landmarks ─────────────────────────────────────────────────────
// Suggest or import a new landmark

router.post('/landmarks', async (req, res) => {
  try {
    const data = await Landmark.create(req.body);
    return res.status(201).json(ok(data, 'Landmark added successfully'));
  } catch (error) {
    return res.status(400).json(err(error.message));
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatManeuver(type, modifier) {
  const m = modifier ? `${modifier} ` : '';
  switch (type) {
    case 'depart': return 'Head towards destination';
    case 'arrive': return 'You have arrived at your destination';
    case 'turn': return `Turn ${m}`.trim();
    case 'continue': return `Continue ${m}`.trim();
    case 'roundabout': return `At the roundabout, take ${modifier || 'the next exit'}`;
    case 'merge': return `Merge ${m}`.trim();
    case 'on ramp': return `Take the ramp ${m}`.trim();
    case 'off ramp': return `Take the exit ${m}`.trim();
    case 'fork': return `Keep ${modifier || 'straight'} at the fork`;
    case 'end of road': return `Turn ${modifier || 'right'} at the end of the road`;
    case 'use lane': return `Use the ${modifier || 'correct'} lane`;
    case 'rotary': return `Enter the roundabout`;
    default: return type ? `${type} ${m}`.trim() : 'Continue';
  }
}

function syntheticRoute(lat1, lng1, lat2, lng2, mode) {
  const earthRadius = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const distanceM = earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const speedMs = mode.includes('walk') ? 1.4 : mode.includes('bike') ? 4.5 : 10;
  const durationS = distanceM / speedMs;

  const steps = [
    { instruction: 'Head towards destination', distance: distanceM * 0.4, duration: durationS * 0.4, maneuver_type: 'depart' },
    { instruction: 'Continue straight', distance: distanceM * 0.4, duration: durationS * 0.4, maneuver_type: 'continue' },
    { instruction: 'You have arrived at your destination', distance: distanceM * 0.2, duration: durationS * 0.2, maneuver_type: 'arrive' },
  ];

  return {
    polyline: [[lat1, lng1], [(lat1 + lat2) / 2, (lng1 + lng2) / 2], [lat2, lng2]],
    distance: Math.round(distanceM),
    duration: Math.round(durationS),
    distance_km: +(distanceM / 1000).toFixed(2),
    duration_minutes: +(durationS / 60).toFixed(1),
    estimated_arrival: new Date(Date.now() + durationS * 1000).toISOString(),
    transport_mode: mode,
    steps,
    source: 'estimated',
    warning: 'Routing engine unavailable. Straight-line estimate used.',
  };
}

export default router;
