import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { ArrowRight, Building2, Copy, LocateFixed, MapPinned, Search, Share2, Smartphone, Truck } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const storageKey = 'ppoint_saved_addresses';
const initialAddressForm = {
  buildingName: '',
  houseNumber: '',
  landmark: '',
  district: '',
  streetDescription: '',
  phoneNumber: '',
};
const inputClassName = 'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-stone-500';

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

export default function HomePage() {
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

  const activeAddress = draftAddress || searchResult;
  const activePosition = searchResult
    ? [Number(searchResult.latitude), Number(searchResult.longitude)]
    : (selectedPosition || position);
  const shareUrl = activeAddress ? `${window.location.origin}/${activeAddress.code}` : '';
  const addressSettings = getAddressSettings(publicConfig);
  const deliveryMessage = activeAddress ? [
    'Delivery destination',
    '',
    `PPOINNT Code: ${activeAddress.code}`,
    `Place: ${activeAddress.building_name || activeAddress.landmark || 'Saved location'}`,
    `City: ${activeAddress.city}, ${activeAddress.state}`,
    shareUrl ? `Share Link: ${shareUrl}` : null,
  ].filter(Boolean).join('\n') : '';
  const shareCardText = activeAddress ? [
    'My PPOINNT Address',
    '',
    activeAddress.code,
    '',
    [activeAddress.house_number, activeAddress.building_name || activeAddress.landmark || 'Community mapped address'].filter(Boolean).join(' '),
    `${activeAddress.city}, ${activeAddress.state}`,
    shareUrl,
  ].filter(Boolean).join('\n') : '';

  useEffect(() => {
    api.get('/platform/system/public-config')
      .then((response) => setPublicConfig(response.data.data || null))
      .catch(() => setPublicConfig(null));
  }, []);

  const setCopied = (value) => {
    setCopyState(value);
    setTimeout(() => setCopyState(''), 1800);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser. Use Select Map Point instead.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextPosition = [coords.latitude, coords.longitude];
        setSelectedPosition(nextPosition);
        setPosition(nextPosition);
        setError('');
        setNotice('Location detected. Drag the marker if you need to adjust the exact entrance.');
      },
      () => {
        setError('Location permission was denied. Select the map point manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const generateCommunityAddress = async () => {
    if (!selectedPosition) {
      setError('Select a map point or detect your location first.');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');

    try {
      const response = await api.post('/platform/community/addresses/generate', {
        latitude: selectedPosition[0],
        longitude: selectedPosition[1],
      });
      setDraftAddress(response.data.data);
      setSearchResult(null);
      setNotice('PPOINNT code generated. Add the building name and any optional delivery details, then save. Community addresses go live immediately.');
    } catch (requestError) {
      try {
        const fallbackResponse = await api.post(resolveCommunityApiUrl('/platform/community/addresses/generate'), {
          latitude: selectedPosition[0],
          longitude: selectedPosition[1],
        });
        setDraftAddress(fallbackResponse.data.data);
        setSearchResult(null);
        setNotice('PPOINNT code generated. Add the building name and any optional delivery details, then save. Community addresses go live immediately.');
      } catch (fallbackError) {
        setError(fallbackError.response?.data?.message || requestError.response?.data?.message || 'Failed to generate PPOINNT code.');
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

    setSaving(true);
    setError('');
    setNotice('');

    const payload = {
      code: draftAddress.code,
      ppoint_code: draftAddress.ppoint_code || draftAddress.code,
      latitude: draftAddress.latitude,
      longitude: draftAddress.longitude,
      buildingName: addressForm.buildingName,
      houseNumber: addressForm.houseNumber,
      landmark: addressForm.landmark,
      district: addressForm.district,
      streetDescription: addressForm.streetDescription,
      phoneNumber: addressForm.phoneNumber,
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
      <section className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/6 p-8 backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-300">Community Address Creation</p>
          <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Get Your PPOINNT Address</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-200">
            Create a PPOINNT address for your home, shop, business, estate gate, school, or public building without a developer account.
            Detect your location, place a map point manually when permission is denied, enter the building name, and generate a delivery-ready PPOINNT address in seconds.
          </p>

          <div className="mt-6 rounded-[1.5rem] border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            Community addresses become active as soon as you save them. Admin review is reserved for reported, suspicious, or business-verification cases.
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <button onClick={detectLocation} disabled={loading} className="flex items-center justify-center gap-3 rounded-2xl bg-stone-950 px-6 py-4 font-semibold text-white disabled:opacity-50">
              <LocateFixed size={22} />
              Detect My Location
            </button>
            <button onClick={generateCommunityAddress} disabled={loading || !selectedPosition} className="flex items-center justify-center gap-3 rounded-2xl border border-stone-300 bg-white px-6 py-4 font-semibold text-stone-900 disabled:opacity-50">
              <ArrowRight size={20} />
              {loading ? 'Generating...' : 'Generate PPOINNT Code'}
            </button>
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
              <p className="mt-2 text-stone-300">{draftAddress.city}, {draftAddress.state}, {draftAddress.country}</p>
              <p className="mt-3 text-xs font-mono text-stone-400">{Number(draftAddress.latitude).toFixed(6)}, {Number(draftAddress.longitude).toFixed(6)}</p>

              <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                Only Building / Place Name is required. You can save the PPOINNT address in about {addressSettings.quickCreateTargetSeconds} seconds and add the rest later.
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <input value={addressForm.buildingName} onChange={(event) => setAddressForm({ ...addressForm, buildingName: event.target.value })} className={inputClassName} placeholder="Building / Place Name" />
                {addressSettings.showLandmark && <input value={addressForm.landmark} onChange={(event) => setAddressForm({ ...addressForm, landmark: event.target.value })} className={inputClassName} placeholder="Nearest Landmark (optional)" />}
                {addressSettings.showStreetDescription && <textarea value={addressForm.streetDescription} onChange={(event) => setAddressForm({ ...addressForm, streetDescription: event.target.value })} className={`${inputClassName} min-h-24 md:col-span-2`} placeholder="Street Description (optional)" />}
                {addressSettings.showPhoneNumber && <input value={addressForm.phoneNumber} onChange={(event) => setAddressForm({ ...addressForm, phoneNumber: event.target.value })} className={`${inputClassName} md:col-span-2`} placeholder="Phone Number (optional)" />}
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
              <p className="mt-2 text-stone-600">{[activeAddress.house_number, activeAddress.building_name || activeAddress.landmark || activeAddress.description || 'Community mapped address'].filter(Boolean).join(' ')}</p>
              <p className="mt-1 text-stone-600">{activeAddress.city}, {activeAddress.state}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.25em] text-stone-500">Status: {activeAddress.moderation_status || 'active'}</p>

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

        <div className="space-y-6">
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