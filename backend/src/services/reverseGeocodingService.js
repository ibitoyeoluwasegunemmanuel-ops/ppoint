const REQUEST_TIMEOUT_MS = Number(process.env.REVERSE_GEOCODING_TIMEOUT_MS || 1800);
const NOMINATIM_URL = process.env.NOMINATIM_REVERSE_URL || 'https://nominatim.openstreetmap.org/reverse';
const PHOTON_REVERSE_URL = process.env.PHOTON_REVERSE_URL || 'https://photon.komoot.io/reverse';
const GOOGLE_GEOCODING_URL = process.env.GOOGLE_GEOCODING_URL || 'https://maps.googleapis.com/maps/api/geocode/json';
const MAPBOX_GEOCODING_URL = process.env.MAPBOX_GEOCODING_URL || 'https://api.mapbox.com/search/geocode/v6/reverse';
const CACHE_TTL_MS = Number(process.env.REVERSE_GEOCODING_CACHE_TTL_MS || 10 * 60 * 1000);
const CACHE_PRECISION = Number(process.env.REVERSE_GEOCODING_CACHE_PRECISION || 4);
const reverseGeocodingCache = new Map();

const COMMUNITY_KEYS = [
  'neighbourhood',
  'neighborhood',
  'suburb',
  'quarter',
  'residential',
  'hamlet',
  'village',
  'township',
  'city_district',
  'district',
  'county',
];

const normalizeLabel = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const normalizeKey = (value) => normalizeLabel(value).toLowerCase();

const buildCacheKey = (latitude, longitude) => `${Number(latitude).toFixed(CACHE_PRECISION)}:${Number(longitude).toFixed(CACHE_PRECISION)}`;

const getCachedResult = (latitude, longitude) => {
  const key = buildCacheKey(latitude, longitude);
  const entry = reverseGeocodingCache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt < Date.now()) {
    reverseGeocodingCache.delete(key);
    return null;
  }

  return entry.value;
};

const setCachedResult = (latitude, longitude, value) => {
  reverseGeocodingCache.set(buildCacheKey(latitude, longitude), {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
};

const abortableFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Reverse geocoding request failed with status ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const pickFirst = (...values) => values.map(normalizeLabel).find(Boolean) || null;

const finalizeProviderResult = (provider, payload) => ({
  provider,
  street_name: normalizeLabel(payload.street_name),
  community_name: normalizeLabel(payload.community_name),
  suburb_name: normalizeLabel(payload.suburb_name),
  city: normalizeLabel(payload.city),
  state: normalizeLabel(payload.state),
  country: normalizeLabel(payload.country),
  confidence: Number(payload.confidence || 0),
});

const parseNominatimResult = (payload) => {
  const address = payload?.address || {};
  const community = COMMUNITY_KEYS.map((key) => address[key]).map(normalizeLabel).find(Boolean) || null;

  return finalizeProviderResult('openstreetmap', {
    street_name: pickFirst(address.road, address.pedestrian, address.footway, address.cycleway, address.path),
    community_name: community,
    suburb_name: pickFirst(address.suburb, address.neighbourhood, address.neighborhood, address.quarter),
    city: pickFirst(address.city, address.town, address.village, address.municipality, address.county),
    state: pickFirst(address.state, address.region),
    country: address.country,
    confidence: 0.7,
  });
};

const parsePhotonResult = (payload) => {
  const feature = Array.isArray(payload?.features) ? payload.features[0] : null;
  const properties = feature?.properties || {};

  return finalizeProviderResult('photon', {
    street_name: pickFirst(properties.street, properties.name),
    community_name: pickFirst(properties.suburb, properties.district, properties.locality),
    suburb_name: pickFirst(properties.suburb, properties.district, properties.locality),
    city: pickFirst(properties.city, properties.county, properties.state_district),
    state: pickFirst(properties.state, properties.region),
    country: properties.country,
    confidence: 0.75,
  });
};

const getGoogleComponent = (components, type) => components.find((item) => Array.isArray(item.types) && item.types.includes(type))?.long_name || null;

const parseGoogleResult = (payload) => {
  const result = Array.isArray(payload?.results) ? payload.results[0] : null;
  const components = Array.isArray(result?.address_components) ? result.address_components : [];

  return finalizeProviderResult('google', {
    street_name: pickFirst(getGoogleComponent(components, 'route'), result?.formatted_address?.split(',')?.[0]),
    community_name: pickFirst(
      getGoogleComponent(components, 'neighborhood'),
      getGoogleComponent(components, 'sublocality_level_1'),
      getGoogleComponent(components, 'sublocality'),
      getGoogleComponent(components, 'administrative_area_level_3')
    ),
    suburb_name: pickFirst(
      getGoogleComponent(components, 'sublocality_level_1'),
      getGoogleComponent(components, 'sublocality'),
      getGoogleComponent(components, 'neighborhood')
    ),
    city: pickFirst(
      getGoogleComponent(components, 'locality'),
      getGoogleComponent(components, 'postal_town'),
      getGoogleComponent(components, 'administrative_area_level_2')
    ),
    state: getGoogleComponent(components, 'administrative_area_level_1'),
    country: getGoogleComponent(components, 'country'),
    confidence: 0.9,
  });
};

const getMapboxContext = (feature, prefix) => {
  const contexts = Array.isArray(feature?.properties?.context) ? feature.properties.context : [];
  return contexts.find((item) => String(item?.mapbox_id || item?.id || '').startsWith(prefix))?.name || null;
};

const parseMapboxResult = (payload) => {
  const feature = Array.isArray(payload?.features) ? payload.features[0] : null;
  const featureName = normalizeLabel(feature?.properties?.name || feature?.text);
  const featureType = Array.isArray(feature?.properties?.feature_type)
    ? feature.properties.feature_type[0]
    : feature?.properties?.feature_type;

  return finalizeProviderResult('mapbox', {
    street_name: featureType === 'street' || featureType === 'address'
      ? featureName
      : pickFirst(getMapboxContext(feature, 'street.'), getMapboxContext(feature, 'address.')),
    community_name: pickFirst(
      getMapboxContext(feature, 'neighborhood.'),
      getMapboxContext(feature, 'locality.'),
      getMapboxContext(feature, 'district.'),
      getMapboxContext(feature, 'place.')
    ),
    suburb_name: pickFirst(
      getMapboxContext(feature, 'neighborhood.'),
      getMapboxContext(feature, 'locality.'),
      getMapboxContext(feature, 'district.')
    ),
    city: pickFirst(getMapboxContext(feature, 'place.'), getMapboxContext(feature, 'district.')),
    state: getMapboxContext(feature, 'region.'),
    country: getMapboxContext(feature, 'country.'),
    confidence: 0.8,
  });
};

const tokenize = (value) => normalizeKey(value).split(/\s+/).filter(Boolean);

const calculateTokenOverlap = (left, right) => {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);

  if (!leftTokens.length || !rightTokens.length) {
    return 0;
  }

  const rightTokenSet = new Set(rightTokens);
  const overlap = leftTokens.filter((token) => rightTokenSet.has(token)).length;
  return overlap / Math.max(leftTokens.length, rightTokens.length);
};

const looksSpecificCommunity = (value, related = {}) => {
  const normalized = normalizeKey(value);
  if (!normalized) {
    return false;
  }

  return ![related.city, related.state, related.country]
    .map(normalizeKey)
    .filter(Boolean)
    .includes(normalized);
};

const pickProviderByStreetAffinity = (providers, preferredStreetName) => {
  const preferredStreet = normalizeLabel(preferredStreetName);
  if (!preferredStreet) {
    return null;
  }

  return providers
    .map((provider) => ({
      provider,
      score: calculateTokenOverlap(provider.street_name, preferredStreet),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || (right.provider.confidence - left.provider.confidence))[0]?.provider || null;
};

const pickConsensusCommunity = (providers, preferredStreetName, related = {}) => {
  const candidates = providers
    .flatMap((provider) => [provider.community_name, provider.suburb_name])
    .map(normalizeLabel)
    .filter(Boolean);

  const counts = candidates.reduce((accumulator, value) => {
    const key = normalizeKey(value);
    accumulator.set(key, { value, count: (accumulator.get(key)?.count || 0) + 1 });
    return accumulator;
  }, new Map());

  const agreedValue = [...counts.values()]
    .filter((entry) => entry.count >= 2)
    .sort((left, right) => right.count - left.count || right.value.length - left.value.length)[0]?.value || null;

  if (agreedValue) {
    return agreedValue;
  }

  const streetAlignedProvider = pickProviderByStreetAffinity(providers, preferredStreetName);
  if (streetAlignedProvider) {
    return streetAlignedProvider.community_name || streetAlignedProvider.suburb_name || null;
  }

  return providers
    .flatMap((provider) => [provider.community_name, provider.suburb_name])
    .filter((value) => looksSpecificCommunity(value, related))
    .sort((left, right) => normalizeLabel(right).length - normalizeLabel(left).length)[0] || null;
};

const scoreValue = (value, providers, related = {}) => {
  const normalizedValue = normalizeKey(value);
  if (!normalizedValue) {
    return Number.NEGATIVE_INFINITY;
  }

  let matches = 0;
  let confidence = 0;

  providers.forEach((provider) => {
    const candidateValues = [provider.street_name, provider.community_name, provider.city, provider.state, provider.country]
      .map(normalizeKey)
      .filter(Boolean);

    if (candidateValues.includes(normalizedValue)) {
      matches += 1;
      confidence += provider.confidence || 0;
    }
  });

  const tokenCount = normalizedValue.split(/\s+/).length;
  const uniquenessPenalty = [related.city, related.state, related.country]
    .map(normalizeKey)
    .filter(Boolean)
    .includes(normalizedValue)
    ? 2
    : 0;

  return (matches * 10) + confidence + Math.min(tokenCount, 4) - uniquenessPenalty;
};

const pickConsensusValue = (values, providers, related = {}) => {
  const uniqueValues = [...new Map(values.map((value) => [normalizeKey(value), normalizeLabel(value)])).values()].filter(Boolean);

  if (!uniqueValues.length) {
    return null;
  }

  return uniqueValues
    .map((value) => ({ value, score: scoreValue(value, providers, related) }))
    .sort((left, right) => right.score - left.score || right.value.length - left.value.length)[0]?.value || null;
};

export const reverseGeocodeLocation = async (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return {
      streetName: null,
      communityName: null,
      city: null,
      state: null,
      country: null,
      providers: [],
    };
  }

  const cachedResult = getCachedResult(lat, lng);
  if (cachedResult) {
    return cachedResult;
  }

  const tasks = [
    abortableFetch(`${NOMINATIM_URL}?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'PPOINNT/1.0 (reverse geocoding)',
      },
    }).then(parseNominatimResult).catch(() => null),
    abortableFetch(`${PHOTON_REVERSE_URL}?lat=${lat}&lon=${lng}&lang=en`, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'PPOINNT/1.0 (reverse geocoding)',
      },
    }).then(parsePhotonResult).catch(() => null),
  ];

  if (process.env.GOOGLE_MAPS_GEOCODING_API_KEY) {
    tasks.push(
      abortableFetch(`${GOOGLE_GEOCODING_URL}?latlng=${lat},${lng}&key=${process.env.GOOGLE_MAPS_GEOCODING_API_KEY}`)
        .then(parseGoogleResult)
        .catch(() => null)
    );
  }

  if (process.env.MAPBOX_ACCESS_TOKEN) {
    tasks.push(
      abortableFetch(`${MAPBOX_GEOCODING_URL}?longitude=${lng}&latitude=${lat}&access_token=${process.env.MAPBOX_ACCESS_TOKEN}&language=en&types=address,street,neighborhood,locality,place,region,country`)
        .then(parseMapboxResult)
        .catch(() => null)
    );
  }

  const providers = (await Promise.all(tasks)).filter(Boolean);
  const osmStreetName = providers.find((provider) => provider.provider === 'openstreetmap')?.street_name || null;
  const city = pickConsensusValue(providers.map((provider) => provider.city), providers);
  const state = pickConsensusValue(providers.map((provider) => provider.state), providers, { city });
  const country = pickConsensusValue(providers.map((provider) => provider.country), providers, { city, state });
  const streetName = pickConsensusValue(providers.map((provider) => provider.street_name), providers, { city, state, country });
  const communityName = pickConsensusCommunity(providers, osmStreetName || streetName, { city, state, country });
  const suburbName = pickConsensusValue(providers.map((provider) => provider.suburb_name), providers, { city, state, country });

  const result = {
    streetName,
    communityName,
    suburbName,
    city,
    state,
    country,
    providers,
  };

  setCachedResult(lat, lng, result);
  return result;
};