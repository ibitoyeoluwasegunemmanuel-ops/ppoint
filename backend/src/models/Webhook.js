import pool from '../db/pool.js';

class Webhook {
  static async create(data) {
    const { userId, url, events, active = true, secret } = data;
    const result = await pool.query(`
      INSERT INTO webhooks (user_id, url, events, active, secret)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, url, JSON.stringify(events), active, secret]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM webhooks WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await pool.query(
      'SELECT id, url, events, active, last_triggered_at, created_at FROM webhooks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  static async update(id, data) {
    const { url, events, active } = data;
    const result = await pool.query(`
      UPDATE webhooks SET url = $1, events = $2, active = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [url, JSON.stringify(events), active, id]);
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM webhooks WHERE id = $1', [id]);
  }

  static async getWebhooksForEvent(eventType) {
    const result = await pool.query(`
      SELECT * FROM webhooks
      WHERE active = true AND events @> $1::jsonb
      ORDER BY created_at DESC
    `, [JSON.stringify([eventType])]);
    return result.rows;
  }

  static async logEvent(webhookId, eventType, payload, statusCode) {
    await pool.query(`
      INSERT INTO webhook_logs (webhook_id, event_type, payload, status_code)
      VALUES ($1, $2, $3, $4)
    `, [webhookId, eventType, JSON.stringify(payload), statusCode]);
  }

  static async updateLastTriggered(id) {
    await pool.query(
      'UPDATE webhooks SET last_triggered_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  static async getWebhookStats(userId) {
    const result = await pool.query(`
      SELECT
        COUNT(DISTINCT w.id) as total_webhooks,
        COUNT(DISTINCT CASE WHEN w.active = true THEN w.id END) as active_webhooks,
        COUNT(DISTINCT wl.id) as total_events,
        COUNT(DISTINCT CASE WHEN wl.status_code >= 200 AND wl.status_code < 300 THEN wl.id END) as successful_events,
        COUNT(DISTINCT CASE WHEN wl.status_code >= 400 THEN wl.id END) as failed_events
      FROM webhooks w
      LEFT JOIN webhook_logs wl ON w.id = wl.webhook_id
      WHERE w.user_id = $1
    `, [userId]);
    return result.rows[0];
  }
}

export default Webhook;
