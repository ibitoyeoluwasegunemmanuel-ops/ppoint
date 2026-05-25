const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'PPoint API',
    version: '1.0.0',
    description: 'Enterprise platform for address management, delivery optimization, and government coordination'
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development server'
    },
    {
      url: 'https://api.ppoint.online/api',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      Address: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          ppoint_code: { type: 'string' },
          street: { type: 'string' },
          city: { type: 'string' },
          country: { type: 'string' },
          status: { type: 'string', enum: ['verified', 'pending', 'rejected'] },
          confidence_score: { type: 'number' }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string' },
          full_name: { type: 'string' },
          tier: { type: 'string', enum: ['free', 'pro', 'enterprise'] },
          status: { type: 'string', enum: ['active', 'inactive', 'suspended'] }
        }
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          type: { type: 'string' },
          channel: { type: 'string', enum: ['email', 'sms', 'push', 'inapp'] },
          subject: { type: 'string' },
          message: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'sent', 'read', 'failed'] }
        }
      },
      Webhook: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          url: { type: 'string' },
          events: { type: 'array', items: { type: 'string' } },
          active: { type: 'boolean' }
        }
      }
    }
  },
  tags: [
    { name: 'Search', description: 'Global and entity search endpoints' },
    { name: 'Analytics', description: 'Analytics and metrics endpoints' },
    { name: 'Notifications', description: 'Notification management' },
    { name: 'Webhooks', description: 'Webhook integration' },
    { name: '2FA', description: 'Two-factor authentication' },
    { name: 'Export', description: 'Data export and reporting' },
    { name: 'Admin', description: 'Admin dashboard and controls' }
  ],
  paths: {
    '/search/global': {
      get: {
        tags: ['Search'],
        summary: 'Global cross-entity search',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
        ],
        responses: {
          '200': { description: 'Search results from all entities' }
        }
      }
    },
    '/analytics/dashboard': {
      get: {
        tags: ['Analytics'],
        summary: 'Get analytics dashboard metrics',
        parameters: [
          { name: 'days', in: 'query', schema: { type: 'integer', default: 30 } }
        ],
        responses: {
          '200': {
            description: 'Dashboard metrics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    active_users: { type: 'integer' },
                    total_events: { type: 'integer' },
                    logins: { type: 'integer' },
                    transactions: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/notifications/users/{userId}': {
      get: {
        tags: ['Notifications'],
        summary: 'Get user notifications',
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          '200': { description: 'User notifications' }
        }
      }
    },
    '/webhooks': {
      post: {
        tags: ['Webhooks'],
        summary: 'Create webhook',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: { type: 'integer' },
                  url: { type: 'string' },
                  events: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Webhook created' }
        }
      },
      get: {
        tags: ['Webhooks'],
        summary: 'List webhooks for user',
        parameters: [
          { name: 'userId', in: 'query', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          '200': { description: 'User webhooks' }
        }
      }
    },
    '/2fa/setup': {
      post: {
        tags: ['2FA'],
        summary: 'Setup two-factor authentication',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  userId: { type: 'integer' },
                  email: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'QR code and secret for 2FA setup' }
        }
      }
    },
    '/export/users': {
      get: {
        tags: ['Export'],
        summary: 'Export user data to CSV',
        parameters: [
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['csv', 'json'] } }
        ],
        responses: {
          '200': { description: 'CSV file with user data' }
        }
      }
    },
    '/admin/system-stats': {
      get: {
        tags: ['Admin'],
        summary: 'Get system statistics',
        responses: {
          '200': {
            description: 'System statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    total_users: { type: 'integer' },
                    approved_agents: { type: 'integer' },
                    resolved_incidents: { type: 'integer' },
                    total_revenue: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

export default swaggerDefinition;
