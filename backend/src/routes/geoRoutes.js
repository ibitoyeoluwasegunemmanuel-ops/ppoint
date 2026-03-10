import express from 'express';
import pool from '../config/database.js';
import { inMemoryStore } from '../data/inMemoryStore.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = express.Router();

router.use(adminAuth);

router.get('/continents', async (req, res) => {
  try {
    const data = inMemoryStore.isEnabled()
      ? inMemoryStore.getContinents()
      : (await pool.query(`
          SELECT
            ct.id,
            ct.name,
            ct.code,
            (SELECT COUNT(*)::int FROM countries co WHERE co.continent_id = ct.id) AS child_count
          FROM continents ct
          ORDER BY ct.name
        `)).rows;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/countries', async (req, res) => {
  try {
    const continentId = Number(req.query.continentId);

    const data = inMemoryStore.isEnabled()
      ? inMemoryStore.getCountries(continentId)
      : (await pool.query(`
          SELECT
            co.id,
            co.continent_id,
            co.country_name AS name,
            co.country_code AS code,
            co.is_active,
            (SELECT COUNT(*)::int FROM states s WHERE s.country_id = co.id) AS child_count
          FROM countries co
          WHERE ($1::int IS NULL OR co.continent_id = $1)
          ORDER BY co.country_name
        `, [Number.isNaN(continentId) ? null : continentId])).rows;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/states', async (req, res) => {
  try {
    const countryId = Number(req.query.countryId);

    const data = inMemoryStore.isEnabled()
      ? inMemoryStore.getStates(countryId)
      : (await pool.query(`
          SELECT
            s.id,
            s.country_id,
            s.state_name AS name,
            s.state_code AS code,
            s.is_active,
            (SELECT COUNT(*)::int FROM cities c WHERE c.state_id = s.id) AS child_count
          FROM states s
          WHERE ($1::int IS NULL OR s.country_id = $1)
          ORDER BY s.state_name
        `, [Number.isNaN(countryId) ? null : countryId])).rows;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/cities', async (req, res) => {
  try {
    const stateId = Number(req.query.stateId);

    const data = inMemoryStore.isEnabled()
      ? inMemoryStore.getCities(stateId)
      : (await pool.query(`
          SELECT
            c.id,
            c.state_id,
            c.country_id,
            c.city_name AS name,
            c.city_code AS code,
            c.is_active,
            0 AS child_count,
            (SELECT COUNT(*)::int FROM addresses addr WHERE addr.city_code = c.city_code) AS address_count
          FROM cities c
          WHERE ($1::int IS NULL OR c.state_id = $1)
          ORDER BY c.city_name
        `, [Number.isNaN(stateId) ? null : stateId])).rows;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/areas', async (req, res) => {
  try {
    const cityId = Number(req.query.cityId);

    const data = inMemoryStore.isEnabled()
      ? inMemoryStore.getAreas(cityId)
      : (await pool.query(`
          SELECT
            a.id,
            a.city_id,
            a.area_name AS name,
            a.area_code AS code,
            a.is_active,
            (SELECT COUNT(*)::int FROM addresses addr WHERE addr.area_id = a.id) AS address_count
          FROM areas a
          WHERE ($1::int IS NULL OR a.city_id = $1)
          ORDER BY a.area_name
        `, [Number.isNaN(cityId) ? null : cityId])).rows;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/addresses', async (req, res) => {
  try {
    const cityId = Number(req.query.cityId);
    const areaId = Number(req.query.areaId);

    const data = inMemoryStore.isEnabled()
      ? inMemoryStore.getAddresses({
          cityId: Number.isNaN(cityId) ? null : cityId,
          areaId: Number.isNaN(areaId) ? null : areaId
        })
      : (await pool.query(`
          SELECT
            addr.id,
            addr.code,
            addr.city_code,
            addr.area_id,
            addr.latitude,
            addr.longitude,
            addr.country,
            addr.state,
            addr.created_at,
            a.area_name,
            c.city_name
          FROM addresses addr
          LEFT JOIN areas a ON addr.area_id = a.id
          LEFT JOIN cities c ON c.city_code = addr.city_code
          WHERE ($1::int IS NULL OR c.id = $1)
            AND ($2::int IS NULL OR addr.area_id = $2)
          ORDER BY addr.created_at DESC, addr.code ASC
        `, [Number.isNaN(cityId) ? null : cityId, Number.isNaN(areaId) ? null : areaId])).rows;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;