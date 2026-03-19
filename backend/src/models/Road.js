import pool from '../config/database.js';
import { inMemoryStore } from '../data/inMemoryStore.js';

class Road {
  static async list() {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.getRoads();
    }
    const result = await pool.query('SELECT * FROM roads');
    return result.rows;
  }

  static async findNearest(lat, lng, radius = 50) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.findNearestRoad(lat, lng, radius);
    }
    
    // Using PostGIS to find nearest road segment
    const query = `
      SELECT *,
        ST_Distance(
          geometry::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance
      FROM roads
      WHERE ST_DWithin(
        geometry::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      ORDER BY distance
      LIMIT 1
    `;
    const result = await pool.query(query, [lng, lat, radius]);
    return result.rows[0];
  }
}

export default Road;
