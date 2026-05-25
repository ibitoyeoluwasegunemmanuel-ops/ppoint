import pool from '../db/pool.js';

class NotificationTemplate {
  static async create(data) {
    const {
      name, type, channel, subject, body, variables
    } = data;

    const result = await pool.query(
      `INSERT INTO notification_templates
        (name, type, channel, subject, body, variables)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, type, channel, subject, body, variables ? JSON.stringify(variables) : null]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM notification_templates WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByType(type) {
    const result = await pool.query(
      'SELECT * FROM notification_templates WHERE type = $1 ORDER BY name',
      [type]
    );
    return result.rows;
  }

  static async findByChannel(channel) {
    const result = await pool.query(
      'SELECT * FROM notification_templates WHERE channel = $1 ORDER BY name',
      [channel]
    );
    return result.rows;
  }

  static async getAll() {
    const result = await pool.query(
      'SELECT * FROM notification_templates ORDER BY type, channel'
    );
    return result.rows;
  }

  static async update(id, data) {
    const { subject, body } = data;
    const result = await pool.query(
      `UPDATE notification_templates SET subject = $1, body = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [subject, body, id]
    );
    return result.rows[0];
  }
}

export default NotificationTemplate;
