import express from 'express';
import { platformStore } from '../data/platformStore.js';
import { requireDeveloperSessionAuth } from '../middleware/developerAuth.js';

const router = express.Router();

const normalizeRegisterPayload = (body) => ({
  companyName: body.companyName || body.company_name,
  website: body.website,
  email: body.email,
  password: body.password,
  planSlug: body.planSlug || body.plan,
  billingCountry: body.billingCountry || body.country,
});

const successResponse = (message, data = {}, extras = {}) => ({ status: 'success', success: true, message, data, ...extras });
const errorResponse = (message) => ({ status: 'error', success: false, message });

router.get('/plans', (req, res) => {
  res.json(successResponse('Developer plans loaded', platformStore.getPlans()));
});

router.post('/register', (req, res) => {
  try {
    const payload = normalizeRegisterPayload(req.body);
    if (!payload.companyName || !payload.website || !payload.email || !payload.password || !payload.billingCountry || !payload.planSlug) {
      return res.status(400).json({ success: false, error: 'Company name, website, email, password, country, and plan are required' });
    }

    const developer = platformStore.registerDeveloper(payload);
    res.status(201).json(successResponse('Developer account created', developer, { api_key: developer.api_key }));
  } catch (error) {
    res.status(error.status || 400).json(errorResponse(error.message));
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const developer = platformStore.authenticateDeveloper(email, password);
  if (!developer) {
    return res.status(401).json(errorResponse('Invalid developer email or password'));
  }

  const token = platformStore.createDeveloperSession(developer.id);
  res.json(successResponse('Developer login successful', { token, dashboard: platformStore.getDeveloperDashboard(developer.id) }));
});

router.post('/forgot-password', (req, res) => {
  try {
    res.json(platformStore.createDeveloperPasswordReset(req.body.email));
  } catch (error) {
    res.status(error.status || 400).json(errorResponse(error.message));
  }
});

router.post('/reset-password', (req, res) => {
  try {
    res.json(platformStore.resetDeveloperPassword(req.body.token, req.body.password));
  } catch (error) {
    res.status(error.status || 400).json(errorResponse(error.message));
  }
});

router.use(requireDeveloperSessionAuth);

router.get('/dashboard', (req, res) => {
  const dashboard = platformStore.getDeveloperDashboard(req.developer.id);
  res.json(successResponse('Developer dashboard loaded', dashboard));
});

router.patch('/account', (req, res) => {
  try {
    const developer = platformStore.updateDeveloperAccount(req.developer.id, {
      companyName: req.body.companyName || req.body.company_name,
      website: req.body.website,
      email: req.body.email,
      password: req.body.password,
    });
    res.json(successResponse('Developer account updated successfully', developer));
  } catch (error) {
    res.status(error.status || 400).json(errorResponse(error.message));
  }
});

router.post('/api-key/regenerate', (req, res) => {
  const developer = platformStore.regenerateDeveloperApiKey(req.developer.id);
  res.json(successResponse('API key generated successfully', developer));
});

router.post('/payments', (req, res) => {
  try {
    const data = platformStore.submitPaymentProof(req.developer.id, req.body);
    res.status(201).json(successResponse('Payment proof submitted successfully', data));
  } catch (error) {
    res.status(400).json(errorResponse(error.message));
  }
});

router.get('/payments', (req, res) => {
  const dashboard = platformStore.getDeveloperDashboard(req.developer.id);
  res.json(successResponse('Developer payments loaded', dashboard?.payments || []));
});

export default router;