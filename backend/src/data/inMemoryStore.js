import { africaSeedData } from './africaGeography.js';

const continents = [africaSeedData.continent];

const countries = africaSeedData.countries.map((country) => ({ ...country }));

const states = africaSeedData.states.map((state) => ({ ...state }));

const cities = africaSeedData.cities.map((city) => ({ ...city }));

const areas = [];

const addresses = [];

const businesses = [];

const agents = [];

const nationalAddresses = [];

const staffAccounts = [
  {
    id: 1,
    full_name: 'Primary Admin',
    email: 'admin@ppoint.africa',
    role: 'Super Admin',
    region_level: 'country',
    region_id: 1,
    is_enabled: true,
    created_at: new Date().toISOString()
  }
];

let nextAddressId = addresses.length + 1;
let nextContinentId = continents.length + 1;
let nextCountryId = countries.length + 1;
let nextStateId = states.length + 1;
let nextCityId = cities.length + 1;
let nextAreaId = areas.length + 1;
let nextStaffId = staffAccounts.length + 1;
let nextBusinessId = businesses.length + 1;
let nextAgentId = agents.length + 1;
let nextNationalAddressId = nationalAddresses.length + 1;

const resolveAddressStatus = (address) => address.address_status || address.moderation_status || 'active';

const resolveAddressType = (address) => address.address_type || 'community';

const resolveRegistryVerification = (address) => {
  if (address.moderation_status === 'disabled' || address.moderation_status === 'suspended') {
    return 'disabled';
  }

  if (address.moderation_status === 'flagged' || address.moderation_status === 'suspicious') {
    return 'flagged';
  }

  if (address.address_type === 'verified_business') {
    return 'verified_business';
  }

  return resolveAddressStatus(address);
};

const syncNationalAddress = (address) => {
  if (!address?.ppoint_code && !address?.code) {
    return null;
  }

  const ppointCode = address.ppoint_code || address.code;
  const existingRecord = nationalAddresses.find((item) => item.ppoint_code === ppointCode);
  const streetOrLandmark = address.street_description || address.description || address.landmark || null;
  const payload = {
    ppoint_code: ppointCode,
    country: address.country,
    state: address.state,
    city: address.city,
    district: address.district || null,
    street_or_landmark: streetOrLandmark,
    latitude: Number(address.latitude),
    longitude: Number(address.longitude),
    building_name: address.building_name || null,
    created_at: address.created_at,
    verified_status: resolveRegistryVerification(address),
  };

  if (existingRecord) {
    Object.assign(existingRecord, payload);
    return existingRecord;
  }

  const registryRecord = {
    id: nextNationalAddressId++,
    ...payload,
  };

  nationalAddresses.push(registryRecord);
  return registryRecord;
};

const sanitizeAddress = (address) => {
  if (!address) {
    return null;
  }

  return {
    ...address,
    ppoint_code: address.ppoint_code || address.code,
    coordinates: `${Number(address.latitude)},${Number(address.longitude)}`,
    address_type: resolveAddressType(address),
    address_status: resolveAddressStatus(address),
    moderation_status: resolveAddressStatus(address),
    district: address.district || null,
    house_number: address.house_number || null,
    street_description: address.street_description || address.description || null,
    created_by: address.created_by || 'Community',
    created_source: address.created_source || 'community',
  };
};

const formatAgentCode = (id) => `AGT-${String(id).padStart(5, '0')}`;

const sanitizeAgent = (agent) => {
  if (!agent) {
    return null;
  }

  const mappedAddresses = addresses.filter((address) => address.created_source === 'agent' && address.agent_id === agent.id);
  return {
    ...agent,
    agent_code: formatAgentCode(agent.id),
    total_addresses: mappedAddresses.length,
    pending_addresses: mappedAddresses.filter((address) => address.moderation_status === 'pending').length,
    approved_addresses: mappedAddresses.filter((address) => address.moderation_status === 'approved').length,
  };
};

const toRadians = (value) => (value * Math.PI) / 180;

const calculateDistanceInMeters = (lat1, lng1, lat2, lng2) => {
  const earthRadius = 6371000;
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
};

const createConflictError = (message) => {
  const error = new Error(message);
  error.status = 409;
  return error;
};

const resolveRegionCollection = (level) => {
  if (level === 'country') {
    return countries;
  }

  if (level === 'state') {
    return states;
  }

  if (level === 'city') {
    return cities;
  }

  return [];
};

const enrichCity = (city) => {
  if (!city) {
    return null;
  }

  const state = states.find((item) => item.id === city.state_id);
  const country = countries.find((item) => item.id === city.country_id);

  return {
    ...city,
    state: state?.state_name,
    state_name: state?.state_name,
    state_code: state?.state_code,
    country: country?.country_name,
    country_name: country?.country_name,
    country_code: country?.country_code
  };
};

const sanitizeBusiness = (business) => {
  if (!business) {
    return null;
  }

  return {
    ...business,
    verification_label: business.status === 'approved' ? 'Verified Business' : business.status,
  };
};

const resolveRegionName = (regionLevel, regionId) => {
  const resolvers = {
    continent: () => continents.find((item) => item.id === Number(regionId))?.name,
    country: () => countries.find((item) => item.id === Number(regionId))?.country_name,
    state: () => states.find((item) => item.id === Number(regionId))?.state_name,
    city: () => cities.find((item) => item.id === Number(regionId))?.city_name,
    area: () => areas.find((item) => item.id === Number(regionId))?.area_name,
  };

  return resolvers[regionLevel]?.() || 'Unassigned';
};

const buildHierarchyTree = () => continents.map((continent) => ({
  id: continent.id,
  name: continent.name,
  code: continent.code,
  countries: countries
    .filter((country) => country.continent_id === continent.id)
    .map((country) => ({
      id: country.id,
      name: country.country_name,
      code: country.country_code,
      isActive: country.is_active,
      states: states
        .filter((state) => state.country_id === country.id)
        .map((state) => ({
          id: state.id,
          name: state.state_name,
          code: state.state_code,
          isActive: state.is_active,
          cities: cities
            .filter((city) => city.state_id === state.id)
            .map((city) => ({
              id: city.id,
              name: city.city_name,
              code: city.city_code,
              isActive: city.is_active,
              addressCount: addresses.filter((address) => address.city_code === city.city_code).length,
              areas: areas
                .filter((area) => area.city_id === city.id)
                .map((area) => ({
                  id: area.id,
                  name: area.area_name,
                  code: area.area_code,
                  isActive: area.is_active
                }))
            }))
        }))
    }))
}));

export const inMemoryStore = {
  isEnabled() {
    return process.env.USE_IN_MEMORY_DB === 'true';
  },

  findCityByCoordinates(lat, lng) {
    const cityWithinBounds = cities.find((item) => (
      item.is_active
      && lat >= item.min_latitude
      && lat <= item.max_latitude
      && lng >= item.min_longitude
      && lng <= item.max_longitude
    ));

    if (cityWithinBounds) {
      return enrichCity(cityWithinBounds);
    }

    const nearestCity = cities
      .filter((item) => item.is_active)
      .map((item) => ({
        ...item,
        distance: calculateDistanceInMeters(lat, lng, Number(item.latitude ?? item.min_latitude), Number(item.longitude ?? item.min_longitude))
      }))
      .sort((left, right) => left.distance - right.distance)[0];

    return enrichCity(nearestCity);
  },

  findCityByCode(code) {
    return enrichCity(cities.find((item) => item.city_code === code));
  },

  getAllActiveCities() {
    return cities
      .filter((item) => item.is_active)
      .map((item) => enrichCity(item))
      .sort((left, right) => `${left.country_name}${left.city_name}`.localeCompare(`${right.country_name}${right.city_name}`));
  },

  activateCity(id) {
    const city = cities.find((item) => item.id === Number(id));
    if (!city) {
      return null;
    }

    city.is_active = true;
    return enrichCity(city);
  },

  activateStates(ids) {
    const selectedIds = ids.map((id) => Number(id));
    const updatedStates = states.filter((state) => selectedIds.includes(state.id));

    updatedStates.forEach((state) => {
      state.is_active = true;
    });

    return updatedStates;
  },

  activateCities(ids) {
    const selectedIds = ids.map((id) => Number(id));
    const updatedCities = cities.filter((city) => selectedIds.includes(city.id));

    updatedCities.forEach((city) => {
      city.is_active = true;
    });

    return updatedCities.map((city) => enrichCity(city));
  },

  setRegionStatus(level, ids, isActive) {
    const selectedIds = ids.map((id) => Number(id));
    const collection = resolveRegionCollection(level);
    const updatedItems = collection.filter((item) => selectedIds.includes(item.id));

    updatedItems.forEach((item) => {
      item.is_active = Boolean(isActive);
    });

    if (level === 'city') {
      return updatedItems.map((city) => enrichCity(city));
    }

    return updatedItems;
  },

  findNearbyAddress(lat, lng, radius = 15) {
    const nearest = addresses
      .map((address) => ({
        ...address,
        distance: calculateDistanceInMeters(lat, lng, Number(address.latitude), Number(address.longitude))
      }))
      .filter((address) => address.distance <= radius)
      .sort((left, right) => left.distance - right.distance)[0];

    return nearest || null;
  },

  findAddressByCode(code) {
    return sanitizeAddress(addresses.find((item) => item.code === code || item.ppoint_code === code) || null);
  },

  createAddress(input, legacyCityCode, legacyLat, legacyLng, legacyCountry, legacyState) {
    const payload = typeof input === 'object'
      ? input
      : {
          ppointCode: input,
          cityCode: legacyCityCode,
          lat: legacyLat,
          lng: legacyLng,
          country: legacyCountry,
          state: legacyState,
          city: cities.find((item) => item.city_code === legacyCityCode)?.city_name || null,
          landmark: null,
        };

    const matchingArea = areas.find((area) => cities.find((city) => city.id === area.city_id)?.city_code === payload.cityCode);
    const addressType = payload.addressType || 'community';
    const moderationStatus = payload.moderationStatus
      || (addressType === 'verified_business' ? 'pending_business_verification' : addressType === 'reported' ? 'reported' : 'active');
    const isActive = payload.isActive === undefined ? moderationStatus === 'active' || moderationStatus === 'verified_business' : Boolean(payload.isActive);
    const resolvedIdentifier = String(payload.uniqueIdentifier || payload.ppointCode || `ADDR${nextAddressId}`).split('-').at(-1);

    if (!payload.ppointCode) {
      throw new Error('PPOINNT code is required');
    }

    if (addresses.some((item) => item.code === payload.ppointCode || item.ppoint_code === payload.ppointCode)) {
      throw createConflictError(`PPOINNT code already exists: ${payload.ppointCode}`);
    }

    const address = {
      id: nextAddressId++,
      ppoint_code: payload.ppointCode,
      code: payload.ppointCode,
      unique_identifier: resolvedIdentifier,
      city_code: payload.cityCode,
      area_id: matchingArea?.id || null,
      latitude: Number(payload.lat),
      longitude: Number(payload.lng),
      coordinates: `${Number(payload.lat)},${Number(payload.lng)}`,
      country: payload.country,
      state: payload.state,
      city: payload.city,
      district: payload.district || null,
      building_name: payload.buildingName || null,
      house_number: payload.houseNumber || null,
      landmark: payload.landmark || null,
      street_description: payload.streetDescription || payload.description || null,
      description: payload.description || null,
      phone_number: payload.phoneNumber || null,
      address_type: addressType,
      created_by: payload.createdBy || 'Community',
      created_source: payload.createdSource || 'community',
      moderation_status: moderationStatus,
      agent_id: payload.agentId || null,
      is_active: isActive,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addresses.push(address);
    syncNationalAddress(address);
    return sanitizeAddress(address);
  },

  getAddressStats() {
    const grouped = addresses.reduce((accumulator, address) => {
      if (!accumulator[address.city_code]) {
        accumulator[address.city_code] = [];
      }

      accumulator[address.city_code].push(address);
      return accumulator;
    }, {});

    return Object.entries(grouped)
      .map(([cityCode, records]) => ({
        city_code: cityCode,
        total_addresses: String(records.length),
        active_days: String(new Set(records.map((item) => item.created_at.slice(0, 10))).size)
      }))
      .sort((left, right) => Number(right.total_addresses) - Number(left.total_addresses));
  },

  getAdminStats() {
    return {
      totalAddresses: addresses.length,
      activeCities: cities.filter((city) => city.is_active).length,
      coverage: {
        continents: continents.length,
        countries: countries.length,
        states: states.length,
        cities: cities.length,
      },
      coverageLabel: `${countries.length} country / ${states.length} states / ${cities.length} cities`,
      cityBreakdown: this.getAddressStats(),
      systemStatus: 'operational'
    };
  },

  getHierarchy() {
    return buildHierarchyTree();
  },

  getGeographyOptions() {
    return {
      continents: [...continents],
      countries: [...countries],
      states: [...states],
      cities: [...cities],
      areas: [...areas]
    };
  },

  getContinents() {
    return continents.map((continent) => ({
      ...continent,
      child_count: countries.filter((country) => country.continent_id === continent.id).length
    }));
  },

  getAdminCountries() {
    return countries
      .map((country) => ({
        id: country.id,
        continent_id: country.continent_id,
        name: country.country_name,
        code: country.country_code,
        is_active: country.is_active,
        created_at: country.created_at,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  },

  getCountries(continentId) {
    return countries
      .filter((country) => !continentId || country.continent_id === Number(continentId))
      .map((country) => ({
        id: country.id,
        continent_id: country.continent_id,
        name: country.country_name,
        code: country.country_code,
        is_active: country.is_active,
        child_count: states.filter((state) => state.country_id === country.id).length
      }));
  },

  getStates(countryId) {
    return states
      .filter((state) => !countryId || state.country_id === Number(countryId))
      .map((state) => ({
        id: state.id,
        country_id: state.country_id,
        name: state.state_name,
        code: state.state_code,
        is_active: state.is_active,
        child_count: cities.filter((city) => city.state_id === state.id).length
      }));
  },

  getAdminStates(countryId) {
    return states
      .filter((state) => !countryId || state.country_id === Number(countryId))
      .map((state) => ({
        id: state.id,
        country_id: state.country_id,
        name: state.state_name,
        code: state.state_code,
        is_active: state.is_active,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  },

  getCities(stateId) {
    return cities
      .filter((city) => !stateId || city.state_id === Number(stateId))
      .map((city) => ({
        id: city.id,
        state_id: city.state_id,
        country_id: city.country_id,
        name: city.city_name,
        code: city.city_code,
        is_active: city.is_active,
        child_count: 0,
        address_count: addresses.filter((address) => address.city_code === city.city_code).length
      }));
  },

  getAdminCities(stateId) {
    return cities
      .filter((city) => !stateId || city.state_id === Number(stateId))
      .map((city) => ({
        id: city.id,
        state_id: city.state_id,
        country_id: city.country_id,
        name: city.city_name,
        code: city.city_code,
        is_active: city.is_active,
        created_at: city.created_at,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  },

  getAreas(cityId) {
    return areas
      .filter((area) => !cityId || area.city_id === Number(cityId))
      .map((area) => ({
        id: area.id,
        city_id: area.city_id,
        name: area.area_name,
        code: area.area_code,
        is_active: area.is_active,
        address_count: addresses.filter((address) => address.area_id === area.id).length
      }));
  },

  getAddresses({ cityId, areaId }) {
    return addresses
      .filter((address) => {
        const city = cities.find((item) => item.city_code === address.city_code);
        const matchesCity = !cityId || city?.id === Number(cityId);
        const matchesArea = !areaId || address.area_id === Number(areaId);
        return matchesCity && matchesArea;
      })
      .map((address) => ({
        ...sanitizeAddress(address),
        area_name: areas.find((area) => area.id === address.area_id)?.area_name || null,
        city_name: address.city || cities.find((city) => city.city_code === address.city_code)?.city_name || null
      }))
      .sort((left, right) => right.created_at.localeCompare(left.created_at));
  },

  searchAddresses(query) {
    const normalizedQuery = String(query).toLowerCase();
    return addresses
      .filter((address) => [
        address.ppoint_code || address.code,
        address.landmark,
        address.description,
        address.street_description,
        address.building_name,
        address.house_number,
        address.city,
        address.state,
        address.country,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedQuery)))
      .map((address) => sanitizeAddress(address))
      .sort((left, right) => right.created_at.localeCompare(left.created_at));
  },

  listAddresses(query = '') {
    if (!query) {
      return this.getAddresses({});
    }

    return this.searchAddresses(query);
  },

  updateAddressDetails(id, payload = {}) {
    const address = addresses.find((item) => item.id === Number(id));
    if (!address) {
      return null;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'landmark') && payload.landmark !== undefined) {
      address.landmark = payload.landmark || null;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'description') && payload.description !== undefined) {
      address.description = payload.description || null;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'street_description') && payload.street_description !== undefined) {
      address.street_description = payload.street_description || null;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'building_name') && payload.building_name !== undefined) {
      address.building_name = payload.building_name || null;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'house_number') && payload.house_number !== undefined) {
      address.house_number = payload.house_number || null;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'district') && payload.district !== undefined) {
      address.district = payload.district || null;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'phone_number') && payload.phone_number !== undefined) {
      address.phone_number = payload.phone_number || null;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'address_type') && payload.address_type !== undefined) {
      address.address_type = payload.address_type || 'community';
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'moderation_status') && payload.moderation_status !== undefined) {
      address.moderation_status = payload.moderation_status || address.moderation_status || 'active';
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'created_by') && payload.created_by !== undefined) {
      address.created_by = payload.created_by || 'Community';
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'created_source') && payload.created_source !== undefined) {
      address.created_source = payload.created_source || 'community';
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'is_active') && payload.is_active !== undefined) {
      address.is_active = Boolean(payload.is_active);
    }

    address.updated_at = new Date().toISOString();
    syncNationalAddress(address);
    return sanitizeAddress(address);
  },

  updateAddressStatus(id, isActive) {
    const address = addresses.find((item) => item.id === Number(id));
    if (!address) {
      return null;
    }

    address.is_active = Boolean(isActive);
    address.moderation_status = isActive ? 'active' : 'disabled';
    address.updated_at = new Date().toISOString();
    syncNationalAddress(address);
    return sanitizeAddress(address);
  },

  updateAddressModeration(id, { status, isActive, updates = {}, reviewedBy }) {
    const address = addresses.find((item) => item.id === Number(id));
    if (!address) {
      return null;
    }

    Object.assign(address, {
      ...updates,
      is_active: typeof isActive === 'boolean' ? isActive : address.is_active,
      moderation_status: status || address.moderation_status || 'active',
      reviewed_by: reviewedBy || address.reviewed_by || null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    syncNationalAddress(address);
    return sanitizeAddress(address);
  },

  createBusiness({ businessName, businessCategory, contactPhone, email, ppointCode, website, businessDescription, openingHours }) {
    if (!businessName || !businessCategory || !contactPhone || !email || !ppointCode || !businessDescription || !openingHours) {
      const error = new Error('Business name, category, phone, email, PPOINNT code, description, and opening hours are required');
      error.status = 400;
      throw error;
    }

    const address = this.findAddressByCode(ppointCode);
    if (!address) {
      const error = new Error('PPOINNT address not found');
      error.status = 404;
      throw error;
    }

    if (businesses.some((item) => item.email.toLowerCase() === String(email).toLowerCase() && item.ppoint_code === (address.ppoint_code || address.code))) {
      throw createConflictError('Business already registered for this PPOINNT code');
    }

    const business = {
      id: nextBusinessId++,
      business_name: businessName,
      business_category: businessCategory,
      contact_phone: contactPhone,
      email,
      ppoint_code: address.ppoint_code || address.code,
      website: website || null,
      business_description: businessDescription,
      opening_hours: openingHours,
      address_id: address.id,
      country: address.country,
      state: address.state,
      city: address.city,
      landmark: address.landmark || null,
      coordinates: `${Number(address.latitude)},${Number(address.longitude)}`,
      status: 'pending',
      created_at: new Date().toISOString(),
      reviewed_at: null,
    };

    businesses.push(business);
    return sanitizeBusiness(business);
  },

  listBusinesses({ code, status } = {}) {
    return businesses
      .filter((business) => (!code || business.ppoint_code === code) && (!status || business.status === status))
      .map((business) => sanitizeBusiness(business))
      .sort((left, right) => right.created_at.localeCompare(left.created_at));
  },

  updateBusinessStatus(id, status) {
    const business = businesses.find((item) => item.id === Number(id));
    if (!business) {
      return null;
    }

    business.status = status;
    business.reviewed_at = new Date().toISOString();

    if (status === 'approved') {
      const linkedAddress = addresses.find((address) => address.id === business.address_id);
      if (linkedAddress) {
        linkedAddress.address_type = 'verified_business';
        linkedAddress.moderation_status = 'verified_business';
        linkedAddress.is_active = true;
        linkedAddress.updated_at = new Date().toISOString();
        syncNationalAddress(linkedAddress);
      }
    }

    return sanitizeBusiness(business);
  },

  registerAgent({ fullName, phoneNumber, email, country, state, city, territory }) {
    if (!fullName || !phoneNumber || !country || !state || !city || !territory) {
      const error = new Error('Full name, phone number, country, state, city, and territory are required');
      error.status = 400;
      throw error;
    }

    const agent = {
      id: nextAgentId++,
      full_name: fullName,
      phone_number: phoneNumber,
      email: email || null,
      country,
      state,
      city,
      territory,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    agents.push(agent);
    return sanitizeAgent(agent);
  },

  listAgents() {
    return agents.map((agent) => sanitizeAgent(agent)).sort((left, right) => right.created_at.localeCompare(left.created_at));
  },

  getAgentById(id) {
    return sanitizeAgent(agents.find((item) => item.id === Number(id)) || null);
  },

  getAgentDashboard(agentId) {
    const agent = this.getAgentById(agentId);
    if (!agent) {
      return null;
    }

    const mappedAddresses = addresses
      .filter((address) => address.agent_id === Number(agentId))
      .map((address) => sanitizeAddress(address))
      .sort((left, right) => right.created_at.localeCompare(left.created_at));

    return {
      agent,
      addresses: mappedAddresses,
    };
  },

  getNationalAddresses(query = '') {
    const normalizedQuery = String(query).trim().toLowerCase();
    return nationalAddresses
      .filter((record) => {
        if (!normalizedQuery) {
          return true;
        }

        return [
          record.ppoint_code,
          record.country,
          record.state,
          record.city,
          record.district,
          record.street_or_landmark,
          record.building_name,
          record.verified_status,
        ].filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedQuery));
      })
      .sort((left, right) => right.created_at.localeCompare(left.created_at));
  },

  updateNationalAddress(id, payload = {}) {
    const record = nationalAddresses.find((item) => item.id === Number(id));
    if (!record) {
      return null;
    }

    Object.assign(record, {
      country: payload.country ?? record.country,
      state: payload.state ?? record.state,
      city: payload.city ?? record.city,
      district: payload.district ?? record.district,
      street_or_landmark: payload.street_or_landmark ?? record.street_or_landmark,
      latitude: payload.latitude ?? record.latitude,
      longitude: payload.longitude ?? record.longitude,
      building_name: payload.building_name ?? record.building_name,
      verified_status: payload.verified_status ?? record.verified_status,
    });

    return { ...record };
  },

  getModerationQueues() {
    return {
      reported_addresses: addresses.filter((address) => address.moderation_status === 'reported').map((address) => sanitizeAddress(address)),
      suspicious_activity: addresses.filter((address) => ['flagged', 'suspicious'].includes(address.moderation_status)).map((address) => sanitizeAddress(address)),
      pending_business_verification: businesses.filter((business) => business.status === 'pending').map((business) => sanitizeBusiness(business)),
    };
  },

  getDispatchOverview() {
    const deliveryReadyAddresses = addresses.filter((address) => address.is_active && ['active', 'verified_business'].includes(address.moderation_status));
    return {
      delivery_zones: states.filter((state) => state.is_active).slice(0, 12).map((state) => ({ id: state.id, name: state.state_name })),
      dispatch_agents: this.listAgents(),
      delivery_activity: deliveryReadyAddresses.slice(-10).map((address) => ({
        id: address.id,
        ppoint_code: address.ppoint_code || address.code,
        city: address.city,
        state: address.state,
        status: address.moderation_status,
      })),
      totals: {
        ready_addresses: deliveryReadyAddresses.length,
        active_agents: agents.filter((agent) => agent.status === 'active').length,
      },
    };
  },

  createContinent({ name, code }) {
    if (continents.some((continent) => continent.name.toLowerCase() === name.toLowerCase() || continent.code.toUpperCase() === code.toUpperCase())) {
      throw createConflictError('Continent already exists');
    }

    const continent = { id: nextContinentId++, name, code };
    continents.push(continent);
    return continent;
  },

  createCountry({ continentId, countryName, countryCode, isActive }) {
    if (countries.some((country) => country.country_name.toLowerCase() === countryName.toLowerCase() || country.country_code.toUpperCase() === countryCode.toUpperCase())) {
      throw createConflictError('Country already exists');
    }

    const country = {
      id: nextCountryId++,
      continent_id: Number(continentId || continents[0]?.id || 1),
      country_name: countryName,
      country_code: countryCode,
      is_active: Boolean(isActive),
      created_at: new Date().toISOString()
    };
    countries.push(country);
    return country;
  },

  createState({ countryId, stateName, stateCode, isActive }) {
    if (states.some((state) => state.country_id === Number(countryId) && (state.state_name.toLowerCase() === stateName.toLowerCase() || state.state_code.toUpperCase() === stateCode.toUpperCase()))) {
      throw createConflictError('State already exists');
    }

    const state = {
      id: nextStateId++,
      country_id: Number(countryId),
      state_name: stateName,
      state_code: stateCode,
      is_active: Boolean(isActive)
    };
    states.push(state);
    return state;
  },

  createCity({ stateId, cityName, cityCode, minLatitude, maxLatitude, minLongitude, maxLongitude, isActive }) {
    if (cities.some((city) => city.state_id === Number(stateId) && (city.city_name.toLowerCase() === cityName.toLowerCase() || city.city_code.toUpperCase() === cityCode.toUpperCase()))) {
      throw createConflictError('City already exists');
    }

    const state = states.find((item) => item.id === Number(stateId));
    const city = {
      id: nextCityId++,
      state_id: Number(stateId),
      country_id: state?.country_id,
      city_name: cityName,
      city_code: cityCode,
      min_latitude: Number(minLatitude || 0),
      max_latitude: Number(maxLatitude || 0),
      min_longitude: Number(minLongitude || 0),
      max_longitude: Number(maxLongitude || 0),
      is_active: Boolean(isActive),
      created_at: new Date().toISOString()
    };
    cities.push(city);
    return city;
  },

  createArea({ cityId, areaName, areaCode, isActive }) {
    if (areas.some((area) => area.city_id === Number(cityId) && (area.area_name.toLowerCase() === areaName.toLowerCase() || area.area_code.toUpperCase() === areaCode.toUpperCase()))) {
      throw createConflictError('Area already exists');
    }

    const area = {
      id: nextAreaId++,
      city_id: Number(cityId),
      area_name: areaName,
      area_code: areaCode,
      is_active: Boolean(isActive),
      created_at: new Date().toISOString()
    };
    areas.push(area);
    return area;
  },

  getStaffAccounts() {
    return staffAccounts.map((staff) => ({
      ...staff,
      region_name: resolveRegionName(staff.region_level, staff.region_id)
    }));
  },

  createStaffAccount({ fullName, email, role, regionLevel, regionId, isEnabled }) {
    const allowedRoles = ['Super Admin', 'Admin', 'Manager', 'Field Officer'];

    if (!allowedRoles.includes(role)) {
      const error = new Error('Invalid staff role');
      error.status = 400;
      throw error;
    }

    if (staffAccounts.some((staff) => staff.email.toLowerCase() === email.toLowerCase())) {
      throw createConflictError('Staff account already exists');
    }

    const staff = {
      id: nextStaffId++,
      full_name: fullName,
      email,
      role,
      region_level: regionLevel,
      region_id: Number(regionId),
      is_enabled: Boolean(isEnabled),
      created_at: new Date().toISOString()
    };
    staffAccounts.push(staff);
    return {
      ...staff,
      region_name: resolveRegionName(staff.region_level, staff.region_id),
      permissions: {
        'Super Admin': ['overview', 'addresses', 'businesses', 'agents', 'developers', 'usage', 'plans', 'payments', 'regions', 'settings'],
        'Admin': ['overview', 'addresses', 'businesses', 'agents', 'regions'],
        'Manager': ['overview', 'addresses', 'businesses', 'agents', 'regions'],
        'Field Officer': ['addresses', 'agents', 'regions'],
      }[staff.role] || []
    };
  },

  updateStaffStatus(id, isEnabled) {
    const staff = staffAccounts.find((item) => item.id === Number(id));
    if (!staff) {
      return null;
    }

    staff.is_enabled = Boolean(isEnabled);
    return {
      ...staff,
      region_name: resolveRegionName(staff.region_level, staff.region_id)
    };
  }
};