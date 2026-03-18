import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { ArrowRight, Building2, Copy, LocateFixed, MapPinned, Search, Share2, Smartphone, Truck } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { PLACE_TYPES } from '../constants/placeTypes';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const storageKey = 'ppoint_saved_addresses';
const initialAddressForm = {
  placeType: '',
  customPlaceType: '',
  buildingName: '',
  houseNumber: '',
  landmark: '',
  district: '',
  streetDescription: '',
  phoneNumber: '',
};
const inputClassName = 'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-stone-500';

const placeTypeDescriptions = {
  House: 'Homes, apartments, and family compounds',
  Shop: 'Retail spaces, kiosks, and stalls',
  Office: 'Offices, studios, and workspaces',
  School: 'Schools, campuses, and training centers',
  Hospital: 'Hospitals, clinics, and care centers',
  'Estate Gate': 'Residential estates and secured compounds',
  Warehouse: 'Storage, logistics, and industrial spaces',
  Hotel: 'Hotels, lodges, and guest houses',
  'Police Station': 'Police posts and security formations',
  Church: 'Church buildings and worship centers',
  Mosque: 'Mosques and prayer grounds',
  Barracks: 'Military and paramilitary compounds',
  'Public Building': 'Public service and civic buildings',
  'Government Office': 'Government ministries and agencies',
  Market: 'Open markets and commercial hubs',
  Other: 'Something else not listed here',
};

const confidenceTone = {
  high: 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100',
  medium: 'border-amber-300/30 bg-amber-500/10 text-amber-100',
  low: 'border-red-300/30 bg-red-500/10 text-red-100',
};

const readSavedAddresses = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch {
    return [];
  }
};

const getAddressSettings = (publicConfig) => ({
  requireBuildingName: publicConfig?.address_settings?.require_building_name !== false,
  showLandmark: publicConfig?.address_settings?.show_landmark !== false,
  showStreetDescription: publicConfig?.address_settings?.show_street_description !== false,
  showPhoneNumber: publicConfig?.address_settings?.show_phone_number !== false,
  enableHouseNumber: publicConfig?.address_settings?.enable_house_number !== false,
  enableDistrict: publicConfig?.address_settings?.enable_district !== false,
  quickCreateTargetSeconds: Number(publicConfig?.address_settings?.quick_create_target_seconds || 5),
});

const resolveCommunityApiUrl = (path) => {
  if (typeof window === 'undefined') {
    return path;
  }

  const { hostname, origin } = window.location;
  if (hostname === 'ppoint.online' || hostname === 'www.ppoint.online' || hostname.endsWith('.vercel.app')) {
    return `${origin}/api${path}`;
  }

  return path;
};

function MapViewportController({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 14);
    }
  }, [position, map]);

  return null;
}

function DraggableSelectionMarker({ position, onChange }) {
  const map = useMap();

  if (!position) {
    return null;
  }

  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend(event) {
          const nextPosition = event.target.getLatLng();
          map.flyTo([nextPosition.lat, nextPosition.lng], map.getZoom());
          onChange([nextPosition.lat, nextPosition.lng]);
        },
      }}
    >
      <Popup>Drag this marker to the exact gate, entrance, shop, or building front.</Popup>
    </Marker>
  );
}

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect([event.latlng.lat, event.latlng.lng]);
    }
  });

  return null;
}

function PlaceTypePicker({ value, customValue, onChange, onCustomChange, tone = 'dark' }) {
  const theme = tone === 'light'
    ? {
        wrapper: 'rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4',
        label: 'text-stone-700',
        helper: 'text-stone-500',
        select: 'border-stone-200 bg-white text-stone-900',
        customInput: 'border-stone-200 bg-white text-stone-900 placeholder:text-stone-400',
      }
    : {
        wrapper: 'rounded-[1.5rem] border border-white/10 bg-black/20 p-4',
        label: 'text-stone-200',
        helper: 'text-stone-400',
        select: 'border-white/10 bg-white/5 text-stone-100',
        customInput: 'border-white/10 bg-white/5 text-white placeholder:text-stone-500',
      };

  const PLACE_OPTIONS = [
    { type: 'House', icon: '🏠' },
    { type: 'Shop', icon: '🛍' },
    { type: 'Office', icon: '🏢' },
    { type: 'School', icon: '🎓' },
    { type: 'Hospital', icon: '🏥' },
    { type: 'Hotel', icon: '🏨' },
    { type: 'Police Station', icon: '🚓' },
    { type: 'Church', icon: '⛪' },
    { type: 'Mosque', icon: '🕌' },
    { type: 'Warehouse', icon: '📦' },
    { type: 'Market', icon: '🛒' },
    { type: 'Government Office', icon: '🏛' },
    { type: 'Estate Gate', icon: '🚪' },
    { type: 'Barracks', icon: '🪖' },
    { type: 'Public Building', icon: '🏛' },
    { type: 'Other', icon: '📍' },
  ];

  return (
    <div className={`${theme.wrapper} space-y-4`}>
      <div>
        <label className={`text-sm font-semibold uppercase tracking-[0.25em] block ${theme.label}`}>Place Type</label>
        <p className={`mt-1 text-sm ${theme.helper}`}>Select the location type that matches this pin.</p>
      </div>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none rounded-2xl border px-4 py-4 text-base font-medium outline-none transition focus:ring-2 focus:ring-amber-400/50 ${theme.select}`}
        >
          <option value="" disabled>Select a place type...</option>
          {PLACE_OPTIONS.map((opt) => (
            <option key={opt.type} value={opt.type}>
              {opt.icon} {opt.type}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
          <svg className={`h-5 w-5 ${tone === 'light' ? 'text-stone-400' : 'text-stone-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {value === 'Other' && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <input
            value={customValue}
            onChange={(event) => onCustomChange(event.target.value)}
            className={`w-full rounded-2xl border px-4 py-3 outline-none ${theme.customInput}`}
            placeholder="Enter custom place type (e.g. Workshop)"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
      // Detects the user's current location using the browser geolocation API
      const detectLocation = () => {
        if (!navigator.geolocation) {
          setError('Geolocation is not supported by your browser.');
          return;
        }
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setPosition([position.coords.latitude, position.coords.longitude]);
            setSelectedPosition([position.coords.latitude, position.coords.longitude]);
            setLoading(false);
            setError('');
          },
          (err) => {
            setError('Unable to retrieve your location.');
            setLoading(false);
          }
        );
      };
    // Handles updating the place type and resets customPlaceType if needed
    const updatePlaceType = (nextType) => {
      setAddressForm((current) => ({
        ...current,
        placeType: nextType,
        customPlaceType: nextType === 'Other' ? current.customPlaceType : '',
      }));
    };
  const [position, setPosition] = useState([6.5244, 3.3792]);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [draftAddress, setDraftAddress] = useState(null);
  const [searchResult, setSearchResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedAddresses, setSavedAddresses] = useState(readSavedAddresses);
  const [addressForm, setAddressForm] = useState(initialAddressForm);
  const [copyState, setCopyState] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publicConfig, setPublicConfig] = useState(null);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [selectedNavigationKey, setSelectedNavigationKey] = useState('');

  const activeAddress = draftAddress || searchResult;
  const navigationPoints = Array.isArray(draftAddress?.navigation_points) ? draftAddress.navigation_points : [];
  const selectedNavigationPoint = navigationPoints.find((point) => point.key === selectedNavigationKey)
    || navigationPoints.find((point) => point.key === draftAddress?.selected_navigation_point)
    || navigationPoints[0]
    || null;
  const activePosition = searchResult
    ? [Number(searchResult.latitude), Number(searchResult.longitude)]
    : (selectedPosition || position);
  const shareUrl = activeAddress ? `${window.location.origin}/${activeAddress.code}` : '';
  const addressSettings = getAddressSettings(publicConfig);
  const deliveryMessage = activeAddress ? [
    'Delivery destination',
    '',
    `PPOINNT Code: ${activeAddress.code}`,
    activeAddress.display_place_type ? `Place Type: ${activeAddress.display_place_type}` : null,
    `Place: ${activeAddress.building_name || activeAddress.landmark || 'Saved location'}`,
    activeAddress.structured_address_line || null,
    activeAddress.community_name ? `Community: ${activeAddress.community_name}` : null,
    activeAddress.entrance_label ? `Access Point: ${activeAddress.entrance_label}` : null,
    `City: ${activeAddress.city}, ${activeAddress.state}`,
    shareUrl ? `Share Link: ${shareUrl}` : null,
  ].filter(Boolean).join('\n') : '';
  const shareCardText = activeAddress ? [
    'My PPOINNT Address',
    '',
    activeAddress.code,
    '',
    [activeAddress.house_number, activeAddress.building_name || activeAddress.landmark || 'Community mapped address'].filter(Boolean).join(' '),
    activeAddress.structured_address_line || null,
    activeAddress.entrance_label ? `Access Point: ${activeAddress.entrance_label}` : null,
    `${activeAddress.city}, ${activeAddress.state}`,
    shareUrl,
  ].filter(Boolean).join('\n') : '';

  useEffect(() => {
    api.get('/platform/system/public-config')
      .then((response) => setPublicConfig(response.data.data || null))
      .catch(() => setPublicConfig(null));
  }, []);

  useEffect(() => {
    if (!draftAddress) {
      setSelectedNavigationKey('');
      return;
    }
    setSelectedNavigationKey(draftAddress.selected_navigation_point || draftAddress.navigation_points?.[0]?.key || '');
  }, [draftAddress]);

  const generateCommunityAddress = async () => {
    if (!selectedPosition) return;
    setLoading(true);
    setError('');
    setNotice('');

    try {
      const response = await api.post('/platform/community/addresses/generate', {
        latitude: selectedPosition[0],
        longitude: selectedPosition[1]
      });
      const nextAddress = response.data.data;
      setDraftAddress(nextAddress);
      
      const nextLat = Number(nextAddress.latitude);
      const nextLng = Number(nextAddress.longitude);
      if (!isNaN(nextLat) && !isNaN(nextLng)) {
        setSelectedPosition([nextLat, nextLng]);
        setPosition([nextLat, nextLng]);
      }
      
      setNotice('PPOINNT code generated. Please review and save beneath the map to activate it.');
    } catch (requestError) {
      try {
        const fallbackResponse = await api.post(resolveCommunityApiUrl('/platform/community/addresses/generate'), {
          latitude: selectedPosition[0],
          longitude: selectedPosition[1]
        });
        const nextAddress = fallbackResponse.data.data;
        setDraftAddress(nextAddress);
        
        const nextLat = Number(nextAddress.latitude);
        const nextLng = Number(nextAddress.longitude);
        if (!isNaN(nextLat) && !isNaN(nextLng)) {
          setSelectedPosition([nextLat, nextLng]);
          setPosition([nextLat, nextLng]);
        }
        
        setNotice('PPOINNT code generated. Please review and save beneath the map to activate it.');
      } catch (fallbackError) {
        setError(fallbackError.response?.data?.message || requestError.response?.data?.error || 'Failed to generate community address.');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveCommunityAddress = async () => {
    if (!draftAddress?.id) {
      setError('Generate a PPOINNT code before saving address details.');
      return;
    }

    if (addressSettings.requireBuildingName && !addressForm.buildingName.trim()) {
      setError('Building / Place Name is required.');
      return;
    }

    if (!addressForm.placeType) {
      setError('Select a place type before saving the PPOINNT address.');
      return;
    }

    if (addressForm.placeType === 'Other' && !addressForm.customPlaceType.trim()) {
      setError('Enter the custom place type when selecting Other.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    const payload = {
      code: draftAddress.code,
      ppoint_code: draftAddress.ppoint_code || draftAddress.code,
      latitude: draftAddress.latitude,
      longitude: draftAddress.longitude,
      placeType: addressForm.placeType,
      customPlaceType: addressForm.customPlaceType,
      buildingName: addressForm.buildingName,
      houseNumber: addressForm.houseNumber || draftAddress.house_number || '',
      streetName: draftAddress.street_name || '',
      communityName: draftAddress.community_name || '',
      landmark: addressForm.landmark,
      district: addressForm.district,
      buildingPolygonId: draftAddress.building_polygon_id || draftAddress.address_metadata?.building_id || '',
      streetDescription: addressForm.streetDescription,
      phoneNumber: addressForm.phoneNumber,
      entranceLabel: selectedNavigationPoint?.label || draftAddress.entrance_label || null,
      entranceLatitude: selectedNavigationPoint?.latitude ?? draftAddress.entrance_latitude ?? null,
      entranceLongitude: selectedNavigationPoint?.longitude ?? draftAddress.entrance_longitude ?? null,
      confidenceScore: draftAddress.confidence_score || 0,
      addressMetadata: {
        ...(draftAddress.address_metadata || {}),
        selected_navigation_point: selectedNavigationPoint?.key || draftAddress.selected_navigation_point || null,
        navigation_points: draftAddress.navigation_points || draftAddress.address_metadata?.navigation_points || [],
      },
      createdBy: 'Community',
      createdSource: 'community',
    };

    try {
      const response = await api.patch(`/platform/community/addresses/${draftAddress.id}/details`, payload);
      const nextAddress = response.data.data;
      setDraftAddress(nextAddress);
      const nextSaved = [
        { label: nextAddress.building_name || nextAddress.code, ...nextAddress },
        ...savedAddresses.filter((item) => item.code !== nextAddress.code),
      ];
      setSavedAddresses(nextSaved);
      setShowMoreDetails(false);
      localStorage.setItem(storageKey, JSON.stringify(nextSaved));
      setNotice('Community address saved and activated. It is ready for delivery, navigation, and sharing.');
    } catch (requestError) {
      try {
        const fallbackResponse = await api.patch(resolveCommunityApiUrl(`/platform/community/addresses/${draftAddress.id}/details`), payload);
        const nextAddress = fallbackResponse.data.data;
        const nextSaved = [
          { label: nextAddress.building_name || nextAddress.code, ...nextAddress },
          ...savedAddresses.filter((item) => item.code !== nextAddress.code),
        ];
        setDraftAddress(nextAddress);
        setSavedAddresses(nextSaved);
        setShowMoreDetails(false);
        localStorage.setItem(storageKey, JSON.stringify(nextSaved));
        setNotice('Community address saved and activated. It is ready for delivery, navigation, and sharing.');
      } catch (fallbackError) {
        setError(fallbackError.response?.data?.message || requestError.response?.data?.message || 'Failed to save community address.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    const normalizedCode = searchQuery.trim().toUpperCase();
    if (!normalizedCode) {
      return;
    }

    setSearching(true);
    setError('');
    setNotice('');

    try {
      const response = await api.get('/address/search', { params: { code: normalizedCode } });
      const nextResult = response.data.data;
      setSearchResult(nextResult);
      setDraftAddress(null);
      setSelectedNavigationKey(nextResult.selected_navigation_point || nextResult.navigation_points?.[0]?.key || '');
      setSelectedPosition([Number(nextResult.latitude), Number(nextResult.longitude)]);
      setPosition([Number(nextResult.latitude), Number(nextResult.longitude)]);
      setNotice('PPOINNT address found.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'PPOINNT code not found.');
      setSearchResult(null);
    } finally {
      setSearching(false);
    }
  };

  const copyValue = async (value, type) => {
    if (!value) {
      return;
    }

    await navigator.clipboard.writeText(value);
    setCopied(type);
  };

  const sendToDriver = () => {
    if (!deliveryMessage) {
      return;
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(deliveryMessage)}`, '_blank', 'noopener,noreferrer');
  };

  const sendBySms = () => {
    if (!deliveryMessage) {
      return;
    }

    window.open(`sms:?body=${encodeURIComponent(deliveryMessage)}`, '_self');
  };

  const removeSavedAddress = (code) => {
    const nextSaved = savedAddresses.filter((item) => item.code !== code);
    setSavedAddresses(nextSaved);
    localStorage.setItem(storageKey, JSON.stringify(nextSaved));
  };

  return (
    <div className="space-y-10">
      <section className="flex flex-row gap-8 items-start">
        <div className="flex-1 min-w-[340px] max-w-lg rounded-[2rem] border border-white/10 bg-white/6 p-8 backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-300">Community Address Creation</p>
          <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Get Your PPOINNT Address</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-200">
            Create a PPOINNT address for your home, shop, business, estate gate, school, or public building without a developer account.
            Detect your location, place a map point manually when permission is denied, enter the building name, and generate a delivery-ready PPOINNT address in seconds.
          </p>

          <div className="mt-6 rounded-[1.5rem] border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            Community addresses become active as soon as you save them. Admin review is reserved for reported, suspicious, or business-verification cases.
          </div>

          <div className="mt-8 space-y-4">
            <Link to="/drivers" className="inline-block rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white text-lg shadow-lg hover:bg-blue-700 transition mb-4">Driver Navigation</Link>
            <PlaceTypePicker
              value={addressForm.placeType}
              customValue={addressForm.customPlaceType}
              onChange={updatePlaceType}
              onCustomChange={(nextValue) => setAddressForm((current) => ({ ...current, customPlaceType: nextValue }))}
            />

            <div className="grid gap-4 sm:grid-cols-2">
            <button onClick={detectLocation} disabled={loading} className="flex items-center justify-center gap-3 rounded-2xl bg-stone-950 px-6 py-4 font-semibold text-white disabled:opacity-50">
              <LocateFixed size={22} />
              Detect My Location
            </button>
            <button onClick={generateCommunityAddress} disabled={loading || !selectedPosition} className="flex items-center justify-center gap-3 rounded-2xl border border-stone-300 bg-white px-6 py-4 font-semibold text-stone-900 disabled:opacity-50">
              <ArrowRight size={20} />
              {loading ? 'Generating...' : 'Generate PPOINNT Code'}
            </button>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-stone-300">
            {selectedPosition
              ? `Final pin: ${selectedPosition[0].toFixed(6)}, ${selectedPosition[1].toFixed(6)}. Drag the marker until it matches the real entrance or delivery point.`
              : 'Click the map to place a marker anywhere in Africa. If browser location is blocked, manual pin selection remains available.'}
          </div>

          <form onSubmit={handleSearch} className="mt-6 rounded-[1.75rem] border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-400">Search PPOINNT Code</p>
            <div className="mt-4 flex flex-col gap-3 md:flex-row">
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search: PPT-NG-LAG-IKD-X4D9T" className={inputClassName} />
              <button disabled={searching} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-stone-950 disabled:opacity-50">
                <Search size={18} />
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {error && <div className="mt-6 rounded-2xl border border-red-200/40 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
          {notice && <div className="mt-6 rounded-2xl border border-emerald-200/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">{notice}</div>}

          {draftAddress && (
            <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-black/20 p-6">
              <p className="text-sm uppercase tracking-[0.35em] text-stone-400">Generated PPOINNT Code</p>
              <h2 className="mt-3 text-4xl font-black text-white">{draftAddress.code}</h2>
              {draftAddress.display_place_type && <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">{draftAddress.display_place_type}</p>}
              {draftAddress.structured_address_line && <p className="mt-2 text-lg text-stone-200">{draftAddress.structured_address_line}</p>}
              <p className="mt-2 text-stone-300">{draftAddress.city}, {draftAddress.state}, {draftAddress.country}</p>
              <p className="mt-3 text-xs font-mono text-stone-400">{Number(draftAddress.latitude).toFixed(6)}, {Number(draftAddress.longitude).toFixed(6)}</p>

              {(draftAddress.confidence_score || draftAddress.confidence_guidance) && (
                <div className={`mt-4 rounded-2xl border p-4 text-sm ${confidenceTone[draftAddress.confidence_level] || confidenceTone.medium}`}>
                  <p className="font-semibold uppercase tracking-[0.2em]">Confidence {draftAddress.confidence_score || 0}/100</p>
                  <p className="mt-2">{draftAddress.confidence_guidance || 'Review the detected entrance and street details before saving.'}</p>
                  {Number(draftAddress.confidence_score || 0) < 60 && <p className="mt-2 font-semibold">Low location accuracy. Adjust the map pin or confirm the entrance point.</p>}
                </div>
              )}

              {(draftAddress.community_name || draftAddress.street_name) && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-stone-200">
                  {draftAddress.community_name && <p>Detected community: <span className="font-semibold text-white">{draftAddress.community_name}</span></p>}
                  {draftAddress.street_name && <p className="mt-2">Detected street: <span className="font-semibold text-white">{draftAddress.street_name}</span></p>}
                </div>
              )}

              <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                Only Building / Place Name is required. You can save the PPOINNT address in about {addressSettings.quickCreateTargetSeconds} seconds and add the rest later.
              </div>

              {navigationPoints.length > 0 && (
                <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-stone-300">Suggested access point</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {navigationPoints.map((point) => (
                      <button
                        key={point.key}
                        type="button"
                        onClick={() => setSelectedNavigationKey(point.key)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${selectedNavigationPoint?.key === point.key ? 'border-white bg-white text-stone-950' : 'border-white/10 bg-black/20 text-stone-200'}`}
                      >
                        <p className="font-semibold">{point.label}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] opacity-70">{point.is_road_access ? 'Road access point' : 'Entrance point'}</p>
                        <p className="mt-2 font-mono text-xs">{Number(point.latitude).toFixed(6)}, {Number(point.longitude).toFixed(6)}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-4">
                <PlaceTypePicker
                  value={addressForm.placeType}
                  customValue={addressForm.customPlaceType}
                  onChange={updatePlaceType}
                  onCustomChange={(nextValue) => setAddressForm((current) => ({ ...current, customPlaceType: nextValue }))}
                  tone="light"
                />

                <div className="grid gap-4 md:grid-cols-2">
                <input value={addressForm.buildingName} onChange={(event) => setAddressForm({ ...addressForm, buildingName: event.target.value })} className={inputClassName} placeholder="Building / Place Name" />
                {addressSettings.showLandmark && <input value={addressForm.landmark} onChange={(event) => setAddressForm({ ...addressForm, landmark: event.target.value })} className={inputClassName} placeholder="Nearest Landmark (optional)" />}
                {addressSettings.showStreetDescription && <textarea value={addressForm.streetDescription} onChange={(event) => setAddressForm({ ...addressForm, streetDescription: event.target.value })} className={`${inputClassName} min-h-24 md:col-span-2`} placeholder="Street Description (optional)" />}
                {addressSettings.showPhoneNumber && <input value={addressForm.phoneNumber} onChange={(event) => setAddressForm({ ...addressForm, phoneNumber: event.target.value })} className={`${inputClassName} md:col-span-2`} placeholder="Phone Number (optional)" />}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMoreDetails((current) => !current)}
                className="mt-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
              >
                {showMoreDetails ? 'Hide more details' : 'Add more details'}
              </button>

              {showMoreDetails && (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {addressSettings.enableHouseNumber && <input value={addressForm.houseNumber} onChange={(event) => setAddressForm({ ...addressForm, houseNumber: event.target.value })} className={inputClassName} placeholder="House Number" />}
                  {addressSettings.enableDistrict && <input value={addressForm.district} onChange={(event) => setAddressForm({ ...addressForm, district: event.target.value })} className={inputClassName} placeholder="District" />}
                </div>
              )}

              <div className="mt-3 text-xs text-stone-400">
                Optional details help delivery accuracy, but they are not required to create the address.
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={saveCommunityAddress} disabled={saving} className="rounded-2xl bg-white px-5 py-3 font-semibold text-stone-950 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save PPOINNT Address'}
                </button>
                <button onClick={() => copyValue(draftAddress.code, 'code')} className="rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white">
                  {copyState === 'code' ? 'Code Copied' : 'Copy Code'}
                </button>
              </div>
            </div>
          )}

          {activeAddress && (
            <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/10">
              <p className="text-sm uppercase tracking-[0.35em] text-stone-500">My PPOINNT Address</p>
              <h2 className="mt-3 text-4xl font-black text-stone-950">{activeAddress.code}</h2>
              {activeAddress.display_place_type && <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">{activeAddress.display_place_type}</p>}
              <p className="mt-2 text-stone-600">{[activeAddress.house_number, activeAddress.building_name || activeAddress.landmark || activeAddress.description || 'Community mapped address'].filter(Boolean).join(' ')}</p>
              {activeAddress.structured_address_line && <p className="mt-1 text-stone-600">{activeAddress.structured_address_line}</p>}
              {activeAddress.community_name && <p className="mt-1 text-stone-600">Community: {activeAddress.community_name}</p>}
              {activeAddress.entrance_label && <p className="mt-1 text-stone-600">Access point: {activeAddress.entrance_label}</p>}
              <p className="mt-1 text-stone-600">{activeAddress.city}, {activeAddress.state}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.25em] text-stone-500">Status: {activeAddress.moderation_status || 'active'}</p>

              {(activeAddress.confidence_score || activeAddress.confidence_guidance) && (
                <div className={`mt-4 rounded-2xl border p-4 text-sm ${confidenceTone[activeAddress.confidence_level] || confidenceTone.medium}`}>
                  <p className="font-semibold uppercase tracking-[0.2em]">Confidence {activeAddress.confidence_score || 0}/100</p>
                  {activeAddress.confidence_guidance && <p className="mt-2">{activeAddress.confidence_guidance}</p>}
                  {Number(activeAddress.confidence_score || 0) < 60 && <p className="mt-2 font-semibold">Low location accuracy. Adjust the map pin or confirm the entrance point.</p>}
                </div>
              )}

              <div className="mt-6 rounded-2xl bg-stone-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                  <Share2 size={16} />
                  Send to Driver
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-stone-600">{deliveryMessage}</p>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <a href={`https://maps.google.com/?q=${activeAddress.latitude},${activeAddress.longitude}`} target="_blank" rel="noreferrer" className="rounded-2xl bg-stone-100 px-4 py-3 text-center text-sm font-semibold text-stone-900">Open on Map</a>
                <button onClick={() => copyValue(deliveryMessage, 'driver-message')} className="rounded-2xl bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-900">
                  {copyState === 'driver-message' ? 'Copied Message' : 'Copy Message'}
                </button>
                <button onClick={() => copyValue(activeAddress.code, 'share-code')} className="rounded-2xl bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-900">
                  {copyState === 'share-code' ? 'Copied Code' : 'Copy Code'}
                </button>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <button onClick={sendToDriver} className="rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold text-white">
                  WhatsApp
                </button>
                <button onClick={sendBySms} className="rounded-2xl bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-900">
                  SMS
                </button>
                <button onClick={() => copyValue(shareCardText, 'card')} className="rounded-2xl bg-stone-100 px-4 py-3 text-sm font-semibold text-stone-900">
                  {copyState === 'card' ? 'Copied Share Card' : 'Copy Share Card'}
                </button>
                <Link to={`/${activeAddress.code}`} className="rounded-2xl bg-[#25D366] px-4 py-3 text-center text-sm font-semibold text-white">Open Address Page</Link>
              </div>

              <div className="mt-6 rounded-2xl bg-stone-50 p-4">
                <p className="text-sm font-semibold text-stone-700">Support</p>
                <p className="mt-2 text-sm text-stone-600">{publicConfig?.support_contacts?.support_email || 'support@ppoinnt.africa'} • {publicConfig?.support_contacts?.support_phone_number || '+234-800-PPOINNT'}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-[340px] max-w-2xl space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-stone-950/60 shadow-2xl shadow-black/30">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-stone-400">Map Selection</p>
                <h3 className="mt-1 text-2xl font-bold text-white">Pin the exact building point</h3>
              </div>
              <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">Africa-wide</div>
            </div>
            <div className="h-[620px]">
              <MapContainer center={position} zoom={5} style={{ height: '100%', width: '100%' }}>
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapViewportController position={activePosition} />
                <MapClickHandler onSelect={(nextPosition) => { setSelectedPosition(nextPosition); setPosition(nextPosition); setDraftAddress(null); setError(''); }} />
                <DraggableSelectionMarker position={selectedPosition} onChange={(nextPosition) => { setSelectedPosition(nextPosition); setPosition(nextPosition); setDraftAddress(null); }} />
                {searchResult && <Marker position={[Number(searchResult.latitude), Number(searchResult.longitude)]}><Popup>{searchResult.code}</Popup></Marker>}
              </MapContainer>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              { icon: Smartphone, title: 'USSD Access', text: 'Non-smartphone flows are exposed through the USSD session API for telecom integration. Dial flow: 234777#.' },
              { icon: Search, title: 'SMS Lookup', text: 'SMS search is available through the SMS lookup endpoint using commands like ADDRESS IKORODU ZENITHBANK.' },
              { icon: MapPinned, title: 'Agent Mapping', text: 'Field agents can create and edit mapped community addresses from a dedicated dashboard.' },
              { icon: Truck, title: 'Logistics API', text: 'Delivery and routing platforms can verify single or bulk PPOINNT codes for navigation.' },
            ].map((item) => (
              <div key={item.title} className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 backdrop-blur">
                <item.icon className="text-amber-300" />
                <h3 className="mt-4 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-stone-300">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.3em] text-stone-400">Offline Saved Addresses</p>
            <div className="mt-4 space-y-3">
              {savedAddresses.length ? savedAddresses.map((item) => (
                <div key={item.code} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div>
                    <p className="font-semibold text-white">{item.label || item.building_name || item.code}</p>
                    <p className="mt-1 text-sm text-stone-300">{item.code}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/${item.code}`} className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white">Open</Link>
                    <button onClick={() => removeSavedAddress(item.code)} className="rounded-full bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200">Remove</button>
                  </div>
                </div>
              )) : <p className="text-sm text-stone-300">No saved community addresses yet.</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <article className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
          <Building2 className="text-amber-300" />
          <h3 className="mt-4 text-2xl font-black text-white">Verified Business Locations</h3>
          <p className="mt-3 text-sm leading-7 text-stone-300">Businesses can claim PPOINNT codes, attach their operating profile, and move through admin approval into verified location status.</p>
          <Link to="/developers" className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">Open Developer and Business Console</Link>
        </article>
        <article className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
          <MapPinned className="text-sky-300" />
          <h3 className="mt-4 text-2xl font-black text-white">Field Agent Dashboard</h3>
          <p className="mt-3 text-sm leading-7 text-stone-300">Register agents, map rural or urban communities, and create active PPOINNT addresses for delivery and navigation.</p>
          <Link to="/agents" className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">Open Agents</Link>
        </article>
        <article className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
          <Truck className="text-emerald-300" />
          <h3 className="mt-4 text-2xl font-black text-white">Developer Monetization</h3>
          <p className="mt-3 text-sm leading-7 text-stone-300">Starter, Growth, Enterprise, and Logistics API plans are now structured for usage tracking, billing, and request limits.</p>
          <Link to="/developers" className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">See Plans</Link>
        </article>
      </section>
    </div>
  );
}