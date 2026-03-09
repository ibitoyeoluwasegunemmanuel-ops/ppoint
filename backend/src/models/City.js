import pool from '../config/database.js';
import { inMemoryStore } from '../data/inMemoryStore.js';

class City {
  static async findByCoordinates(lat, lng) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.findCityByCoordinates(lat, lng);
    }

    const query = `
      SELECT
        c.*,
        s.state_name AS state,
        co.country_name AS country
      FROM cities c
      JOIN states s ON c.state_id = s.id
      JOIN countries co ON c.country_id = co.id
      WHERE ST_Contains(boundary, ST_SetSRID(ST_MakePoint($1, $2), 4326))
      AND c.is_active = true
      LIMIT 1
    `;
    const result = await pool.query(query, [lng, lat]);
    return result.rows[0];
  }

  static async findByCode(code) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.findCityByCode(code);
    }

    const query = `
      SELECT
        c.*,
        s.state_name AS state,
        co.country_name AS country
      FROM cities c
      JOIN states s ON c.state_id = s.id
      JOIN countries co ON c.country_id = co.id
      WHERE c.city_code = $1
    `;
    const result = await pool.query(query, [code]);
    return result.rows[0];
  }

  static async getAllActive() {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.getAllActiveCities();
    }

    const query = `
      SELECT c.*, co.country_name, s.state_name
      FROM cities c
      JOIN countries co ON c.country_id = co.id
      JOIN states s ON c.state_id = s.id
      WHERE c.is_active = true
      ORDER BY co.country_name, c.city_name
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async activateCity(id) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.activateCity(id);
    }

    const query = 'UPDATE cities SET is_active = true WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

export default City;