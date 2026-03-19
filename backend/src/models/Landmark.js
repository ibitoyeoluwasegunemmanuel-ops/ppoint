import pool from '../config/database.js';
import { inMemoryStore } from '../data/inMemoryStore.js';

class Landmark {
  static async list() {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.getLandmarks();
    }
    const result = await pool.query('SELECT * FROM landmarks');
    return result.rows;
  }

  static async findNearby(lat, lng, radius = 300) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.findNearbyLandmarks(lat, lng, radius);
    }
    
    const query = `
      SELECT *,
        ST_Distance(
          location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance
      FROM landmarks
      WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      ORDER BY distance
      LIMIT 10
    `;
    const result = await pool.query(query, [lng, lat, radius]);
    return result.rows;
  }

  static async create(data) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.createLandmark(data);
    }
    const query = `
      INSERT INTO landmarks (name, type, latitude, longitude, city, state, country, location)
      VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($4, $3), 4326))
      RETURNING *
    `;
    const result = await pool.query(query, [
      data.name,
      data.type,
      data.latitude,
      data.longitude,
      data.city,
      data.state,
      data.country
    ]);
    return result.rows[0];
  }
}

export default Landmark;
