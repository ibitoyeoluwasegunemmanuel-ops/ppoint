import Address from '../models/Address.js';
import City from '../models/City.js';
import AddressService from './addressService.js';

const OVERPASS_API_URL = process.env.OSM_OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter';
const REQUEST_TIMEOUT_MS = Number(process.env.AUTO_BUILDING_DETECTION_TIMEOUT_MS || 2500);
const DEFAULT_RADIUS_METERS = Number(process.env.AUTO_BUILDING_DETECTION_RADIUS_METERS || 1200);
const DEFAULT_LIMIT = Number(process.env.AUTO_BUILDING_DETECTION_LIMIT || 20);

const inferPlaceType = (buildingType = '') => {
  const normalized = String(buildingType).trim().toLowerCase();

  if (!normalized) {
    return 'House';
  }

  if (['commercial', 'retail', 'kiosk'].includes(normalized)) {
    return 'Shop';
  }

  if (['office'].includes(normalized)) {
    return 'Office';
  }

  if (['school', 'college', 'university', 'kindergarten'].includes(normalized)) {
    return 'School';
  }

  if (['hospital', 'clinic', 'doctors'].includes(normalized)) {
    return 'Hospital';
  }

  if (['warehouse', 'industrial'].includes(normalized)) {
    return 'Warehouse';
  }

  if (['government', 'civic', 'public'].includes(normalized)) {
    return 'Government Office';
  }

  if (['hotel'].includes(normalized)) {
    return 'Hotel';
  }

  if (['church', 'cathedral', 'chapel'].includes(normalized)) {
    return 'Church';
  }

  if (['mosque'].includes(normalized)) {
    return 'Mosque';
  }

  return 'House';
};

const createAbortableFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Building detection request failed with status ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const average = (values = []) => values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);

const toPolygon = (geometry = []) => geometry
  .map((point) => ({ latitude: Number(point.lat), longitude: Number(point.lon) }))
  .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));

const toCentroid = (polygon = []) => ({
  latitude: average(polygon.map((point) => point.latitude)),
  longitude: average(polygon.map((point) => point.longitude)),
});

const buildOverpassQuery = ({ latitude, longitude, radiusMeters }) => `
[out:json][timeout:8];
(
  way["building"](around:${radiusMeters},${latitude},${longitude});
  relation["building"](around:${radiusMeters},${latitude},${longitude});
);
out geom;
`;

const resolveTargetCity = async ({ cityCode, latitude, longitude }) => {
  if (cityCode) {
    const city = await City.findByCode(cityCode);
    if (!city) {
      const error = new Error('City not found for building detection');
      error.status = 404;
      throw error;
    }

    return {
      city,
      latitude: Number((Number(city.min_latitude) + Number(city.max_latitude)) / 2),
      longitude: Number((Number(city.min_longitude) + Number(city.max_longitude)) / 2),
    };
  }

  if (latitude !== undefined && longitude !== undefined) {
    const city = await City.findByCoordinates(Number(latitude), Number(longitude));
    return {
      city,
      latitude: Number(latitude),
      longitude: Number(longitude),
    };
  }

  const error = new Error('Either cityCode or latitude/longitude is required for building detection');
  error.status = 400;
  throw error;
};

export const runAutoBuildingDetection = async ({
  cityCode,
  latitude,
  longitude,
  radiusMeters = DEFAULT_RADIUS_METERS,
  limit = DEFAULT_LIMIT,
  createdBy = 'Admin Detection Engine',
} = {}) => {
  const target = await resolveTargetCity({ cityCode, latitude, longitude });
  const payload = await createAbortableFetch(OVERPASS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
      'User-Agent': 'PPOINNT/1.0 (auto building detection)',
    },
    body: buildOverpassQuery({
      latitude: target.latitude,
      longitude: target.longitude,
      radiusMeters: Math.max(150, Number(radiusMeters) || DEFAULT_RADIUS_METERS),
    }),
  });

  const elements = Array.isArray(payload?.elements) ? payload.elements : [];
  const created = [];
  const skipped = [];

  for (const element of elements.slice(0, Math.max(1, Number(limit) || DEFAULT_LIMIT))) {
    const polygon = toPolygon(element.geometry || []);
    if (polygon.length < 3) {
      skipped.push({ id: element.id, reason: 'missing_polygon' });
      continue;
    }

    const centroid = toCentroid(polygon);
    const existing = await Address.findNearby(centroid.latitude, centroid.longitude, 4);
    if (existing) {
      skipped.push({ id: element.id, reason: 'already_exists', code: existing.ppoint_code || existing.code });
      continue;
    }

    const placeType = inferPlaceType(element.tags?.building);
    const address = await AddressService.generateAddress(centroid.latitude, centroid.longitude, {
      buildingName: element.tags?.name || 'Unverified Address',
      placeType,
      createdBy,
      createdSource: 'auto_detection',
      addressType: 'auto_generated_building',
      moderationStatus: 'unverified',
      autoGeneratedFlag: true,
      buildingPolygonId: `osm-${element.type}-${element.id}`,
      addressMetadata: {
        source_dataset: 'openstreetmap_buildings',
        building_polygon: polygon,
        source_building_id: element.id,
        source_building_type: element.tags?.building || null,
        auto_generated_flag: true,
      },
    });

    created.push(address);
  }

  return {
    city: target.city?.city_name || null,
    city_code: target.city?.city_code || cityCode || null,
    radius_meters: Math.max(150, Number(radiusMeters) || DEFAULT_RADIUS_METERS),
    requested_limit: Math.max(1, Number(limit) || DEFAULT_LIMIT),
    created_count: created.length,
    skipped_count: skipped.length,
    created,
    skipped,
  };
};
