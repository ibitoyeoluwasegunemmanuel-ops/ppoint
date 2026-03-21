import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Globe2, MapPin } from 'lucide-react';
import api from '../services/api';

export default function Layout({ children }) {
  const [publicConfig, setPublicConfig] = useState(null);

  useEffect(() => {
    api.get('/platform/system/public-config')
      .then((response) => setPublicConfig(response.data.data || null))
      .catch(() => setPublicConfig(null));
  }, []);

  const location = useLocation();
  const isFullScreenMode = ['/', '/drivers'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_24%),linear-gradient(180deg,_#0c0a09_0%,_#111827_48%,_#172554_100%)]"></div>
      <nav className="border-b border-white/10 bg-stone-950/70 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="rounded-xl bg-amber-400 p-2 text-stone-950 shadow-lg shadow-amber-400/20">
                <MapPin size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">PPOINT</h1>
                <p className="text-xs text-stone-300">Digital Addressing for Africa</p>
              </div>
            </Link>
            <div className="flex items-center gap-3 text-sm text-stone-300">
              {[
                { to: '/', label: 'Get Address' },
                { to: '/drivers', label: 'Driver Navigation' },
                { to: '/agents', label: 'Agents' },
                { to: '/developers', label: 'Developers' },
                { to: '/admin', label: 'Admin' },
              ].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `rounded-full border px-4 py-2 text-sm font-medium transition ${isActive ? 'border-amber-300/40 bg-amber-300/10 text-amber-200' : 'border-white/10 bg-white/5 text-white hover:bg-white/10'}`}
                >
                  {item.label}
                </NavLink>
              ))}
              <>
                <Globe2 size={16} />
                <span>ppoint.africa</span>
              </>
            </div>
          </div>
        </div>
      </nav>
      {isFullScreenMode ? (
        <main className="flex-1 w-full h-[calc(100vh-64px)] relative flex flex-col overflow-hidden">
          {children}
        </main>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
          {children}
        </main>
      )}
      {!isFullScreenMode && (
        <footer className="border-t border-white/10 bg-stone-950/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-sm text-stone-300">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <p>{publicConfig?.platform_name || 'PPOINT Africa'} • {publicConfig?.domain || 'ppoint.africa'}</p>
              <div className="flex flex-wrap gap-4">
                <span>Support: {publicConfig?.support_contacts?.support_email || 'support@ppoinnt.africa'}</span>
                <span>Phone: {publicConfig?.support_contacts?.support_phone_number || '+234-800-PPOINNT'}</span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
