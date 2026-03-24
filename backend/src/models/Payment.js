import pool from '../config/database.js';
import { inMemoryStore } from '../data/inMemoryStore.js';

class Payment {
  static async create({ developer_id, plan_slug, payment_method, amount, currency, proof_name, proof_data, proof_reference }) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.createPayment({ developer_id, plan_slug, payment_method, amount, currency, proof_name, proof_data, proof_reference });
    }
    const query = `
      INSERT INTO payments (developer_id, plan_slug, payment_method, amount, currency, proof_name, proof_data, proof_reference)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await pool.query(query, [developer_id, plan_slug, payment_method, amount, currency, proof_name, proof_data, proof_reference]);
    return result.rows[0];
  }

  static async list() {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.listPayments();
    }
    const query = 'SELECT p.*, d.company_name as developer_name FROM payments p LEFT JOIN developers d ON p.developer_id = d.id ORDER BY p.created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  static async updateStatus(id, status) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.updatePaymentStatus(id, status);
    }
    const query = 'UPDATE payments SET status = $1, reviewed_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }
}

export default Payment;
