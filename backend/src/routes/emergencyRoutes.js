import express from 'express';
import Address from '../models/Address.js';

const router = express.Router();
const activeEmergencies = new Map();

const success = (message, data = {}) => ({ status: 'success', success: true, message, data });
const failure = (message) => ({ status: 'error', success: false, message });

// Register emergency dispatch
router.post('/dispatch', async (req, res) => {
  try {
    const { ppoinnt_code, emergency_type, caller_name, caller_phone, caller_location_latitude, caller_location_longitude, description } = req.body;

    if (!ppoinnt_code || !emergency_type) {
      return res.status(400).json(failure('Code and emergency type required'));
    }

    if (!['ambulance', 'fire', 'police', 'flood'].includes(emergency_type)) {
      return res.status(400).json(failure('Invalid emergency type'));
    }

    const address = await Address.findByCode(ppoinnt_code);
    if (!address) {
      return res.status(404).json(failure('PPOINNT location not found'));
    }

    const emergencyId = `EMG-${emergency_type.toUpperCase()}-${Date.now()}`;
    const emergency = {
      emergency_id: emergencyId,
      ppoinnt_code,
      address_coordinates: {
        latitude: address.latitude,
        longitude: address.longitude,
        address: address.address,
        place_type: address.place_type,
      },
      emergency_type,
      caller_name,
      caller_phone,
      caller_location: {
        latitude: caller_location_latitude,
        longitude: caller_location_longitude,
      },
      description,
      created_at: new Date().toISOString(),
      status: 'dispatched',
      distance_to_location_meters: 0,
      nearest_station: null,
      assigned_responders: [],
      eta_minutes: null,
    };

    // Calculate distance from caller to destination
    if (caller_location_latitude && caller_location_longitude) {
      const latDiff = Math.abs(Number(caller_location_latitude) - address.latitude);
      const lngDiff = Math.abs(Number(caller_location_longitude) - address.longitude);
      emergency.distance_to_location_meters = Math.round(Math.sqrt(latDiff ** 2 + lngDiff ** 2) * 111000);
      emergency.eta_minutes = Math.round(emergency.distance_to_location_meters / 1000); // Rough estimate
    }

    activeEmergencies.set(emergencyId, emergency);

    res.json(success('Emergency dispatched', {
      emergency_id: emergencyId,
      ppoinnt_code,
      emergency_type,
      status: 'dispatched',
      eta_minutes: emergency.eta_minutes,
      responders_assigned: 0,
    }));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

// Get emergency details
router.get('/:emergency_id', async (req, res) => {
  try {
    const emergency = activeEmergencies.get(req.params.emergency_id);
    if (!emergency) {
      return res.status(404).json(failure('Emergency not found'));
    }

    res.json(success('Emergency details retrieved', emergency));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

// Assign responder
router.post('/:emergency_id/assign', async (req, res) => {
  try {
    const { responder_id, responder_name, responder_phone, vehicle_type, current_latitude, current_longitude } = req.body;
    const emergency = activeEmergencies.get(req.params.emergency_id);

    if (!emergency) {
      return res.status(404).json(failure('Emergency not found'));
    }

    // Calculate distance from responder to emergency
    const latDiff = Math.abs(Number(current_latitude) - emergency.address_coordinates.latitude);
    const lngDiff = Math.abs(Number(current_longitude) - emergency.address_coordinates.longitude);
    const distanceMeters = Math.round(Math.sqrt(latDiff ** 2 + lngDiff ** 2) * 111000);
    const etaMinutes = Math.round(distanceMeters / 1500); // ~1.5 km/min for emergency

    const responder = {
      responder_id,
      responder_name,
      responder_phone,
      vehicle_type,
      assigned_at: new Date().toISOString(),
      distance_meters: distanceMeters,
      eta_minutes: etaMinutes,
      status: 'en_route',
    };

    emergency.assigned_responders.push(responder);
    if (!emergency.eta_minutes || etaMinutes < emergency.eta_minutes) {
      emergency.eta_minutes = etaMinutes;
    }

    res.json(success('Responder assigned', {
      emergency_id: req.params.emergency_id,
      responder: responder,
      total_responders: emergency.assigned_responders.length,
      eta_minutes: emergency.eta_minutes,
    }));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

// Update responder status
router.patch('/:emergency_id/responder/:responder_id', async (req, res) => {
  try {
    const { status, current_latitude, current_longitude } = req.body;
    const emergency = activeEmergencies.get(req.params.emergency_id);

    if (!emergency) {
      return res.status(404).json(failure('Emergency not found'));
    }

    const responder = emergency.assigned_responders.find(r => r.responder_id === req.params.responder_id);
    if (!responder) {
      return res.status(404).json(failure('Responder not found'));
    }

    responder.status = status || responder.status;

    if (current_latitude && current_longitude) {
      const latDiff = Math.abs(Number(current_latitude) - emergency.address_coordinates.latitude);
      const lngDiff = Math.abs(Number(current_longitude) - emergency.address_coordinates.longitude);
      responder.distance_meters = Math.round(Math.sqrt(latDiff ** 2 + lngDiff ** 2) * 111000);
      responder.updated_at = new Date().toISOString();
    }

    if (status === 'arrived') {
      emergency.status = 'responders_arrived';
    }

    res.json(success('Responder status updated', responder));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

// Close emergency
router.post('/:emergency_id/close', async (req, res) => {
  try {
    const { resolution, notes } = req.body;
    const emergency = activeEmergencies.get(req.params.emergency_id);

    if (!emergency) {
      return res.status(404).json(failure('Emergency not found'));
    }

    emergency.status = 'closed';
    emergency.closed_at = new Date().toISOString();
    emergency.resolution = resolution;
    emergency.notes = notes;
    emergency.duration_minutes = Math.round((new Date(emergency.closed_at) - new Date(emergency.created_at)) / 60000);

    res.json(success('Emergency closed', {
      emergency_id: req.params.emergency_id,
      status: 'closed',
      resolution,
      duration_minutes: emergency.duration_minutes,
      responders: emergency.assigned_responders.length,
    }));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

// Get nearby emergencies
router.get('/nearby/:latitude/:longitude', async (req, res) => {
  try {
    const { latitude, longitude, radius_meters } = req.query;
    const radiusMeters = Number(radius_meters) || 5000;

    const nearbyEmergencies = Array.from(activeEmergencies.values())
      .filter(e => e.status !== 'closed')
      .filter(e => {
        const latDiff = Math.abs(Number(latitude) - e.address_coordinates.latitude);
        const lngDiff = Math.abs(Number(longitude) - e.address_coordinates.longitude);
        const distance = Math.sqrt(latDiff ** 2 + lngDiff ** 2) * 111000;
        return distance <= radiusMeters;
      })
      .sort((a, b) => {
        const aDist = Math.sqrt((Number(latitude) - a.address_coordinates.latitude) ** 2 + (Number(longitude) - a.address_coordinates.longitude) ** 2) * 111000;
        const bDist = Math.sqrt((Number(latitude) - b.address_coordinates.latitude) ** 2 + (Number(longitude) - b.address_coordinates.longitude) ** 2) * 111000;
        return aDist - bDist;
      })
      .slice(0, 10);

    res.json(success('Nearby emergencies retrieved', {
      emergencies: nearbyEmergencies,
      count: nearbyEmergencies.length,
      search_radius_meters: radiusMeters,
    }));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

// Emergency alert (USSD/SMS from feature phone)
router.post('/alert', async (req, res) => {
  try {
    const { emergency_type, caller_phone, ppoinnt_code, description } = req.body;

    if (!emergency_type || !caller_phone) {
      return res.status(400).json(failure('Type and phone required'));
    }

    // Auto-extract coordinates from PPOINNT if available
    let address = null;
    if (ppoinnt_code) {
      address = await Address.findByCode(ppoinnt_code);
    }

    const emergencyId = `EMG-${emergency_type.toUpperCase()}-${Date.now()}`;
    const emergency = {
      emergency_id: emergencyId,
      ppoinnt_code: ppoinnt_code || null,
      address_coordinates: address ? {
        latitude: address.latitude,
        longitude: address.longitude,
        address: address.address,
      } : null,
      emergency_type,
      caller_phone,
      description: description || `Emergency ${emergency_type} alert`,
      created_at: new Date().toISOString(),
      status: 'dispatched',
      assigned_responders: [],
      source: 'ussd_sms',
    };

    activeEmergencies.set(emergencyId, emergency);

    res.json(success('Emergency alert sent', {
      emergency_id: emergencyId,
      status: 'dispatched',
      message: 'Emergency services have been notified. Help is on the way.',
    }));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

export default router;
