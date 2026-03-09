import pool from '../config/database.js';
import { inMemoryStore } from '../data/inMemoryStore.js';

class Address {
  static async findNearby(lat, lng, radius = 15) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.findNearbyAddress(lat, lng, radius);
    }

    const query = `
      SELECT *,
        ST_Distance(
          location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance
      FROM addresses
      WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      ORDER BY distance
      LIMIT 1
    `;
    const result = await pool.query(query, [lng, lat, radius]);
    return result.rows[0];
  }

  static async findByCode(code) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.findAddressByCode(code);
    }

    const query = 'SELECT * FROM addresses WHERE code = $1';
    const result = await pool.query(query, [code]);
    return result.rows[0];
  }

  static async getNextNumber(cityCode) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.getNextAddressNumber(cityCode);
    }

    const query = `
      SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM '[0-9]+') AS INTEGER)), 0) + 1 as next_num
      FROM addresses
      WHERE code LIKE $1
    `;
    const result = await pool.query(query, [`${cityCode}-%`]);
    return result.rows[0].next_num;
  }

  static async create(code, cityCode, lat, lng, country, state) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.createAddress(code, cityCode, lat, lng, country, state);
    }

    const query = `
      INSERT INTO addresses (code, city_code, latitude, longitude, country, state, location)
      VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($4, $3), 4326))
      RETURNING *
    `;
    const result = await pool.query(query, [code, cityCode, lat, lng, country, state]);
    return result.rows[0];
  }

  static async getStats() {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.getAddressStats();
    }

    const query = `
      SELECT
        city_code,
        COUNT(*) as total_addresses,
        COUNT(DISTINCT DATE(created_at)) as active_days
      FROM addresses
      GROUP BY city_code
      ORDER BY total_addresses DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

export default Address;