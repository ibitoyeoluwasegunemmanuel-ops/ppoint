import City from '../models/City.js';
import Address from '../models/Address.js';

const GRID_SIZE = parseInt(process.env.GRID_SIZE, 10) || 20;
const PROXIMITY_RADIUS = parseInt(process.env.PROXIMITY_RADIUS, 10) || 15;

class AddressService {
  static async generateAddress(lat, lng) {
    const city = await City.findByCoordinates(lat, lng);

    if (!city) {
      throw new Error('Location not within any active service area');
    }

    const existingAddress = await Address.findNearby(lat, lng, PROXIMITY_RADIUS);

    if (existingAddress) {
      return {
        code: existingAddress.code,
        city: city.city_name,
        state: city.state,
        country: city.country,
        latitude: existingAddress.latitude,
        longitude: existingAddress.longitude,
        isExisting: true
      };
    }

    this.calculateGridCoordinates(lat, lng, city);
    const nextNumber = await Address.getNextNumber(city.city_code);
    const code = `${city.city_code}-${String(nextNumber).padStart(4, '0')}`;

    const newAddress = await Address.create(
      code,
      city.city_code,
      lat,
      lng,
      city.country,
      city.state
    );

    return {
      code: newAddress.code,
      city: city.city_name,
      state: city.state,
      country: city.country,
      latitude: newAddress.latitude,
      longitude: newAddress.longitude,
      isExisting: false
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
    if (!address) {
      throw new Error('Address not found');
    }

    const city = await City.findByCode(address.city_code);

    return {
      code: address.code,
      city: city?.city_name || address.city_code,
      state: address.state,
      country: address.country,
      latitude: Number(address.latitude),
      longitude: Number(address.longitude),
      createdAt: address.created_at,
      mapLink: `https://maps.google.com/?q=${address.latitude},${address.longitude}`
    };
  }
}

export default AddressService;