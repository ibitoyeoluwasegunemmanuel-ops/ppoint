const GPS_WEIGHT = 25;
const BUILDING_WEIGHT = 20;
const ROAD_PROXIMITY_WEIGHT = 20;
const ENTRANCE_WEIGHT = 15;
const GEOCODING_WEIGHT = 20;

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const scoreGpsAccuracy = (accuracyMeters) => {
  const accuracy = Number(accuracyMeters);

  if (!Number.isFinite(accuracy) || accuracy <= 0) {
    return 0;
  }

  if (accuracy <= 10) {
    return GPS_WEIGHT;
  }

  if (accuracy <= 20) {
    return 24;
  }

  if (accuracy <= 35) {
    return 16;
  }

  if (accuracy <= 50) {
    return 8;
  }

  return 3;
};

const scoreRoadProximity = (distanceMeters) => {
  const distance = Number(distanceMeters);

  if (!Number.isFinite(distance) || distance < 0) {
    return 0;
  }

  if (distance <= 12) {
    return ROAD_PROXIMITY_WEIGHT;
  }

  if (distance <= 25) {
    return 15;
  }

  if (distance <= 40) {
    return 10;
  }

  if (distance <= 60) {
    return 5;
  }

  return 0;
};

const scoreGeocodingAgreement = (providers = [], resolvedCommunityName = '', resolvedStreetName = '') => {
  const normalizedResolved = normalizeKey(resolvedCommunityName);
  const normalizedStreet = normalizeKey(resolvedStreetName);
  if ((!normalizedResolved && !normalizedStreet) || providers.length < 2) {
    return 0;
  }

  const communityMatches = normalizedResolved
    ? providers.filter((provider) => normalizeKey(provider.community_name) === normalizedResolved || normalizeKey(provider.suburb_name) === normalizedResolved).length
    : 0;
  const streetMatches = normalizedStreet
    ? providers.filter((provider) => normalizeKey(provider.street_name) === normalizedStreet).length
    : 0;
  const ratio = Math.max(communityMatches, streetMatches) / providers.length;

  if (ratio >= 0.9) {
    return GEOCODING_WEIGHT;
  }

  if (ratio >= 0.66) {
    return 15;
  }

  if (ratio >= 0.5) {
    return 10;
  }

  return 4;
};

export const resolveConfidenceLevel = (score) => {
  if (score >= 85) {
    return 'high';
  }

  if (score >= 60) {
    return 'medium';
  }

  return 'low';
};

export const buildConfidenceGuidance = (score) => {
  const level = resolveConfidenceLevel(score);

  if (level === 'high') {
    return 'High accuracy. No correction is required.';
  }

  if (level === 'medium') {
    return 'Medium accuracy. Verify the street or entrance if needed.';
  }

  return 'Low location accuracy. Adjust the map pin or confirm the entrance point.';
};

export const calculateAddressConfidence = ({
  gpsAccuracy,
  buildingDetected,
  roadProximity,
  entranceDetected,
  geocodingProviders,
  communityName,
  streetName,
}) => {
  const breakdown = {
    gps_accuracy: scoreGpsAccuracy(gpsAccuracy),
    building_detection: buildingDetected ? BUILDING_WEIGHT : 0,
    road_proximity: scoreRoadProximity(roadProximity),
    entrance_detection: entranceDetected ? ENTRANCE_WEIGHT : 0,
    multi_provider_geocoding: scoreGeocodingAgreement(geocodingProviders, communityName, streetName),
  };

  const score = Math.max(0, Math.min(100, Math.round(Object.values(breakdown).reduce((sum, value) => sum + value, 0))));
  const level = resolveConfidenceLevel(score);

  return {
    score,
    level,
    guidance: buildConfidenceGuidance(score),
    breakdown,
  };
};