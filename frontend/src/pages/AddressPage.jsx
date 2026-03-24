import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MapboxMap, { Marker } from '../components/MapboxMap';
import { 
  ArrowLeft, Copy, Share2, Navigation, 
  MapPin, Check, Phone, Info, LayoutGrid,
  Send, ExternalLink, QrCode, Smartphone,
  ShieldCheck, Zap, ArrowRight
} from 'lucide-react';
import api from '../services/api';

// ─── Design System Tokens ────────────────────────────────────────────────────
const THEME = {
  primary: 'hsl(38, 92%, 50%)',
  accent: 'hsl(160, 84%, 39%)',
  bg: 'hsl(24, 10%, 10%)',
  card: 'hsla(24, 10%, 15%, 0.8)',
};

export default function AddressPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copyState, setCopyState] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const response = await api.get(`/addresses/${code.toUpperCase()}`);
        setAddress(response.data.data);
      } catch (err) {
        setError('PPOINNT Code not found or invalid.');
      } finally {
        setLoading(false);
      }
    };
    fetchAddress();
  }, [code]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address.code);
    setCopyState(true);
    setTimeout(() => setCopyState(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `PPOINNT Address: ${address.code}`,
        text: `Find this location using PPOINNT code: ${address.code}`,
        url: window.location.href,
      });
    } else {
      const msg = `My PPOINNT Address: ${address.code}\n${window.location.href}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-950">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-amber-400 border-t-transparent shadow-[0_0_20px_hsla(38,92%,50%,0.3)]" />
          <p className="mt-4 font-black text-white">RECONSTRUCTION COORDINATES...</p>
        </div>
      </div>
    );
  }

  if (error || !address) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-stone-950 p-6 text-center">
        <div className="mb-6 rounded-full bg-red-500/10 p-6 text-red-500 ring-1 ring-red-500/20">
          <Info size={48} />
        </div>
        <h2 className="text-3xl font-black text-white">404: CODE NOT FOUND</h2>
        <p className="mt-2 text-stone-500 font-medium">This PPOINNT code doesn't exist or has been deactivated.</p>
        <Link to="/" className="mt-8 rounded-2xl bg-amber-400 px-8 py-4 font-black text-stone-950 shadow-xl shadow-amber-400/20">
          Return to Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full flex flex-col bg-stone-950 overflow-hidden font-sans">
      {/* ── MAP HEADER (40% height) ── */}
      <div className="h-[45vh] w-full relative z-0">
        <MapboxMap
          center={[address.longitude, address.latitude]}
          zoom={16}
          defaultViewMode="hybrid"
          defaultTheme="dark"
          showViewToggle={false}
          style={{ height: '100%', width: '100%' }}
        >
          <Marker longitude={address.longitude} latitude={address.latitude} anchor="bottom">
            <div className="relative h-14 w-14 group">
              <div className={`absolute inset-0 rounded-full animate-ping opacity-25 ${address.address_type === 'verified_business' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <div className={`relative h-full w-full flex items-center justify-center rounded-full border-4 border-white text-3xl shadow-2xl transition-transform group-hover:scale-110 ${address.address_type === 'verified_business' ? 'bg-emerald-500' : 'bg-amber-400'}`}>
                {address.address_type === 'verified_business' ? '🏢' : '📍'}
              </div>
            </div>
          </Marker>
        </MapboxMap>

        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          className="absolute left-6 top-6 z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-stone-950/80 text-white shadow-2xl backdrop-blur-2xl hover:bg-stone-900"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* ── ADDRESS CONTENT ── */}
      <div className="relative z-10 flex-1 -mt-10 overflow-y-auto">
        <div className="mx-auto max-w-2xl min-h-full rounded-t-[3rem] border-t border-white/10 bg-stone-950/95 p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex gap-2 mb-2">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">PPOINNT Active</p>
                 {address.address_type === 'verified_business' && (
                    <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                       <ShieldCheck size={10} /> VERIFIED BUSINESS
                    </span>
                 )}
                 {address.confidence_score >= 90 && (
                    <span className="bg-amber-400 text-stone-950 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                       <Zap size={10} /> HIGH CONFIDENCE
                    </span>
                 )}
              </div>
              <h1 className="text-7xl font-black text-white tracking-tighter flex items-center gap-4">
                {address.code}
                <button onClick={handleCopy} className="text-stone-700 hover:text-amber-400 transition">
                  {copyState ? <Check size={28} className="text-emerald-400" /> : <Copy size={28} />}
                </button>
              </h1>

              {/* Creator Identity */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest leading-none">Created by</span>
                <Link 
                  to={`/profile/${address.profile_id || 1}`}
                  className="text-xs font-black text-amber-400 hover:text-amber-300 transition-colors uppercase italic flex items-center gap-1"
                >
                  {address.creator_name || 'Ibitoye Oluwasegun Emmanuel'}
                  <ExternalLink size={10} />
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-2">
               <button onClick={() => setShowQr(!showQr)} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white hover:bg-white/10 border border-white/10">
                 <QrCode size={24} />
               </button>
               <button onClick={handleShare} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white hover:bg-white/10 border border-white/10">
                 <Share2 size={24} />
               </button>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-white/5 pb-10">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 mb-2">Location Context</p>
                <div className="flex items-center gap-3 text-xl font-bold text-white">
                   <MapPin size={20} className="text-amber-400" />
                   {address.city}, {address.state}
                </div>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 mb-2">Category</p>
                <div className="flex items-center gap-3 text-xl font-bold text-white">
                   <LayoutGrid size={20} className="text-amber-400" />
                   {address.display_place_type || 'General'}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 mb-2">Coordinates</p>
                <code className="text-sm font-bold text-stone-400 bg-white/5 px-3 py-2 rounded-lg">
                  {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
                </code>
              </div>
              
              {address.phone_number && (
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 mb-2">Contact</p>
                  <a href={`tel:${address.phone_number}`} className="flex items-center gap-3 text-xl font-bold text-amber-400">
                    <Phone size={20} />
                    {address.phone_number}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="mt-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-500 mb-4">Precision Routing</p>
            <div className="grid grid-cols-1 gap-4">
              <Link 
                to={`/drivers?code=${address.code}`}
                className="group flex items-center justify-between rounded-3xl bg-amber-400 p-6 transition hover:bg-amber-300 shadow-xl shadow-amber-400/10"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-950 text-amber-400">
                    <Navigation size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-stone-950">Start Navigation</h3>
                    <p className="text-sm font-bold text-stone-950/70">Turn-by-turn guidance</p>
                  </div>
                </div>
                <div className="rounded-full bg-stone-950/10 p-2 group-hover:translate-x-1 transition-transform">
                  <Send size={24} className="text-stone-950" />
                </div>
              </Link>

              <button 
                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${address.latitude},${address.longitude}`, '_blank')}
                className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 transition"
              >
                <div className="flex items-center gap-4">
                   <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <ExternalLink size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">External Maps</h3>
                    <p className="text-sm font-bold text-stone-500">Open in Google Maps</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Viral Loop Section */}
          <div className="mt-16 rounded-[2.5rem] bg-amber-400 p-8 shadow-2xl shadow-amber-400/20 text-center">
            <h3 className="text-3xl font-black text-stone-950 italic tracking-tighter">WANT A CODE FOR YOUR ENTRANCE?</h3>
            <p className="mt-2 text-sm font-bold text-stone-950/70 uppercase tracking-widest leading-relaxed">
              Create your own precision PPOINNT for free and stop saying "turn beside the yellow building".
            </p>
            <Link 
              to="/" 
              className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-stone-950 px-8 py-4 font-black text-white hover:scale-105 transition active:scale-95 shadow-xl"
            >
              CREATE MY PPOINNT <ArrowRight size={20} className="text-amber-400" />
            </Link>
          </div>

          <p className="mt-12 text-center text-[10px] font-black uppercase tracking-[0.5em] text-stone-700">
            Powered by PPOINNT Africa Network © 2026
          </p>
        </div>
      </div>

      {/* ── QR MODAL ── */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xl p-6" onClick={() => setShowQr(false)}>
          <div className="relative rounded-[3rem] bg-white p-12 shadow-2xl" onClick={e => e.stopPropagation()}>
             <img 
               src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.href)}&bgcolor=ffffff&color=0c0a09`}
               alt="QR Code"
               className="w-64 h-64"
             />
             <p className="mt-8 text-center text-xl font-black text-stone-950">SCAN TO OPEN ADDRESS</p>
             <button onClick={() => setShowQr(false)} className="absolute -top-4 -right-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-950 text-white shadow-xl">
               <X size={24} />
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ size, className }) {
  return (
    <svg 
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}