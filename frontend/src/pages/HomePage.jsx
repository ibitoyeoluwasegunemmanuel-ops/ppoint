import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { ArrowRight, Copy, LocateFixed, Loader2, Navigation, Share2, ShieldCheck, Truck, Waves } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 18);
    }
  }, [position, map]);

  return position ? (
    <Marker position={position}>
      <Popup>Selected location</Popup>
    </Marker>
  ) : null;
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
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  const generateAddressForCoordinates = async (latitude, longitude) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/generate-address', {
        latitude,
        longitude
      });
      setAddress(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate address');
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    setLoading(true);
    setError(null);
    setLocationPermissionDenied(false);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        await generateAddressForCoordinates(latitude, longitude);
      },
      (err) => {
        if (err.code === 1) {
          setLocationPermissionDenied(true);
          setError('Location permission was denied. Click anywhere on the map to choose your location manually.');
        } else {
          setError(`Unable to retrieve your location: ${err.message}`);
        }
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const generateFromSelectedPoint = async () => {
    if (!position) {
      setError('Choose a point on the map first.');
      return;
    }

    await generateAddressForCoordinates(position[0], position[1]);
  };

  const copyToClipboard = async () => {
    if (!address) {
      return;
    }

    await navigator.clipboard.writeText(address.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareAddress = async () => {
    if (!address) {
      return;
    }

    const shareData = {
      title: 'My PPOINT Address',
      text: `My address is ${address.code} in ${address.city}`,
      url: `${window.location.origin}/${address.code}`
    };

    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard.writeText(`${window.location.origin}/${address.code}`);
    window.alert('Link copied to clipboard!');
  };

  const openNavigation = () => {
    if (address) {
      window.open(`https://maps.google.com/?q=${address.latitude},${address.longitude}`, '_blank');
    }
  };

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <div className="space-y-6 rounded-[2rem] border border-white/10 bg-white/6 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-sm text-amber-200">
            <Waves size={16} />
            Built for locations that deserve clarity
          </div>

          <div className="space-y-4">
            <h2 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
              A real address for any point on the map.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-stone-200">
              PPOINT turns live coordinates into simple, shareable location codes that work for
              deliveries, emergency response, visitors, field teams, and local discovery.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-3xl font-black text-amber-300">15m</p>
              <p className="mt-2 text-sm text-stone-300">Proximity check to avoid duplicate address creation.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-3xl font-black text-sky-300">Grid</p>
              <p className="mt-2 text-sm text-stone-300">Deterministic generation aligned to city service boundaries.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-3xl font-black text-emerald-300">Live</p>
              <p className="mt-2 text-sm text-stone-300">Ready to connect web, maps, operations, and administration.</p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white p-6 text-stone-900 shadow-xl shadow-black/10">
            <h3 className="text-2xl font-bold text-stone-900">Get your PPOINT address</h3>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Use your current location to generate a code you can copy, share, and navigate to instantly.
              If location access is denied, select a point on the map manually.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                onClick={detectLocation}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-stone-950 px-6 py-4 font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <LocateFixed size={24} />}
                {loading ? 'Detecting Location...' : 'Detect My Location'}
              </button>

              <button
                onClick={generateFromSelectedPoint}
                disabled={loading || !position}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-stone-300 bg-white px-6 py-4 font-semibold text-stone-900 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowRight size={20} />
                Use Selected Map Point
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
              {position ? (
                <>
                  <p className="font-semibold text-stone-900">Selected coordinates</p>
                  <p className="mt-1 font-mono text-xs text-stone-700">
                    {position[0].toFixed(6)}, {position[1].toFixed(6)}
                  </p>
                </>
              ) : (
                <p>Click anywhere on the map to choose a location manually.</p>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {locationPermissionDenied && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Browser location access is off for this site. You can still continue by selecting your location on the map.
              </div>
            )}

            {address && (
              <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-stone-50 p-6">
                <div className="text-center mb-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500">Your PPOINT Code</p>
                  <h3 className="mt-2 text-5xl font-black tracking-tight text-stone-950">{address.code}</h3>
                  <p className="mt-2 text-lg text-stone-600">{address.city}, {address.state}</p>
                  {address.isExisting && (
                    <span className="mt-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      Existing Address
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={copyToClipboard}
                    className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 transition-colors hover:bg-stone-100"
                  >
                    <Copy size={24} className={copied ? 'text-emerald-600' : 'text-stone-600'} />
                    <span className="text-xs font-medium text-stone-700">{copied ? 'Copied!' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={shareAddress}
                    className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 transition-colors hover:bg-stone-100"
                  >
                    <Share2 size={24} className="text-stone-600" />
                    <span className="text-xs font-medium text-stone-700">Share</span>
                  </button>

                  <button
                    onClick={openNavigation}
                    className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 transition-colors hover:bg-stone-100"
                  >
                    <Navigation size={24} className="text-stone-600" />
                    <span className="text-xs font-medium text-stone-700">Navigate</span>
                  </button>
                </div>

                <div className="mt-6 border-t border-stone-200 pt-6">
                  <p className="text-center text-xs text-stone-500">
                    Share this link: <br />
                    <span className="font-mono text-stone-950">{window.location.origin}/{address.code}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-stone-950/60 shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-stone-400">Live map</p>
              <h3 className="mt-1 text-2xl font-bold text-white">Coverage preview</h3>
            </div>
            <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              Nigeria beta
            </div>
          </div>
          <div className="h-[620px]">
            <MapContainer
              center={[6.5244, 3.3792]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler
                onSelect={(nextPosition) => {
                  setPosition(nextPosition);
                  setError(null);
                }}
              />
              <LocationMarker position={position} />
            </MapContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <article className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
          <Truck className="text-amber-300" size={28} />
          <h3 className="mt-4 text-xl font-bold text-white">Delivery clarity</h3>
          <p className="mt-3 text-sm leading-7 text-stone-300">
            Drivers and dispatch teams can route to a short code instead of relying on vague landmarks.
          </p>
        </article>
        <article className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
          <ShieldCheck className="text-sky-300" size={28} />
          <h3 className="mt-4 text-xl font-bold text-white">Emergency response</h3>
          <p className="mt-3 text-sm leading-7 text-stone-300">
            Faster coordination for field agents and responders who need exact location references.
          </p>
        </article>
        <article className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur">
          <ArrowRight className="text-emerald-300" size={28} />
          <h3 className="mt-4 text-xl font-bold text-white">Built to expand</h3>
          <p className="mt-3 text-sm leading-7 text-stone-300">
            The backend model supports city activation, administrative oversight, and gradual regional rollout.
          </p>
        </article>
      </section>
    </div>
  );
}