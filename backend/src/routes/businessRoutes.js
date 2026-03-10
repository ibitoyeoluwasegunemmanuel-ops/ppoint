import express from 'express';
import { inMemoryStore } from '../data/inMemoryStore.js';

const router = express.Router();

router.post('/', (req, res) => {
  try {
    const business = inMemoryStore.createBusiness({
      businessName: req.body.businessName || req.body.business_name,
      businessCategory: req.body.businessCategory || req.body.business_category,
      contactPhone: req.body.contactPhone || req.body.contact_phone,
      email: req.body.email,
      ppointCode: req.body.ppointCode || req.body.ppoint_code,
      website: req.body.website,
      businessDescription: req.body.businessDescription || req.body.business_description,
      openingHours: req.body.openingHours || req.body.opening_hours,
    });

    res.status(201).json({
      status: 'success',
      success: true,
      message: 'Business location submitted for verification',
      data: business,
    });
  } catch (error) {
    res.status(error.status || 400).json({ status: 'error', success: false, message: error.message });
  }
});

router.get('/', (req, res) => {
  const data = inMemoryStore.listBusinesses({ code: req.query.code, status: req.query.status || 'approved' });
  res.json({ status: 'success', success: true, message: 'Business locations loaded', data });
});

export default router;
