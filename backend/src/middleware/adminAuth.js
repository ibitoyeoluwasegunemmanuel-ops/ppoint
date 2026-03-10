import { platformStore } from '../data/platformStore.js';

export const getBearerToken = (authorizationHeader) => authorizationHeader?.replace(/^Bearer\s+/i, '').trim();

export const adminAuth = (req, res, next) => {
  const token = getBearerToken(req.headers.authorization);
  const admin = token ? platformStore.getAdminBySession(token) : null;

  if (!admin) {
    return res.status(401).json({ success: false, error: 'Unauthorized admin session' });
  }

  req.admin = admin;
  next();
};