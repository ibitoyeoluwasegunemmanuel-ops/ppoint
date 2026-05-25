import pool from '../db/pool.js';

class Subscription {
  static async create(data) {
    const {
      developerId, tier, billingCycle, amount, status, startDate, nextBillingDate
    } = data;

    const result = await pool.query(
      `INSERT INTO subscriptions
        (developer_id, tier, billing_cycle, amount, status, start_date, next_billing_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [developerId, tier, billingCycle, amount, status || 'active', startDate, nextBillingDate]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByDeveloperId(developerId) {
    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE developer_id = $1',
      [developerId]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE subscriptions
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }

  static async updateTier(id, tier, amount) {
    const result = await pool.query(
      `UPDATE subscriptions
       SET tier = $1, amount = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [tier, amount, id]
    );
    return result.rows[0];
  }

  static async renewalDue() {
    const result = await pool.query(
      `SELECT * FROM subscriptions
       WHERE status = 'active' AND next_billing_date <= CURRENT_DATE`
    );
    return result.rows;
  }

  static async getStats() {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_subscriptions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_count,
        SUM(amount) as monthly_recurring_revenue,
        COUNT(DISTINCT developer_id) as unique_developers
      FROM subscriptions
    `);
    return result.rows[0];
  }

  static async countByTier(tier) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM subscriptions WHERE tier = $1 AND status = $2',
      [tier, 'active']
    );
    return parseInt(result.rows[0].count);
  }
}

export default Subscription;
