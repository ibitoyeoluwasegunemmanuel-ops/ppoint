import express from 'express';
import AddressService from '../services/addressService.js';
import Address from '../models/Address.js';
import PublicUsage from '../models/PublicUsage.js';
import FieldAgent from '../models/FieldAgent.js';
import { inMemoryStore } from '../data/inMemoryStore.js';
import { platformStore } from '../data/platformStore.js';

const router = express.Router();

const success = (message, data = {}, extras = {}) => ({ status: 'success', success: true, message, data, ...extras });
const failure = (message) => ({ status: 'error', success: false, message });

const parseCoordinates = (body) => ({
  latitude: Number(body.latitude),
  longitude: Number(body.longitude),
});

router.post('/community/addresses/generate', async (req, res) => {
  try {
    const { latitude, longitude } = parseCoordinates(req.body);
    const identifier = req.ip || 'guest';
    
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return res.status(400).json(failure('Latitude and longitude are required'));
    }

    // Revenue Rule: First 3 FREE, then ₦50
    const usage = await PublicUsage.getCheck(identifier);
    if (usage.isExceeded && !req.body.isPaid) {
      return res.status(402).json({
        ...failure('PPOINNT limit reached. Payment required for next generation.'),
        requiresPayment: true,
        fee: usage.fee_amount || 50,
        currency: 'NGN'
      });
    }

    const address = await AddressService.generateAddress(latitude, longitude, {
      placeType: req.body.placeType || req.body.place_type || '',
      customPlaceType: req.body.customPlaceType || req.body.custom_place_type || '',
      communityName: req.body.communityName || req.body.community_name || '',
      buildingPolygonId: req.body.buildingPolygonId || req.body.building_polygon_id || '',
      entranceLabel: req.body.entranceLabel || req.body.entrance_label || '',
      entranceLatitude: req.body.entranceLatitude ?? req.body.entrance_latitude ?? null,
      entranceLongitude: req.body.entranceLongitude ?? req.body.entrance_longitude ?? null,
      gpsAccuracy: req.body.gpsAccuracy ?? req.body.gps_accuracy ?? null,
      createdBy: 'Community',
      createdSource: 'community',
      addressType: 'community',
      moderationStatus: 'active',
    });

    res.status(201).json(success('Community PPOINNT code generated', address));
    await PublicUsage.increment(identifier);
  } catch (error) {
    res.status(error.status || 400).json(failure(error.message));
  }
});

router.patch('/community/addresses/:id/details', async (req, res) => {
  try {
    const address = await Address.updateDetails(req.params.id, {
      building_name: req.body.buildingName || req.body.building_name || null,
      house_number: req.body.houseNumber || req.body.house_number || null,
      street_name: req.body.streetName || req.body.street_name || null,
      community_name: req.body.communityName || req.body.community_name || null,
      landmark: req.body.landmark || null,
      street_description: req.body.streetDescription || req.body.street_description || req.body.description || null,
      description: req.body.description || req.body.streetDescription || req.body.street_description || null,
      district: req.body.district || null,
      building_polygon_id: req.body.buildingPolygonId || req.body.building_polygon_id || null,
      phone_number: req.body.phoneNumber || req.body.phone_number || null,
      entrance_label: req.body.entranceLabel || req.body.entrance_label || null,
      entrance_latitude: req.body.entranceLatitude ?? req.body.entrance_latitude ?? null,
      entrance_longitude: req.body.entranceLongitude ?? req.body.entrance_longitude ?? null,
      confidence_score: req.body.confidenceScore ?? req.body.confidence_score ?? 0,
      place_type: req.body.placeType || req.body.place_type || null,
      custom_place_type: req.body.customPlaceType || req.body.custom_place_type || null,
      address_metadata: req.body.addressMetadata || req.body.address_metadata || undefined,
      address_type: req.body.addressType || req.body.address_type || 'community',
      moderation_status: req.body.moderationStatus || req.body.moderation_status || 'active',
      created_by: req.body.createdBy || req.body.created_by || 'Community',
      created_source: req.body.createdSource || req.body.created_source || 'community',
      is_active: req.body.isActive === undefined ? true : Boolean(req.body.isActive),
    });

    if (!address) {
      return res.status(404).json(failure('Address not found'));
    }

    res.json(success('Community address details saved', address));
  } catch (error) {
    res.status(error.status || 400).json(failure(error.message));
  }
});

router.get('/community/addresses', (req, res) => {
  const query = String(req.query.q || '').trim();
  const data = query ? inMemoryStore.searchAddresses(query) : inMemoryStore.getAddresses({});
  res.json(success('Community addresses loaded', data));
});

router.get('/system/public-config', (req, res) => {
  res.json(success('Public platform configuration loaded', platformStore.getPublicPlatformConfig()));
});

router.post('/ussd/session', async (req, res) => {
  try {
    const text = String(req.body.text || '').trim();
    const parts = text.split('*').filter(Boolean);

    if (!parts.length) {
      return res.json(success('USSD menu loaded', {
        code: '234777#',
        menu: ['1. Get My PPOINNT Address', '2. Search PPOINNT Address', '3. Help'],
      }));
    }

    if (parts[0] === '1') {
      const { latitude, longitude } = parseCoordinates(req.body);
      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return res.json(success('USSD address capture started', {
          prompt: 'Collect country, state, city, landmark, and coordinates from the telecom gateway, then call this endpoint again with latitude and longitude.',
          received: {
            country: req.body.country || null,
            state: req.body.state || null,
            city: req.body.city || null,
            landmark: req.body.landmark || null,
          },
        }));
      }

      const address = await AddressService.generateAddress(latitude, longitude, {
        landmark: req.body.landmark || '',
        description: req.body.description || `USSD request for ${req.body.city || 'community location'}`,
        createdBy: 'USSD User',
        createdSource: 'ussd',
        addressType: 'community',
        moderationStatus: 'active',
      });

      return res.json(success('USSD PPOINNT address generated', {
        sms_message: `Your PPOINNT address: ${address.code}. ${address.landmark || ''} ${address.city}, ${address.state}`.trim(),
        address,
      }));
    }

    if (parts[0] === '2') {
      const code = parts.slice(1).join('*').trim() || String(req.body.code || '').trim();
      if (!code) {
        return res.status(400).json(failure('PPOINNT code is required for USSD search'));
      }

      const address = await AddressService.getAddressInfo(code);
      return res.json(success('USSD address search completed', {
        sms_message: `${address.code} ${address.landmark || ''} ${address.city}, ${address.state}`.trim(),
        address,
      }));
    }

    return res.json(success('USSD help loaded', {
      help: 'Dial 234777#, choose 1 to generate an address, 2 to search a PPOINNT code, or use SMS lookup for text-based retrieval.',
    }));
  } catch (error) {
    res.status(error.status || 400).json(failure(error.message));
  }
});

router.post('/sms/lookup', async (req, res) => {
  try {
    const message = String(req.body.message || '').trim();
    if (!message) {
      return res.status(400).json(failure('SMS message is required'));
    }

    const query = message.replace(/^ADDRESS\s+/i, '').trim();
    const results = await AddressService.searchAddresses(query);
    const match = results[0];

    if (!match) {
      return res.status(404).json(failure('No PPOINNT address matched the SMS query'));
    }

    res.json(success('SMS lookup completed', {
      reply: `Your PPOINNT address:\n${match.code}\n${match.landmark || match.description || ''}\n${match.city} ${match.state}`.trim(),
      address: match,
    }));
  } catch (error) {
    res.status(error.status || 400).json(failure(error.message));
  }
});

router.post('/agents/register', async (req, res) => {
  try {
    const agent = await FieldAgent.register({
      fullName: req.body.fullName || req.body.full_name,
      phoneNumber: req.body.phoneNumber || req.body.phone_number,
      email: req.body.email,
      country: req.body.country,
      state: req.body.state,
      city: req.body.city,
      territory: req.body.territory,
    });

    res.status(201).json(success('Field agent registered', agent));
  } catch (error) {
    res.status(error.status || 400).json(failure(error.message));
  }
});

router.get('/agents', async (req, res) => {
  res.json(success('Field agents loaded', await FieldAgent.list()));
});

router.get('/agents/:id/dashboard', async (req, res) => {
  const dashboard = await inMemoryStore.getAgentDashboard(req.params.id); // Keeping dashboard logic in store for complex aggregation for now
  if (!dashboard) {
    return res.status(404).json(failure('Agent not found'));
  }

  res.json(success('Field agent dashboard loaded', dashboard));
});

router.post('/agents/:id/withdraw', async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json(failure('Invalid withdrawal amount'));
    }
    const withdrawal = await FieldAgent.withdraw(req.params.id, amount);
    res.json(success('Withdrawal request submitted', withdrawal));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

import PaymentService from '../services/paymentService.js';

router.post('/payments/verify-ppoint-fee', async (req, res) => {
  const { reference, identifier } = req.body;
  if (!reference) return res.status(400).json(failure('Payment reference required'));
  
  try {
    const verified = await PaymentService.verifyReference(reference);
    if (verified.status === 'success') {
      // Upon successful payment of ₦50, we reset the count or grant more generations
      // For MVP simplicity: we reset the count to 0 (user gets 3 more free)
      if (identifier) {
        if (!inMemoryStore.isEnabled()) {
          const pool = (await import('../config/database.js')).default;
          await pool.query('UPDATE public_usage SET count = 0 WHERE identifier = $1', [identifier]);
        } else {
           inMemoryStore.resetPublicUsage(identifier);
        }
      }
      return res.json(success('Payment verified, 3 more free PPOINNTs granted!', { reference, status: 'success' }));
    }
    res.status(400).json(failure('Invalid reference or payment failed.'));
  } catch (error) {
    res.status(500).json(failure(error.message));
  }
});

router.get('/usage/check', async (req, res) => {
  const identifier = req.query.id || req.ip;
  const usage = await PublicUsage.getCheck(identifier);
  res.json(success('Usage count retrieved', { 
    ...usage,
    fee_required: usage.isExceeded,
    fee_amount: 50,
    currency: 'NGN'
  }));
});

router.post('/business/verify-payment', async (req, res) => {
  try {
    const { ppointCode, reference } = req.body;
    if (!ppointCode || !reference) return res.status(400).json(failure('PPOINNT code and reference required'));
    
    const address = await Address.findByCode(ppointCode);
    if (!address) return res.status(404).json(failure('PPOINNT not found'));

    // Upgrade status to verified
    const updated = await Address.updateDetails(address.id, {
      moderation_status: 'verified_business',
      address_type: 'verified_business',
      confidence_score: Math.min(100, (address.confidence_score || 0) + 10)
    });

    res.json(success('Business verification payment successful. Your PPOINNT is now Verified.', updated));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

router.post('/agents/:id/addresses', async (req, res) => {
  try {
    const { latitude, longitude } = parseCoordinates(req.body);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return res.status(400).json(failure('Latitude and longitude are required'));
    }

    const address = await AddressService.generateAddress(latitude, longitude, {
      landmark: req.body.landmark || '',
      description: req.body.description || req.body.streetDescription || '',
      streetDescription: req.body.streetDescription || req.body.description || '',
      buildingName: req.body.buildingName || '',
      houseNumber: req.body.houseNumber || '',
      placeType: req.body.placeType || req.body.place_type || '',
      customPlaceType: req.body.customPlaceType || req.body.custom_place_type || '',
      district: req.body.district || '',
      phoneNumber: req.body.phoneNumber || '',
      createdBy: `Agent AGT-${String(req.params.id).padStart(5, '0')}`,
      createdSource: 'agent',
      addressType: 'community',
      moderationStatus: 'active',
      agentId: Number(req.params.id),
    });

    const updated = await Address.updateDetails(address.id, {
      building_name: req.body.buildingName || null,
      house_number: req.body.houseNumber || null,
      street_name: req.body.streetName || req.body.street_name || address.street_name || null,
      landmark: req.body.landmark || null,
      street_description: req.body.description || req.body.streetDescription || null,
      description: req.body.description || req.body.streetDescription || null,
      district: req.body.district || null,
      phone_number: req.body.phoneNumber || null,
      place_type: req.body.placeType || req.body.place_type || address.place_type || null,
      custom_place_type: req.body.customPlaceType || req.body.custom_place_type || address.custom_place_type || null,
      address_metadata: req.body.addressMetadata || req.body.address_metadata || address.address_metadata || undefined,
      created_by: `Agent AGT-${String(req.params.id).padStart(5, '0')}`,
      created_source: 'agent',
      moderation_status: 'active',
      address_type: 'community',
      is_active: true,
    });

    res.status(201).json(success('Agent-mapped address created', updated || address));
  } catch (error) {
    res.status(error.status || 400).json(failure(error.message));
  }
});

router.get('/monetization/plans', (req, res) => {
  res.json(success('Platform monetization plans loaded', platformStore.getPlans()));
});

router.post('/logistics/verify', async (req, res) => {
  try {
    const code = String(req.body.code || '').trim();
    if (!code) {
      return res.status(400).json(failure('PPOINNT code is required'));
    }

    const address = await AddressService.getAddressInfo(code);
    res.json(success('Logistics verification completed', {
      verified: true,
      navigation_url: `https://maps.google.com/?q=${address.latitude},${address.longitude}`,
      address,
    }));
  } catch (error) {
    res.status(error.status || 404).json(failure(error.message));
  }
});

router.post('/logistics/bulk-verify', async (req, res) => {
  try {
    const codes = Array.isArray(req.body.codes) ? req.body.codes : [];
    const data = await Promise.all(codes.map(async (code) => {
      try {
        const address = await AddressService.getAddressInfo(code);
        return { code, verified: true, address };
      } catch (error) {
        return { code, verified: false, message: error.message };
      }
    }));

    res.json(success('Bulk logistics verification completed', data));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

export default router;