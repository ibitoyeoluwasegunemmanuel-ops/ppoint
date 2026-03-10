import { City, Country, State } from 'country-state-city';

const AFRICAN_COUNTRY_ISO_CODES = [
  'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CM', 'CV', 'CF', 'TD', 'KM', 'CG', 'CD', 'CI',
  'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR',
  'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN',
  'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW'
];

const DEFAULT_BOUNDARY_DELTA = 0.18;

const slugify = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^A-Za-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toUpperCase();

const getNumericCoordinate = (value, fallback = 0) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
};

const getBounds = (latitude, longitude) => ({
  min_latitude: Number((latitude - DEFAULT_BOUNDARY_DELTA).toFixed(6)),
  max_latitude: Number((latitude + DEFAULT_BOUNDARY_DELTA).toFixed(6)),
  min_longitude: Number((longitude - DEFAULT_BOUNDARY_DELTA).toFixed(6)),
  max_longitude: Number((longitude + DEFAULT_BOUNDARY_DELTA).toFixed(6)),
});

const createUniqueCode = (baseCode, registry, limit = 64) => {
  const normalizedBase = baseCode.slice(0, limit);
  let candidate = normalizedBase;
  let suffix = 2;

  while (registry.has(candidate)) {
    const nextSuffix = `-${suffix}`;
    candidate = `${normalizedBase.slice(0, limit - nextSuffix.length)}${nextSuffix}`;
    suffix += 1;
  }

  registry.add(candidate);
  return candidate;
};

const getFallbackState = (country) => ({
  name: 'National Coverage',
  isoCode: `${country.isoCode}-NAT`,
  countryCode: country.isoCode,
  latitude: country.latitude,
  longitude: country.longitude,
});

const getFallbackCity = (country, state) => ({
  name: country.name,
  countryCode: country.isoCode,
  stateCode: state.isoCode,
  latitude: state.latitude || country.latitude,
  longitude: state.longitude || country.longitude,
});

export const createAfricaSeedData = () => {
  const continent = { id: 1, name: 'Africa', code: 'AFR' };
  const countries = [];
  const states = [];
  const cities = [];
  const countryCodeRegistry = new Set();
  const stateCodeRegistry = new Set();
  const cityCodeRegistry = new Set();
  const timestamp = new Date().toISOString();

  let nextCountryId = 1;
  let nextStateId = 1;
  let nextCityId = 1;

  AFRICAN_COUNTRY_ISO_CODES
    .map((isoCode) => Country.getCountryByCode(isoCode))
    .filter(Boolean)
    .sort((left, right) => left.name.localeCompare(right.name))
    .forEach((country) => {
      const countryCode = createUniqueCode(country.isoCode, countryCodeRegistry, 8);
      const countryId = nextCountryId++;
      countries.push({
        id: countryId,
        continent_id: continent.id,
        country_name: country.name,
        country_code: countryCode,
        name: country.name,
        code: countryCode,
        is_active: true,
        created_at: timestamp,
        latitude: getNumericCoordinate(country.latitude),
        longitude: getNumericCoordinate(country.longitude),
      });

      const rawStates = State.getStatesOfCountry(country.isoCode);
      const normalizedStates = rawStates.length ? rawStates : [getFallbackState(country)];

      normalizedStates.forEach((state) => {
        const stateId = nextStateId++;
        const stateCode = createUniqueCode(
          `${country.isoCode}-${slugify(state.isoCode || state.name).slice(0, 16)}`,
          stateCodeRegistry,
          24
        );

        const stateLatitude = getNumericCoordinate(state.latitude, getNumericCoordinate(country.latitude));
        const stateLongitude = getNumericCoordinate(state.longitude, getNumericCoordinate(country.longitude));

        states.push({
          id: stateId,
          country_id: countryId,
          state_name: state.name,
          state_code: stateCode,
          code: stateCode,
          is_active: true,
          latitude: stateLatitude,
          longitude: stateLongitude,
        });

        const rawCities = rawStates.length
          ? City.getCitiesOfState(country.isoCode, state.isoCode)
          : City.getCitiesOfCountry(country.isoCode);
        const normalizedCities = rawCities.length ? rawCities : [getFallbackCity(country, state)];

        normalizedCities.forEach((city) => {
          const latitude = getNumericCoordinate(city.latitude, stateLatitude);
          const longitude = getNumericCoordinate(city.longitude, stateLongitude);
          const cityCode = createUniqueCode(
            `${country.isoCode}-${slugify(state.isoCode || state.name).slice(0, 12)}-${slugify(city.name).slice(0, 24)}`,
            cityCodeRegistry,
            64
          );

          cities.push({
            id: nextCityId++,
            state_id: stateId,
            country_id: countryId,
            city_name: city.name,
            city_code: cityCode,
            ...getBounds(latitude, longitude),
            is_active: true,
            created_at: timestamp,
            latitude,
            longitude,
          });
        });
      });
    });

  return { continent, countries, states, cities };
};

export const africaSeedData = createAfricaSeedData();