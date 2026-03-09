const continents = [
  { id: 1, name: 'Africa', code: 'AFR' }
];

const countries = [
  { id: 1, continent_id: 1, country_name: 'Nigeria', country_code: 'NGA', is_active: true }
];

const states = [
  { id: 1, country_id: 1, state_name: 'Lagos State', state_code: 'LA' },
  { id: 2, country_id: 1, state_name: 'Federal Capital Territory', state_code: 'FC' },
  { id: 3, country_id: 1, state_name: 'Oyo State', state_code: 'OY' },
  { id: 4, country_id: 1, state_name: 'Rivers State', state_code: 'RI' },
  { id: 5, country_id: 1, state_name: 'Kano State', state_code: 'KN' }
];

const cities = [
  {
    id: 1,
    state_id: 1,
    country_id: 1,
    city_name: 'Lagos',
    city_code: 'LAG',
    min_latitude: 6.4,
    max_latitude: 6.7,
    min_longitude: 3.2,
    max_longitude: 3.6,
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    state_id: 2,
    country_id: 1,
    city_name: 'Abuja',
    city_code: 'ABJ',
    min_latitude: 8.9,
    max_latitude: 9.2,
    min_longitude: 7.1,
    max_longitude: 7.5,
    is_active: false,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    state_id: 3,
    country_id: 1,
    city_name: 'Ibadan',
    city_code: 'IBD',
    min_latitude: 7.3,
    max_latitude: 7.5,
    min_longitude: 3.8,
    max_longitude: 4.0,
    is_active: false,
    created_at: new Date().toISOString()
  }
];

const addresses = [];

let nextAddressId = 1;

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
    country: country?.country_name,
    country_name: country?.country_name
  };
};

export const inMemoryStore = {
  isEnabled() {
    return process.env.USE_IN_MEMORY_DB === 'true';
  },

  findCityByCoordinates(lat, lng) {
    const city = cities.find((item) => (
      item.is_active
      && lat >= item.min_latitude
      && lat <= item.max_latitude
      && lng >= item.min_longitude
      && lng <= item.max_longitude
    ));

    return enrichCity(city);
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
    return addresses.find((item) => item.code === code) || null;
  },

  getNextAddressNumber(cityCode) {
    const matchingCodes = addresses
      .filter((item) => item.city_code === cityCode)
      .map((item) => Number(item.code.split('-')[1] || 0));

    return (matchingCodes.length ? Math.max(...matchingCodes) : 0) + 1;
  },

  createAddress(code, cityCode, lat, lng, country, state) {
    const address = {
      id: nextAddressId++,
      code,
      city_code: cityCode,
      latitude: Number(lat),
      longitude: Number(lng),
      country,
      state,
      created_at: new Date().toISOString()
    };

    addresses.push(address);
    return address;
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

  getHierarchy() {
    return cities.map((city) => {
      const state = states.find((item) => item.id === city.state_id);
      const country = countries.find((item) => item.id === city.country_id);
      const continent = continents.find((item) => item.id === country?.continent_id);
      const cityAddresses = addresses.filter((item) => item.city_code === city.city_code);

      return {
        continent: continent?.name || null,
        country_name: country?.country_name || null,
        state_name: state?.state_name || null,
        city_name: city.city_name,
        city_code: city.city_code,
        is_active: city.is_active,
        address_count: String(cityAddresses.length)
      };
    });
  }
};