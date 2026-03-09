import { Link } from 'react-router-dom';
import { Globe2, MapPin } from 'lucide-react';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
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
              <Globe2 size={16} />
              <span>ppoint.online</span>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}