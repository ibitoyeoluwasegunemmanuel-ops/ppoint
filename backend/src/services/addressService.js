import City from '../models/City.js';
import Address from '../models/Address.js';
import crypto from 'crypto';
import { enrichLocationWithOsmData } from './osmAddressingService.js';
import { calculateAddressConfidence } from './addressConfidenceService.js';
import { reverseGeocodeLocation } from './reverseGeocodingService.js';
import { normalizePlaceType } from '../utils/placeType.js';

const GRID_SIZE = parseInt(process.env.GRID_SIZE, 10) || 20;
const PROXIMITY_RADIUS = parseInt(process.env.PROXIMITY_RADIUS, 10) || 5;
const UNIQUE_IDENTIFIER_LENGTH = 6;
const UNIQUE_IDENTIFIER_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_GENERATION_MAX_RETRIES = 24;
const ADMINISTRATIVE_CITY_OVERRIDES = [
  {
    countryCode: 'NG',
    stateCode: 'LAG',
    match: /\b(?:EBUTE\s+IKORODU|AGBEDE(?:\s+IKORODU)?|IKORODU)\b/i,
    city: 'Ikorodu',
    cityCode: 'IKD',
  },
];

const normalizeSegment = (value) => String(value || '')
  .toUpperCase()
  .replace(/[^A-Z0-9\s]/g, ' ')
  .replace(/\b(STATE|CITY|REGION|PROVINCE|MUNICIPALITY|COUNTY|TERRITORY|DISTRICT|SUBURB|NEIGHBORHOOD|AREA|WARD|STREET|ROAD|AVENUE|CLOSE|ESTATE|PHASE|QUARTER|VILLAGE|TOWN)\b/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const createCodeSegment = (value, fallback = 'UNK') => {
  const normalizedValue = normalizeSegment(value);
  if (!normalizedValue) {
    return fallback;
  }

  const parts = normalizedValue.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return parts.slice(0, 3).map((part) => part[0]).join('').padEnd(3, 'X').slice(0, 3);
  }

  return normalizedValue.slice(0, 3).padEnd(3, 'X');
};

const resolveRegionSegment = (code, label, fallback = 'UNK') => {
  const normalizedCode = normalizeSegment(code);
  if (normalizedCode && normalizedCode.length <= 3) {
    return normalizedCode.padEnd(3, 'X').slice(0, 3);
  }

  return createCodeSegment(label, fallback);
};

const buildPpointPrefix = (city) => {
  const countryCode = String(city.country_code || 'AF').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 2).padEnd(2, 'X');
  const stateCode = resolveRegionSegment(city.state_code, city.state, 'UNK');
  const normalizedCityName = normalizeSegment(city.city_name);
  const administrativeCity = ADMINISTRATIVE_CITY_OVERRIDES.find((item) => (
    item.countryCode === countryCode
    && item.stateCode === stateCode
    && item.match.test(normalizedCityName)
  ));
  const cityLabel = administrativeCity?.city || city.city_name;
  const cityCode = administrativeCity?.cityCode || resolveRegionSegment(city.city_code, cityLabel, 'UNK');

  return {
    countryCode,
    stateCode,
    cityCode,
    cityLabel,
    localityLabel: administrativeCity && city.city_name !== administrativeCity.city ? city.city_name : null,
    prefix: `PPT-${countryCode}-${stateCode}-${cityCode}`,
  };
};

const createRandomIdentifier = () => {
  let identifier = '';

  for (let index = 0; index < UNIQUE_IDENTIFIER_LENGTH; index += 1) {
    identifier += UNIQUE_IDENTIFIER_ALPHABET[crypto.randomInt(0, UNIQUE_IDENTIFIER_ALPHABET.length)];
  }

  return identifier;
};

const structuredAddressLine = (houseNumber, streetName) => [houseNumber, streetName].filter(Boolean).join(' ').trim() || null;

const calculateDistanceInMeters = (from, to) => {
  if (!from || !to) {
    return null;
  }

  const earthRadius = 6371000;
  const lat1 = (Number(from.latitude) * Math.PI) / 180;
  const lat2 = (Number(to.latitude) * Math.PI) / 180;
  const deltaLat = ((Number(to.latitude) - Number(from.latitude)) * Math.PI) / 180;
  const deltaLng = ((Number(to.longitude) - Number(from.longitude)) * Math.PI) / 180;

  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadius * c);
};

const normalizeGeoPoint = (point) => {
  if (!point) {
    return null;
  }

  const latitude = Number(point.latitude ?? point.lat);
  const longitude = Number(point.longitude ?? point.lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
};

const normalizePath = (path = []) => path
  .map((point) => normalizeGeoPoint(point))
  .filter(Boolean);

const normalizeNavigationPoints = (points = []) => points
  .map((point) => {
    const latitude = Number(point.latitude ?? point.lat);
    const longitude = Number(point.longitude ?? point.lng);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      key: String(point.key || '').trim() || 'manual_pin',
      label: String(point.label || '').trim() || 'Manual Pin',
      latitude,
      longitude,
      is_road_access: Boolean(point.is_road_access),
    };
  })
  .filter(Boolean);

const getAddressIntelligence = (address) => {
  const metadata = address.address_metadata || {};
  const navigationPoints = normalizeNavigationPoints(metadata.navigation_points || metadata.navigationPoints || []);

  return {
    community_name: address.community_name || metadata.community_name || metadata.reverse_geocoding?.community_name || null,
    suburb_name: metadata.suburb_name || metadata.reverse_geocoding?.suburb_name || null,
    building_polygon_id: address.building_polygon_id || metadata.building_id || null,
    entrance_label: address.entrance_label || null,
    entrance_latitude: address.entrance_latitude === null || address.entrance_latitude === undefined ? null : Number(address.entrance_latitude),
    entrance_longitude: address.entrance_longitude === null || address.entrance_longitude === undefined ? null : Number(address.entrance_longitude),
    confidence_score: address.confidence_score === null || address.confidence_score === undefined ? Number(metadata.confidence_score || 0) : Number(address.confidence_score),
    confidence_level: metadata.confidence_level || null,
    confidence_guidance: metadata.confidence_guidance || null,
    confidence_breakdown: metadata.confidence_breakdown || {},
    navigation_points: navigationPoints,
    selected_navigation_point: metadata.selected_navigation_point || null,
    snapped_road_point: normalizeGeoPoint(metadata.snapped_road_point),
    building_entrance_point: normalizeGeoPoint(metadata.building_entrance_point),
    building_polygon: normalizePath(metadata.building_polygon),
    road_segment: normalizePath(metadata.road_segment),
    road_proximity_meters: metadata.road_proximity_meters === undefined || metadata.road_proximity_meters === null ? null : Number(metadata.road_proximity_meters),
    geocoding_providers: Array.isArray(metadata.geocoding_providers) ? metadata.geocoding_providers : [],
    auto_generated_flag: Boolean(address.auto_generated_flag || metadata.auto_generated_flag),
  };
};

const toAddressResponse = (address, cityContext, countryCode, stateCode, cityCode) => ({
  id: address.id,
  code: address.ppoint_code || address.code,
  ppoint_code: address.ppoint_code || address.code,
  city: address.city || cityContext.city_name || cityCode,
  state: address.state || cityContext.state,
  country: address.country || cityContext.country,
  country_code: countryCode,
  state_code: stateCode,
  city_code: cityCode,
  latitude: Number(address.latitude),
  longitude: Number(address.longitude),
  coordinates: `${Number(address.latitude)},${Number(address.longitude)}`,
  district: address.district || null,
  building_name: address.building_name || null,
  house_number: address.house_number || null,
  street_name: address.street_name || null,
  landmark: address.landmark || null,
  street_description: address.street_description || address.description || null,
  description: address.description || null,
  phone_number: address.phone_number || null,
  place_type: address.place_type || null,
  custom_place_type: address.custom_place_type || null,
  display_place_type: address.custom_place_type || address.place_type || null,
  address_metadata: address.address_metadata || {},
  structured_address_line: structuredAddressLine(address.house_number, address.street_name),
  locality_line: [address.city || cityContext.city_name || cityCode, address.state || cityContext.state, address.country || cityContext.country].filter(Boolean).join(', '),
  address_type: address.address_type || 'community',
  status: address.address_status || address.moderation_status || 'active',
  created_by: address.created_by || 'Community',
  moderation_status: address.moderation_status || 'active',
  created_at: address.created_at,
  shareUrl: `${process.env.PUBLIC_APP_URL || 'http://127.0.0.1:5183'}/${address.ppoint_code || address.code}`,
  ...getAddressIntelligence(address),
});

class AddressService {
  static async generateAddress(lat, lng, options = {}) {
    const city = await City.findByCoordinates(lat, lng);

    if (!city) {
      throw new Error('Location is outside the current African geographic dataset');
    }

    const existingAddress = await Address.findNearby(lat, lng, PROXIMITY_RADIUS);
    const { countryCode, stateCode, cityCode, cityLabel, localityLabel, prefix } = buildPpointPrefix(city);
    const placeTypeInfo = normalizePlaceType(options.placeType, options.customPlaceType);
    const [osmEnrichment, reverseGeocoding] = await Promise.all([
      enrichLocationWithOsmData(lat, lng),
      reverseGeocodeLocation(lat, lng),
    ]);
    const resolvedCommunityName = options.communityName || reverseGeocoding?.communityName || reverseGeocoding?.suburbName || null;
    const resolvedHouseNumber = options.houseNumber || osmEnrichment?.buildingNumber || null;
    const resolvedStreetName = options.streetName || osmEnrichment?.streetName || reverseGeocoding?.streetName || null;
    const resolvedBuildingPolygonId = options.buildingPolygonId || osmEnrichment?.metadata?.building_id || null;
    const navigationPoints = normalizeNavigationPoints(osmEnrichment?.navigationPoints || osmEnrichment?.metadata?.navigation_points || []);
    const selectedNavigationPointKey = options.selectedNavigationPoint || osmEnrichment?.selectedNavigationPoint || null;
    const selectedNavigationPoint = navigationPoints.find((entry) => entry.key === selectedNavigationPointKey) || null;
    const roadProximityMeters = calculateDistanceInMeters(
      normalizeGeoPoint(osmEnrichment?.buildingEntrancePoint) || { latitude: lat, longitude: lng },
      normalizeGeoPoint(osmEnrichment?.snappedRoadPoint)
    );
    const confidence = calculateAddressConfidence({
      gpsAccuracy: options.gpsAccuracy || options.gps_accuracy || null,
      buildingDetected: Boolean(osmEnrichment?.metadata?.building_detected),
      roadProximity: roadProximityMeters,
      entranceDetected: Boolean(selectedNavigationPoint || osmEnrichment?.buildingEntrancePoint),
      geocodingProviders: reverseGeocoding?.providers || [],
      communityName: resolvedCommunityName,
      streetName: resolvedStreetName,
    });
    const resolvedEntranceLabel = options.entranceLabel || selectedNavigationPoint?.label || null;
    const resolvedEntranceLatitude = options.entranceLatitude ?? selectedNavigationPoint?.latitude ?? osmEnrichment?.buildingEntrancePoint?.latitude ?? null;
    const resolvedEntranceLongitude = options.entranceLongitude ?? selectedNavigationPoint?.longitude ?? osmEnrichment?.buildingEntrancePoint?.longitude ?? null;
    const resolvedMetadata = {
      ...(osmEnrichment?.metadata || {}),
      reverse_geocoding: {
        street_name: reverseGeocoding?.streetName || null,
        community_name: reverseGeocoding?.communityName || null,
        suburb_name: reverseGeocoding?.suburbName || null,
        city: reverseGeocoding?.city || null,
        state: reverseGeocoding?.state || null,
        country: reverseGeocoding?.country || null,
      },
      geocoding_providers: reverseGeocoding?.providers || [],
      community_name: resolvedCommunityName,
      suburb_name: reverseGeocoding?.suburbName || null,
      confidence_score: confidence.score,
      confidence_level: confidence.level,
      confidence_guidance: confidence.guidance,
      confidence_breakdown: confidence.breakdown,
      navigation_points: navigationPoints,
      selected_navigation_point: selectedNavigationPointKey,
      snapped_road_point: normalizeGeoPoint(osmEnrichment?.snappedRoadPoint),
      building_entrance_point: normalizeGeoPoint(osmEnrichment?.buildingEntrancePoint),
      road_proximity_meters: roadProximityMeters,
      auto_generated_flag: Boolean(options.autoGeneratedFlag || options.auto_generated_flag),
      minimum_distance_meters: PROXIMITY_RADIUS,
      fallback_mode: !osmEnrichment,
    };
    const addressType = options.addressType || 'community';
    const moderationStatus = options.moderationStatus
      || (addressType === 'verified_business' ? 'pending_business_verification' : addressType === 'reported' ? 'reported' : 'active');

    if (existingAddress) {
      const persistedAddress = (options.landmark && !existingAddress.landmark)
        || options.buildingName
        || options.houseNumber
        || options.streetDescription
        || placeTypeInfo.placeType
        || resolvedStreetName
        || resolvedCommunityName
        || resolvedEntranceLabel
        || resolvedBuildingPolygonId
        || confidence.score
        ? await Address.updateDetails(existingAddress.id, {
          landmark: options.landmark,
          building_name: options.buildingName,
          house_number: resolvedHouseNumber,
          street_name: resolvedStreetName,
          community_name: resolvedCommunityName,
          building_polygon_id: resolvedBuildingPolygonId,
          entrance_label: resolvedEntranceLabel,
          entrance_latitude: resolvedEntranceLatitude,
          entrance_longitude: resolvedEntranceLongitude,
          confidence_score: confidence.score,
          auto_generated_flag: Boolean(options.autoGeneratedFlag || options.auto_generated_flag || existingAddress.auto_generated_flag),
          street_description: options.streetDescription,
          description: options.description || existingAddress.description || localityLabel || null,
          place_type: placeTypeInfo.placeType,
          custom_place_type: placeTypeInfo.customPlaceType,
          address_metadata: {
            ...(existingAddress.address_metadata || {}),
            ...resolvedMetadata,
          },
        })
        : existingAddress;

      return {
        ...toAddressResponse(persistedAddress, { ...city, city_name: cityLabel }, countryCode, stateCode, cityCode),
        isExisting: true,
      };
    }

    this.calculateGridCoordinates(lat, lng, city);

    let newAddress = null;

    for (let attempt = 0; attempt < CODE_GENERATION_MAX_RETRIES; attempt += 1) {
      const uniqueIdentifier = createRandomIdentifier();
      const code = `${prefix}-${uniqueIdentifier}`;

      try {
        newAddress = await Address.create({
          ppointCode: code,
          uniqueIdentifier,
          cityCode: city.city_code,
          lat,
          lng,
          country: reverseGeocoding?.country || city.country,
          state: reverseGeocoding?.state || city.state,
          city: reverseGeocoding?.city || cityLabel,
          communityName: resolvedCommunityName,
          district: options.district,
          landmark: options.landmark,
          description: options.description || localityLabel || null,
          streetDescription: options.streetDescription,
          buildingName: options.buildingName,
          houseNumber: resolvedHouseNumber,
          streetName: resolvedStreetName,
          buildingPolygonId: resolvedBuildingPolygonId,
          phoneNumber: options.phoneNumber,
          entranceLabel: resolvedEntranceLabel,
          entranceLatitude: resolvedEntranceLatitude,
          entranceLongitude: resolvedEntranceLongitude,
          confidenceScore: confidence.score,
          autoGeneratedFlag: Boolean(options.autoGeneratedFlag || options.auto_generated_flag),
          placeType: placeTypeInfo.placeType,
          customPlaceType: placeTypeInfo.customPlaceType,
          addressMetadata: resolvedMetadata,
          addressType,
          createdBy: options.createdBy,
          createdSource: options.createdSource,
          moderationStatus,
          agentId: options.agentId,
        });
        break;
      } catch (error) {
        if (Address.isCodeConflict(error)) {
          continue;
        }

        throw error;
      }
    }

    if (!newAddress) {
      const error = new Error('Unable to generate a unique PPOINNT code at this time');
      error.status = 503;
      throw error;
    }

    return {
      ...toAddressResponse(newAddress, { ...city, city_name: cityLabel }, countryCode, stateCode, cityCode),
      isExisting: false,
    };
  }

  static calculateGridCoordinates(lat, lng, city) {
    const gridX = Math.floor((lng - city.min_longitude) / (GRID_SIZE / 111320));
    const gridY = Math.floor((lat - city.min_latitude) / (GRID_SIZE / 110540));
    const gridWidth = Math.ceil((city.max_longitude - city.min_longitude) / (GRID_SIZE / 111320));
    const gridId = gridX + (gridY * gridWidth);

    return { gridX, gridY, gridId };
  }

  static async getAddressInfo(code) {
    const address = await Address.findByCode(code);
    if (!address || address.is_active === false) {
      throw new Error('Address not found');
    }

    const city = await City.findByCode(address.city_code);

    return {
      ...toAddressResponse(address, city || {}, city?.country_code || null, city?.state_code || null, address.city_code),
      createdAt: address.created_at,
      mapLink: `https://maps.google.com/?q=${address.latitude},${address.longitude}`,
    };
  }

  static async searchAddresses(query) {
    const normalizedQuery = String(query).trim();
    if (!normalizedQuery) {
      return [];
    }

    const exactAddress = await Address.findByCode(normalizedQuery).catch(() => null);
    const results = exactAddress ? [exactAddress] : await Address.search(normalizedQuery);
    return results.map((item) => ({
      id: item.id,
      code: item.ppoint_code || item.code,
      ppoint_code: item.ppoint_code || item.code,
      country: item.country,
      state: item.state,
      city: item.city,
      district: item.district || null,
      building_name: item.building_name || null,
      house_number: item.house_number || null,
      street_name: item.street_name || null,
      landmark: item.landmark || null,
      street_description: item.street_description || item.description || null,
      description: item.description || null,
      phone_number: item.phone_number || null,
      place_type: item.place_type || null,
      custom_place_type: item.custom_place_type || null,
      display_place_type: item.custom_place_type || item.place_type || null,
      address_metadata: item.address_metadata || {},
      structured_address_line: structuredAddressLine(item.house_number, item.street_name),
      address_type: item.address_type || 'community',
      status: item.address_status || item.moderation_status || 'active',
      created_by: item.created_by || 'Community',
      moderation_status: item.moderation_status || 'active',
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      coordinates: `${Number(item.latitude)},${Number(item.longitude)}`,
      created_at: item.created_at,
      is_active: item.is_active !== false,
      ...getAddressIntelligence(item),
    }));
  }
}

export default AddressService;