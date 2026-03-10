import City from '../models/City.js';
import Address from '../models/Address.js';
import crypto from 'crypto';

const GRID_SIZE = parseInt(process.env.GRID_SIZE, 10) || 20;
const PROXIMITY_RADIUS = parseInt(process.env.PROXIMITY_RADIUS, 10) || 15;
const UNIQUE_IDENTIFIER_LENGTH = 6;
const UNIQUE_IDENTIFIER_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_GENERATION_MAX_RETRIES = 24;
const normalizeSegment = (value) => String(value || '')
  .toUpperCase()
  .replace(/[^A-Z0-9\s]/g, ' ')
  .replace(/\b(STATE|CITY|REGION|PROVINCE|MUNICIPALITY|COUNTY|TERRITORY)\b/g, ' ')
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

const createRandomIdentifier = () => {
  let identifier = '';

  for (let index = 0; index < UNIQUE_IDENTIFIER_LENGTH; index += 1) {
    identifier += UNIQUE_IDENTIFIER_ALPHABET[crypto.randomInt(0, UNIQUE_IDENTIFIER_ALPHABET.length)];
  }

  return identifier;
};

class AddressService {
  static async generateAddress(lat, lng, options = {}) {
    const city = await City.findByCoordinates(lat, lng);

    if (!city) {
      throw new Error('Location is outside the current African geographic dataset');
    }

    const existingAddress = await Address.findNearby(lat, lng, PROXIMITY_RADIUS);
    const countryCode = String(city.country_code || 'AF').toUpperCase();
    const stateCode = resolveRegionSegment(city.state_code, city.state, 'UNK');
    const cityCode = resolveRegionSegment(city.city_code, city.city_name, 'UNK');
    const addressType = options.addressType || 'community';
    const moderationStatus = options.moderationStatus
      || (addressType === 'verified_business' ? 'pending_business_verification' : addressType === 'reported' ? 'reported' : 'active');

    if (existingAddress) {
      const persistedAddress = (options.landmark && !existingAddress.landmark) || options.buildingName || options.houseNumber || options.streetDescription
        ? await Address.updateDetails(existingAddress.id, {
          landmark: options.landmark,
          building_name: options.buildingName,
          house_number: options.houseNumber,
          street_description: options.streetDescription,
        })
        : existingAddress;

      return {
        id: persistedAddress.id,
        code: persistedAddress.ppoint_code || persistedAddress.code,
        ppoint_code: persistedAddress.ppoint_code || persistedAddress.code,
        city: city.city_name,
        state: city.state,
        country: city.country,
        country_code: countryCode,
        state_code: stateCode,
        city_code: cityCode,
        latitude: persistedAddress.latitude,
        longitude: persistedAddress.longitude,
        coordinates: `${Number(persistedAddress.latitude)},${Number(persistedAddress.longitude)}`,
        district: persistedAddress.district || null,
        building_name: persistedAddress.building_name || null,
        house_number: persistedAddress.house_number || null,
        landmark: persistedAddress.landmark || options.landmark || null,
        street_description: persistedAddress.street_description || persistedAddress.description || null,
        description: persistedAddress.description || null,
        phone_number: persistedAddress.phone_number || null,
        address_type: persistedAddress.address_type || 'community',
        status: persistedAddress.address_status || persistedAddress.moderation_status || 'active',
        created_by: persistedAddress.created_by || 'Community',
        moderation_status: persistedAddress.moderation_status || 'active',
        created_at: persistedAddress.created_at,
        isExisting: true,
        shareUrl: `${process.env.PUBLIC_APP_URL || 'http://127.0.0.1:5183'}/${persistedAddress.ppoint_code || persistedAddress.code}`
      };
    }

    const prefix = `PPT-${countryCode}-${stateCode}-${cityCode}`;
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
          country: city.country,
          state: city.state,
          city: city.city_name,
          district: options.district,
          landmark: options.landmark,
          description: options.description,
          streetDescription: options.streetDescription,
          buildingName: options.buildingName,
          houseNumber: options.houseNumber,
          phoneNumber: options.phoneNumber,
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
      id: newAddress.id,
      code: newAddress.ppoint_code || newAddress.code,
      ppoint_code: newAddress.ppoint_code || newAddress.code,
      city: city.city_name,
      state: city.state,
      country: city.country,
      country_code: countryCode,
      state_code: stateCode,
      city_code: cityCode,
      latitude: newAddress.latitude,
      longitude: newAddress.longitude,
      coordinates: `${Number(newAddress.latitude)},${Number(newAddress.longitude)}`,
      district: newAddress.district || null,
      building_name: newAddress.building_name || null,
      house_number: newAddress.house_number || null,
      landmark: newAddress.landmark || options.landmark || null,
      street_description: newAddress.street_description || newAddress.description || null,
      description: newAddress.description || null,
      phone_number: newAddress.phone_number || null,
      address_type: newAddress.address_type || addressType,
      status: newAddress.address_status || newAddress.moderation_status || 'active',
      created_by: newAddress.created_by || 'Community',
      moderation_status: newAddress.moderation_status || moderationStatus,
      created_at: newAddress.created_at,
      isExisting: false,
      shareUrl: `${process.env.PUBLIC_APP_URL || 'http://127.0.0.1:5183'}/${newAddress.ppoint_code || newAddress.code}`
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
      id: address.id,
      code: address.ppoint_code || address.code,
      ppoint_code: address.ppoint_code || address.code,
      city: address.city || city?.city_name || address.city_code,
      state: address.state,
      country: address.country,
      latitude: Number(address.latitude),
      longitude: Number(address.longitude),
      coordinates: `${Number(address.latitude)},${Number(address.longitude)}`,
      district: address.district || null,
      building_name: address.building_name || null,
      house_number: address.house_number || null,
      landmark: address.landmark || null,
      street_description: address.street_description || address.description || null,
      description: address.description || null,
      phone_number: address.phone_number || null,
      address_type: address.address_type || 'community',
      status: address.address_status || address.moderation_status || 'active',
      created_by: address.created_by || 'Community',
      moderation_status: address.moderation_status || 'active',
      createdAt: address.created_at,
      mapLink: `https://maps.google.com/?q=${address.latitude},${address.longitude}`,
      shareUrl: `${process.env.PUBLIC_APP_URL || 'http://127.0.0.1:5183'}/${address.ppoint_code || address.code}`
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
      landmark: item.landmark || null,
      street_description: item.street_description || item.description || null,
      description: item.description || null,
      phone_number: item.phone_number || null,
      address_type: item.address_type || 'community',
      status: item.address_status || item.moderation_status || 'active',
      created_by: item.created_by || 'Community',
      moderation_status: item.moderation_status || 'active',
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      coordinates: `${Number(item.latitude)},${Number(item.longitude)}`,
      created_at: item.created_at,
      is_active: item.is_active !== false,
    }));
  }
}

export default AddressService;