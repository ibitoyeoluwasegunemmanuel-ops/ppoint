const GPS_WEIGHT = 30;
const BUILDING_WEIGHT = 25;
const STREET_WEIGHT = 20;
const ENTRANCE_WEIGHT = 15;
const GEOCODING_WEIGHT = 10;

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

const scoreGeocodingAgreement = (providers = [], resolvedCommunityName = '') => {
  const normalizedResolved = normalizeKey(resolvedCommunityName);
  if (!normalizedResolved || providers.length < 2) {
    return 0;
  }

  const matches = providers.filter((provider) => normalizeKey(provider.community_name) === normalizedResolved).length;
  const ratio = matches / providers.length;

  if (ratio >= 0.9) {
    return GEOCODING_WEIGHT;
  }

  if (ratio >= 0.66) {
    return 7;
  }

  if (ratio >= 0.5) {
    return 4;
  }

  return 1;
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

  return 'Low accuracy. Adjust the pin or confirm the correct entrance before saving.';
};

export const calculateAddressConfidence = ({
  gpsAccuracy,
  buildingDetected,
  streetDetected,
  entranceDetected,
  geocodingProviders,
  communityName,
}) => {
  const breakdown = {
    gps_accuracy: scoreGpsAccuracy(gpsAccuracy),
    building_detection: buildingDetected ? BUILDING_WEIGHT : 0,
    street_detection: streetDetected ? STREET_WEIGHT : 0,
    entrance_detection: entranceDetected ? ENTRANCE_WEIGHT : 0,
    multi_provider_geocoding: scoreGeocodingAgreement(geocodingProviders, communityName),
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