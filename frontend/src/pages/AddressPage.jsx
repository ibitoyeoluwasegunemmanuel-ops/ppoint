import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Navigation, Share2, MapPin } from 'lucide-react';
import api from '../services/api';

export default function AddressPage() {
  const { code } = useParams();
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const response = await api.get(`/address/${code}`);
        setAddress(response.data.data);
      } catch {
        setError('Address not found');
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, [code]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">{error}</h2>
        <p className="text-gray-600 mt-2">This PPOINT code doesn't exist in our system.</p>
      </div>
    );
  }

  const position = [Number(address.latitude), Number(address.longitude)];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white text-stone-900 shadow-2xl shadow-black/20">
        <div className="h-[400px]">
          <MapContainer
            center={position}
            zoom={18}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position}>
              <Popup>{address.code}</Popup>
            </Marker>
          </MapContainer>
        </div>

        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-black text-gray-900 mb-2">{address.code}</h1>
              <p className="text-xl text-gray-600">{address.city}, {address.state}</p>
              <p className="text-gray-500">{address.country}</p>
            </div>
            <div className="rounded-xl bg-primary-50 p-4">
              <MapPin size={32} className="text-primary-600" />
            </div>
          </div>

          <div className="flex gap-4">
            <a
              href={`https://maps.google.com/?q=${address.latitude},${address.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Navigation size={20} />
              Navigate Here
            </a>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `PPOINT ${address.code}`,
                    text: `Navigate to ${address.code} in ${address.city}`,
                    url: window.location.href
                  });
                }
              }}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 size={20} />
              Share
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-2">Coordinates</h3>
            <p className="font-mono text-sm text-gray-600">
              {Number(address.latitude).toFixed(6)}, {Number(address.longitude).toFixed(6)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}