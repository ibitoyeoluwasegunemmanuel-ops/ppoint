import express from 'express';
import City from '../models/City.js';
import Address from '../models/Address.js';
import AddressService from '../services/addressService.js';
import { optionalDeveloperApiAuth } from '../middleware/developerAuth.js';
import { platformStore } from '../data/platformStore.js';
import { inMemoryStore } from '../data/inMemoryStore.js';

const router = express.Router();

const handleGenerate = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      landmark,
      description,
      buildingName,
      phoneNumber,
      placeType,
      customPlaceType,
      streetName,
      addressMetadata,
      createdBy,
      createdSource,
      moderationStatus,
    } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
    }

    const address = await AddressService.generateAddress(
      parseFloat(latitude),
      parseFloat(longitude),
      {
        landmark: typeof landmark === 'string' ? landmark.trim() : '',
        description: typeof description === 'string' ? description.trim() : '',
        buildingName: typeof buildingName === 'string' ? buildingName.trim() : '',
        phoneNumber: typeof phoneNumber === 'string' ? phoneNumber.trim() : '',
        placeType: typeof placeType === 'string' ? placeType.trim() : '',
        customPlaceType: typeof customPlaceType === 'string' ? customPlaceType.trim() : '',
        streetName: typeof streetName === 'string' ? streetName.trim() : '',
        addressMetadata: typeof addressMetadata === 'object' && addressMetadata ? addressMetadata : undefined,
        createdBy: typeof createdBy === 'string' ? createdBy.trim() : '',
        createdSource: typeof createdSource === 'string' ? createdSource.trim() : '',
        moderationStatus: typeof moderationStatus === 'string' ? moderationStatus.trim() : '',
      }
    );

    res.json({
      success: true,
      data: address
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

router.post('/address/generate', optionalDeveloperApiAuth, handleGenerate);
router.post('/generate-address', optionalDeveloperApiAuth, handleGenerate);

router.get('/plans', (req, res) => {
  res.json(platformStore.getPublicPlans());
});

router.get('/countries', (req, res) => {
  const countries = inMemoryStore.getAdminCountries().map((country) => ({
    id: country.id,
    code: country.code,
    name: country.name,
  }));

  res.json(countries);
});

router.get('/address/search', optionalDeveloperApiAuth, async (req, res) => {
  try {
    const code = String(req.query.code || req.query.q || '').trim();
    if (!code) {
      return res.status(400).json({ status: 'error', success: false, message: 'PPOINNT code is required' });
    }

    const data = await AddressService.getAddressInfo(code);
    res.json({ status: 'success', success: true, message: 'Address found', data });
  } catch (error) {
    res.status(404).json({ status: 'error', success: false, message: error.message });
  }
});

router.get('/address/:code', optionalDeveloperApiAuth, async (req, res) => {
  try {
    const address = await AddressService.getAddressInfo(req.params.code);
    res.json({
      status: 'success',
      success: true,
      message: 'Address found',
      data: address
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

router.get('/addresses/:code', optionalDeveloperApiAuth, async (req, res) => {
  try {
    const address = await AddressService.getAddressInfo(req.params.code);
    res.json({
      status: 'success',
      success: true,
      message: 'Address found',
      data: address
    });
  } catch (error) {
    res.status(404).json({
      status: 'error',
      success: false,
      message: error.message
    });
  }
});

router.get('/search', optionalDeveloperApiAuth, async (req, res) => {
  try {
    const query = String(req.query.code || req.query.q || req.query.query || '').trim();
    if (!query) {
      return res.json({ status: 'success', success: true, message: 'No search query provided', data: [] });
    }

    const data = await AddressService.searchAddresses(query);
    res.json({ status: 'success', success: true, message: 'Address search completed', data });
  } catch (error) {
    res.status(500).json({ status: 'error', success: false, message: error.message });
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

router.get('/cities', async (req, res) => {
  try {
    const cities = await City.getAllActive();
    res.json({
      success: true,
      data: cities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/debug/addresses', async (req, res) => {
  try {
    const data = await Address.getLatestDebug();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;