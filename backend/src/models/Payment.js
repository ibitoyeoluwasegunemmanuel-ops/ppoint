import pool from '../db/pool.js';

class Payment {
  static async create(data) {
    const {
      userId, developerId, amount, currency, method, status,
      reference, description, metadata
    } = data;

    const result = await pool.query(
      `INSERT INTO payments
        (user_id, developer_id, amount, currency, method, status,
         reference, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, developerId, amount, currency, method, status || 'pending',
       reference, description, metadata ? JSON.stringify(metadata) : null]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM payments WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByReference(reference) {
    const result = await pool.query(
      'SELECT * FROM payments WHERE reference = $1',
      [reference]
    );
    return result.rows[0];
  }

  static async findByDeveloperId(developerId, limit = 100) {
    const result = await pool.query(
      `SELECT * FROM payments
       WHERE developer_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [developerId, limit]
    );
    return result.rows;
  }

  static async updateStatus(id, status, notes = null) {
    const result = await pool.query(
      `UPDATE payments
       SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, notes, id]
    );
    return result.rows[0];
  }

  static async getStats(startDate = null, endDate = null) {
    let query = `
      SELECT
        COUNT(*) as total_transactions,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as avg_transaction,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
      FROM payments
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

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  static async getMonthlyRevenue(months = 12) {
    const result = await pool.query(
      `SELECT
        DATE_TRUNC('month', created_at) as month,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as revenue,
        COUNT(*) as transactions
       FROM payments
       WHERE created_at > NOW() - INTERVAL '${months} months' AND status = 'completed'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY month DESC`
    );
    return result.rows;
  }

  static async countByStatus(status) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM payments WHERE status = $1',
      [status]
    );
    return parseInt(result.rows[0].count);
  }
}

export default Payment;
