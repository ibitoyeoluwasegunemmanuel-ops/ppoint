import pool from '../db/pool.js';

class Analytics {
  static async recordEvent(eventType, userId, metadata) {
    await pool.query(
      `INSERT INTO analytics_events (event_type, user_id, metadata)
       VALUES ($1, $2, $3)`,
      [eventType, userId, metadata ? JSON.stringify(metadata) : null]
    );
  }

  static async getDashboardMetrics(days = 30) {
    const result = await pool.query(`
      SELECT
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as total_events,
        COUNT(CASE WHEN event_type = 'login' THEN 1 END) as logins,
        COUNT(CASE WHEN event_type = 'transaction' THEN 1 END) as transactions
      FROM analytics_events
      WHERE created_at > NOW() - INTERVAL '${days} days'
    `);
    return result.rows[0];
  }

  static async getTrendData(eventType, days = 30) {
    const result = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM analytics_events
      WHERE event_type = $1 AND created_at > NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC`,
      [eventType]
    );
    return result.rows;
  }
}

export default Analytics;
