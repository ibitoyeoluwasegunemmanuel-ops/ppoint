import pool from '../db/pool.js';

class APIUsage {
  static async logUsage(data) {
    const {
      apiKeyId, endpoint, method, statusCode, responseTime,
      requestSize, responseSize, ipAddress, userId, tier
    } = data;

    const result = await pool.query(
      `INSERT INTO api_usage_logs
        (api_key_id, endpoint, method, status_code, response_time_ms,
         request_size, response_size, ip_address, user_id, tier)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [apiKeyId, endpoint, method, statusCode, responseTime,
       requestSize, responseSize, ipAddress, userId, tier]
    );
    return result.rows[0];
  }

  static async getUsageStats(apiKeyId, startDate = null, endDate = null) {
    let query = `
      SELECT
        COUNT(*) as total_requests,
        SUM(response_time_ms) as total_response_time,
        AVG(response_time_ms) as avg_response_time,
        MIN(response_time_ms) as min_response_time,
        MAX(response_time_ms) as max_response_time,
        SUM(request_size) as total_request_size,
        SUM(response_size) as total_response_size,
        SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as successful_requests,
        SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as failed_requests
      FROM api_usage_logs
      WHERE api_key_id = $1
    `;
    const params = [apiKeyId];
    let paramIndex = 2;

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

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  static async getEndpointStats(apiKeyId, limit = 10) {
    const result = await pool.query(
      `SELECT
        endpoint,
        method,
        COUNT(*) as call_count,
        AVG(response_time_ms) as avg_response_time,
        SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count
       FROM api_usage_logs
       WHERE api_key_id = $1
       GROUP BY endpoint, method
       ORDER BY call_count DESC
       LIMIT $2`,
      [apiKeyId, limit]
    );
    return result.rows;
  }

  static async getDailyStats(apiKeyId, days = 30) {
    const result = await pool.query(
      `SELECT
        DATE(created_at) as date,
        COUNT(*) as requests,
        AVG(response_time_ms) as avg_response_time,
        SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errors
       FROM api_usage_logs
       WHERE api_key_id = $1 AND created_at > NOW() - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [apiKeyId]
    );
    return result.rows;
  }

  static async getStatusCodeDistribution(apiKeyId) {
    const result = await pool.query(
      `SELECT
        status_code,
        COUNT(*) as count
       FROM api_usage_logs
       WHERE api_key_id = $1
       GROUP BY status_code
       ORDER BY status_code`,
      [apiKeyId]
    );
    return result.rows;
  }

  static async getTierStats(tier, startDate = null) {
    let query = `
      SELECT
        COUNT(*) as total_requests,
        COUNT(DISTINCT api_key_id) as unique_users,
        AVG(response_time_ms) as avg_response_time,
        SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count
      FROM api_usage_logs
      WHERE tier = $1
    `;
    const params = [tier];

    if (startDate) {
      query += ` AND created_at > $2`;
      params.push(startDate);
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  static async cleanup(daysToKeep = 90) {
    const result = await pool.query(
      `DELETE FROM api_usage_logs
       WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
       RETURNING id`
    );
    return result.rowCount;
  }
}

export default APIUsage;
