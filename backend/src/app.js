import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import addressRoutes from './routes/addressRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import developerRoutes from './routes/developerRoutes.js';
import geoRoutes from './routes/geoRoutes.js';
import platformRoutes from './routes/platformRoutes.js';
import regionRoutes from './routes/regionRoutes.js';
import { initDatabase } from './scripts/initDatabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_PREVIEW_URL,
  'https://ppoint.online',
  'https://www.ppoint.online',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5183',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5183'
].filter(Boolean);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (
      !origin
      || allowedOrigins.includes(origin)
      || origin.endsWith('.vercel.app')
    ) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
app.use('/api', addressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/developers', developerRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/regions', regionRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const startServer = async () => {
  if (process.env.USE_IN_MEMORY_DB !== 'true' && process.env.INIT_DB_ON_START === 'true') {
    await initDatabase();
  }

  app.listen(PORT, () => {
    console.log(`PPOINT server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start PPOINT server', error);
  process.exit(1);
});
