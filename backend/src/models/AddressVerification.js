import pool from '../db/pool.js';

class AddressVerification {
  static async create(data) {
    const { addressCode, latitude, longitude, status, confidence, verificationMethod } = data;
    const result = await pool.query(
      `INSERT INTO address_verification
        (address_code, latitude, longitude, status, confidence, verification_method)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [addressCode, latitude, longitude, status || 'pending', confidence || 0, verificationMethod]
    );
    return result.rows[0];
  }

  static async updateStatus(code, status, confidence = null) {
    const result = await pool.query(
      `UPDATE address_verification SET status = $1, confidence = $2, verified_at = CURRENT_TIMESTAMP 
       WHERE address_code = $3 RETURNING *`,
      [status, confidence, code]
    );
    return result.rows[0];
  }

  static async getStats() {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        AVG(confidence) as avg_confidence
      FROM address_verification
    `);
    return result.rows[0];
  }
}

export default AddressVerification;
