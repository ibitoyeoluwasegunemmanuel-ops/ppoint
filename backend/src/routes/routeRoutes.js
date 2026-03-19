/**
 * Route calculation endpoint — proxies to routing engine.
 * Superseded by aiMappingRoutes.js POST /route.
 * Kept for backward compatibility.
 */
import express from 'express';

const router = express.Router();

// Delegate to /route handled by aiMappingRoutes — this file is kept as a stub
// so existing imports in app.js don't break.
router.post('/route-legacy', (_req, res) => {
  res.status(410).json({ status: 'deprecated', message: 'Use POST /api/route instead' });
});

export default router;
