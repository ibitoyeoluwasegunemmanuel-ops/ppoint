import express from 'express';
import { platformStore } from '../data/platformStore.js';

const router = express.Router();

router.post('/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const data = platformStore.createPasswordResetToken(email);
    res.json(data);
  } catch (error) {
    res.status(error.status || 400).json({ success: false, error: error.message });
  }
});

router.post('/reset-password', (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, error: 'Token and new password are required' });
    }

    const data = platformStore.resetPassword(token, password);
    res.json(data);
  } catch (error) {
    res.status(error.status || 400).json({ success: false, error: error.message });
  }
});

export default router;