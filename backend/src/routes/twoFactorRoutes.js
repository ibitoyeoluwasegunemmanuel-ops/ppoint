import express from 'express';
import TwoFactorService from '../services/twoFactorService.js';

const router = express.Router();

router.post('/setup', async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'userId and email are required'
      });
    }

    const result = await TwoFactorService.generateSecret(email);

    res.json({
      status: 'success',
      success: true,
      message: '2FA setup initiated',
      data: {
        secret: result.secret,
        qrCode: result.qrCode,
        instructions: 'Scan the QR code with your authenticator app or enter the secret manually'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.post('/enable', async (req, res) => {
  try {
    const { userId, secret, token } = req.body;

    if (!userId || !secret || !token) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'userId, secret, and token are required'
      });
    }

    const isValid = TwoFactorService.verifyToken(secret, token);
    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'Invalid verification code'
      });
    }

    const user = await TwoFactorService.enable2FA(userId, secret);
    const backupCodes = await TwoFactorService.generateBackupCodes(userId);

    res.json({
      status: 'success',
      success: true,
      message: '2FA enabled successfully',
      data: {
        enabled: user.two_factor_enabled,
        backupCodes,
        warning: 'Save these backup codes in a safe place. You can use them to access your account if you lose access to your authenticator.'
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.post('/disable', async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'userId and password are required'
      });
    }

    const user = await TwoFactorService.disable2FA(userId);

    res.json({
      status: 'success',
      success: true,
      message: '2FA disabled',
      data: { enabled: user.two_factor_enabled }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'userId and token are required'
      });
    }

    const isValid = await TwoFactorService.verify2FAToken(userId, token);

    res.json({
      status: 'success',
      success: true,
      message: '2FA token verified',
      data: { verified: isValid }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

router.post('/backup-code/verify', async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'userId and code are required'
      });
    }

    const isValid = await TwoFactorService.verifyBackupCode(userId, code);

    res.json({
      status: 'success',
      success: true,
      message: 'Backup code verified and marked as used',
      data: { verified: isValid }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

router.post('/backup-codes/regenerate', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'userId is required'
      });
    }

    const codes = await TwoFactorService.generateBackupCodes(userId);

    res.json({
      status: 'success',
      success: true,
      message: 'Backup codes regenerated',
      data: { codes }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.get('/status/:userId', async (req, res) => {
  try {
    const status = await TwoFactorService.get2FAStatus(req.params.userId);
    const codeStats = await TwoFactorService.getBackupCodeStats(req.params.userId);

    res.json({
      status: 'success',
      success: true,
      data: {
        twoFactorEnabled: status.enabled,
        enabledAt: status.enabledAt,
        backupCodes: codeStats
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

export default router;
