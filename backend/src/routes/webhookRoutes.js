import express from 'express';
import crypto from 'crypto';
import Webhook from '../models/Webhook.js';
import WebhookService from '../services/webhookService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { userId, url, events } = req.body;

    if (!userId || !url || !events) {
      return res.status(400).json({
        status: 'error',
        success: false,
        message: 'userId, url, and events are required'
      });
    }

    const secret = crypto.randomBytes(32).toString('hex');
    const webhook = await Webhook.create({ userId, url, events, secret });

    res.status(201).json({
      status: 'success',
      success: true,
      message: 'Webhook created',
      data: {
        id: webhook.id,
        url: webhook.url,
        events: JSON.parse(webhook.events || '[]'),
        secret: webhook.secret,
        active: webhook.active
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const webhooks = await Webhook.findByUserId(req.params.userId);
    res.json({
      status: 'success',
      success: true,
      data: webhooks.map(w => ({
        id: w.id,
        url: w.url,
        events: JSON.parse(w.events || '[]'),
        active: w.active,
        lastTriggeredAt: w.last_triggered_at,
        createdAt: w.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const webhook = await Webhook.findById(req.params.id);
    if (!webhook) {
      return res.status(404).json({
        status: 'error',
        success: false,
        message: 'Webhook not found'
      });
    }

    res.json({
      status: 'success',
      success: true,
      data: {
        id: webhook.id,
        url: webhook.url,
        events: JSON.parse(webhook.events || '[]'),
        active: webhook.active
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { url, events, active } = req.body;
    const webhook = await Webhook.update(req.params.id, { url, events, active });

    res.json({
      status: 'success',
      success: true,
      message: 'Webhook updated',
      data: webhook
    });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Webhook.delete(req.params.id);
    res.json({
      status: 'success',
      success: true,
      message: 'Webhook deleted'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.post('/:id/test', async (req, res) => {
  try {
    const webhook = await Webhook.findById(req.params.id);
    if (!webhook) {
      return res.status(404).json({
        status: 'error',
        success: false,
        message: 'Webhook not found'
      });
    }

    const result = await WebhookService.testWebhook(webhook.url, webhook.secret);
    res.json({
      status: 'success',
      success: result.success,
      data: result
    });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.post('/:id/retry', async (req, res) => {
  try {
    const result = await WebhookService.retryFailedWebhooks(req.params.id);
    res.json({
      status: 'success',
      success: true,
      message: 'Failed webhooks retried',
      data: result
    });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

router.get('/user/:userId/stats', async (req, res) => {
  try {
    const stats = await Webhook.getWebhookStats(req.params.userId);
    res.json({
      status: 'success',
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
  }
});

export default router;
