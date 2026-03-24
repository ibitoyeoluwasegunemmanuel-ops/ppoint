import pool from '../config/database.js';
import { inMemoryStore } from '../data/inMemoryStore.js';

class FieldAgent {
  static async list() {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.listAgents();
    }
    const query = 'SELECT * FROM field_agents ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  static async findById(id) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.getAgentById(id);
    }
    const query = 'SELECT * FROM field_agents WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async register({ fullName, phoneNumber, email, country, state, city, territory }) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.registerAgent({ fullName, phoneNumber, email, country, state, city, territory });
    }
    const query = `
      INSERT INTO field_agents (full_name, phone_number, email, country, state, city, territory)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await pool.query(query, [fullName, phoneNumber, email, country, state, city, territory]);
    return result.rows[0];
  }

  static async updateEarnings(id, amount) {
    if (inMemoryStore.isEnabled()) {
      // Logic would be in the service but for memoryStore we update balance
      const agent = inMemoryStore.getAgentById(id);
      if (agent) {
        agent.earnings_balance = (agent.earnings_balance || 0) + amount;
      }
      return agent;
    }
    const query = 'UPDATE field_agents SET earnings_balance = COALESCE(earnings_balance, 0) + $1 WHERE id = $2 RETURNING *';
    const result = await pool.query(query, [amount, id]);
    return result.rows[0];
  }

  static async withdraw(id, amount) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.requestWithdrawal(id, amount);
    }
    const query = 'UPDATE field_agents SET earnings_balance = earnings_balance - $1 WHERE id = $2 AND earnings_balance >= $1 RETURNING *';
    const result = await pool.query(query, [amount, id]);
    if (result.rowCount === 0) throw new Error('Insufficient balance or agent not found');
    return result.rows[0];
  }
}

export default FieldAgent;
