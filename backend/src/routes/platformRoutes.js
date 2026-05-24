import express from 'express';
import AddressService from '../services/addressService.js';
import Address from '../models/Address.js';
import PublicUsage from '../models/PublicUsage.js';
import FieldAgent from '../models/FieldAgent.js';
import { inMemoryStore } from '../data/inMemoryStore.js';
import { platformStore } from '../data/platformStore.js';
import { calculateAddressConfidence, resolveConfidenceLevel } from '../services/addressConfidenceService.js';
import USSDService from '../services/ussdService.js';

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
    const phoneNumber = req.body.phone_number || req.body.phoneNumber || 'unknown';
    const sessionId = req.body.session_id || req.body.sessionId || null;

    if (!text) {
      return res.json(success('USSD main menu', {
        menu: USSDService.MAIN_MENU,
        session_id: sessionId,
      }));
    }

    const choice = text.split('*').pop();

    // Main menu navigation
    if (choice === '1') {
      return res.json(success('USSD generate menu', {
        menu: USSDService.GENERATE_MENU,
        session_id: sessionId,
      }));
    }

    if (choice === '2') {
      const code = String(req.body.code || '').trim().toUpperCase();
      if (code && code.length > 5) {
        try {
          const address = await AddressService.getAddressInfo(code);
          return res.json(success('USSD search result', {
            found: true,
            code: address.code,
            landmark: address.landmark,
            city: address.city,
            state: address.state,
            sms_message: `${address.code}\n${address.landmark || 'No landmark'}\n${address.city}, ${address.state}`,
          }));
        } catch (err) {
          return res.json(success('USSD search not found', {
            found: false,
            menu: 'Code not found.\n\n1. Try again\n2. Back\n\nChoose:',
          }));
        }
      }
      return res.json(success('USSD search prompt', {
        menu: 'Enter PPOINNT code:\n(e.g., PPT-NG-LAG-IKD-1234)',
        session_id: sessionId,
      }));
    }

    if (choice === '3') {
      return res.json(success('USSD instructions', {
        menu: USSDService.INSTRUCTIONS,
        session_id: sessionId,
      }));
    }

    if (choice === '0') {
      return res.json(success('USSD session ended', {
        menu: 'Thank you for using PPOINNT!',
      }));
    }

    return res.json(success('USSD main menu', {
      menu: USSDService.MAIN_MENU,
      session_id: sessionId,
    }));
  } catch (error) {
    res.status(error.status || 400).json(failure(error.message));
  }
});

router.post('/ussd/generate', async (req, res) => {
  try {
    const { latitude, longitude, landmark, phone_number } = req.body;

    if (!latitude || !longitude) {
      return res.json(success('USSD awaiting coordinates', {
        menu: 'Send your location:\n\nDial *850*1*<LAT>*<LNG>#\n\nExample:\n*850*1*6.5244*3.3792#',
        status: 'awaiting_coords',
      }));
    }

    const address = await AddressService.generateAddress(
      Number(latitude),
      Number(longitude),
      {
        landmark: landmark || '',
        description: 'Generated via USSD',
        createdBy: `USSD-${phone_number || 'user'}`,
        createdSource: 'ussd',
        addressType: 'community',
        moderationStatus: 'active',
      }
    );

    const smsText = `PPOINNT: ${address.code}\n${address.landmark || ''}\n${address.city}, ${address.state}\n\nShare: ppoint.online/p/${address.code}`;

    return res.json(success('USSD address generated', {
      code: address.code,
      landmark: address.landmark,
      city: address.city,
      state: address.state,
      menu: `Your PPOINNT:\n${address.code}\n\n${address.landmark || address.city}\n\n1. Share\n0. Exit`,
      sms_message: smsText,
    }));
  } catch (error) {
    res.status(error.status || 400).json(failure(error.message));
  }
});

router.post('/sms/command', async (req, res) => {
  try {
    const message = String(req.body.message || '').trim();
    const phoneNumber = req.body.phone_number || req.body.phoneNumber || '';

    if (!message) {
      return res.status(400).json(failure('Message is required'));
    }

    const result = await USSDService.handleSMSCommand(message);

    res.json({
      status: 'success',
      success: true,
      data: {
        phone_number: phoneNumber,
        command: message,
        reply: result.sms_message || result.message,
        ...result,
      },
    });
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

    // Try as SMS command first
    if (message.toUpperCase().startsWith('ADDR') || message.toUpperCase().startsWith('FIND') || message.toUpperCase().startsWith('HELP')) {
      const result = await USSDService.handleSMSCommand(message);
      return res.json(success('SMS command processed', {
        reply: result.sms_message || result.message,
        ...result,
      }));
    }

    // Otherwise treat as address search
    const query = message.replace(/^ADDRESS\s+/i, '').trim();
    const results = await AddressService.searchAddresses(query);
    const match = results[0];

    if (!match) {
      return res.status(404).json(success('No address found', {
        reply: `No PPOINNT found.\n\nTry:\nFIND <CODE>\nADDR <LAT> <LNG>\nHELP`,
      }));
    }

    res.json(success('SMS lookup completed', {
      reply: `${match.code}\n${match.landmark || match.city}\n${match.state}`,
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

router.get('/addresses/:code/confidence', async (req, res) => {
  try {
    const code = String(req.params.code || '').trim().toUpperCase();
    if (!code) {
      return res.status(400).json(failure('PPOINNT code is required'));
    }

    const address = await AddressService.getAddressInfo(code);
    if (!address) {
      return res.status(404).json(failure('PPOINNT address not found'));
    }

    const confidence = calculateAddressConfidence({
      gpsAccuracy: address.gps_accuracy || 10,
      buildingDetected: !!address.building_polygon_id,
      roadProximity: address.road_proximity_distance || 15,
      entranceDetected: !!(address.entrance_latitude && address.entrance_longitude),
      geocodingProviders: address.geocoding_providers || [],
      communityName: address.community_name || '',
      streetName: address.street_name || '',
      landmarkProvided: !!address.landmark,
      manualPin: true,
    });

    res.json(success('Address confidence score retrieved', {
      code: address.code,
      latitude: address.latitude,
      longitude: address.longitude,
      confidence_score: confidence.score,
      confidence_level: confidence.level,
      confidence_guidance: confidence.guidance,
      confidence_breakdown: confidence.breakdown,
      verification_count: address.verification_count || 0,
      community_rating: address.community_rating || 0,
      created_at: address.created_at,
      landmark: address.landmark || null,
      city: address.city,
      state: address.state,
    }));
  } catch (error) {
    res.status(error.status || 400).json(failure(error.message));
  }
});

router.post('/addresses/:code/verify', async (req, res) => {
  try {
    const code = String(req.params.code || '').trim().toUpperCase();
    const { action, agentId, notes } = req.body;

    if (!code) {
      return res.status(400).json(failure('PPOINNT code is required'));
    }

    if (!['upvote', 'downvote', 'flag'].includes(action)) {
      return res.status(400).json(failure('Action must be upvote, downvote, or flag'));
    }

    const address = await Address.findByCode(code);
    if (!address) {
      return res.status(404).json(failure('PPOINNT address not found'));
    }

    const currentVotes = address.verification_count || 0;
    const currentRating = address.community_rating || 0;

    let newVotes = currentVotes + 1;
    let newRating = currentRating;

    if (action === 'upvote') {
      newRating = currentRating + 1;
    } else if (action === 'downvote') {
      newRating = Math.max(-100, currentRating - 1);
    }

    const updated = await Address.updateDetails(address.id, {
      verification_count: newVotes,
      community_rating: newRating,
      address_metadata: {
        ...(address.address_metadata || {}),
        last_verification_action: action,
        last_verification_at: new Date().toISOString(),
        last_verified_by_agent: agentId || null,
        verification_notes: notes || null,
      },
    });

    res.json(success(`Address ${action}d successfully`, {
      code: updated.code || code,
      verification_count: newVotes,
      community_rating: newRating,
      address: updated,
    }));
  } catch (error) {
    res.status(error.status || 400).json(failure(error.message));
  }
});

// ──── AGENT TERRITORIES & VERIFICATION INFRASTRUCTURE ────
router.get('/agents/:id/territory', async (req, res) => {
  try {
    const agent = await FieldAgent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json(failure('Agent not found'));
    }

    const territory = await FieldAgent.getTerritory(req.params.id);
    const stats = await FieldAgent.getStats(req.params.id);

    res.json(success('Agent territory loaded', {
      agent_id: req.params.id,
      territory: territory?.territory || 'Unassigned',
      city: territory?.city || '',
      state: territory?.state || '',
      country: territory?.country || 'Nigeria',
      certification_level: stats?.certification_level || 'Bronze',
      verification_count: stats?.verification_count || 0,
      accuracy_score: stats?.accuracy_score || 0,
      payout_per_address: FieldAgent.calculatePayout(stats?.verification_count || 0),
    }));
  } catch (error) {
    res.status(error.status || 400).json(failure(error.message));
  }
});

router.get('/agents/:id/verification-tasks', async (req, res) => {
  try {
    const agent = await FieldAgent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json(failure('Agent not found'));
    }

    const tasks = await FieldAgent.getVerificationTasks(req.params.id);

    res.json(success('Verification tasks loaded', {
      pending_count: tasks.length,
      tasks: tasks.map(t => ({
        code: t.code || t.ppoint_code,
        latitude: t.latitude,
        longitude: t.longitude,
        landmark: t.landmark,
        city: t.city,
        verification_count: t.verification_count,
        community_rating: t.community_rating,
        place_type: t.place_type || t.display_place_type,
        created_at: t.created_at,
      })),
    }));
  } catch (error) {
    res.status(error.status || 400).json(failure(error.message));
  }
});

router.post('/agents/:id/verify-address/:code', async (req, res) => {
  try {
    const agentId = req.params.id;
    const code = String(req.params.code || '').trim().toUpperCase();
    const { verified, notes, correct_latitude, correct_longitude } = req.body;

    const agent = await FieldAgent.findById(agentId);
    if (!agent) {
      return res.status(404).json(failure('Agent not found'));
    }

    const address = await Address.findByCode(code);
    if (!address) {
      return res.status(404).json(failure('PPOINNT address not found'));
    }

    // Record the verification
    await FieldAgent.recordVerification(agentId, code, verified);

    // Update address metadata with agent verification
    const updatedMetadata = {
      ...(address.address_metadata || {}),
      agent_verified: verified,
      verified_by_agent_id: agentId,
      verified_at: new Date().toISOString(),
      verification_notes: notes || '',
    };

    // If agent provided corrections
    if (verified && (correct_latitude || correct_longitude)) {
      updatedMetadata.original_latitude = address.latitude;
      updatedMetadata.original_longitude = address.longitude;
      updatedMetadata.corrected_by_agent = agentId;
    }

    const updated = await Address.updateDetails(address.id, {
      address_metadata: updatedMetadata,
      latitude: correct_latitude ? Number(correct_latitude) : address.latitude,
      longitude: correct_longitude ? Number(correct_longitude) : address.longitude,
      verification_count: (address.verification_count || 0) + 1,
    });

    // Award payout to agent
    const payout = FieldAgent.calculatePayout(agent.verification_count || 0);
    await FieldAgent.updateEarnings(agentId, payout);

    res.json(success('Address verified by agent', {
      code: address.code,
      verified,
      payout_awarded: payout,
      address: updated,
    }));
  } catch (error) {
    res.status(error.status || 400).json(failure(error.message));
  }
});

router.get('/agents/leaderboard/:state', async (req, res) => {
  try {
    const state = String(req.params.state).trim();
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const leaderboard = await FieldAgent.leaderboard(state, limit);

    res.json(success('Agent leaderboard loaded', {
      state,
      agents: leaderboard.map((a, idx) => ({
        rank: idx + 1,
        agent_id: a.id,
        name: a.full_name,
        territory: a.territory,
        certification_level: a.certification_level,
        verification_count: a.verification_count,
        accuracy_score: a.accuracy_score,
        lifetime_earnings: a.total_earnings,
      })),
    }));
  } catch (error) {
    res.status(error.status || 400).json(failure(error.message));
  }
});

router.get('/agents/:id/stats', async (req, res) => {
  try {
    const stats = await FieldAgent.getStats(req.params.id);
    if (!stats) {
      return res.status(404).json(failure('Agent not found'));
    }

    const nextTierThreshold = stats.certification_level === 'Gold' ? 500 : stats.certification_level === 'Silver' ? 100 : 0;
    const nextTier = stats.certification_level === 'Bronze' ? 'Silver' : stats.certification_level === 'Silver' ? 'Gold' : null;

    res.json(success('Agent stats loaded', {
      ...stats,
      certification_progress: {
        current_tier: stats.certification_level,
        current_verifications: stats.verification_count,
        next_tier: nextTier,
        next_threshold: nextTier ? (stats.certification_level === 'Bronze' ? 100 : 500) : null,
        progress_to_next: nextTier ? ((stats.verification_count / (stats.certification_level === 'Bronze' ? 100 : 500)) * 100) : 100,
      },
    }));
  } catch (error) {
    res.status(error.status || 400).json(failure(error.message));
  }
});

// ──── GOVERNMENT INTEGRATION INFRASTRUCTURE ────
router.post('/government/bulk-lookup', async (req, res) => {
  try {
    const { codes, confidence_threshold = 70 } = req.body;

    if (!Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json(failure('Codes array is required'));
    }

    if (codes.length > 1000) {
      return res.status(400).json(failure('Maximum 1000 codes per request'));
    }

    const results = await Promise.all(codes.map(async (code) => {
      try {
        const address = await AddressService.getAddressInfo(code);
        const confidence = calculateAddressConfidence({
          gpsAccuracy: address.gps_accuracy || 10,
          buildingDetected: !!address.building_polygon_id,
          roadProximity: address.road_proximity_distance || 15,
          entranceDetected: !!(address.entrance_latitude && address.entrance_longitude),
          geocodingProviders: [],
          communityName: address.community_name || '',
          streetName: address.street_name || '',
          landmarkProvided: !!address.landmark,
          manualPin: true,
        });

        const meetsThreshold = confidence.score >= confidence_threshold;

        return {
          code: address.code,
          verified: meetsThreshold,
          confidence_score: confidence.score,
          confidence_level: confidence.level,
          latitude: address.latitude,
          longitude: address.longitude,
          city: address.city,
          state: address.state,
          landmark: address.landmark || null,
          verification_count: address.verification_count || 0,
          community_rating: address.community_rating || 0,
          place_type: address.place_type,
        };
      } catch (error) {
        return {
          code,
          verified: false,
          error: 'Address not found',
        };
      }
    }));

    res.json(success('Bulk lookup completed', {
      requested: codes.length,
      verified: results.filter(r => r.verified).length,
      threshold: confidence_threshold,
      results,
    }));
  } catch (error) {
    res.status(error.status || 400).json(failure(error.message));
  }
});

router.get('/government/coverage/:state', async (req, res) => {
  try {
    const state = String(req.params.state).trim();

    if (inMemoryStore.isEnabled()) {
      return res.json(success('Coverage stats loaded', {
        state,
        total_addresses: 0,
        high_confidence: 0,
        medium_confidence: 0,
        low_confidence: 0,
        verified_agents: 0,
        coverage_percentage: 0,
      }));
    }

    const query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN confidence_score >= 85 THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN confidence_score >= 60 AND confidence_score < 85 THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN confidence_score < 60 THEN 1 ELSE 0 END) as low
      FROM addresses
      WHERE state = $1 AND moderation_status = 'active'
    `;

    const result = await pool.query(query, [state]);
    const stats = result.rows[0] || { total: 0, high: 0, medium: 0, low: 0 };

    res.json(success('Coverage stats loaded', {
      state,
      total_addresses: Number(stats.total),
      high_confidence: Number(stats.high) || 0,
      medium_confidence: Number(stats.medium) || 0,
      low_confidence: Number(stats.low) || 0,
      verified_agents: await FieldAgent.leaderboard(state, 999).then(a => a.length),
      coverage_percentage: stats.total > 0 ? Math.round((Number(stats.high) / Number(stats.total)) * 100) : 0,
    }));
  } catch (error) {
    res.status(error.status || 400).json(failure(error.message));
  }
});

router.get('/government/coverage/lga/:state/:lga', async (req, res) => {
  try {
    const state = String(req.params.state).trim();
    const lga = String(req.params.lga).trim();

    if (inMemoryStore.isEnabled()) {
      return res.json(success('LGA coverage stats loaded', {
        state,
        lga,
        total_addresses: 0,
        verified_count: 0,
        agent_count: 0,
      }));
    }

    const query = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN verification_count >= 5 THEN 1 ELSE 0 END) as verified
      FROM addresses
      WHERE state = $1 AND community_name ILIKE $2 AND moderation_status = 'active'
    `;

    const result = await pool.query(query, [state, `%${lga}%`]);
    const stats = result.rows[0] || { total: 0, verified: 0 };

    res.json(success('LGA coverage stats loaded', {
      state,
      lga,
      total_addresses: Number(stats.total),
      verified_count: Number(stats.verified) || 0,
      agent_count: 0, // TODO: count agents working in this LGA
    }));
  } catch (error) {
    res.status(error.status || 400).json(failure(error.message));
  }
});

router.post('/government/export/csv', async (req, res) => {
  try {
    const { state, confidence_threshold = 85, limit = 10000 } = req.body;

    if (!state) {
      return res.status(400).json(failure('State is required'));
    }

    const query = `
      SELECT code, latitude, longitude, landmark, city, community_name, confidence_score, verification_count
      FROM addresses
      WHERE state = $1 AND confidence_score >= $2 AND moderation_status = 'active'
      ORDER BY confidence_score DESC
      LIMIT $3
    `;

    if (inMemoryStore.isEnabled()) {
      return res.json(success('CSV export prepared', {
        state,
        format: 'csv',
        count: 0,
        download_url: '/api/platform/government/download-csv',
      }));
    }

    const result = await pool.query(query, [state, confidence_threshold, limit]);
    const addresses = result.rows;

    let csv = 'PPOINNT Code,Latitude,Longitude,Landmark,City,Community,Confidence Score,Verification Count\n';
    addresses.forEach(a => {
      csv += `"${a.code}",${a.latitude},${a.longitude},"${a.landmark || ''}","${a.city}","${a.community_name}",${a.confidence_score},${a.verification_count}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="ppoinnt_${state}_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(error.status || 400).json(failure(error.message));
  }
});

router.get('/government/stats/:state', async (req, res) => {
  try {
    const state = String(req.params.state).trim();

    if (inMemoryStore.isEnabled()) {
      return res.json(success('Government dashboard stats loaded', {
        state,
        total_addresses: 0,
        agents_active: 0,
        average_confidence: 0,
        addresses_this_month: 0,
        verification_events: 0,
      }));
    }

    const query = `
      SELECT
        COUNT(*) as total,
        AVG(confidence_score) as avg_confidence,
        SUM(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) as this_month,
        SUM(verification_count) as total_verifications
      FROM addresses
      WHERE state = $1 AND moderation_status = 'active'
    `;

    const result = await pool.query(query, [state]);
    const stats = result.rows[0] || {};
    const agents = await FieldAgent.leaderboard(state, 999);

    res.json(success('Government dashboard stats loaded', {
      state,
      total_addresses: Number(stats.total) || 0,
      agents_active: agents.length,
      average_confidence: Math.round(Number(stats.avg_confidence) || 0),
      addresses_this_month: Number(stats.this_month) || 0,
      verification_events: Number(stats.total_verifications) || 0,
      top_agents: agents.slice(0, 5).map((a, idx) => ({
        rank: idx + 1,
        name: a.full_name,
        verifications: a.verification_count,
        accuracy: a.accuracy_score,
      })),
    }));
  } catch (error) {
    res.status(error.status || 400).json(failure(error.message));
  }
});

export default router;