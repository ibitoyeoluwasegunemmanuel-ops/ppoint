import pool from '../db/pool.js';
import crypto from 'crypto';

class DeveloperAccount {
  static generateApiKey() {
    return 'ppt_' + crypto.randomBytes(32).toString('hex');
  }

  static async create(data) {
    const {
      userId, businessName, website, tier, email, contactPhone
    } = data;

    const apiKey = this.generateApiKey();
    const apiSecret = crypto.randomBytes(32).toString('hex');

    const result = await pool.query(
      `INSERT INTO developer_accounts
        (user_id, business_name, website, tier, email, contact_phone, api_key, api_secret)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, user_id, business_name, website, tier, email, api_key, created_at`,
      [userId, businessName, website, tier || 'free', email, contactPhone, apiKey, apiSecret]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT id, user_id, business_name, website, tier, email, contact_phone,
              api_key, status, created_at, updated_at, last_active
       FROM developer_accounts WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findByApiKey(apiKey) {
    const result = await pool.query(
      `SELECT id, user_id, business_name, tier, email, status, created_at
       FROM developer_accounts WHERE api_key = $1`,
      [apiKey]
    );
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const result = await pool.query(
      `SELECT id, user_id, business_name, website, tier, email,
              api_key, status, created_at, updated_at, last_active
       FROM developer_accounts WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  static async getAllDevelopers(limit = 100) {
    const result = await pool.query(
      `SELECT id, user_id, business_name, website, tier, email, status, created_at
       FROM developer_accounts
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  static async updateTier(id, newTier) {
    const result = await pool.query(
      `UPDATE developer_accounts
       SET tier = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [newTier, id]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE developer_accounts
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }

  static async updateLastActive(id) {
    await pool.query(
      `UPDATE developer_accounts
       SET last_active = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );
  }

  static async regenerateApiKey(id) {
    const apiKey = this.generateApiKey();
    const apiSecret = crypto.randomBytes(32).toString('hex');

    const result = await pool.query(
      `UPDATE developer_accounts
       SET api_key = $1, api_secret = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING api_key`,
      [apiKey, apiSecret, id]
    );
    return result.rows[0];
  }

  static async getDeveloperMetrics(id) {
    const result = await pool.query(
      `SELECT
        da.id, da.business_name, da.tier, da.created_at,
        COUNT(DISTINCT aul.endpoint) as unique_endpoints,
        COUNT(aul.id) as total_api_calls,
        AVG(aul.response_time_ms) as avg_response_time
       FROM developer_accounts da
       LEFT JOIN api_usage_logs aul ON da.api_key = aul.api_key_id
       WHERE da.id = $1
       GROUP BY da.id, da.business_name, da.tier, da.created_at`,
      [id]
    );
    return result.rows[0];
  }

  static async countByTier(tier) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM developer_accounts WHERE tier = $1',
      [tier]
    );
    return parseInt(result.rows[0].count);
  }
}

export default DeveloperAccount;
