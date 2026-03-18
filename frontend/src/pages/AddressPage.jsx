import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Copy, Navigation, QrCode, Save, Share2 } from 'lucide-react';
import QRCode from 'qrcode';
import api from '../services/api';

export default function AddressPage() {
  const { code } = useParams();
  const [address, setAddress] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [copyState, setCopyState] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [publicConfig, setPublicConfig] = useState(null);
  const [driverLat, setDriverLat] = useState(null);
  const [driverLng, setDriverLng] = useState(null);
  const [driverLocationError, setDriverLocationError] = useState(null);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/${code}` : `https://ppoint.africa/${code}`;

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const response = await api.get(`/address/${code}`);
        setAddress(response.data.data);
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Address not found');
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
    api.get('/platform/system/public-config')
      .then((response) => setPublicConfig(response.data.data || null))
      .catch(() => setPublicConfig(null));
  }, [code]);

  useEffect(() => {
    if (!address) {
      return;
    }

    QRCode.toDataURL(shareUrl, { width: 220, margin: 1 })
      .then(setQrCodeUrl)
      .catch(() => setQrCodeUrl(''));
  }, [address, shareUrl]);

  if (loading) {
    return <div className="flex items-center justify-center p-16 text-white">Loading address...</div>;
  }

  if (error) {
    return <div className="rounded-[2rem] border border-red-200/30 bg-red-500/10 p-10 text-center text-red-100">{error}</div>;
  }

  const position = [Number(address.latitude), Number(address.longitude)];
  const deliveryMessage = [
    'Delivery destination',
    '',
    `PPOINNT Code: ${address.code}`,
    address.display_place_type ? `Place type: ${address.display_place_type}` : null,
    `Place: ${[address.house_number, address.building_name || address.landmark || address.description || 'Saved address'].filter(Boolean).join(' ')}`,
    address.structured_address_line ? `Address line: ${address.structured_address_line}` : null,
    `City: ${address.city}, ${address.state}, ${address.country}`,
    `Share Link: ${shareUrl}`,
  ].filter(Boolean).join('\n');

  const sendToDriver = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(deliveryMessage)}`, '_blank', 'noopener,noreferrer');
  };

  const sendBySms = () => {
    window.open(`sms:?body=${encodeURIComponent(deliveryMessage)}`, '_self');
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl shadow-black/20">
        <div className="h-[520px]">
          <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={position}><Popup>{address.code}</Popup></Marker>
            {/* Driver location marker */}
            {driverLat && driverLng && (
              <Marker position={[driverLat, driverLng]}>
                <Popup>My Location</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <button
            className="rounded-xl bg-blue-600 px-4 py-2 text-white font-semibold"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setDriverLat(pos.coords.latitude);
                    setDriverLng(pos.coords.longitude);
                    setDriverLocationError(null);
                  },
                  (err) => {
                    setDriverLocationError('Unable to detect location');
                  }
                );
              } else {
                setDriverLocationError('Geolocation not supported');
              }
            }}
          >
            Detect My Location
          </button>
          {driverLat && driverLng && (
            <span className="text-sm text-stone-700">Lat: {driverLat.toFixed(6)}, Lng: {driverLng.toFixed(6)}</span>
          )}
          {driverLocationError && (
            <span className="text-sm text-red-600">{driverLocationError}</span>
          )}
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white p-8 text-stone-900 shadow-2xl shadow-black/20">
        <p className="text-sm uppercase tracking-[0.35em] text-stone-500">PPOINT Address</p>
        <h1 className="mt-3 text-4xl font-black text-stone-950">{address.code}</h1>
        <p className="mt-3 text-lg text-stone-600">{address.city}, {address.state}, {address.country}</p>
        {address.display_place_type && <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">{address.display_place_type}</p>}
        {(address.house_number || address.building_name) && <p className="mt-2 text-sm font-semibold text-stone-800">{[address.house_number, address.building_name].filter(Boolean).join(' ')}</p>}
        {address.structured_address_line && <p className="mt-2 text-sm font-medium text-stone-800">{address.structured_address_line}</p>}
        {address.landmark && <p className="mt-2 text-sm font-medium text-stone-700">Nearby landmark: {address.landmark}</p>}
        {address.district && <p className="mt-2 text-sm font-medium text-stone-700">District: {address.district}</p>}
        {address.street_description && <p className="mt-2 text-sm text-stone-600">{address.street_description}</p>}
        {address.description && <p className="mt-2 text-sm text-stone-600">{address.description}</p>}
        <p className="mt-2 text-xs font-medium uppercase tracking-[0.25em] text-stone-500">Created by {address.created_by || 'Community'} • {address.moderation_status || 'active'}</p>
        <p className="mt-3 font-mono text-sm text-stone-500">{position[0].toFixed(6)}, {position[1].toFixed(6)}</p>

        <div className="mt-6 rounded-2xl bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-700">Send to Driver</p>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-stone-600">{deliveryMessage}</p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <button onClick={sendToDriver} className="rounded-2xl bg-[#25D366] px-5 py-3 text-center font-semibold text-white">
            <Share2 size={16} className="inline mr-2" />WhatsApp
          </button>
          <button onClick={sendBySms} className="rounded-2xl bg-stone-100 px-5 py-3 text-center font-semibold text-stone-900">
            <Share2 size={16} className="inline mr-2" />SMS
          </button>
          <button onClick={async () => { await navigator.clipboard.writeText(deliveryMessage); setCopyState('message'); setTimeout(() => setCopyState(''), 1800); }} className="rounded-2xl bg-stone-100 px-5 py-3 font-semibold text-stone-900">
            <Copy size={16} className="inline mr-2" />{copyState === 'message' ? 'Copied Message' : 'Copy Message'}
          </button>
          <button onClick={async () => { await navigator.clipboard.writeText(address.code); setCopyState('code'); setTimeout(() => setCopyState(''), 1800); }} className="rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white">
            <Copy size={16} className="inline mr-2" />{copyState === 'code' ? 'Copied Code' : 'Copy Code'}
          </button>
          <a href={`https://maps.google.com/?q=${address.latitude},${address.longitude}`} target="_blank" rel="noreferrer" className="rounded-2xl bg-stone-100 px-5 py-3 text-center font-semibold text-stone-900 md:col-span-2 xl:col-span-4">
            <Navigation size={16} className="inline mr-2" />Open on Map
          </a>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <button onClick={async () => { await navigator.clipboard.writeText(shareUrl); setCopyState('link'); setTimeout(() => setCopyState(''), 1800); }} className="rounded-2xl bg-stone-100 px-5 py-3 font-semibold text-stone-900">
            <Copy size={16} className="inline mr-2" />{copyState === 'link' ? 'Copied Link' : 'Copy Link'}
          </button>
          <button onClick={() => setShowQrCode((current) => !current)} className="rounded-2xl bg-stone-950 px-5 py-3 font-semibold text-white">
            <QrCode size={16} className="inline mr-2" />Generate QR Code
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-700">Permanent code</p>
          <p className="mt-2 text-sm leading-7 text-stone-600">This PPOINT code is permanently linked to this saved location and can be reused in maps, logistics, emergency response, and business systems.</p>
        </div>

        <div className="mt-6 rounded-2xl bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-700">Support</p>
          <p className="mt-2 text-sm text-stone-600">{publicConfig?.support_contacts?.support_email || 'support@ppoinnt.africa'} • {publicConfig?.support_contacts?.support_phone_number || '+234-800-PPOINNT'}</p>
        </div>

        {/* Claim system: show if building is detected and unclaimed */}
        {address.status === 'unverified' || address.status === 'claimed' ? (
          <div className="mt-6">
            <a
              href={`/claim-building?buildingId=${address.id}`}
              className="block w-full rounded-2xl bg-yellow-500 px-5 py-4 text-center font-bold text-white text-lg shadow-md mt-2"
            >
              {address.status === 'claimed' ? 'This building is already claimed' : 'This building already exists. Claim this PPOINNT address.'}
            </a>
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_220px]">
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-sm font-semibold text-stone-700">Shareable link</p>
            <p className="mt-2 break-all font-mono text-sm text-stone-900">{shareUrl}</p>
            <button onClick={() => {
              const saved = JSON.parse(localStorage.getItem('ppoint_saved_addresses') || '[]');
              const nextSaved = [{ label: 'Saved Address', ...address }, ...saved.filter((item) => item.code !== address.code)];
              localStorage.setItem('ppoint_saved_addresses', JSON.stringify(nextSaved));
            }} className="mt-4 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white"><Save size={14} className="inline mr-2" />Save Offline</button>
          </div>
          <div className="rounded-2xl bg-stone-50 p-4 text-center">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700"><QrCode size={16} />QR Code</p>
            {showQrCode && qrCodeUrl && <img src={qrCodeUrl} alt={`QR for ${address.code}`} className="mx-auto mt-3 h-44 w-44 rounded-xl bg-white p-2" />}
          </div>
        </div>
      </div>
    </div>
  );
}