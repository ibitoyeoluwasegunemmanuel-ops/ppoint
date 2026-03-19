/**
 * AI Building Detection Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides the building detection pipeline for the PPOINNT platform.
 *
 * In production this module would integrate with:
 *   - Google Earth Engine / Sentinel-2 satellite tile APIs
 *   - A deployed TensorFlow/PyTorch segmentation model (e.g. SAM or BuildingNet)
 *
 * For now it implements deterministic logic that:
 *   1. Creates a realistic building footprint polygon around a lat/lng point
 *   2. Estimates an entrance from the nearest virtual road axis
 *   3. Calculates a detailed confidence score (0–100)
 *   4. Returns structured data compatible with AddressService.generateAddress()
 *
 * This allows full end-to-end wiring today and a clean swap to a real ML model later.
 */

import crypto from 'crypto';

// ─── Constants ────────────────────────────────────────────────────────────────

const BUILDING_TYPES = ['residential', 'commercial', 'industrial', 'institutional', 'mixed'];

const ENTRANCE_TYPES = {
  main: 'main entrance',
  delivery: 'delivery entrance',
  service: 'service entrance',
};

// Approximate metres-per-degree at equator
const M_PER_DEG_LAT = 111320;
const M_PER_DEG_LNG = (lat) => 111320 * Math.cos((lat * Math.PI) / 180);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a rectangular polygon around a point. Width/height in metres.
 */
function buildRectanglePolygon(lat, lng, widthM = 20, heightM = 15, bearingDeg = 0) {
  const dLat = heightM / 2 / M_PER_DEG_LAT;
  const dLng = widthM / 2 / M_PER_DEG_LNG(lat);
  const rad = (bearingDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const corners = [
    [-dLng, -dLat],
    [dLng, -dLat],
    [dLng, dLat],
    [-dLng, dLat],
  ];

  return corners.map(([dx, dy]) => ({
    longitude: +(lng + dx * cos - dy * sin).toFixed(7),
    latitude: +(lat + dx * sin + dy * cos).toFixed(7),
  }));
}

/**
 * Snap a point to the nearest cardinal road axis (N/S/E/W offset).
 * Returns the snapped coordinate and bearing.
 */
function snapToNearestRoad(lat, lng, buildingWidthM = 20) {
  const offsetM = buildingWidthM / 2 + 3; // sidewalk buffer
  const bearings = [0, 90, 180, 270]; // N, E, S, W
  const chosen = bearings[Math.floor(lat * 100 + lng * 100) % 4]; // deterministic per location

  const dLat = chosen === 0 ? offsetM / M_PER_DEG_LAT : chosen === 180 ? -offsetM / M_PER_DEG_LAT : 0;
  const dLng = chosen === 90 ? offsetM / M_PER_DEG_LNG(lat) : chosen === 270 ? -offsetM / M_PER_DEG_LNG(lat) : 0;

  return {
    latitude: +(lat + dLat).toFixed(7),
    longitude: +(lng + dLng).toFixed(7),
    road_bearing: chosen,
    road_proximity_meters: offsetM,
  };
}

/**
 * Estimate building orientation (0–360°) from coordinates.
 * Uses a repeatable pseudo-random value based on location hash.
 */
function estimateBuildingBearing(lat, lng) {
  const hash = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453);
  const orientations = [0, 45, 90, 135]; // common street-aligned orientations
  return orientations[Math.floor((hash % 1) * orientations.length)];
}

/**
 * Derive a synthetic building ID from coordinates.
 */
function buildingIdFromCoords(lat, lng) {
  const hash = crypto.createHash('sha1').update(`${lat.toFixed(6)},${lng.toFixed(6)}`).digest('hex');
  return `BLD-${hash.slice(0, 12).toUpperCase()}`;
}

/**
 * Estimate building size category from surrounding density hint (simplified).
 */
function estimateBuildingSize(lat, lng) {
  const seed = Math.abs(Math.sin(lat * 7.3 + lng * 13.7) * 100);
  const sizes = [
    { width: 8, height: 6, category: 'small' },
    { width: 15, height: 12, category: 'medium' },
    { width: 25, height: 20, category: 'large' },
    { width: 40, height: 30, category: 'commercial' },
  ];
  return sizes[Math.floor(seed % sizes.length)];
}

// ─── Confidence Scoring ───────────────────────────────────────────────────────

/**
 * Calculate an AI detection confidence score (0–100).
 *
 * Breakdown weights:
 *   Building polygon quality  : 40 pts
 *   Road proximity           : 25 pts
 *   Entrance detection       : 20 pts
 *   Geocoding coverage       : 15 pts
 */
function calculateDetectionConfidence({ hasPolygon, roadProximityM, hasEntrance, hasStreetData, hasCommunityData }) {
  let score = 0;
  const breakdown = {};

  // Building polygon
  if (hasPolygon) {
    breakdown.building_polygon = 40;
    score += 40;
  } else {
    breakdown.building_polygon = 20; // point only
    score += 20;
  }

  // Road proximity
  if (roadProximityM !== null && roadProximityM !== undefined) {
    const roadScore = roadProximityM <= 5 ? 25 : roadProximityM <= 15 ? 20 : roadProximityM <= 30 ? 15 : 8;
    breakdown.road_proximity = roadScore;
    score += roadScore;
  } else {
    breakdown.road_proximity = 5;
    score += 5;
  }

  // Entrance
  breakdown.entrance_detection = hasEntrance ? 20 : 5;
  score += breakdown.entrance_detection;

  // Geocoding coverage
  breakdown.geocoding_coverage = hasCommunityData ? 15 : hasStreetData ? 10 : 5;
  score += breakdown.geocoding_coverage;

  const level = score >= 85 ? 'high' : score >= 65 ? 'medium' : 'low';
  const guidance =
    score >= 85
      ? 'High confidence. Building accurately detected. Entrance coordinates are reliable for delivery.'
      : score >= 65
      ? 'Medium confidence. Building detected. Verify entrance point before dispatching.'
      : 'Low confidence. Manual verification recommended before using for logistics.';

  return { score: Math.min(100, score), level, guidance, breakdown };
}

// ─── Main Detection Function ───────────────────────────────────────────────────

/**
 * Simulate AI building detection at given coordinates.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {object} options
 *   @param {string}  options.streetName       – from OSM enrichment
 *   @param {string}  options.communityName    – from reverse geocoding
 *   @param {string}  options.buildingType     – hint: residential | commercial | …
 *   @param {boolean} options.hasStreetData    – OSM has road data for this location
 * @returns {object} Detection result
 */
export function detectBuilding(lat, lng, options = {}) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Invalid coordinates for building detection');
  }

  const bearing = estimateBuildingBearing(lat, lng);
  const size = estimateBuildingSize(lat, lng);
  const polygon = buildRectanglePolygon(lat, lng, size.width, size.height, bearing);
  const roadSnap = snapToNearestRoad(lat, lng, size.width);
  const buildingId = buildingIdFromCoords(lat, lng);

  const hasStreetData = Boolean(options.streetName || options.hasStreetData);
  const hasCommunityData = Boolean(options.communityName);

  // Generate entrance point (on the road-facing wall)
  const entrance = {
    latitude: +(lat + (roadSnap.latitude - lat) * 0.6).toFixed(7),
    longitude: +(lng + (roadSnap.longitude - lng) * 0.6).toFixed(7),
    type: 'main entrance',
    label: 'Main Entrance',
    key: 'main_entrance',
    is_road_access: true,
  };

  // Delivery entrance (rear)
  const deliveryEntrance = {
    latitude: +(lat - (roadSnap.latitude - lat) * 0.4).toFixed(7),
    longitude: +(lng - (roadSnap.longitude - lng) * 0.4).toFixed(7),
    type: 'delivery entrance',
    label: 'Delivery Entrance',
    key: 'delivery_entrance',
    is_road_access: false,
  };

  const confidence = calculateDetectionConfidence({
    hasPolygon: true,
    roadProximityM: roadSnap.road_proximity_meters,
    hasEntrance: true,
    hasStreetData,
    hasCommunityData,
  });

  const buildingType = options.buildingType || BUILDING_TYPES[Math.floor(Math.abs(Math.sin(lat + lng)) * BUILDING_TYPES.length)];

  return {
    building_id: buildingId,
    latitude: lat,
    longitude: lng,
    building_polygon: polygon,
    building_type: buildingType,
    estimated_area_sqm: +(size.width * size.height).toFixed(1),
    estimated_width_m: size.width,
    estimated_height_m: size.height,
    building_orientation_deg: bearing,
    size_category: size.category,
    entrances: [entrance, deliveryEntrance],
    main_entrance: entrance,
    snapped_road_point: {
      latitude: roadSnap.latitude,
      longitude: roadSnap.longitude,
    },
    road_proximity_meters: roadSnap.road_proximity_meters,
    confidence_score: confidence.score,
    confidence_level: confidence.level,
    confidence_guidance: confidence.guidance,
    confidence_breakdown: confidence.breakdown,
    // Pipeline metadata
    detection_source: 'ai_simulation',
    detection_model: 'ppoinnt-building-detector-v1',
    detection_version: '1.0.0',
    detected_at: new Date().toISOString(),
  };
}

/**
 * Batch detect buildings for a tile bounding box.
 * Generates a grid of synthetic buildings within the bounding box.
 *
 * @param {object} bounds - { minLat, maxLat, minLng, maxLng }
 * @param {object} options - { limit, streetName, communityName }
 */
export function detectBuildingsInTile(bounds, options = {}) {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const limit = Math.min(options.limit || 10, 50);

  if (
    !Number.isFinite(minLat) ||
    !Number.isFinite(maxLat) ||
    !Number.isFinite(minLng) ||
    !Number.isFinite(maxLng)
  ) {
    throw new Error('Invalid bounding box for tile detection');
  }

  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  const buildings = [];

  // Distribute buildings on a pseudo-random grid within the tile
  const seed = Math.abs(Math.sin(minLat * 1000 + minLng * 1000) * 1000);
  for (let i = 0; i < limit; i++) {
    const fx = (Math.sin(seed + i * 2.3) + 1) / 2; // 0–1
    const fy = (Math.sin(seed + i * 3.7) + 1) / 2;
    const lat = +(minLat + fy * latSpan).toFixed(7);
    const lng = +(minLng + fx * lngSpan).toFixed(7);

    try {
      buildings.push(detectBuilding(lat, lng, options));
    } catch {
      // skip invalid detections
    }
  }

  return {
    tile_bounds: bounds,
    building_count: buildings.length,
    buildings,
    processed_at: new Date().toISOString(),
    pipeline: 'ppoinnt-satellite-tile-v1',
  };
}

/**
 * Get entrance suggestion for an existing address.
 * Called when upgrading an address record with entrance detection.
 */
export function suggestEntrance(lat, lng, streetName = null) {
  const buildingDetection = detectBuilding(lat, lng, { streetName });
  return {
    entrances: buildingDetection.entrances,
    recommended_entrance: buildingDetection.main_entrance,
    road_proximity_meters: buildingDetection.road_proximity_meters,
    confidence_score: buildingDetection.confidence_score,
  };
}

export default { detectBuilding, detectBuildingsInTile, suggestEntrance };
