import pool from '../db/pool.js';

class GovernmentHierarchy {
  static async createRegion(data) {
    const {
      level, parentId, name, code, country, latitude, longitude, type
    } = data;

    const result = await pool.query(
      `INSERT INTO government_hierarchy
        (level, parent_id, name, code, country, latitude, longitude, type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [level, parentId, name, code, country, latitude, longitude, type]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM government_hierarchy WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByCode(code) {
    const result = await pool.query(
      'SELECT * FROM government_hierarchy WHERE code = $1',
      [code]
    );
    return result.rows[0];
  }

  static async findByLevel(level, parentId = null) {
    let query = 'SELECT * FROM government_hierarchy WHERE level = $1';
    const params = [level];
    let paramIndex = 2;

    if (parentId) {
      query += ` AND parent_id = $${paramIndex}`;
      params.push(parentId);
    }

    query += ' ORDER BY name';
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getChildren(parentId) {
    const result = await pool.query(
      'SELECT * FROM government_hierarchy WHERE parent_id = $1 ORDER BY name',
      [parentId]
    );
    return result.rows;
  }

  static async getCountries() {
    const result = await pool.query(
      'SELECT DISTINCT country FROM government_hierarchy ORDER BY country'
    );
    return result.rows.map(r => r.country);
  }

  static async getHierarchyPath(id) {
    const result = await pool.query(
      `WITH RECURSIVE path AS (
        SELECT id, parent_id, name, level FROM government_hierarchy WHERE id = $1
        UNION ALL
        SELECT gh.id, gh.parent_id, gh.name, gh.level 
        FROM government_hierarchy gh
        JOIN path ON gh.id = path.parent_id
      ) SELECT id, name, level FROM path ORDER BY level`,
      [id]
    );
    return result.rows;
  }

  static async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE government_hierarchy
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }

  static async getStats() {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_regions,
        COUNT(CASE WHEN level = 'country' THEN 1 END) as countries,
        COUNT(CASE WHEN level = 'state' THEN 1 END) as states,
        COUNT(CASE WHEN level = 'city' THEN 1 END) as cities,
        COUNT(CASE WHEN level = 'area' THEN 1 END) as areas
      FROM government_hierarchy
    `);
    return result.rows[0];
  }
}

export default GovernmentHierarchy;
