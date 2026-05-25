import crypto from 'crypto';
import Webhook from '../models/Webhook.js';

class WebhookService {
  static generateSignature(payload, secret) {
    return crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
  }

  static async triggerEvent(eventType, payload, userId = null) {
    try {
      let webhooks;
      if (userId) {
        const userWebhooks = await Webhook.findByUserId(userId);
        webhooks = userWebhooks.filter(w => JSON.parse(w.events || '[]').includes(eventType));
      } else {
        webhooks = await Webhook.getWebhooksForEvent(eventType);
      }

      const deliveries = [];
      for (const webhook of webhooks) {
        const delivery = this.sendWebhook(webhook, eventType, payload);
        deliveries.push(delivery);
      }

      await Promise.all(deliveries);
      return { success: true, webhooksTriggered: webhooks.length };
    } catch (error) {
      console.error('Webhook trigger error:', error);
      return { success: false, error: error.message };
    }
  }

  static async sendWebhook(webhook, eventType, payload) {
    try {
      const signature = this.generateSignature(payload, webhook.secret);
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': eventType,
          'X-Webhook-Timestamp': new Date().toISOString()
        },
        body: JSON.stringify({
          event: eventType,
          timestamp: new Date().toISOString(),
          data: payload
        }),
        timeout: 10000
      });

      const statusCode = response.status;
      await Webhook.logEvent(webhook.id, eventType, payload, statusCode);
      await Webhook.updateLastTriggered(webhook.id);

      return { success: statusCode >= 200 && statusCode < 300, statusCode };
    } catch (error) {
      console.error(`Failed to send webhook to ${webhook.url}:`, error);
      await Webhook.logEvent(webhook.id, eventType, payload, 0);
      throw error;
    }
  }

  static async retryFailedWebhooks(webhookId, retries = 3) {
    try {
      const webhook = await Webhook.findById(webhookId);
      if (!webhook) throw new Error('Webhook not found');

      // Get failed logs
      const result = await pool.query(`
        SELECT event_type, payload FROM webhook_logs
        WHERE webhook_id = $1 AND status_code >= 400
        ORDER BY created_at DESC
        LIMIT 10
      `, [webhookId]);

      let successCount = 0;
      for (const log of result.rows) {
        for (let i = 0; i < retries; i++) {
          try {
            await this.sendWebhook(webhook, log.event_type, JSON.parse(log.payload));
            successCount++;
            break;
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
          }
        }
      }

      return { retriedCount: result.rows.length, successCount };
    } catch (error) {
      console.error('Webhook retry error:', error);
      throw error;
    }
  }

  static async testWebhook(webhookUrl, secret) {
    const testPayload = {
      event: 'test.webhook',
      timestamp: new Date().toISOString(),
      data: { message: 'This is a test webhook event' }
    };

    const signature = this.generateSignature(testPayload, secret);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': 'test.webhook',
          'X-Webhook-Timestamp': new Date().toISOString()
        },
        body: JSON.stringify(testPayload),
        timeout: 5000
      });

      return {
        success: response.ok,
        statusCode: response.status,
        message: `Webhook responded with status ${response.status}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Failed to reach webhook: ${error.message}`
      };
    }
  }
}

export default WebhookService;
