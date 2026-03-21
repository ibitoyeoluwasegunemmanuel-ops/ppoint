import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { platformStore } from '../data/platformStore.js';
import { inMemoryStore } from '../data/inMemoryStore.js';
import Address from '../models/Address.js';
import { runAutoBuildingDetection } from '../services/autoBuildingDetectionService.js';

const router = express.Router();

const buildAddressModerationQueues = (addresses = []) => ({
  reported_addresses: addresses.filter((address) => address.moderation_status === 'reported'),
  suspicious_activity: addresses.filter((address) => ['flagged', 'suspicious'].includes(address.moderation_status)),
  low_confidence_addresses: addresses.filter((address) => Number(address.confidence_score || 0) < 60),
  unverified_buildings: addresses.filter((address) => address.auto_generated_flag && ['unverified', 'pending_detection'].includes(address.moderation_status)),
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  platformStore.ensureDefaultAdmin();
  const admin = platformStore.authenticateAdmin(email, password);

  if (!admin) {
    return res.status(401).json({ success: false, error: 'Invalid admin email or password' });
  }

  const token = platformStore.createAdminSession(admin.id);
  const adminData = platformStore.getAdminBySession(token);
  res.json({
    token,
    user: {
      email: adminData.email,
      role: 'admin',
      permissions: adminData.permissions,
      full_name: adminData.full_name
    }
  });
});

router.use(adminAuth);

router.get('/overview', async (req, res) => {
  try {
    const overview = platformStore.getOverview();
    if (inMemoryStore.isEnabled()) {
      return res.json({ success: true, data: overview });
    }

    const addresses = await Address.list('');
    const queues = buildAddressModerationQueues(addresses);

    return res.json({
      success: true,
      data: {
        ...overview,
        total_addresses: addresses.length,
        reported_addresses: queues.reported_addresses.length,
        suspicious_activity: queues.suspicious_activity.length,
        low_confidence_addresses: queues.low_confidence_addresses.length,
        unverified_buildings: queues.unverified_buildings.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Alias for dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const overview = platformStore.getOverview();
    if (inMemoryStore.isEnabled()) {
      return res.json({ success: true, data: overview });
    }

    const addresses = await Address.list('');
    const queues = buildAddressModerationQueues(addresses);

    return res.json({
      success: true,
      data: {
        ...overview,
        total_addresses: addresses.length,
        reported_addresses: queues.reported_addresses.length,
        suspicious_activity: queues.suspicious_activity.length,
        low_confidence_addresses: queues.low_confidence_addresses.length,
        unverified_buildings: queues.unverified_buildings.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/moderation', async (req, res) => {
  try {
    if (inMemoryStore.isEnabled()) {
      return res.json({ success: true, data: inMemoryStore.getModerationQueues() });
    }

    const addresses = await Address.list('');
    const queues = buildAddressModerationQueues(addresses);
    return res.json({
      success: true,
      data: {
        ...queues,
        pending_business_verification: inMemoryStore.listBusinesses({ status: 'pending' }),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/addresses', async (req, res) => {
  try {
    const data = await Address.list(String(req.query.q || ''));
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/map', async (req, res) => {
  try {
    if (inMemoryStore.isEnabled()) {
      return res.json({ success: true, data: inMemoryStore.getAdminMapData() });
    }

    const data = await Address.list('');
    return res.json({ success: true, data: data.map((item) => ({
      ...item,
      building_polygon: item.address_metadata?.building_polygon || [],
      category: item.auto_generated_flag && ['unverified', 'pending_detection'].includes(item.moderation_status)
        ? 'unverified_building'
        : Number(item.confidence_score || 0) < 60
          ? 'low_confidence'
          : 'verified',
    })) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/addresses/:id/status', async (req, res) => {
  try {
    const data = await Address.updateStatus(req.params.id, req.body.isActive);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/addresses/:id', async (req, res) => {
  try {
    const data = await Address.updateDetails(req.params.id, {
      building_name: req.body.buildingName || req.body.building_name,
      house_number: req.body.houseNumber || req.body.house_number,
      street_name: req.body.streetName || req.body.street_name,
      community_name: req.body.communityName || req.body.community_name,
      landmark: req.body.landmark,
      street_description: req.body.streetDescription || req.body.street_description,
      description: req.body.description,
      district: req.body.district,
      building_polygon_id: req.body.buildingPolygonId || req.body.building_polygon_id,
      phone_number: req.body.phoneNumber || req.body.phone_number,
      entrance_label: req.body.entranceLabel || req.body.entrance_label,
      entrance_latitude: req.body.entranceLatitude ?? req.body.entrance_latitude,
      entrance_longitude: req.body.entranceLongitude ?? req.body.entrance_longitude,
      confidence_score: req.body.confidenceScore ?? req.body.confidence_score,
      auto_generated_flag: req.body.autoGeneratedFlag ?? req.body.auto_generated_flag,
      place_type: req.body.placeType || req.body.place_type,
      custom_place_type: req.body.customPlaceType || req.body.custom_place_type,
      address_metadata: req.body.addressMetadata || req.body.address_metadata,
      address_type: req.body.addressType || req.body.address_type,
      moderation_status: req.body.moderationStatus || req.body.moderation_status,
      is_active: typeof req.body.isActive === 'boolean' ? req.body.isActive : undefined,
    });

    if (!data) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    res.json({ success: true, data, message: 'Address updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/addresses/:id', async (req, res) => {
  try {
    const data = await Address.delete(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    res.json({ success: true, data, message: 'Address deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/building-detections/run', async (req, res) => {
  try {
    const data = await runAutoBuildingDetection({
      cityCode: req.body.cityCode || req.body.city_code || '',
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      radiusMeters: req.body.radiusMeters || req.body.radius_meters,
      limit: req.body.limit || req.body.maxBuildings,
      createdBy: req.admin?.full_name || 'Admin Detection Engine',
    });

    res.status(201).json({ success: true, data, message: 'Building detection run completed' });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, error: error.message });
  }
});

router.get('/developers', (req, res) => {
  res.json({ success: true, data: platformStore.listDevelopers() });
});

router.get('/businesses', (req, res) => {
  res.json({ status: 'success', success: true, message: 'Businesses loaded', data: inMemoryStore.listBusinesses({ status: req.query.status, code: req.query.code }) });
});

router.get('/agents', (req, res) => {
  res.json({ status: 'success', success: true, message: 'Agents loaded', data: inMemoryStore.listAgents() });
});

router.patch('/businesses/:id/status', (req, res) => {
  const nextStatus = req.body.status;
  if (!['approved', 'rejected', 'suspended'].includes(nextStatus)) {
    return res.status(400).json({ status: 'error', success: false, message: 'Invalid business status' });
  }

  const business = inMemoryStore.updateBusinessStatus(req.params.id, nextStatus);
  if (!business) {
    return res.status(404).json({ status: 'error', success: false, message: 'Business not found' });
  }

  res.json({ status: 'success', success: true, message: 'Business status updated', data: business });
});

router.patch('/developers/:id/status', (req, res) => {
  const developer = platformStore.setDeveloperStatus(req.params.id, req.body.status);
  if (!developer) {
    return res.status(404).json({ success: false, error: 'Developer not found' });
  }

  res.json({ success: true, data: developer });
});

router.patch('/developers/:id/plan', (req, res) => {
  const developer = platformStore.updateDeveloperPlan(req.params.id, req.body.planSlug || req.body.plan_slug || req.body.plan);
  if (!developer) {
    return res.status(404).json({ success: false, error: 'Developer or plan not found' });
  }

  res.json({ success: true, data: developer });
});

router.post('/developers/:id/reset-usage', (req, res) => {
  const usage = platformStore.resetDeveloperUsage(req.params.id);
  if (!usage) {
    return res.status(404).json({ success: false, error: 'Developer not found' });
  }

  res.json({ success: true, data: usage, message: 'Developer API usage reset successfully' });
});

router.post('/developers/:id/reset-api-key', (req, res) => {
  const developer = platformStore.resetDeveloperApiKey(req.params.id);
  if (!developer) {
    return res.status(404).json({ success: false, error: 'Developer not found' });
  }

  res.json({ success: true, data: developer });
});

router.get('/api-usage', (req, res) => {
  res.json({ success: true, data: platformStore.listUsage() });
});

router.get('/plans', (req, res) => {
  res.json({ success: true, data: platformStore.getPlans() });
});

router.post('/plans', (req, res) => {
  try {
    const plan = platformStore.createPlan(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(error.status || 400).json({ success: false, error: error.message });
  }
});

router.patch('/plans/:id', (req, res) => {
  const plan = platformStore.updatePlan(req.params.id, req.body);
  if (!plan) {
    return res.status(404).json({ success: false, error: 'Plan not found' });
  }

  res.json({ success: true, data: plan });
});

router.delete('/plans/:id', (req, res) => {
  const plan = platformStore.deletePlan(req.params.id);
  if (!plan) {
    return res.status(404).json({ success: false, error: 'Plan not found' });
  }

  res.json({ success: true, data: plan, message: 'Plan archived successfully' });
});

router.get('/payments', (req, res) => {
  res.json({ success: true, data: platformStore.listPayments() });
});

router.patch('/payments/:id', (req, res) => {
  const payment = platformStore.reviewPayment(req.params.id, req.body.status);
  if (!payment) {
    return res.status(404).json({ success: false, error: 'Payment not found' });
  }

  res.json({ success: true, data: payment });
});

router.get('/settings', (req, res) => {
  res.json({ success: true, data: platformStore.getSettings() });
});

router.post('/settings', (req, res) => {
  res.json({ success: true, data: platformStore.updateSettings(req.body), message: 'Settings saved successfully' });
});

router.patch('/settings', (req, res) => {
  res.json({ success: true, data: platformStore.updateSettings(req.body) });
});

router.get('/registry', (req, res) => {
  const data = inMemoryStore.getNationalAddresses(String(req.query.q || ''));
  res.json({ success: true, data });
});

router.patch('/registry/:id', (req, res) => {
  const data = inMemoryStore.updateNationalAddress(req.params.id, req.body);
  if (!data) {
    return res.status(404).json({ success: false, error: 'Registry address not found' });
  }

  res.json({ success: true, data, message: 'Registry address updated successfully' });
});

router.get('/registry/export', (req, res) => {
  const data = inMemoryStore.getNationalAddresses(String(req.query.q || ''));
  res.json({ success: true, data, exported_at: new Date().toISOString() });
});

router.get('/dispatch', (req, res) => {
  res.json({ success: true, data: inMemoryStore.getDispatchOverview() });
});

router.get('/continents', (req, res) => {
  res.json({ success: true, data: inMemoryStore.getContinents() });
});

router.get('/countries', (req, res) => {
  res.json({ success: true, data: inMemoryStore.getAdminCountries() });
});

router.get('/states', (req, res) => {
  res.json({ success: true, data: inMemoryStore.getAdminStates(req.query.countryId) });
});

router.get('/cities', (req, res) => {
  res.json({ success: true, data: inMemoryStore.getAdminCities(req.query.stateId) });
});

router.get('/hierarchy', (req, res) => {
  res.json({ success: true, data: inMemoryStore.getHierarchy() });
});

router.post('/regions/status', (req, res) => {
  const { level, ids, isActive } = req.body;
  if (!['country', 'state', 'city'].includes(level)) {
    return res.status(400).json({ success: false, error: 'Invalid region level' });
  }

  const data = inMemoryStore.setRegionStatus(level, ids || [], isActive);
  res.json({ success: true, data });
});

router.get('/staff', (req, res) => {
  res.json({ success: true, data: inMemoryStore.getStaffAccounts() });
});

router.post('/staff', (req, res) => {
  try {
    const data = inMemoryStore.createStaffAccount(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(error.status || 400).json({ success: false, error: error.message });
  }
});

router.patch('/staff/:id/status', (req, res) => {
  const data = inMemoryStore.updateStaffStatus(req.params.id, req.body.isEnabled);
  if (!data) {
    return res.status(404).json({ success: false, error: 'Staff account not found' });
  }

  res.json({ success: true, data });
});

export default router;
