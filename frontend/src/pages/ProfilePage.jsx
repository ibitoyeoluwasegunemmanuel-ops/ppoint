import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Globe, Phone, Mail, 
  Map as MapIcon, ShieldCheck, Zap, ArrowRight,
  ExternalLink, User, Search
} from 'lucide-react';
import api from '../services/api';

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/profiles/${id}`);
        setProfile(response.data.data);
      } catch (err) {
        setError('User profile not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-950">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-amber-400 border-t-transparent shadow-[0_0_20px_hsla(38,92%,50%,0.3)]" />
          <p className="mt-4 font-black text-white">ACCESSING CREATOR PROFILE...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-stone-950 p-6 text-center">
        <h2 className="text-3xl font-black text-white">PROFILE NOT FOUND</h2>
        <Link to="/" className="mt-8 rounded-2xl bg-amber-400 px-8 py-4 font-black text-stone-950 shadow-xl border border-amber-500">
           Return to Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white font-sans selection:bg-amber-400 selection:text-stone-950">
      
      {/* ── HEADER & NAVIGATION ── */}
      <nav className="fixed top-0 inset-x-0 z-30 p-6 flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => navigate(-1)}
          className="h-14 w-14 flex items-center justify-center rounded-3xl bg-stone-900/80 text-white border border-white/10 backdrop-blur-xl shadow-2xl pointer-events-auto active:scale-95 transition"
        >
          <ArrowLeft size={24} />
        </button>
      </nav>

      {/* ── PROFILE HERO ── */}
      <div className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-400/10 via-transparent to-transparent opacity-50 blur-3xl" />
        
        <div className="relative mx-auto max-w-4xl text-center">
           <div className="mx-auto h-32 w-32 rounded-[2.5rem] bg-stone-900 border-4 border-amber-400 shadow-2xl shadow-amber-400/20 overflow-hidden flex items-center justify-center text-amber-400">
              <User size={64} className="opacity-50" />
           </div>
           
           <h1 className="mt-8 text-5xl md:text-6xl font-black italic tracking-tighter leading-none">{profile.full_name}</h1>
           <p className="mt-4 text-sm font-bold text-stone-500 uppercase tracking-[0.5em] flex items-center justify-center gap-3">
              <ShieldCheck size={16} className="text-emerald-500" /> Verified Creator
           </p>

           <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-4 backdrop-blur-md">
                 <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Total Created</p>
                 <p className="text-2xl font-black text-amber-400 italic">{(profile.addresses?.length || 0).toLocaleString()} <span className="text-stone-600">PPOINNTs</span></p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-4 backdrop-blur-md">
                 <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Global Reach</p>
                 <p className="text-2xl font-black text-emerald-400 italic">8 / 10 <span className="text-stone-600">Precision</span></p>
              </div>
           </div>

           <div className="mt-8 flex flex-wrap items-center justify-center gap-3 opacity-60">
              <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                 <Phone size={12} className="text-amber-400" /> {profile.phone_number}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                 <Mail size={12} className="text-amber-400" /> {profile.email || 'emmanuel@ppoint.africa'}
              </div>
           </div>
        </div>
      </div>

      {/* ── CREATED PPOINNTs ── */}
      <div className="relative mx-auto max-w-4xl px-6 pb-24">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-black italic tracking-tight flex items-center gap-3">
              <MapIcon size={20} className="text-amber-400" />
              COLLECTION BY THIS CREATOR
           </h3>
           <div className="h-[1px] flex-1 mx-6 bg-white/10" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
           {profile.addresses?.map((ppt) => (
              <Link 
                key={ppt.code}
                to={`/${ppt.code}`}
                className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-white/5 p-6 backdrop-blur-xl transition-all hover:border-amber-400/50 hover:bg-white/10"
              >
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 text-stone-400 group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors">
                        <MapPin size={24} />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{ppt.place_type}</p>
                         <h4 className="text-xl font-black text-white italic">{ppt.code}</h4>
                      </div>
                   </div>
                   <ArrowRight size={20} className="text-stone-700 group-hover:text-amber-400 transition-colors" />
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/5">
                   <p className="text-xs font-bold text-stone-400 truncate">
                      {ppt.building_name || ppt.landmark || ppt.city || 'Precision Location'}
                   </p>
                </div>
              </Link>
           ))}
           {!profile.addresses?.length && (
              <div className="col-span-full py-12 text-center rounded-[2.5rem] border border-dashed border-white/10">
                 <p className="text-stone-500 font-bold">This creator hasn't published any PPOINNTs yet.</p>
              </div>
           )}
        </div>

        {/* ── DISCOVERY CTA ── */}
        <div className="mt-16 text-center">
            <h4 className="text-stone-500 text-sm font-bold uppercase tracking-widest mb-6">Become a Verified Creator</h4>
            <Link to="/" className="inline-flex items-center gap-3 rounded-full bg-white/5 border border-white/10 px-8 py-4 font-black transition-all hover:bg-white/10 hover:border-amber-400 active:scale-95">
               GET YOUR OWN PPOINNT <ArrowRight size={18} />
            </Link>
        </div>
      </div>

    </div>
  );
}
