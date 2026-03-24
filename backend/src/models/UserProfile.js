import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ppoint'
});

export default class UserProfile {
  static async findById(id) {
    const { rows } = await pool.query('SELECT * FROM user_profiles WHERE id = $1', [id]);
    return rows[0];
  }

  static async findByPhone(phone) {
    const { rows } = await pool.query('SELECT * FROM user_profiles WHERE phone_number = $1', [phone]);
    return rows[0];
  }

  static async searchByName(name) {
    const { rows } = await pool.query(
      'SELECT id, full_name, avatar_url, ppoint_count FROM user_profiles WHERE full_name ILIKE $1 LIMIT 20',
      [`%${name}%`]
    );
    return rows;
  }

  static async create(data) {
    const { rows } = await pool.query(
      'INSERT INTO user_profiles (full_name, phone_number, email) VALUES ($1, $2, $3) RETURNING *',
      [data.fullName, data.phoneNumber, data.email]
    );
    return rows[0];
  }

  static async incrementCount(id) {
    await pool.query('UPDATE user_profiles SET ppoint_count = ppoint_count + 1 WHERE id = $1', [id]);
  }
}
