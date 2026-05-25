import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { initDatabase } from './scripts/initDatabase.js';

import addressRoutes from './routes/addressRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import developerRoutes from './routes/developerRoutes.js';
import geoRoutes from './routes/geoRoutes.js';
import platformRoutes from './routes/platformRoutes.js';
import regionRoutes from './routes/regionRoutes.js';
import routeRoutes from './routes/routeRoutes.js';
import buildingDetectionRoutes from './routes/buildingDetectionRoutes.js';
import adminBuildingRoutes from './routes/adminBuildingRoutes.js';
import buildingClaimRoutes from './routes/buildingClaimRoutes.js';
import aiMappingRoutes from './routes/aiMappingRoutes.js';
import driverIntelligenceRoutes from './routes/driverIntelligenceRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import seoRoutes from './routes/seoRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import deliveryProofRoutes from './routes/deliveryProofRoutes.js';
import trackingRoutes from './routes/trackingRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import moderationRoutes from './routes/moderationRoutes.js';
import governmentRoutes from './routes/governmentRoutes.js';
import developerEnhancedRoutes from './routes/developerEnhancedRoutes.js';
import agentApplicationRoutes from './routes/agentApplicationRoutes.js';
import emergencyDispatchRoutes from './routes/emergencyDispatchRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import businessAnalyticsRoutes from './routes/businessAnalyticsRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import governmentPortalRoutes from './routes/governmentPortalRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import exportRoutes from './routes/exportRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_PREVIEW_URL,
  'https://ppoint.online',
  'https://www.ppoint.online',
  ...(!isProd ? [
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5183',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5183',
  ] : []),
].filter(Boolean);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
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
app.use('/api', routeRoutes);
app.use('/api', buildingDetectionRoutes);
app.use('/api', adminBuildingRoutes);
app.use('/api', buildingClaimRoutes);
app.use('/api', aiMappingRoutes);
app.use('/api/driver', driverIntelligenceRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/property', propertyRoutes);
app.use('/api/delivery', deliveryProofRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/emergency-dispatch', emergencyDispatchRoutes);
app.use('/api/admin/moderation', moderationRoutes);
app.use('/api/government', governmentRoutes);
app.use('/api/government-portal', governmentPortalRoutes);
app.use('/api/developers/enhanced', developerEnhancedRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/business', businessAnalyticsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', agentApplicationRoutes);
app.use('/', seoRoutes); // Mount SEO routes at root or as needed

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export const startServer = async () => {
  if (process.env.USE_IN_MEMORY_DB !== 'true' && process.env.INIT_DB_ON_START === 'true') {
    await initDatabase();
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PPOINT server running on port ${PORT}`);
  });
};

const isDirectExecution = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectExecution) {
  startServer().catch((error) => {
    console.error('Failed to start PPOINT server', error);
    process.exit(1);
  });
}

export default app;
