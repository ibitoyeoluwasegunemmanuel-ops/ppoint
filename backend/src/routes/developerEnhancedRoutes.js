import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { inMemoryStore } from '../data/inMemoryStore.js';

const router = express.Router();

// API Documentation Endpoints
router.get('/docs/endpoints', (req, res) => {
  const endpoints = [
    {
      path: '/api/addresses',
      method: 'POST',
      description: 'Create a new PPOINNT address',
      authentication: 'API Key',
      rateLimit: '1000/hour',
      request: {
        code: 'string',
        landmark: 'string',
        latitude: 'number',
        longitude: 'number',
        place_type: 'string',
      },
      response: {
        id: 'string',
        code: 'string',
        confidence_score: 'number',
        verified: 'boolean',
      },
    },
    {
      path: '/api/addresses/:code',
      method: 'GET',
      description: 'Lookup a PPOINNT address',
      authentication: 'API Key',
      rateLimit: '5000/hour',
      request: { code: 'string' },
      response: {
        code: 'string',
        landmark: 'string',
        latitude: 'number',
        longitude: 'number',
        confidence_score: 'number',
      },
    },
    {
      path: '/api/tracking/session/start',
      method: 'POST',
      description: 'Start a delivery tracking session',
      authentication: 'API Key',
      rateLimit: '500/hour',
      request: {
        ppoinnt_code: 'string',
        recipient_phone: 'string',
      },
      response: {
        session_id: 'string',
        polyline: 'array',
        eta_seconds: 'number',
      },
    },
    {
      path: '/api/delivery/proof',
      method: 'POST',
      description: 'Submit delivery proof with GPS accuracy',
      authentication: 'API Key',
      rateLimit: '1000/hour',
      request: {
        ppoinnt_code: 'string',
        latitude: 'number',
        longitude: 'number',
        accuracy_meters: 'number',
      },
      response: {
        accuracy_score: 'number',
        verified: 'boolean',
      },
    },
    {
      path: '/api/emergency/dispatch',
      method: 'POST',
      description: 'Dispatch emergency services',
      authentication: 'API Key + Government Access',
      rateLimit: '100/hour',
      request: {
        type: 'string',
        latitude: 'number',
        longitude: 'number',
        details: 'string',
      },
      response: {
        dispatch_id: 'string',
        responders: 'array',
        eta_minutes: 'number',
      },
    },
  ];

  res.json({ success: true, data: endpoints });
});

router.get('/docs/sdk/:language', (req, res) => {
  const language = req.params.language;
  const apiKey = req.query.key || 'YOUR_API_KEY';

  const sdkExamples = {
    javascript: `
// PPOINT JavaScript SDK
import { PPOINT } from '@ppoint/sdk';

const ppoint = new PPOINT({
  apiKey: '${apiKey}',
  environment: 'production'
});

// Lookup an address
const address = await ppoint.addresses.lookup('PPT-NG-LAG-IKD-1234');
console.log(address.landmark, address.confidence_score);

// Start a delivery tracking session
const session = await ppoint.tracking.startSession({
  ppoinnt_code: 'PPT-NG-LAG-IKD-1234',
  recipient_phone: '+2341234567890'
});

// Listen for location updates
session.on('location', (location) => {
  console.log('Driver at', location.latitude, location.longitude);
});
    `,
    python: `
# PPOINT Python SDK
from ppoint import PPOINT

ppoint = PPOINT(api_key='${apiKey}')

# Lookup an address
address = ppoint.addresses.lookup('PPT-NG-LAG-IKD-1234')
print(f"{address['landmark']} - {address['confidence_score']}%")

# Start a delivery tracking session
session = ppoint.tracking.start_session(
    ppoinnt_code='PPT-NG-LAG-IKD-1234',
    recipient_phone='+2341234567890'
)

# Stream location updates
for location in session.stream_locations():
    print(f"Driver at {location['lat']}, {location['lng']}")
    `,
    curl: `
# PPOINT REST API Examples

# Lookup an address
curl -X GET "https://api.ppoint.online/api/addresses/PPT-NG-LAG-IKD-1234" \\
  -H "Authorization: Bearer ${apiKey}"

# Start tracking session
curl -X POST "https://api.ppoint.online/api/tracking/session/start" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "ppoinnt_code": "PPT-NG-LAG-IKD-1234",
    "recipient_phone": "+2341234567890"
  }'
    `,
  };

  const code = sdkExamples[language] || sdkExamples.javascript;

  res.json({
    success: true,
    data: {
      language,
      code,
      documentation: `https://docs.ppoint.online/sdk/${language}`,
    }
  });
});

// Webhook Management
router.get('/webhooks', (req, res) => {
  try {
    const webhooks = inMemoryStore.listWebhooks?.() || [];
    res.json({ success: true, data: webhooks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/webhooks', (req, res) => {
  try {
    const { url, events, secret } = req.body;
    const webhook = {
      id: `wh_${Date.now()}`,
      url,
      events: Array.isArray(events) ? events : [events],
      secret,
      created_at: new Date().toISOString(),
      status: 'active',
      last_triggered: null,
      success_count: 0,
      failure_count: 0,
    };

    const webhooks = inMemoryStore.listWebhooks?.() || [];
    webhooks.push(webhook);
    inMemoryStore.saveWebhooks?.(webhooks);

    res.status(201).json({ success: true, data: webhook });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/webhooks/:id/test', (req, res) => {
  try {
    const webhookId = req.params.id;
    const webhooks = inMemoryStore.listWebhooks?.() || [];
    const webhook = webhooks.find(w => w.id === webhookId);

    if (!webhook) {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }

    // Simulate webhook delivery
    const testPayload = {
      event: 'test.delivery',
      timestamp: new Date().toISOString(),
      data: {
        ppoinnt_code: 'PPT-NG-LAG-IKD-TEST',
        test: true,
      },
    };

    const result = {
      webhook_id: webhookId,
      test_id: `test_${Date.now()}`,
      url: webhook.url,
      status: 'sent',
      request_time_ms: Math.random() * 500 + 50,
      response_code: 200,
      response_body: '{"success":true}',
      timestamp: new Date().toISOString(),
    };

    webhook.last_triggered = new Date().toISOString();
    webhook.success_count++;
    inMemoryStore.saveWebhooks?.(webhooks);

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/webhooks/:id/logs', (req, res) => {
  try {
    const webhookId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const mockLogs = [
      {
        id: `log_${Date.now()}`,
        webhook_id: webhookId,
        event: 'delivery.completed',
        status: 'success',
        response_code: 200,
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        request_time_ms: 145,
      },
      {
        id: `log_${Date.now() - 1}`,
        webhook_id: webhookId,
        event: 'address.verified',
        status: 'success',
        response_code: 200,
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        request_time_ms: 89,
      },
      {
        id: `log_${Date.now() - 2}`,
        webhook_id: webhookId,
        event: 'tracking.updated',
        status: 'retry',
        response_code: 503,
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        request_time_ms: 2000,
      },
    ];

    const paginated = mockLogs.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      data: paginated,
      pagination: { page, limit, total: mockLogs.length },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/webhooks/:id', (req, res) => {
  try {
    const webhookId = req.params.id;
    const webhooks = inMemoryStore.listWebhooks?.() || [];
    const filtered = webhooks.filter(w => w.id !== webhookId);
    inMemoryStore.saveWebhooks?.(filtered);

    res.json({ success: true, message: 'Webhook deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API Key Management
router.get('/api-keys', (req, res) => {
  try {
    const apiKeys = [
      {
        id: 'pk_live_abc123',
        type: 'Live',
        created_at: '2024-01-15T10:30:00Z',
        last_used: '2024-05-23T14:20:00Z',
        requests_24h: 1245,
        requests_7d: 8932,
      },
      {
        id: 'pk_test_def456',
        type: 'Test',
        created_at: '2024-01-15T10:30:00Z',
        last_used: '2024-05-24T09:15:00Z',
        requests_24h: 342,
        requests_7d: 2450,
      },
    ];

    res.json({ success: true, data: apiKeys });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/api-keys/rotate', (req, res) => {
  try {
    const newKey = {
      id: `pk_live_${Math.random().toString(36).substr(2, 9)}`,
      type: 'Live',
      created_at: new Date().toISOString(),
      last_used: null,
      requests_24h: 0,
      requests_7d: 0,
    };

    res.json({
      success: true,
      data: newKey,
      message: 'API key rotated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Usage Analytics
router.get('/usage/analytics', (req, res) => {
  try {
    const period = req.query.period || '7d';

    const analytics = {
      period,
      total_requests: 45230,
      successful_requests: 44820,
      failed_requests: 410,
      success_rate: 99.1,
      avg_response_time_ms: 145,
      unique_endpoints: 8,
      top_endpoints: [
        { path: '/api/addresses/:code', requests: 18932, success_rate: 99.8 },
        { path: '/api/tracking/session/start', requests: 12450, success_rate: 98.9 },
        { path: '/api/delivery/proof', requests: 8340, success_rate: 99.5 },
        { path: '/api/emergency/dispatch', requests: 5508, success_rate: 98.2 },
      ],
      errors: [
        { code: 429, message: 'Rate limit exceeded', count: 234 },
        { code: 503, message: 'Service unavailable', count: 156 },
        { code: 401, message: 'Unauthorized', count: 20 },
      ],
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
