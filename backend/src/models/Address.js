import pool from '../config/database.js';
import { inMemoryStore } from '../data/inMemoryStore.js';

class Address {
  static isCodeConflict(error) {
    return Boolean(
      error
      && (
        error.code === '23505'
        || error.status === 409
        || /duplicate key|unique constraint|already exists/i.test(String(error.message || ''))
      )
    );
  }

  static async findNearby(lat, lng, radius = 15) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.findNearbyAddress(lat, lng, radius);
    }

    const query = `
      SELECT *,
        ST_Distance(
          location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance
      FROM addresses
      WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      ORDER BY distance
      LIMIT 1
    `;
    const result = await pool.query(query, [lng, lat, radius]);
    return result.rows[0];
  }

  static async findByCode(code) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.findAddressByCode(code);
    }

    const query = 'SELECT * FROM addresses WHERE COALESCE(ppoint_code, code) = $1 LIMIT 1';
    const result = await pool.query(query, [code]);
    return result.rows[0];
  }

  static async create({
    ppointCode,
    uniqueIdentifier,
    cityCode,
    lat,
    lng,
    country,
    state,
    city,
    communityName,
    district,
    landmark,
    description,
    streetDescription,
    buildingName,
    houseNumber,
    streetName,
    buildingPolygonId,
    phoneNumber,
    entranceLabel,
    entranceLatitude,
    entranceLongitude,
    confidenceScore,
    placeType,
    customPlaceType,
    addressMetadata,
    addressType,
    createdBy,
    createdSource,
    moderationStatus,
    agentId,
  }) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.createAddress({
        ppointCode,
        uniqueIdentifier,
        cityCode,
        lat,
        lng,
        country,
        state,
        city,
        communityName,
        district,
        landmark,
        description,
        streetDescription,
        buildingName,
        houseNumber,
        streetName,
        buildingPolygonId,
        phoneNumber,
        entranceLabel,
        entranceLatitude,
        entranceLongitude,
        confidenceScore,
        placeType,
        customPlaceType,
        addressMetadata,
        addressType,
        createdBy,
        createdSource,
        moderationStatus,
        agentId,
      });
    }

    const isActive = ['active', 'verified_business'].includes(moderationStatus || 'active');

    const query = `
      INSERT INTO addresses (
        ppoint_code,
        code,
        city_code,
        latitude,
        longitude,
        country,
        state,
        city,
        community_name,
        district,
        landmark,
        street_description,
        description,
        building_name,
        house_number,
        street_name,
        building_polygon_id,
        phone_number,
        entrance_label,
        entrance_latitude,
        entrance_longitude,
        confidence_score,
        place_type,
        custom_place_type,
        address_metadata,
        address_type,
        created_by,
        created_source,
        moderation_status,
        is_active,
        location
      )
      VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24::jsonb, $25, $26, $27, $28, $29, ST_SetSRID(ST_MakePoint($4, $3), 4326))
      RETURNING *
    `;
    try {
      const result = await pool.query(query, [
        ppointCode,
        cityCode,
        lat,
        lng,
        country,
        state,
        city,
        communityName || null,
        district || null,
        landmark || null,
        streetDescription || description || null,
        description || null,
        buildingName || null,
        houseNumber || null,
        streetName || null,
        buildingPolygonId || null,
        phoneNumber || null,
        entranceLabel || null,
        entranceLatitude === undefined || entranceLatitude === null ? null : Number(entranceLatitude),
        entranceLongitude === undefined || entranceLongitude === null ? null : Number(entranceLongitude),
        Number(confidenceScore || 0),
        placeType || null,
        customPlaceType || null,
        JSON.stringify(addressMetadata || {}),
        addressType || 'community',
        createdBy || 'Community',
        createdSource || 'community',
        moderationStatus || 'active',
        isActive,
      ]);
      return result.rows[0];
    } catch (error) {
      if (Address.isCodeConflict(error)) {
        const conflictError = new Error(`PPOINNT code already exists: ${ppointCode}`);
        conflictError.status = 409;
        throw conflictError;
      }

      throw error;
    }
  }

  static async search(query) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.searchAddresses(query);
    }

    const result = await pool.query(
      `SELECT *
       FROM addresses
       WHERE COALESCE(ppoint_code, code) ILIKE $1
       ORDER BY created_at DESC
       LIMIT 25`,
      [`%${query}%`]
    );

    return result.rows;
  }

  static async list(query = '') {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.listAddresses(query);
    }

    const result = await pool.query(
      `SELECT *
       FROM addresses
       WHERE ($1 = '' OR COALESCE(ppoint_code, code) ILIKE $2)
       ORDER BY created_at DESC`,
      [query, `%${query}%`]
    );

    return result.rows;
  }

  static async updateStatus(id, isActive) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.updateAddressStatus(id, isActive);
    }

    const result = await pool.query(
      'UPDATE addresses SET is_active = $2 WHERE id = $1 RETURNING *',
      [Number(id), Boolean(isActive)]
    );

    return result.rows[0];
  }

  static async updateDetails(id, payload = {}) {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.updateAddressDetails(id, payload);
    }

    const updates = [];
    const values = [Number(id)];

    const pushUpdate = (column, value, expression) => {
      values.push(value);
      updates.push(`${column} = ${expression || `$${values.length}`}`);
    };

    if (Object.prototype.hasOwnProperty.call(payload, 'landmark') && payload.landmark !== undefined) {
      pushUpdate('landmark', payload.landmark || null);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'description') && payload.description !== undefined) {
      pushUpdate('description', payload.description || null);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'street_description') && payload.street_description !== undefined) {
      pushUpdate('street_description', payload.street_description || null);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'building_name') && payload.building_name !== undefined) {
      pushUpdate('building_name', payload.building_name || null);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'house_number') && payload.house_number !== undefined) {
      pushUpdate('house_number', payload.house_number || null);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'street_name') && payload.street_name !== undefined) {
      pushUpdate('street_name', payload.street_name || null);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'community_name') && payload.community_name !== undefined) {
      pushUpdate('community_name', payload.community_name || null);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'building_polygon_id') && payload.building_polygon_id !== undefined) {
      pushUpdate('building_polygon_id', payload.building_polygon_id || null);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'district') && payload.district !== undefined) {
      pushUpdate('district', payload.district || null);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'phone_number') && payload.phone_number !== undefined) {
      pushUpdate('phone_number', payload.phone_number || null);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'entrance_label') && payload.entrance_label !== undefined) {
      pushUpdate('entrance_label', payload.entrance_label || null);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'entrance_latitude') && payload.entrance_latitude !== undefined) {
      pushUpdate('entrance_latitude', payload.entrance_latitude === null ? null : Number(payload.entrance_latitude));
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'entrance_longitude') && payload.entrance_longitude !== undefined) {
      pushUpdate('entrance_longitude', payload.entrance_longitude === null ? null : Number(payload.entrance_longitude));
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'confidence_score') && payload.confidence_score !== undefined) {
      pushUpdate('confidence_score', Number(payload.confidence_score || 0));
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'place_type') && payload.place_type !== undefined) {
      pushUpdate('place_type', payload.place_type || null);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'custom_place_type') && payload.custom_place_type !== undefined) {
      pushUpdate('custom_place_type', payload.custom_place_type || null);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'address_metadata') && payload.address_metadata !== undefined) {
      pushUpdate('address_metadata', JSON.stringify(payload.address_metadata || {}), `$${values.length + 1}::jsonb`);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'address_type') && payload.address_type !== undefined) {
      pushUpdate('address_type', payload.address_type || 'community');
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'moderation_status') && payload.moderation_status !== undefined) {
      pushUpdate('moderation_status', payload.moderation_status || 'active');
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'created_by') && payload.created_by !== undefined) {
      pushUpdate('created_by', payload.created_by || 'Community');
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'created_source') && payload.created_source !== undefined) {
      pushUpdate('created_source', payload.created_source || 'community');
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'is_active') && payload.is_active !== undefined) {
      pushUpdate('is_active', Boolean(payload.is_active));
    }

    if (!updates.length) {
      const result = await pool.query('SELECT * FROM addresses WHERE id = $1', [Number(id)]);
      return result.rows[0] || null;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    const result = await pool.query(`UPDATE addresses SET ${updates.join(', ')} WHERE id = $1 RETURNING *`, values);

    return result.rows[0];
  }

  static async getStats() {
    if (inMemoryStore.isEnabled()) {
      return inMemoryStore.getAddressStats();
    }

    const query = `
      SELECT
        city_code,
        COUNT(*) as total_addresses,
        COUNT(DISTINCT DATE(created_at)) as active_days
      FROM addresses
      GROUP BY city_code
      ORDER BY total_addresses DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

export default Address;