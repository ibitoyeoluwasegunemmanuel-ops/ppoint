import pool from '../db/pool.js';

class GovernmentMetrics {
  static async recordMetric(data) {
    const {
      regionId, metricType, value, category, metadata
    } = data;

    const result = await pool.query(
      `INSERT INTO government_metrics
        (region_id, metric_type, value, category, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [regionId, metricType, value, category, metadata ? JSON.stringify(metadata) : null]
    );
    return result.rows[0];
  }

  static async getMetricsByRegion(regionId, metricType = null, limit = 100) {
    let query = 'SELECT * FROM government_metrics WHERE region_id = $1';
    const params = [regionId];
    let paramIndex = 2;

    if (metricType) {
      query += ` AND metric_type = $${paramIndex}`;
      params.push(metricType);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC LIMIT $' + paramIndex;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getCoverageStats(regionId = null) {
    let query = `
      SELECT
        COUNT(DISTINCT region_id) as regions_covered,
        SUM(CASE WHEN metric_type = 'total_addresses' THEN value ELSE 0 END) as total_addresses,
        SUM(CASE WHEN metric_type = 'verified_addresses' THEN value ELSE 0 END) as verified_addresses,
        SUM(CASE WHEN metric_type = 'active_agents' THEN value ELSE 0 END) as active_agents,
        SUM(CASE WHEN metric_type = 'pending_verification' THEN value ELSE 0 END) as pending_verification
      FROM government_metrics
      WHERE created_at > NOW() - INTERVAL '30 days'
    `;
    const params = [];

    if (regionId) {
      query += ` AND region_id = $1`;
      params.push(regionId);
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  static async getAggregateStats(startDate = null, endDate = null) {
    let query = `
      SELECT
        metric_type,
        SUM(value) as total_value,
        AVG(value) as avg_value,
        COUNT(*) as measurements
      FROM government_metrics
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` GROUP BY metric_type ORDER BY metric_type`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getTrendData(regionId, metricType, days = 30) {
    const result = await pool.query(
      `SELECT
        DATE(created_at) as date,
        AVG(value) as avg_value,
        MAX(value) as max_value,
        MIN(value) as min_value
       FROM government_metrics
       WHERE region_id = $1 AND metric_type = $2 
             AND created_at > NOW() - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [regionId, metricType]
    );
    return result.rows;
  }
}

export default GovernmentMetrics;
