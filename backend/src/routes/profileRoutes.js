import express from 'express';
import UserProfile from '../models/UserProfile.js';
import Address from '../models/Address.js';

const router = express.Router();

const success = (message, data = {}) => ({ status: 'success', success: true, message, data });
const failure = (message) => ({ status: 'error', success: false, message });

// Search profiles by name
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query) return res.json(success('Empty search results', []));
    const profiles = await UserProfile.searchByName(query);
    res.json(success('Profiles found', profiles));
  } catch (error) {
    res.status(500).json(failure(error.message));
  }
});

// Get a specific profile with its created PPOINNTs
router.get('/:id', async (req, res) => {
  try {
    const profile = await UserProfile.findById(req.params.id);
    if (!profile) return res.status(404).json(failure('Profile not found'));
    
    // Get PPOINNTs created by this user
    const addresses = await Address.findByProfileId(req.params.id);
    
    res.json(success('Profile loaded', {
      ...profile,
      addresses
    }));
  } catch (error) {
    res.status(500).json(failure(error.message));
  }
});

export default router;
