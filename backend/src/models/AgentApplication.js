import pool from '../config/database.js';

export default class AgentApplication {
  // Create a new application
  static async create(data) {
    const {
      userId, name, email, phone, country, state,
      experience, references, documents, status = 'pending'
    } = data;

    const appliedDate = new Date();

    const { rows } = await pool.query(
      `INSERT INTO agent_applications
       (user_id, name, email, phone, country, state, experience, references, documents, status, applied_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [userId, name, email, phone, country, state, experience, references, JSON.stringify(documents || []), status, appliedDate, new Date()]
    );

    return this._formatRow(rows[0]);
  }

  // Find application by ID
  static async findById(id) {
    const { rows } = await pool.query(
      'SELECT * FROM agent_applications WHERE id = $1',
      [id]
    );
    return rows[0] ? this._formatRow(rows[0]) : null;
  }

  // Find all applications for a user
  static async findByUserId(userId) {
    const { rows } = await pool.query(
      'SELECT * FROM agent_applications WHERE user_id = $1 ORDER BY applied_date DESC',
      [userId]
    );
    return rows.map(row => this._formatRow(row));
  }

  // Get all applications with optional filters
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM agent_applications WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.country) {
      query += ` AND country = $${paramCount}`;
      params.push(filters.country);
      paramCount++;
    }

    if (filters.state) {
      query += ` AND state = $${paramCount}`;
      params.push(filters.state);
      paramCount++;
    }

    query += ' ORDER BY applied_date DESC';

    const { rows } = await pool.query(query, params);
    return rows.map(row => this._formatRow(row));
  }

  // Update application status and review info
  static async updateReview(id, reviewData) {
    const { status, reviewedBy, notes } = reviewData;
    const reviewDate = new Date();

    const { rows } = await pool.query(
      `UPDATE agent_applications
       SET status = $1, reviewed_by = $2, review_date = $3, notes = $4
       WHERE id = $5
       RETURNING *`,
      [status, reviewedBy, reviewDate, notes, id]
    );

    return rows[0] ? this._formatRow(rows[0]) : null;
  }

  // Get count by status
  static async countByStatus(status) {
    const { rows } = await pool.query(
      'SELECT COUNT(*) as count FROM agent_applications WHERE status = $1',
      [status]
    );
    return parseInt(rows[0].count, 10);
  }

  // Helper to format row data
  static _formatRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      country: row.country,
      state: row.state,
      experience: row.experience,
      references: row.references,
      documents: typeof row.documents === 'string' ? JSON.parse(row.documents) : (row.documents || []),
      status: row.status,
      createdAt: row.created_at,
      appliedDate: row.applied_date,
      reviewedBy: row.reviewed_by,
      reviewDate: row.review_date,
      notes: row.notes,
      score: row.score
    };
  }

  // Calculate application score (0-100)
  static generateScore(application) {
    let score = 0;

    // Experience scoring (0-40 points)
    const expScore = Math.min(application.experience * 5, 40);
    score += expScore;

    // References scoring (0-30 points)
    const referenceCount = (application.references || '').split('\n').filter(r => r.trim()).length;
    const refScore = Math.min(referenceCount * 10, 30);
    score += refScore;

    // Documents scoring (0-30 points)
    const docCount = (application.documents || []).length;
    const docScore = Math.min(docCount * 10, 30);
    score += docScore;

    return Math.round(score);
  }
}
