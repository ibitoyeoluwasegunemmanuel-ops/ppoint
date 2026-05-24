import express from 'express';
import Address from '../models/Address.js';

const router = express.Router();

const success = (message, data = {}) => ({ status: 'success', success: true, message, data });
const failure = (message) => ({ status: 'error', success: false, message });

// Link PPOINNT to property title
router.post('/property/link', async (req, res) => {
  try {
    const { ppoinnt_code, property_id, title_number, owner_name, land_area_sqm } = req.body;

    if (!ppoinnt_code || !property_id) {
      return res.status(400).json(failure('PPOINNT code and property ID required'));
    }

    const address = await Address.findByCode(ppoinnt_code);
    if (!address) {
      return res.status(404).json(failure('PPOINNT not found'));
    }

    const updated = await Address.updateDetails(address.id, {
      address_metadata: {
        ...(address.address_metadata || {}),
        property_id,
        title_number,
        owner_name,
        land_area_sqm,
        property_linked_at: new Date().toISOString(),
      },
    });

    res.json(success('Property linked to PPOINNT', {
      ppoinnt_code,
      property_id,
      title_number,
      owner_name,
    }));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

// Get property details from PPOINNT
router.get('/property/:ppoinnt_code', async (req, res) => {
  try {
    const address = await Address.findByCode(req.params.ppoinnt_code);
    if (!address) {
      return res.status(404).json(failure('PPOINNT not found'));
    }

    const metadata = address.address_metadata || {};
    if (!metadata.property_id) {
      return res.status(404).json(failure('No property linked to this PPOINNT'));
    }

    res.json(success('Property details retrieved', {
      ppoinnt_code: address.code,
      latitude: address.latitude,
      longitude: address.longitude,
      property_id: metadata.property_id,
      title_number: metadata.title_number,
      owner_name: metadata.owner_name,
      land_area_sqm: metadata.land_area_sqm,
      landmark: address.landmark,
      city: address.city,
      state: address.state,
      linked_at: metadata.property_linked_at,
    }));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

// Bulk property import from land bureau CSV
router.post('/property/bulk-import', async (req, res) => {
  try {
    const { properties } = req.body;

    if (!Array.isArray(properties)) {
      return res.status(400).json(failure('Properties array required'));
    }

    const results = await Promise.all(
      properties.map(async (prop) => {
        try {
          const address = await Address.findByCode(prop.ppoinnt_code.toUpperCase());
          if (!address) {
            return { code: prop.ppoinnt_code, status: 'not_found' };
          }

          await Address.updateDetails(address.id, {
            address_metadata: {
              ...(address.address_metadata || {}),
              property_id: prop.property_id,
              title_number: prop.title_number,
              owner_name: prop.owner_name,
              land_area_sqm: prop.land_area_sqm,
              property_linked_at: new Date().toISOString(),
            },
          });

          return { code: prop.ppoinnt_code, status: 'linked' };
        } catch (error) {
          return { code: prop.ppoinnt_code, status: 'error', error: error.message };
        }
      })
    );

    res.json(success('Bulk import completed', {
      total: properties.length,
      linked: results.filter(r => r.status === 'linked').length,
      not_found: results.filter(r => r.status === 'not_found').length,
      failed: results.filter(r => r.status === 'error').length,
      results,
    }));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

// Get all properties in a state/LGA for land bureau
router.get('/property/list/:state/:lga', async (req, res) => {
  try {
    const state = req.params.state.trim();
    const lga = req.params.lga.trim();

    // TODO: Query addresses with property_metadata in state/lga
    res.json(success('Properties retrieved', {
      state,
      lga,
      properties: [],
      total: 0,
    }));
  } catch (error) {
    res.status(400).json(failure(error.message));
  }
});

export default router;
