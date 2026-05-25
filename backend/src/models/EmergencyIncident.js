import pool from '../db/pool.js';

class EmergencyIncident {
  static async create(data) {
    const {
      reporterName, reporterPhone, location, latitude, longitude,
      incidentType, description, severity, address
    } = data;

    const result = await pool.query(
      `INSERT INTO emergency_incidents
        (reporter_name, reporter_phone, location, latitude, longitude,
         incident_type, description, severity, address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'reported')
       RETURNING *`,
      [reporterName, reporterPhone, location, latitude, longitude,
       incidentType, description, severity, address]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM emergency_incidents WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM emergency_incidents WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.severity) {
      query += ` AND severity = $${paramIndex}`;
      params.push(filters.severity);
      paramIndex++;
    }

    if (filters.incidentType) {
      query += ` AND incident_type = $${paramIndex}`;
      params.push(filters.incidentType);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async updateStatus(id, status, dispatcherId = null) {
    const result = await pool.query(
      `UPDATE emergency_incidents
       SET status = $1, dispatcher_id = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, dispatcherId, id]
    );
    return result.rows[0];
  }

  static async assignDispatcher(id, dispatcherId, dispatcherName) {
    const result = await pool.query(
      `UPDATE emergency_incidents
       SET dispatcher_id = $1, dispatcher_name = $2, status = 'assigned',
           assigned_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [dispatcherId, dispatcherName, id]
    );
    return result.rows[0];
  }

  static async closeIncident(id, resolutionNotes) {
    const result = await pool.query(
      `UPDATE emergency_incidents
       SET status = 'closed', resolution_notes = $1,
           closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [resolutionNotes, id]
    );
    return result.rows[0];
  }

  static async countByStatus(status) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM emergency_incidents WHERE status = $1',
      [status]
    );
    return parseInt(result.rows[0].count);
  }

  static async getStats() {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'reported' THEN 1 ELSE 0 END) as reported,
        SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_count,
        AVG(EXTRACT(EPOCH FROM (COALESCE(closed_at, CURRENT_TIMESTAMP) - created_at))) as avg_response_time
      FROM emergency_incidents
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);
    return result.rows[0];
  }

  static async getByDispatcher(dispatcherId) {
    const result = await pool.query(
      `SELECT * FROM emergency_incidents
       WHERE dispatcher_id = $1
       ORDER BY created_at DESC`,
      [dispatcherId]
    );
    return result.rows;
  }
}

export default EmergencyIncident;
