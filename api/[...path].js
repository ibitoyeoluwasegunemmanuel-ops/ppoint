import app from '../backend/src/app.js';

export default function handler(req, res) {
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
  return app(req, res);
}