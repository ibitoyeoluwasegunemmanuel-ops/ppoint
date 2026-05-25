import pool from '../db/pool.js';

class Invoice {
  static async create(data) {
    const {
      developerId, invoiceNumber, amount, currency, status,
      dueDate, description, items, notes
    } = data;

    const result = await pool.query(
      `INSERT INTO invoices
        (developer_id, invoice_number, amount, currency, status,
         due_date, description, items, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [developerId, invoiceNumber, amount, currency, status || 'draft',
       dueDate, description, items ? JSON.stringify(items) : null, notes]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByNumber(invoiceNumber) {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE invoice_number = $1',
      [invoiceNumber]
    );
    return result.rows[0];
  }

  static async findByDeveloperId(developerId, limit = 50) {
    const result = await pool.query(
      `SELECT * FROM invoices
       WHERE developer_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [developerId, limit]
    );
    return result.rows;
  }

  static async updateStatus(id, status, notes = null) {
    const result = await pool.query(
      `UPDATE invoices
       SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, notes, id]
    );
    return result.rows[0];
  }

  static async getStats() {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as overdue_amount,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count
      FROM invoices
    `);
    return result.rows[0];
  }

  static async getOverdueInvoices() {
    const result = await pool.query(
      `SELECT * FROM invoices
       WHERE status IN ('pending', 'sent') AND due_date < CURRENT_DATE
       ORDER BY due_date ASC`
    );
    return result.rows;
  }

  static async countByStatus(status) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM invoices WHERE status = $1',
      [status]
    );
    return parseInt(result.rows[0].count);
  }
}

export default Invoice;
