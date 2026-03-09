import express from 'express';
import City from '../models/City.js';
import AddressService from '../services/addressService.js';

const router = express.Router();

router.post('/generate-address', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const address = await AddressService.generateAddress(
      parseFloat(latitude),
      parseFloat(longitude)
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
});

router.get('/address/:code', async (req, res) => {
  try {
    const address = await AddressService.getAddressInfo(req.params.code);
    res.json({
      success: true,
      data: address
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
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

export default router;