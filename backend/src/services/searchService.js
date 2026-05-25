import pool from '../db/pool.js';

class SearchService {
  static async searchUsers(query, limit = 20, offset = 0) {
    const searchTerm = `%${query}%`;
    const result = await pool.query(`
      SELECT id, email, tier, status, created_at
      FROM user_profiles
      WHERE email ILIKE $1 OR COALESCE(full_name, '') ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [searchTerm, limit, offset]);
    return result.rows;
  }

  static async searchAddresses(query, limit = 20, offset = 0) {
    const searchTerm = `%${query}%`;
    const result = await pool.query(`
      SELECT id, ppoint_code, street, city, state, country, status, created_at
      FROM buildings
      WHERE ppoint_code ILIKE $1 OR street ILIKE $1 OR city ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [searchTerm, limit, offset]);
    return result.rows;
  }

  static async searchBusinesses(query, limit = 20, offset = 0) {
    const searchTerm = `%${query}%`;
    const result = await pool.query(`
      SELECT id, business_name, email, tier, status, created_at
      FROM developer_accounts
      WHERE business_name ILIKE $1 OR email ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [searchTerm, limit, offset]);
    return result.rows;
  }

  static async searchAgents(query, limit = 20, offset = 0) {
    const searchTerm = `%${query}%`;
    const result = await pool.query(`
      SELECT id, name, email, country, status, created_at
      FROM agent_applications
      WHERE status = 'approved' AND (name ILIKE $1 OR email ILIKE $1)
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [searchTerm, limit, offset]);
    return result.rows;
  }

  static async searchEmergencies(query, limit = 20, offset = 0) {
    const searchTerm = `%${query}%`;
    const result = await pool.query(`
      SELECT id, incident_type, location_code, status, created_at
      FROM emergency_incidents
      WHERE incident_type ILIKE $1 OR location_code ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [searchTerm, limit, offset]);
    return result.rows;
  }

  static async globalSearch(query, limit = 10) {
    try {
      const [users, addresses, businesses, agents, emergencies] = await Promise.all([
        this.searchUsers(query, limit),
        this.searchAddresses(query, limit),
        this.searchBusinesses(query, limit),
        this.searchAgents(query, limit),
        this.searchEmergencies(query, limit)
      ]);

      return {
        query,
        results: {
          users: { count: users.length, data: users },
          addresses: { count: addresses.length, data: addresses },
          businesses: { count: businesses.length, data: businesses },
          agents: { count: agents.length, data: agents },
          emergencies: { count: emergencies.length, data: emergencies }
        },
        totalResults: users.length + addresses.length + businesses.length + agents.length + emergencies.length
      };
    } catch (error) {
      throw error;
    }
  }

  static async filterUsers(filters = {}, limit = 20, offset = 0) {
    let query = 'SELECT id, email, tier, status, created_at FROM user_profiles WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.tier) {
      query += ` AND tier = $${paramIndex}`;
      params.push(filters.tier);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.createdAfter) {
      query += ` AND created_at > $${paramIndex}`;
      params.push(filters.createdAfter);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async filterAddresses(filters = {}, limit = 20, offset = 0) {
    let query = 'SELECT id, ppoint_code, street, city, state, country, status FROM buildings WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.country) {
      query += ` AND country = $${paramIndex}`;
      params.push(filters.country);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.minAccuracy) {
      query += ` AND confidence_score >= $${paramIndex}`;
      params.push(filters.minAccuracy);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getSearchSuggestions(query, limit = 5) {
    const searchTerm = `${query}%`;
    const result = await pool.query(`
      (SELECT email as suggestion, 'user' as type FROM user_profiles WHERE email ILIKE $1 LIMIT $2)
      UNION ALL
      (SELECT street as suggestion, 'address' as type FROM buildings WHERE street ILIKE $1 LIMIT $2)
      UNION ALL
      (SELECT business_name as suggestion, 'business' as type FROM developer_accounts WHERE business_name ILIKE $1 LIMIT $2)
      LIMIT $2
    `, [searchTerm, limit]);
    return result.rows;
  }
}

export default SearchService;
