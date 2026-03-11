const OVERPASS_API_URL = process.env.OSM_OVERPASS_API_URL || 'https://overpass-api.de/api/interpreter';
const BUILDING_SEARCH_RADIUS_METERS = Number(process.env.OSM_BUILDING_SEARCH_RADIUS_METERS || 120);
const STREET_MATCH_RADIUS_METERS = Number(process.env.OSM_STREET_MATCH_RADIUS_METERS || 40);
const REQUEST_TIMEOUT_MS = Number(process.env.OSM_REQUEST_TIMEOUT_MS || 4500);

const toRadians = (value) => (value * Math.PI) / 180;

const distanceMeters = (left, right) => {
  const earthRadius = 6371000;
  const deltaLat = toRadians(right.lat - left.lat);
  const deltaLng = toRadians(right.lng - left.lng);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(left.lat)) * Math.cos(toRadians(right.lat)) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

const buildOverpassQuery = (lat, lng) => `
[out:json][timeout:8];
(
  way["building"](around:${BUILDING_SEARCH_RADIUS_METERS},${lat},${lng});
  way["highway"]["name"](around:${BUILDING_SEARCH_RADIUS_METERS * 1.5},${lat},${lng});
);
(._;>;);
out body;
`;

const pointInPolygon = (point, polygon) => {
  let isInside = false;

  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index];
    const previous = polygon[previousIndex];
    const intersects = ((current.lng > point.lng) !== (previous.lng > point.lng))
      && (point.lat < ((previous.lat - current.lat) * (point.lng - current.lng)) / ((previous.lng - current.lng) || Number.EPSILON) + current.lat);

    if (intersects) {
      isInside = !isInside;
    }
  }

  return isInside;
};

const centroidOfPolygon = (coordinates) => {
  const uniqueCoordinates = coordinates.length > 1 && coordinates[0].lat === coordinates[coordinates.length - 1].lat && coordinates[0].lng === coordinates[coordinates.length - 1].lng
    ? coordinates.slice(0, -1)
    : coordinates;
  const sum = uniqueCoordinates.reduce((accumulator, coordinate) => ({
    lat: accumulator.lat + coordinate.lat,
    lng: accumulator.lng + coordinate.lng,
  }), { lat: 0, lng: 0 });

  return {
    lat: sum.lat / uniqueCoordinates.length,
    lng: sum.lng / uniqueCoordinates.length,
  };
};

const projectPointToSegment = (point, start, end) => {
  const latitudeScale = 111320;
  const longitudeScale = 111320 * Math.max(Math.cos(toRadians(point.lat)), 0.2);
  const endVector = {
    x: (end.lng - start.lng) * longitudeScale,
    y: (end.lat - start.lat) * latitudeScale,
  };
  const pointVector = {
    x: (point.lng - start.lng) * longitudeScale,
    y: (point.lat - start.lat) * latitudeScale,
  };
  const segmentLengthSquared = endVector.x ** 2 + endVector.y ** 2;
  const t = segmentLengthSquared <= 0
    ? 0
    : Math.min(1, Math.max(0, ((pointVector.x * endVector.x) + (pointVector.y * endVector.y)) / segmentLengthSquared));

  const projection = {
    lat: start.lat + (end.lat - start.lat) * t,
    lng: start.lng + (end.lng - start.lng) * t,
  };
  const delta = {
    x: pointVector.x - endVector.x * t,
    y: pointVector.y - endVector.y * t,
  };
  const cross = endVector.x * pointVector.y - endVector.y * pointVector.x;

  return {
    projection,
    distance: Math.sqrt(delta.x ** 2 + delta.y ** 2),
    segmentLength: Math.sqrt(segmentLengthSquared),
    t,
    cross,
  };
};

const analyzePointOnLine = (point, coordinates) => {
  let best = null;
  let cumulativeDistance = 0;

  for (let index = 0; index < coordinates.length - 1; index += 1) {
    const start = coordinates[index];
    const end = coordinates[index + 1];
    const projection = projectPointToSegment(point, start, end);
    const alongDistance = cumulativeDistance + projection.segmentLength * projection.t;

    if (!best || projection.distance < best.distance) {
      best = {
        distance: projection.distance,
        alongDistance,
        projection: projection.projection,
        side: projection.cross >= 0 ? 'left' : 'right',
      };
    }

    cumulativeDistance += projection.segmentLength;
  }

  return best;
};

const minimumDistanceToPolyline = (point, coordinates) => {
  if (coordinates.length < 2) {
    return Number.POSITIVE_INFINITY;
  }

  return coordinates.slice(0, -1).reduce((best, _, index) => {
    const projection = projectPointToSegment(point, coordinates[index], coordinates[index + 1]);
    return Math.min(best, projection.distance);
  }, Number.POSITIVE_INFINITY);
};

const fetchOsmElements = async (lat, lng) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: buildOverpassQuery(lat, lng),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Overpass request failed with status ${response.status}`);
    }

    const payload = await response.json();
    return Array.isArray(payload.elements) ? payload.elements : [];
  } finally {
    clearTimeout(timeout);
  }
};

const parseOsmData = (elements) => {
  const nodes = new Map();
  elements.filter((item) => item.type === 'node').forEach((item) => {
    nodes.set(item.id, { lat: Number(item.lat), lng: Number(item.lon) });
  });

  const ways = elements.filter((item) => item.type === 'way');
  const buildings = [];
  const streets = [];

  ways.forEach((way) => {
    const coordinates = (way.nodes || [])
      .map((nodeId) => nodes.get(nodeId))
      .filter(Boolean);

    if (coordinates.length < 2) {
      return;
    }

    if (way.tags?.building && coordinates.length >= 3) {
      const polygon = coordinates[0].lat === coordinates[coordinates.length - 1].lat && coordinates[0].lng === coordinates[coordinates.length - 1].lng
        ? coordinates
        : [...coordinates, coordinates[0]];

      buildings.push({
        id: way.id,
        tags: way.tags || {},
        polygon,
        centroid: centroidOfPolygon(polygon),
      });
    }

    if (way.tags?.highway && way.tags?.name) {
      streets.push({
        id: way.id,
        tags: way.tags || {},
        name: way.tags.name,
        coordinates,
      });
    }
  });

  return { buildings, streets };
};

const chooseBuilding = (point, buildings) => {
  const ranked = buildings.map((building) => {
    const containsPoint = pointInPolygon(point, building.polygon);
    const edgeDistance = containsPoint ? 0 : minimumDistanceToPolyline(point, building.polygon);
    const centroidDistance = distanceMeters(point, building.centroid);
    return {
      ...building,
      rankingDistance: containsPoint ? 0 : Math.min(edgeDistance, centroidDistance),
    };
  }).sort((left, right) => left.rankingDistance - right.rankingDistance);

  const best = ranked[0];
  if (!best || best.rankingDistance > BUILDING_SEARCH_RADIUS_METERS / 2) {
    return null;
  }

  return best;
};

const chooseStreet = (point, streets, preferredStreetName = '') => {
  const normalizedPreferredStreetName = String(preferredStreetName || '').trim().toLowerCase();
  const ranked = streets
    .map((street) => {
      const analysis = analyzePointOnLine(point, street.coordinates);
      return analysis ? { ...street, analysis } : null;
    })
    .filter(Boolean)
    .sort((left, right) => {
      const leftPreferred = normalizedPreferredStreetName && left.name.toLowerCase() === normalizedPreferredStreetName ? 0 : 1;
      const rightPreferred = normalizedPreferredStreetName && right.name.toLowerCase() === normalizedPreferredStreetName ? 0 : 1;
      if (leftPreferred !== rightPreferred) {
        return leftPreferred - rightPreferred;
      }

      return left.analysis.distance - right.analysis.distance;
    });

  const best = ranked[0];
  if (!best || best.analysis.distance > BUILDING_SEARCH_RADIUS_METERS) {
    return null;
  }

  return best;
};

const buildSequentialNumber = (selectedBuilding, street, buildings) => {
  if (!selectedBuilding || !street) {
    return null;
  }

  const explicitNumber = selectedBuilding.tags['addr:housenumber'];
  if (explicitNumber) {
    return String(explicitNumber).trim();
  }

  const preferredStreetName = String(selectedBuilding.tags['addr:street'] || '').trim().toLowerCase();
  const rankedBuildings = buildings
    .map((building) => {
      const analysis = analyzePointOnLine(building.centroid, street.coordinates);
      if (!analysis || analysis.distance > STREET_MATCH_RADIUS_METERS) {
        return null;
      }

      const taggedStreetName = String(building.tags['addr:street'] || '').trim().toLowerCase();
      if (preferredStreetName && taggedStreetName && taggedStreetName !== preferredStreetName) {
        return null;
      }

      return {
        id: building.id,
        side: analysis.side,
        alongDistance: analysis.alongDistance,
      };
    })
    .filter(Boolean);

  const leftBuildings = rankedBuildings.filter((building) => building.side === 'left').sort((left, right) => left.alongDistance - right.alongDistance);
  const rightBuildings = rankedBuildings.filter((building) => building.side === 'right').sort((left, right) => left.alongDistance - right.alongDistance);

  const leftIndex = leftBuildings.findIndex((building) => building.id === selectedBuilding.id);
  if (leftIndex >= 0) {
    return String(leftIndex * 2 + 1);
  }

  const rightIndex = rightBuildings.findIndex((building) => building.id === selectedBuilding.id);
  if (rightIndex >= 0) {
    return String(rightIndex * 2 + 2);
  }

  return null;
};

export const enrichLocationWithOsmData = async (latitude, longitude) => {
  if (process.env.OSM_ENRICHMENT_ENABLED === 'false') {
    return null;
  }

  try {
    const point = { lat: Number(latitude), lng: Number(longitude) };
    const elements = await fetchOsmElements(point.lat, point.lng);
    const { buildings, streets } = parseOsmData(elements);
    const selectedBuilding = chooseBuilding(point, buildings);
    const pointForStreet = selectedBuilding?.centroid || point;
    const preferredStreetName = selectedBuilding?.tags?.['addr:street'] || '';
    const street = chooseStreet(pointForStreet, streets, preferredStreetName);
    const streetName = street?.name || selectedBuilding?.tags?.['addr:street'] || null;
    const buildingNumber = selectedBuilding
      ? buildSequentialNumber(selectedBuilding, street, buildings) || selectedBuilding.tags['addr:housenumber'] || null
      : null;

    if (!selectedBuilding && !streetName) {
      return null;
    }

    return {
      streetName: streetName ? String(streetName).trim() : null,
      buildingNumber: buildingNumber ? String(buildingNumber).trim() : null,
      metadata: {
        source: 'openstreetmap',
        building_detected: Boolean(selectedBuilding),
        building_name: selectedBuilding?.tags?.name || null,
        building_type: selectedBuilding?.tags?.building || null,
        street_detected: Boolean(streetName),
        street_name: streetName ? String(streetName).trim() : null,
        street_side: street?.analysis?.side || null,
      },
    };
  } catch {
    return null;
  }
};