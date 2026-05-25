import pool from '../db/pool.js';

class Notification {
  static async create(data) {
    const {
      userId, type, channel, subject, message, metadata,
      status, sentAt
    } = data;

    const result = await pool.query(
      `INSERT INTO notifications
        (user_id, type, channel, subject, message, metadata, status, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, type, channel, subject, message, metadata ? JSON.stringify(metadata) : null, status || 'pending', sentAt]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByUserId(userId, limit = 50) {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  static async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE notifications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }

  static async getStats() {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM notifications
    `);
    return result.rows[0];
  }

  static async getPending() {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE status = $1 ORDER BY created_at LIMIT 100',
      ['pending']
    );
    return result.rows;
  }
}

export default Notification;
