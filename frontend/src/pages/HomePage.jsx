import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MapboxMap, { Marker } from '../components/MapboxMap';
import { ArrowRight, Building2, Check, Copy, LocateFixed, MapPinned, Navigation, Search, Share2, Smartphone, Truck } from 'lucide-react';
import api from '../services/api';
import { PLACE_TYPES } from '../constants/placeTypes';


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

// DraggableSelectionMarker is now handled via Mapbox Marker drag events
function DraggablePin({ position, onChange }) {
  if (!position) return null;
  return (
    <Marker
      longitude={position[1]}
      latitude={position[0]}
      anchor="bottom"
      draggable
      onDragEnd={(e) => {
        const { lng, lat } = e.lngLat;
        onChange([lat, lng]);
      }}
    >
      <div style={{ fontSize: 30, lineHeight: 1, filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.5))' }}>📍</div>
    </Marker>
  );
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

function BottomSheet({ isOpen, children }) {
  return (
    <>
      {/* Overlay */}
      <div className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} />
      
      {/* Sheet */}
      <div className={`fixed inset-x-0 bottom-0 z-50 transform rounded-t-[2.5rem] border-t border-white/10 bg-stone-950 p-6 pb-12 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-spring ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-white/20" />
        {children}
      </div>
    </>
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
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isBottomSheetExpanded, setIsBottomSheetExpanded] = useState(false);
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
    'My PPOINNT delivery address:',
    '',
    activeAddress.code,
    [activeAddress.building_name || activeAddress.community_name || activeAddress.landmark, activeAddress.city, activeAddress.state].filter(Boolean).join(', '),
    activeAddress.entrance_label ? `Access point: ${activeAddress.entrance_label}` : null,
    '',
    'Open location:',
    shareUrl || `https://ppoint.online/${activeAddress.code}`,
  ].filter(v => v !== null).join('\n') : '';
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
      setStep(2);
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
        setStep(2);
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
      setStep(4);
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
        setStep(4);
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
      setStep(4);
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
    setCopyState(type);
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

  // ─── Render Sub-Components (Modals & Overlays) ──────────────────────────

  // Bottom Sheet Container
  const BottomSheet = ({ children, isOpen, onClose }) => (
    <div className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="absolute inset-x-0 top-0 h-10 w-full -translate-y-full bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      <div className="rounded-t-3xl border-t border-white/20 bg-stone-950/90 p-6 shadow-2xl backdrop-blur-2xl sm:p-8 sm:pb-12 max-w-2xl mx-auto">
        <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-white/20" />
        {children}
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full flex flex-col bg-stone-900 overflow-hidden">
      {/* ─── FULL SCREEN MAP ─── */}
      <div className="absolute inset-0 z-0">
        <MapboxMap
          center={[position[1], position[0]]}
          zoom={15}
          defaultViewMode="hybrid"
          defaultTheme="dark"
          showViewToggle={false}
          onClick={(lat, lng) => {
            if (step !== 1) return;
            setSelectedPosition([lat, lng]);
            setPosition([lat, lng]);
            setDraftAddress(null);
            setError('');
          }}
          style={{ height: '100%', width: '100%' }}
        >
          <DraggablePin
            position={selectedPosition}
            onChange={(nextPosition) => {
              setSelectedPosition(nextPosition);
              setPosition(nextPosition);
              setDraftAddress(null);
            }}
          />
          {searchResult && (
            <Marker longitude={Number(searchResult.longitude)} latitude={Number(searchResult.latitude)} anchor="bottom">
              <div style={{ fontSize: 32, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}>📍</div>
            </Marker>
          )}
        </MapboxMap>
      </div>

      {/* ─── FLOATING TOP CONTROLS ─── */}
      <div className="absolute top-4 inset-x-4 z-10 flex flex-col gap-3 max-w-xl mx-auto pointer-events-none">
        {/* Search Bar */}
        <form onSubmit={(e) => { handleSearch(e); if (searchQuery) setStep(4); }} className="relative pointer-events-auto">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PPOINNT Code..."
            className="w-full rounded-[1.5rem] border border-white/20 bg-stone-950/80 px-5 py-4 pl-12 font-bold text-white shadow-xl backdrop-blur-xl outline-none placeholder:text-stone-400 focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
          {searching && <span className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-amber-400">⌛</span>}
        </form>

        {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/80 p-3 text-sm font-semibold text-white shadow-lg backdrop-blur pointer-events-auto">{error}</div>}
        {notice && <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/80 p-3 text-sm font-semibold text-white shadow-lg backdrop-blur pointer-events-auto">{notice}</div>}
      </div>

      {/* ─── FLOATING RIGHT CONTROLS ─── */}
      <div className="absolute right-4 bottom-40 z-10 flex flex-col gap-3 pointer-events-none">
        <button
          onClick={detectLocation}
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-stone-950/80 text-amber-400 shadow-xl backdrop-blur-xl hover:bg-stone-900 pointer-events-auto transition"
          title="Locate Me"
        >
          {loading ? <span className="animate-spin">↻</span> : <LocateFixed size={24} />}
        </button>
      </div>

      {/* ─── STEP 1: BOTTOM ACTION PANEL ─── */}
      <div className={`absolute inset-x-4 bottom-8 z-10 mx-auto max-w-xl transition-all duration-300 ${step === 1 ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
        <div className="relative rounded-[1.75rem] border border-white/20 bg-stone-950/80 p-4 shadow-2xl backdrop-blur-xl">
          {isBottomSheetExpanded ? (
            <div className="space-y-4 pt-2">
              <div 
                className="absolute left-1/2 top-4 h-1.5 w-12 -translate-x-1/2 cursor-pointer rounded-full bg-white/20 hover:bg-white/30"
                onClick={() => setIsBottomSheetExpanded(false)}
              />
              <div className="pt-4 flex flex-col gap-2">
                <label className="text-sm font-semibold text-stone-400">Select Place Type</label>
                <select
                  value={addressForm.placeType}
                  onChange={(e) => updatePlaceType(e.target.value)}
                  className="w-full rounded-[1.25rem] border border-white/20 bg-stone-900 px-4 py-3 text-white shadow-xl outline-none focus:border-amber-400/50"
                >
                  <option value="" disabled>Select a type...</option>
                  {PLACE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {addressForm.placeType === 'Other' && (
                   <input
                     value={addressForm.customPlaceType || ''}
                     onChange={(e) => setAddressForm((c) => ({ ...c, customPlaceType: e.target.value }))}
                     placeholder="Specify custom place type..."
                     className="mt-2 w-full rounded-[1.25rem] border border-white/20 bg-stone-900 px-4 py-3 text-white shadow-xl outline-none focus:border-amber-400/50"
                   />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={detectLocation}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-4 font-bold text-white hover:bg-white/20 transition disabled:opacity-50"
                >
                  <LocateFixed size={20} /> Locat{loading ? 'ing...' : 'e Me'}
                </button>
                <button
                  onClick={() => { setIsBottomSheetExpanded(false); generateCommunityAddress(); }}
                  disabled={loading || !selectedPosition}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-4 font-black text-stone-950 hover:bg-amber-300 transition shadow-lg shadow-amber-400/20 disabled:opacity-50"
                >
                  <MapPinned size={20} /> Generate
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsBottomSheetExpanded(true)}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-amber-400 px-4 py-4 font-black text-stone-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-300"
            >
              <MapPinned size={22} /> Generate PPOINNT Address
            </button>
          )}
        </div>
      </div>

      {/* ─── STEP 2: PPOINNT GENERATED MODAL ─── */}
      <BottomSheet isOpen={step === 2 && draftAddress}>
        <p className="text-sm font-black uppercase tracking-[0.3em] text-stone-400">New PPOINNT Code</p>
        <h2 className="mt-2 text-6xl font-black text-amber-400">{draftAddress?.code}</h2>
        <div className="mt-4 flex flex-col gap-1 text-lg font-semibold text-stone-200">
          <p>{draftAddress?.city}</p>
          <p className="text-stone-400">{draftAddress?.state}, {draftAddress?.country}</p>
        </div>
        
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button onClick={() => setStep(3)} className="w-full rounded-2xl bg-amber-400 py-4 font-black text-stone-950 hover:bg-amber-300 transition">Save & Activate</button>
          <button onClick={() => { setStep(1); setDraftAddress(null); }} className="w-full rounded-2xl bg-white/10 py-4 font-bold text-white hover:bg-white/20 transition">Discard</button>
        </div>
      </BottomSheet>

      {/* ─── STEP 3: ADD DETAILS MODAL ─── */}
      <BottomSheet isOpen={step === 3 && draftAddress}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-white">Save Address Details</h3>
          <button onClick={() => setStep(2)} className="rounded-full bg-white/10 p-2 text-stone-400 hover:text-white"><ArrowRight size={20} className="rotate-180" /></button>
        </div>
        
        <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          <PlaceTypePicker
            tone="dark"
            value={addressForm.placeType}
            customValue={addressForm.customPlaceType}
            onChange={(nextType) => setAddressForm({ ...addressForm, placeType: nextType })}
            onCustomChange={(nextCustom) => setAddressForm({ ...addressForm, customPlaceType: nextCustom })}
          />
          <input value={addressForm.buildingName} onChange={(event) => setAddressForm({ ...addressForm, buildingName: event.target.value })} className={inputClassName} placeholder="Building / Place Name (Required)" />
          {addressSettings.showLandmark && <input value={addressForm.landmark} onChange={(event) => setAddressForm({ ...addressForm, landmark: event.target.value })} className={inputClassName} placeholder="Nearest Landmark (optional)" />}
        </div>
        
        <button onClick={saveCommunityAddress} disabled={saving} className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-amber-400 px-6 py-4 text-xl font-black text-stone-950 shadow-xl shadow-amber-400/20 transition hover:bg-amber-300 disabled:opacity-50">
          {saving ? 'Saving...' : 'Confirm & Save'}
        </button>
      </BottomSheet>

      {/* ─── STEP 4: ACTIVE ADDRESS ACTIONS MODAL ─── */}
      <BottomSheet isOpen={step === 4 && activeAddress}>
        <p className="text-sm font-black uppercase tracking-[0.3em] text-emerald-400">PPOINNT Details</p>
        <h2 className="mt-1 text-5xl font-black text-white">{activeAddress?.code}</h2>
        <p className="mt-3 text-lg font-medium text-stone-300">{[activeAddress?.house_number, activeAddress?.building_name || activeAddress?.landmark].filter(Boolean).join(' ')}</p>
        <p className="mt-1 text-stone-500">{activeAddress?.city}, {activeAddress?.state}</p>
        
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link to={`/drivers?code=${activeAddress?.code}`} className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 py-4 font-black text-stone-950 hover:bg-amber-300 transition">
            <Navigation size={20} /> Navigate
          </Link>
          <button onClick={sendToDriver} className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 font-bold text-white shadow-lg transition hover:bg-[#20b858]">
            <Share2 size={20} /> Share
          </button>
          <button onClick={() => copyValue(activeAddress?.code, 'code')} className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 py-4 font-bold text-white hover:bg-white/20 transition sm:col-span-2">
            <Copy size={20} /> {copyState === 'code' ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
        <button onClick={() => { setStep(1); setDraftAddress(null); setSearchResult(null); }} className="mt-6 w-full text-center text-sm font-semibold text-stone-500 hover:text-white transition">Close</button>
      </BottomSheet>

    </div>
  );
}