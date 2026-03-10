import { platformStore } from '../data/platformStore.js';
import { getBearerToken } from './adminAuth.js';

export const requireDeveloperSessionAuth = (req, res, next) => {
  const token = getBearerToken(req.headers.authorization);
  const developer = token ? platformStore.getDeveloperBySession(token) : null;

  if (!developer) {
    return res.status(401).json({ success: false, error: 'Unauthorized developer session' });
  }

  req.developer = developer;
  next();
};

export const optionalDeveloperApiAuth = (req, res, next) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    return next();
  }

  try {
    const data = platformStore.consumeApiUsage(token);
    req.apiDeveloper = data.developer;
    req.apiUsage = data.usage;
    next();
  } catch (error) {
    res.status(error.status || 401).json({ success: false, error: error.message });
  }
};