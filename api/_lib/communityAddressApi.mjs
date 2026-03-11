const PRODUCTION_FRONTEND_URL = 'https://ppoint.online';

const json = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const parseLooseBodyValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return {};
  }

  if (typeof value === 'object' && !Buffer.isBuffer(value)) {
    return value;
  }

  const rawValue = Buffer.isBuffer(value) ? value.toString('utf8') : String(value);

  try {
    return JSON.parse(rawValue);
  } catch {
    const params = new URLSearchParams(rawValue);
    if ([...params.keys()].length) {
      return Object.fromEntries(params.entries());
    }

    throw new Error('Invalid JSON');
  }
};

const parseBody = (req) => new Promise((resolve, reject) => {
  try {
    const parsedBody = parseLooseBodyValue(req.body);
    if (Object.keys(parsedBody).length || req.body === '' || req.body === null || req.body === undefined) {
      resolve(parsedBody);
      return;
    }
  } catch {
    // Fall through to stream parsing below.
  }

  let rawBody = '';
  req.on('data', (chunk) => {
    rawBody += chunk;
  });

  req.on('end', () => {
    try {
      resolve(parseLooseBodyValue(rawBody));
    } catch (error) {
      reject(error);
    }
  });

  req.on('error', reject);
});

const configureRuntime = () => {
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
  process.env.PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || PRODUCTION_FRONTEND_URL;
  process.env.USE_IN_MEMORY_DB = process.env.DATABASE_URL ? 'false' : 'true';
};

const createAddressFromDraft = async (body) => {
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const code = String(body.code || body.ppoint_code || '').trim();

  if (Number.isNaN(latitude) || Number.isNaN(longitude) || !code) {
    return null;
  }

  const [{ default: Address }, { default: City }] = await Promise.all([
    import('../../backend/src/models/Address.js'),
    import('../../backend/src/models/City.js'),
  ]);

  const existingAddress = await Address.findByCode(code).catch(() => null);
  if (existingAddress) {
    return existingAddress;
  }

  const city = await City.findByCoordinates(latitude, longitude);
  if (!city) {
    const error = new Error('Location is outside the current African geographic dataset');
    error.status = 400;
    throw error;
  }

  return Address.create({
    ppointCode: code,
    uniqueIdentifier: code.split('-').at(-1),
    cityCode: city.city_code,
    lat: latitude,
    lng: longitude,
    country: city.country,
    state: city.state,
    city: city.city_name,
    district: body.district || null,
    landmark: body.landmark || null,
    description: body.description || body.streetDescription || body.street_description || null,
    streetDescription: body.streetDescription || body.street_description || body.description || null,
    buildingName: body.buildingName || body.building_name || null,
    houseNumber: body.houseNumber || body.house_number || null,
    streetName: body.streetName || body.street_name || null,
    phoneNumber: body.phoneNumber || body.phone_number || null,
    placeType: body.placeType || body.place_type || null,
    customPlaceType: body.customPlaceType || body.custom_place_type || null,
    addressMetadata: body.addressMetadata || body.address_metadata || {},
    addressType: body.addressType || body.address_type || 'community',
    createdBy: body.createdBy || body.created_by || 'Community',
    createdSource: body.createdSource || body.created_source || 'community',
    moderationStatus: body.moderationStatus || body.moderation_status || 'active',
  });
};

export const handleCommunityGenerate = async (req, res) => {
  if (req.method !== 'POST') {
    json(res, 405, { success: false, message: 'Method not allowed' });
    return;
  }

  try {
    configureRuntime();
    const body = await parseBody(req);
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      json(res, 400, { success: false, message: 'Latitude and longitude are required' });
      return;
    }

    const { default: AddressService } = await import('../../backend/src/services/addressService.js');
    const address = await AddressService.generateAddress(latitude, longitude, {
      landmark: body.landmark || '',
      description: body.description || '',
      streetDescription: body.streetDescription || body.street_description || '',
      buildingName: body.buildingName || body.building_name || '',
      houseNumber: body.houseNumber || body.house_number || '',
      streetName: body.streetName || body.street_name || '',
      district: body.district || '',
      phoneNumber: body.phoneNumber || body.phone_number || '',
      placeType: body.placeType || body.place_type || '',
      customPlaceType: body.customPlaceType || body.custom_place_type || '',
      createdBy: body.createdBy || body.created_by || 'Community',
      createdSource: body.createdSource || body.created_source || 'community',
      addressType: body.addressType || body.address_type || 'community',
      moderationStatus: body.moderationStatus || body.moderation_status || 'active',
      agentId: body.agentId || body.agent_id || null,
    });

    json(res, 200, { success: true, data: address, message: 'Community PPOINNT code generated' });
  } catch (error) {
    json(res, error.status || 500, { success: false, message: error.message || 'Failed to generate PPOINNT code' });
  }
};

export const handleCommunityDetailsUpdate = async (req, res, id) => {
  if (req.method !== 'PATCH') {
    json(res, 405, { success: false, message: 'Method not allowed' });
    return;
  }

  try {
    configureRuntime();
    const body = await parseBody(req);
    const { default: Address } = await import('../../backend/src/models/Address.js');
    let address = await Address.updateDetails(id, {
      building_name: body.buildingName || body.building_name || null,
      house_number: body.houseNumber || body.house_number || null,
      street_name: body.streetName || body.street_name || null,
      landmark: body.landmark || null,
      street_description: body.streetDescription || body.street_description || body.description || null,
      description: body.description || body.streetDescription || body.street_description || null,
      district: body.district || null,
      phone_number: body.phoneNumber || body.phone_number || null,
      place_type: body.placeType || body.place_type || null,
      custom_place_type: body.customPlaceType || body.custom_place_type || null,
      address_metadata: body.addressMetadata || body.address_metadata || undefined,
      address_type: body.addressType || body.address_type || 'community',
      moderation_status: body.moderationStatus || body.moderation_status || 'active',
      created_by: body.createdBy || body.created_by || 'Community',
      created_source: body.createdSource || body.created_source || 'community',
      is_active: body.isActive === undefined ? true : Boolean(body.isActive),
    });

    if (!address) {
      const createdAddress = await createAddressFromDraft(body);
      if (createdAddress?.id) {
        address = await Address.updateDetails(createdAddress.id, {
          building_name: body.buildingName || body.building_name || null,
          house_number: body.houseNumber || body.house_number || null,
          street_name: body.streetName || body.street_name || null,
          landmark: body.landmark || null,
          street_description: body.streetDescription || body.street_description || body.description || null,
          description: body.description || body.streetDescription || body.street_description || null,
          district: body.district || null,
          phone_number: body.phoneNumber || body.phone_number || null,
          place_type: body.placeType || body.place_type || null,
          custom_place_type: body.customPlaceType || body.custom_place_type || null,
          address_metadata: body.addressMetadata || body.address_metadata || undefined,
          address_type: body.addressType || body.address_type || 'community',
          moderation_status: body.moderationStatus || body.moderation_status || 'active',
          created_by: body.createdBy || body.created_by || 'Community',
          created_source: body.createdSource || body.created_source || 'community',
          is_active: body.isActive === undefined ? true : Boolean(body.isActive),
        });
      }
    }

    if (!address) {
      json(res, 404, { success: false, message: 'Address not found' });
      return;
    }

    json(res, 200, { success: true, data: address, message: 'Community address details saved' });
  } catch (error) {
    json(res, error.status || 500, { success: false, message: error.message || 'Failed to save community address' });
  }
};