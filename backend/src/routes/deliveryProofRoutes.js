import express from 'express';
import Address from '../models/Address.js';

const router = express.Router();

const success = (message, data = {}) => ({ status: 'success', success: true, message, data });
const failure = (message) => ({ status: 'error', success: false, message });

// Record delivery proof (photo + GPS)
router.post('/proof', async (req, res) => {
  try {
    const { ppoinnt_code, driver_id, delivery_latitude, delivery_longitude, photo_url, notes } = req.body;

    if (!ppoinnt_code || !driver_id) {
      return res.status(400).json(failure('Code and driver ID required'));
    }

    const address = await Address.findByCode(ppoinnt_code);
    if (!address) {
      return res.status(404).json(failure('PPOINNT not found'));
    }

    // Calculate GPS accuracy (how close to original pin)
    const latDiff = Math.abs(Number(delivery_latitude) - address.latitude);
    const lngDiff = Math.abs(Number(delivery_longitude) - address.longitude);
    const distanceMeters = Math.sqrt(latDiff ** 2 + lngDiff ** 2) * 111000; // rough conversion

    const proofData = {
      ...(address.address_metadata || {}),
      deliveries: (address.address_metadata?.deliveries || []).concat([{
        driver_id,
        delivered_at: new Date().toISOString(),
        latitude: delivery_latitude,
        longitude: delivery_longitude,
        distance_error_meters: Math.round(distanceMeters),
        photo_url,
        notes,
      }]),
      last_delivery_verified_at: new Date().toISOString(),
      total_deliveries: (address.address_metadata?.deliveries || []).length + 1,
    };

    await Address.updateDetails(address.id, {
      address_metadata: proofData,
      verification_count: (address.verification_count || 0) + 1,
    });

    res.json(success('Delivery proof recorded', {
      ppoinnt_code,
      driver_id,
      distance_error_meters: Math.round(distanceMeters),
      accuracy: distanceMeters < 10 ? 'excellent' : distanceMeters < 30 ? 'good' : 'needs_review',
    }));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

// Get delivery history for an address
router.get('/history/:ppoinnt_code', async (req, res) => {
  try {
    const address = await Address.findByCode(req.params.ppoinnt_code);
    if (!address) {
      return res.status(404).json(failure('PPOINNT not found'));
    }

    const deliveries = address.address_metadata?.deliveries || [];

    res.json(success('Delivery history retrieved', {
      ppoinnt_code: address.code,
      total_deliveries: deliveries.length,
      last_delivery: deliveries[deliveries.length - 1] || null,
      deliveries: deliveries.map(d => ({
        driver_id: d.driver_id,
        delivered_at: d.delivered_at,
        accuracy: d.distance_error_meters < 10 ? 'excellent' : d.distance_error_meters < 30 ? 'good' : 'needs_review',
        distance_meters: d.distance_error_meters,
      })),
    }));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

// Rate address accuracy based on deliveries
router.get('/accuracy-score/:ppoinnt_code', async (req, res) => {
  try {
    const address = await Address.findByCode(req.params.ppoinnt_code);
    if (!address) {
      return res.status(404).json(failure('PPOINNT not found'));
    }

    const deliveries = address.address_metadata?.deliveries || [];
    if (deliveries.length === 0) {
      return res.json(success('No delivery data', { accuracy_score: 0, delivery_count: 0 }));
    }

    const avgError = deliveries.reduce((sum, d) => sum + (d.distance_error_meters || 0), 0) / deliveries.length;
    const accuracy = Math.max(0, Math.min(100, 100 - (avgError * 3))); // 0-100 scale

    res.json(success('Accuracy score calculated', {
      ppoinnt_code: address.code,
      accuracy_score: Math.round(accuracy),
      average_error_meters: Math.round(avgError),
      delivery_count: deliveries.length,
      status: accuracy > 90 ? 'excellent' : accuracy > 75 ? 'good' : 'needs_improvement',
    }));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

// Dispute delivery (address was in wrong location)
router.post('/dispute', async (req, res) => {
  try {
    const { ppoinnt_code, driver_id, delivery_timestamp, correct_latitude, correct_longitude, reason } = req.body;

    if (!ppoinnt_code) {
      return res.status(400).json(failure('PPOINNT code required'));
    }

    const address = await Address.findByCode(ppoinnt_code);
    if (!address) {
      return res.status(404).json(failure('PPOINNT not found'));
    }

    const disputeData = {
      ...(address.address_metadata || {}),
      dispute_reported: true,
      dispute_at: new Date().toISOString(),
      dispute_by_driver: driver_id,
      dispute_reason: reason,
      dispute_suggested_latitude: correct_latitude,
      dispute_suggested_longitude: correct_longitude,
    };

    await Address.updateDetails(address.id, {
      address_metadata: disputeData,
      moderation_status: 'under_review',
    });

    res.json(success('Dispute recorded - address under review', {
      ppoinnt_code,
      status: 'under_review',
      moderation_status: 'under_review',
    }));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

export default router;
