import pool from '../config/database.js';
import { inMemoryStore } from '../data/inMemoryStore.js';

class PublicUsage {
  static async getCheck(identifier) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.checkPublicUsage(identifier);
    }
    const query = 'SELECT * FROM public_usage WHERE identifier = $1';
    const result = await pool.query(query, [identifier]);
    const record = result.rows[0];
    const count = record ? record.count : 0;
    return {
      count,
      isExceeded: count >= 3,
      remaining: Math.max(0, 3 - count)
    };
  }

  static async increment(identifier) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.incrementPublicUsage(identifier);
    }
    const query = `
      INSERT INTO public_usage (identifier, count, last_generation_at, updated_at)
      VALUES ($1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (identifier) DO UPDATE
      SET count = public_usage.count + 1, last_generation_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      RETURNING count
    `;
    const result = await pool.query(query, [identifier]);
    return result.rows[0].count;
  }
}

export default PublicUsage;
