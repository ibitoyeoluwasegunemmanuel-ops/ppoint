import pool from '../db/pool.js';
import crypto from 'crypto';

class GovernmentAgent {
  static async create(data) {
    const {
      regionId, name, email, phone, role, department,
      level, jurisdiction, status
    } = data;

    const agentId = 'GOV_' + crypto.randomBytes(8).toString('hex').toUpperCase();

    const result = await pool.query(
      `INSERT INTO government_agents
        (region_id, agent_id, name, email, phone, role, department,
         level, jurisdiction, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [regionId, agentId, name, email, phone, role, department, level, jurisdiction, status || 'active']
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM government_agents WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByRegion(regionId, limit = 100) {
    const result = await pool.query(
      `SELECT * FROM government_agents
       WHERE region_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [regionId, limit]
    );
    return result.rows;
  }

  static async findByRole(role) {
    const result = await pool.query(
      `SELECT * FROM government_agents
       WHERE role = $1 AND status = 'active'
       ORDER BY name`,
      [role]
    );
    return result.rows;
  }

  static async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE government_agents
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
        COUNT(*) as total_agents,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_agents,
        COUNT(DISTINCT role) as unique_roles,
        COUNT(DISTINCT level) as operational_levels
      FROM government_agents
    `);
    return result.rows[0];
  }

  static async getByRole(role) {
    const result = await pool.query(
      `SELECT role, COUNT(*) as count FROM government_agents
       WHERE status = 'active'
       GROUP BY role
       ORDER BY count DESC`
    );
    return result.rows;
  }
}

export default GovernmentAgent;
