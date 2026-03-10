import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { inMemoryStore } from '../data/inMemoryStore.js';

const router = express.Router();

router.use(adminAuth);

const normalizeIds = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => Number(item))
    .filter((item) => !Number.isNaN(item));
};

const resolveRegionLevel = (req) => {
  const { body, query } = req;

  if (typeof body.level === 'string') {
    return body.level;
  }

  if (typeof body.regionLevel === 'string') {
    return body.regionLevel;
  }

  if (typeof query.level === 'string') {
    return query.level;
  }

  if (Array.isArray(body.countryIds)) {
    return 'country';
  }

  if (Array.isArray(body.stateIds)) {
    return 'state';
  }

  if (Array.isArray(body.cityIds)) {
    return 'city';
  }

  return null;
};

const resolveRegionIds = (body) => {
  if (Array.isArray(body.regionIds)) {
    return normalizeIds(body.regionIds);
  }

  if (Array.isArray(body.ids)) {
    return normalizeIds(body.ids);
  }

  if (Array.isArray(body.countryIds)) {
    return normalizeIds(body.countryIds);
  }

  if (Array.isArray(body.stateIds)) {
    return normalizeIds(body.stateIds);
  }

  if (Array.isArray(body.cityIds)) {
    return normalizeIds(body.cityIds);
  }

  return [];
};

const regionLabel = (level, count) => {
  const labels = {
    country: count === 1 ? 'country' : 'countries',
    state: count === 1 ? 'state' : 'states',
    city: count === 1 ? 'city' : 'cities',
  };

  return labels[level] || 'regions';
};

const updateRegionStatus = (req, res, isActive) => {
  const level = resolveRegionLevel(req);
  const selectedIds = resolveRegionIds(req.body);

  if (!['country', 'state', 'city'].includes(level)) {
    return res.status(400).json({ success: false, error: 'Region level is required for bulk activation. Send country, state, or city.' });
  }

  if (!selectedIds.length) {
    return res.status(400).json({ success: false, error: 'Select at least one region checkbox before updating status.' });
  }

  const data = inMemoryStore.setRegionStatus(level, selectedIds, isActive);
  return res.json({
    success: true,
    data,
    message: `Selected ${regionLabel(level, selectedIds.length)} ${isActive ? 'enabled' : 'disabled'} successfully`,
  });
};

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      countries: inMemoryStore.getAdminCountries(),
      states: inMemoryStore.getAdminStates(req.query.countryId),
      cities: inMemoryStore.getAdminCities(req.query.stateId),
    },
  });
});

router.post('/enable', (req, res) => {
  return updateRegionStatus(req, res, true);
});

router.post('/disable', (req, res) => {
  return updateRegionStatus(req, res, false);
});

export default router;