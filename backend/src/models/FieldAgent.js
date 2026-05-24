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

  static async getTerritory(id) {
    if (inMemoryStore.isEnabled()) {
      const agent = inMemoryStore.getAgentById(id);
      return agent ? { territory: agent.territory, city: agent.city, state: agent.state } : null;
    }
    const query = 'SELECT id, territory, city, state, country FROM field_agents WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getVerificationTasks(agentId) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.getAgentVerificationTasks(agentId);
    }
    const query = `
      SELECT a.*,
        COALESCE(c.verification_count, 0) as verification_count,
        COALESCE(c.community_rating, 0) as community_rating
      FROM addresses a
      WHERE a.state = (SELECT state FROM field_agents WHERE id = $1)
      AND a.moderation_status = 'active'
      AND (a.verification_count < 5 OR a.community_rating < 3)
      ORDER BY a.verification_count ASC, a.created_at DESC
      LIMIT 20
    `;
    const result = await pool.query(query, [agentId]);
    return result.rows;
  }

  static async recordVerification(agentId, addressCode, verified) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.recordAgentVerification(agentId, addressCode, verified);
    }
    const query = `
      INSERT INTO agent_verifications (agent_id, address_code, verified_at, verified)
      VALUES ($1, $2, NOW(), $3)
      RETURNING *
    `;
    const result = await pool.query(query, [agentId, addressCode, verified]);
    return result.rows[0];
  }

  static async getStats(id) {
    if (inMemoryStore.isEnabled()) {
      const agent = inMemoryStore.getAgentById(id);
      if (!agent) return null;
      return {
        id: agent.id,
        full_name: agent.full_name,
        territory: agent.territory,
        state: agent.state,
        certification_level: agent.certification_level || 'Bronze',
        verification_count: agent.verification_count || 0,
        accuracy_score: agent.accuracy_score || 0,
        total_earnings: agent.total_earnings || 0,
        earnings_balance: agent.earnings_balance || 0,
      };
    }
    const query = `
      SELECT
        fa.id, fa.full_name, fa.territory, fa.state,
        COALESCE(fa.certification_level, 'Bronze') as certification_level,
        COUNT(av.id) as verification_count,
        COALESCE(fa.accuracy_score, 0) as accuracy_score,
        COALESCE(fa.total_earnings, 0) as total_earnings,
        COALESCE(fa.earnings_balance, 0) as earnings_balance
      FROM field_agents fa
      LEFT JOIN agent_verifications av ON fa.id = av.agent_id
      WHERE fa.id = $1
      GROUP BY fa.id, fa.full_name, fa.territory, fa.state, fa.certification_level, fa.accuracy_score, fa.total_earnings, fa.earnings_balance
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async leaderboard(state, limit = 10) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.getAgentLeaderboard(state, limit);
    }
    const query = `
      SELECT
        fa.id, fa.full_name, fa.territory, fa.state,
        COALESCE(fa.certification_level, 'Bronze') as certification_level,
        COUNT(av.id) as verification_count,
        COALESCE(fa.accuracy_score, 0) as accuracy_score,
        COALESCE(fa.total_earnings, 0) as total_earnings
      FROM field_agents fa
      LEFT JOIN agent_verifications av ON fa.id = av.agent_id
      WHERE fa.state = $1
      GROUP BY fa.id, fa.full_name, fa.territory, fa.state, fa.certification_level, fa.accuracy_score, fa.total_earnings
      ORDER BY verification_count DESC, accuracy_score DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [state, limit]);
    return result.rows;
  }

  static calculateCertificationLevel(verificationCount) {
    if (verificationCount >= 500) return 'Gold';
    if (verificationCount >= 100) return 'Silver';
    return 'Bronze';
  }

  static calculatePayout(verificationCount) {
    const level = this.calculateCertificationLevel(verificationCount);
    if (level === 'Gold') return 250;
    if (level === 'Silver') return 150;
    return 50;
  }
}

export default FieldAgent;
