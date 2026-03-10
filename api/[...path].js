import app from '../backend/src/app.js';

export default function handler(req, res) {
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
  process.env.PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || 'https://ppoint.online';
  process.env.USE_IN_MEMORY_DB = process.env.DATABASE_URL ? 'false' : 'true';
  return app(req, res);
}