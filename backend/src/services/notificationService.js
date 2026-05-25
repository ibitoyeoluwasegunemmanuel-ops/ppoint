import Notification from '../models/Notification.js';
import NotificationTemplate from '../models/NotificationTemplate.js';

class NotificationService {
  static channels = {
    email: 'email',
    sms: 'sms',
    push: 'push',
    inapp: 'inapp'
  };

  static types = {
    welcome: 'welcome',
    verification: 'verification',
    payment: 'payment',
    emergency: 'emergency',
    application_status: 'application_status',
    agent_dispatch: 'agent_dispatch',
    government_alert: 'government_alert'
  };

  static async sendNotification(userId, type, channel, data) {
    if (!this.types[type]) throw new Error('Invalid notification type');
    if (!this.channels[channel]) throw new Error('Invalid channel');

    const template = await NotificationTemplate.findByType(type);
    if (!template || template.length === 0) {
      throw new Error('Template not found for type: ' + type);
    }

    const tmpl = template[0];
    const subject = this.interpolate(tmpl.subject, data);
    const message = this.interpolate(tmpl.body, data);

    const notification = await Notification.create({
      userId,
      type,
      channel,
      subject,
      message,
      metadata: data,
      status: 'pending'
    });

    // Send based on channel
    if (channel === 'email') {
      await this.sendEmail(userId, subject, message, data);
    } else if (channel === 'sms') {
      await this.sendSMS(userId, message, data);
    } else if (channel === 'push') {
      await this.sendPush(userId, subject, message, data);
    }

    return notification;
  }

  static async sendEmail(userId, subject, message, data) {
    try {
      // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
      // For now, just mark as sent
      console.log(`EMAIL to user ${userId}: ${subject}`);
      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  static async sendSMS(userId, message, data) {
    try {
      // TODO: Integrate with SMS service (Twilio, Termii, etc.)
      // For now, just mark as sent
      console.log(`SMS to user ${userId}: ${message}`);
      return true;
    } catch (error) {
      console.error('SMS send error:', error);
      return false;
    }
  }

  static async sendPush(userId, title, message, data) {
    try {
      // TODO: Integrate with push notification service
      console.log(`PUSH to user ${userId}: ${title}`);
      return true;
    } catch (error) {
      console.error('Push send error:', error);
      return false;
    }
  }

  static interpolate(template, data) {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  static async createDefaultTemplates() {
    const templates = [
      {
        name: 'Welcome Email',
        type: 'welcome',
        channel: 'email',
        subject: 'Welcome to PPOINNT, {{name}}!',
        body: 'Hello {{name}},\n\nWelcome to PPOINNT! Your account has been created successfully.'
      },
      {
        name: 'Payment Confirmation',
        type: 'payment',
        channel: 'email',
        subject: 'Payment Confirmed - ₦{{amount}}',
        body: 'Your payment of ₦{{amount}} has been confirmed.\nReference: {{reference}}'
      },
      {
        name: 'Emergency Alert',
        type: 'emergency',
        channel: 'sms',
        subject: 'EMERGENCY ALERT',
        body: 'EMERGENCY: {{incident_type}} reported at {{location}}. Dispatchers assigned.'
      },
      {
        name: 'Agent Application Status',
        type: 'application_status',
        channel: 'email',
        subject: 'Your Agent Application - {{status}}',
        body: 'Your application status: {{status}}\n{{message}}'
      },
      {
        name: 'Agent Dispatch Alert',
        type: 'agent_dispatch',
        channel: 'sms',
        subject: 'New Dispatch Available',
        body: 'New {{service_type}} request at {{location}}. Accept to respond.'
      }
    ];

    for (const template of templates) {
      try {
        await NotificationTemplate.create(template);
      } catch (e) {
        // Template might already exist
      }
    }

    return templates.length;
  }

  static async getNotificationStats() {
    return await Notification.getStats();
  }
}

export default NotificationService;
