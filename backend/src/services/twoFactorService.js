import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import pool from '../db/pool.js';

class TwoFactorService {
  static async generateSecret(userEmail) {
    const secret = speakeasy.generateSecret({
      name: `PPoint (${userEmail})`,
      issuer: 'PPoint',
      length: 32
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode,
      otpauth_url: secret.otpauth_url
    };
  }

  static verifyToken(secret, token) {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2
    });
  }

  static async enable2FA(userId, secret) {
    const result = await pool.query(`
      UPDATE user_profiles
      SET two_factor_secret = $1, two_factor_enabled = true, two_factor_enabled_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email, two_factor_enabled
    `, [secret, userId]);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  static async disable2FA(userId) {
    const result = await pool.query(`
      UPDATE user_profiles
      SET two_factor_secret = NULL, two_factor_enabled = false
      WHERE id = $1
      RETURNING id, email, two_factor_enabled
    `, [userId]);

    return result.rows[0];
  }

  static async verify2FAToken(userId, token) {
    const result = await pool.query(
      'SELECT two_factor_secret, two_factor_enabled FROM user_profiles WHERE id = $1',
      [userId]
    );

    if (!result.rows[0] || !result.rows[0].two_factor_enabled) {
      throw new Error('2FA not enabled for this user');
    }

    const isValid = this.verifyToken(result.rows[0].two_factor_secret, token);
    if (!isValid) {
      throw new Error('Invalid 2FA token');
    }

    return true;
  }

  static async generateBackupCodes(userId) {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(this.generateRandomCode());
    }

    const hashedCodes = codes.map(code => ({
      code,
      hash: this.hashCode(code),
      used: false
    }));

    await pool.query(`
      UPDATE user_profiles
      SET backup_codes = $1
      WHERE id = $2
    `, [JSON.stringify(hashedCodes), userId]);

    return codes;
  }

  static async verifyBackupCode(userId, code) {
    const result = await pool.query(
      'SELECT backup_codes FROM user_profiles WHERE id = $1',
      [userId]
    );

    if (!result.rows[0] || !result.rows[0].backup_codes) {
      throw new Error('No backup codes found');
    }

    const codes = result.rows[0].backup_codes;
    const codeEntry = codes.find(c => !c.used && c.hash === this.hashCode(code));

    if (!codeEntry) {
      throw new Error('Invalid or used backup code');
    }

    const updatedCodes = codes.map(c =>
      c.hash === codeEntry.hash ? { ...c, used: true } : c
    );

    await pool.query(
      'UPDATE user_profiles SET backup_codes = $1 WHERE id = $2',
      [JSON.stringify(updatedCodes), userId]
    );

    return true;
  }

  static generateRandomCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  static hashCode(code) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  static async get2FAStatus(userId) {
    const result = await pool.query(
      'SELECT id, two_factor_enabled, two_factor_enabled_at FROM user_profiles WHERE id = $1',
      [userId]
    );

    if (!result.rows[0]) {
      throw new Error('User not found');
    }

    return {
      enabled: result.rows[0].two_factor_enabled,
      enabledAt: result.rows[0].two_factor_enabled_at
    };
  }

  static async getBackupCodeStats(userId) {
    const result = await pool.query(
      'SELECT backup_codes FROM user_profiles WHERE id = $1',
      [userId]
    );

    if (!result.rows[0] || !result.rows[0].backup_codes) {
      return { total: 0, used: 0, remaining: 0 };
    }

    const codes = result.rows[0].backup_codes;
    const used = codes.filter(c => c.used).length;

    return {
      total: codes.length,
      used,
      remaining: codes.length - used
    };
  }
}

export default TwoFactorService;
