import pool from '../db/pool.js';

class ExportService {
  static async exportUserData(filters = {}) {
    let query = 'SELECT id, email, tier, status, created_at FROM user_profiles WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.tier) {
      query += ` AND tier = $${paramIndex}`;
      params.push(filters.tier);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async exportAddressData(filters = {}) {
    let query = 'SELECT id, ppoint_code, street, city, state, country, status, confidence_score, created_at FROM buildings WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.country) {
      query += ` AND country = $${paramIndex}`;
      params.push(filters.country);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async exportTransactionData(filters = {}) {
    let query = `
      SELECT id, user_id, amount, status, payment_method, created_at
      FROM payments
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.method) {
      query += ` AND payment_method = $${paramIndex}`;
      params.push(filters.method);
      paramIndex++;
    }

    if (filters.dateFrom) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters.dateTo) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(filters.dateTo);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async exportAnalyticsData(eventType, days = 30) {
    const result = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count, event_type
      FROM analytics_events
      WHERE event_type = $1 AND created_at > NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at), event_type
      ORDER BY date DESC
    `, [eventType]);
    return result.rows;
  }

  static convertToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          const str = value.toString().replace(/"/g, '""');
          return str.includes(',') || str.includes('"') ? `"${str}"` : str;
        }).join(',')
      )
    ].join('\n');

    return csv;
  }

  static getCSVFilename(type) {
    const timestamp = new Date().toISOString().split('T')[0];
    const typeMap = {
      users: 'users_export',
      addresses: 'addresses_export',
      transactions: 'transactions_export',
      analytics: 'analytics_export'
    };
    return `${typeMap[type] || 'data_export'}_${timestamp}.csv`;
  }

  static async generateReport(reportType, filters = {}) {
    const timestamp = new Date().toISOString();
    let data, title;

    switch (reportType) {
      case 'users':
        data = await this.exportUserData(filters);
        title = 'User Accounts Report';
        break;
      case 'addresses':
        data = await this.exportAddressData(filters);
        title = 'Address Verification Report';
        break;
      case 'transactions':
        data = await this.exportTransactionData(filters);
        title = 'Transaction Report';
        break;
      case 'analytics':
        data = await this.exportAnalyticsData(filters.eventType || 'login', filters.days || 30);
        title = 'Analytics Report';
        break;
      default:
        throw new Error('Invalid report type');
    }

    return {
      title,
      timestamp,
      filters,
      dataCount: data.length,
      data
    };
  }

  static async scheduleReport(userId, reportType, filters = {}, recurrence = 'once') {
    const result = await pool.query(`
      INSERT INTO scheduled_reports (user_id, report_type, filters, recurrence, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *
    `, [userId, reportType, JSON.stringify(filters), recurrence]);
    return result.rows[0];
  }

  static async getScheduledReports(userId) {
    const result = await pool.query(`
      SELECT id, report_type, filters, recurrence, last_sent_at, created_at
      FROM scheduled_reports
      WHERE user_id = $1 AND active = true
      ORDER BY created_at DESC
    `, [userId]);
    return result.rows;
  }
}

export default ExportService;
