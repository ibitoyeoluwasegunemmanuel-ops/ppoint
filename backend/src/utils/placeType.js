export const PLACE_TYPES = [
  'House',
  'Shop',
  'Office',
  'Hospital',
  'School',
  'Church',
  'Mosque',
  'Restaurant',
  'Hotel',
  'Police Station',
  'Barracks',
  'Warehouse',
  'Market',
  'Estate Gate',
  'Public Building',
  'Other',
];

export const normalizePlaceType = (placeType, customPlaceType = '') => {
  const normalizedPlaceType = String(placeType || '').trim();
  const normalizedCustomPlaceType = String(customPlaceType || '').trim();

  if (!normalizedPlaceType) {
    return {
      placeType: null,
      customPlaceType: null,
      displayPlaceType: null,
    };
  }

  if (normalizedPlaceType === 'Other') {
    return {
      placeType: 'Other',
      customPlaceType: normalizedCustomPlaceType || null,
      displayPlaceType: normalizedCustomPlaceType || 'Other',
    };
  }

  if (PLACE_TYPES.includes(normalizedPlaceType)) {
    return {
      placeType: normalizedPlaceType,
      customPlaceType: null,
      displayPlaceType: normalizedPlaceType,
    };
  }

  return {
    placeType: 'Other',
    customPlaceType: normalizedPlaceType,
    displayPlaceType: normalizedPlaceType,
  };
};