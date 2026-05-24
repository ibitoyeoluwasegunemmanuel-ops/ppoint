import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PP } from '../styles/tokens';

// ── Mock data ─────────────────────────────────────────────────────────────────
const recentPpoints = [
  { code: 'PPT-NG-LAG-IKD-1234', name: 'Beside GTBank', street: '15, Ajayi Street', area: 'Ikorodu, Lagos', verified: true, time: '2h ago' },
  { code: 'PPT-NG-LAG-IKD-1235', name: '24 Olabisi Street', street: '24, Olabisi Street', area: 'Ikorodu, Lagos', verified: true, time: '3h ago' },
  { code: 'PPT-NG-LAG-IKD-1236', name: 'Supermarket Entrance', street: '8, Market Road', area: 'Ikorodu, Lagos', verified: false, time: '4h ago' },
  { code: 'PPT-NG-LAG-IKD-1237', name: 'Junction Roundabout', street: 'Lagos-Ibadan Expressway', area: 'Ikorodu, Lagos', verified: true, time: '5h ago' },
  { code: 'PPT-NG-LAG-IKD-1238', name: 'Medical Centre', street: '3, Hospital Lane', area: 'Ikorodu, Lagos', verified: false, time: '6h ago' },
  { code: 'PPT-NG-LAG-IKD-1239', name: 'School Main Gate', street: '1, Education Drive', area: 'Ikorodu, Lagos', verified: true, time: '7h ago' },
];

const agents = [
  { rank: 1, name: 'Adaeze N.', badge: 'top', created: 184, accuracy: 99, earnings: 38400 },
  { rank: 2, name: 'Tunde A.', badge: null, created: 156, accuracy: 98, earnings: 22100 },
  { rank: 3, name: 'Emmanuel O.', badge: 'you', created: 128, accuracy: 97, earnings: 24650 },
  { rank: 4, name: 'Ifeoma K.', badge: null, created: 112, accuracy: 95, earnings: 22200 },
];

const inspector = {
  code: 'PPT-NG-LAG-IKD-1234',
  type: 'House',
  landmark: 'Beside GTBank',
  createdBy: 'Adaeze N.',
  lastVerified: '2h ago',
  accuracy: 'High · 3m',
  used: 47,
  street: '15, Ajayi Street',
  area: 'Ikorodu, Lagos',
};

const navItems = [
  { icon: GridIcon, label: 'Overview', path: '/dashboard' },
  { icon: PinIcon, label: 'Addresses', path: '/dashboard/addresses' },
  { icon: MapIcon, label: 'Live map', path: '/map' },
  { icon: ArrowIcon, label: 'Navigation', path: '/navigate' },
  { icon: AgentIcon, label: 'Agents', path: '/agents' },
  { icon: ActivityIcon, label: 'Activity', path: '/library' },
];

const workspaceItems = [
  { icon: ApiIcon, label: 'API & SDK', path: '/developers' },
  { icon: TeamIcon, label: 'Team', path: '/settings' },
  { icon: SettingsIcon, label: 'Settings', path: '/settings' },
];

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function GridIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/></svg>;
}
function PinIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>;
}
function MapIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 3v15M15 6v15" stroke="currentColor" strokeWidth="1.8"/></svg>;
}
function ArrowIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 11L21 4l-7 17-2-7-9-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>;
}
function AgentIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function ActivityIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ApiIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16 18l6-6-6-6M8 6L2 12l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function TeamIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="17" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M20 18c0-2.4-1.6-4.4-3.8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function SettingsIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function BellIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.8"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function QRIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.8"/><rect x="5" y="5" width="3" height="3" fill="currentColor"/><rect x="16" y="5" width="3" height="3" fill="currentColor"/><rect x="5" y="16" width="3" height="3" fill="currentColor"/><path d="M14 14h2v2h-2zM18 14h3M18 18h3M18 16h1M14 18v3M16 18v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function CopyIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.8"/></svg>;
}

// ── Sparkline (CSS bars) ──────────────────────────────────────────────────────
function Sparkline({ color, positive }) {
  const heights = [30, 45, 35, 60, 50, 70, 55, 80, 65, 90];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 32 }}>
      {heights.map((h, i) => (
        <div key={i} style={{
          width: 4, height: `${h}%`, borderRadius: 2,
          background: color || '#FFC72C',
          opacity: i < heights.length - 3 ? 0.3 : 1,
          transition: 'height 0.3s',
        }} />
      ))}
    </div>
  );
}

// ── PPOINT Code Display ───────────────────────────────────────────────────────
function PPCode({ code, size = 12 }) {
  if (!code) return null;
  const parts = code.split('-');
  return (
    <span style={{ fontFamily: PP.mono, fontWeight: 700, fontSize: size, letterSpacing: 0.2 }}>
      {parts.map((p, i) => (
        <span key={i}>
          <span style={{ color: i === parts.length - 1 ? '#FFC72C' : i < 2 ? 'rgba(255,255,255,0.5)' : '#FFFFFF' }}>
            {p}
          </span>
          {i < parts.length - 1 && <span style={{ color: 'rgba(255,255,255,0.3)' }}>-</span>}
        </span>
      ))}
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ label, value, change, positive, color }) {
  return (
    <div style={{
      flex: 1, minWidth: 160,
      background: '#13141A',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.5 }}>
            {value}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', marginTop: 3, fontWeight: 600, letterSpacing: 0.3 }}>
            {label}
          </div>
        </div>
        <div style={{
          fontSize: 12, fontWeight: 700,
          color: positive !== false ? '#34D399' : '#F87171',
          background: positive !== false ? '#34D39918' : '#F8717118',
          padding: '3px 8px', borderRadius: 6,
        }}>
          {change}
        </div>
      </div>
      <Sparkline color={color} positive={positive} />
    </div>
  );
}

// ── CSS Map ───────────────────────────────────────────────────────────────────
function LiveMap({ onSelectPin }) {
  const pins = [
    { x: '28%', y: '55%', code: 'PPT-NG-LAG-IKD-1234', label: 'Ajayi St', active: true },
    { x: '38%', y: '38%', code: 'PPT-NG-LAG-IKD-1235', label: 'Olabisi St' },
    { x: '55%', y: '48%', code: 'PPT-NG-LAG-IKD-1236', label: 'Market Rd' },
    { x: '45%', y: '62%', code: 'PPT-NG-LAG-IKD-1237', label: 'Roundabout' },
    { x: '62%', y: '35%', code: 'PPT-NG-LAG-IKD-1238', label: 'Medical' },
    { x: '70%', y: '58%', code: 'PPT-NG-LAG-IKD-1239', label: 'School Gate' },
    { x: '22%', y: '42%', code: 'PPT-NG-LAG-IKD-1240', label: 'Mosque Rd' },
  ];

  return (
    <div style={{
      position: 'relative', background: '#0E1117',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, overflow: 'hidden', height: 280,
    }}>
      {/* Grid roads */}
      {[0, 1, 2, 3, 4].map(i => (
        <div key={`h${i}`} style={{
          position: 'absolute', left: 0, right: 0, top: `${20 + i * 18}%`,
          height: 1, background: 'rgba(255,255,255,0.04)',
        }} />
      ))}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <div key={`v${i}`} style={{
          position: 'absolute', top: 0, bottom: 0, left: `${15 + i * 16}%`,
          width: 1, background: 'rgba(255,255,255,0.04)',
        }} />
      ))}

      {/* Territory boundary */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <polygon
          points="180,50 380,30 520,100 490,220 300,250 150,180"
          fill="rgba(255,199,44,0.06)"
          stroke="rgba(255,199,44,0.3)"
          strokeWidth="1.5"
          strokeDasharray="6,4"
        />
      </svg>

      {/* Roads */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path d="M 100,160 Q 300,140 500,150" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" strokeLinecap="round"/>
        <path d="M 200,60 Q 250,160 230,260" stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <path d="M 150,100 Q 350,80 600,110" stroke="rgba(255,255,255,0.06)" strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>

      {/* Pins */}
      {pins.map((pin, i) => (
        <div
          key={i}
          onClick={() => onSelectPin && onSelectPin(pin.code)}
          style={{
            position: 'absolute', left: pin.x, top: pin.y,
            transform: 'translate(-50%, -100%)',
            cursor: 'pointer', zIndex: 2,
          }}
        >
          <div style={{
            background: pin.active ? '#FFC72C' : '#FFFFFF',
            width: pin.active ? 10 : 8, height: pin.active ? 10 : 8,
            borderRadius: '50%',
            boxShadow: pin.active ? '0 0 0 3px rgba(255,199,44,0.3), 0 0 12px rgba(255,199,44,0.5)' : '0 0 0 2px rgba(255,255,255,0.15)',
          }} />
        </div>
      ))}

      {/* Map controls */}
      <div style={{
        position: 'absolute', top: 12, right: 12,
        display: 'flex', gap: 6,
      }}>
        {['Map', 'Satellite', 'Hybrid'].map(mode => (
          <button key={mode} style={{
            padding: '5px 10px', borderRadius: 7, border: 'none',
            background: mode === 'Map' ? '#FFC72C' : '#1A1B21',
            color: mode === 'Map' ? '#0A0B0D' : '#A1A1A6',
            fontSize: 11, fontWeight: 700, fontFamily: PP.font, cursor: 'pointer',
          }}>
            {mode}
          </button>
        ))}
      </div>

      {/* Live badge */}
      <div style={{
        position: 'absolute', top: 12, left: 12,
        display: 'flex', alignItems: 'center', gap: 5,
        background: '#13141A', borderRadius: 8, padding: '4px 10px',
        border: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF' }}>7 PPOINNTs live</span>
      </div>
    </div>
  );
}

// ── Inspector Panel ───────────────────────────────────────────────────────────
function InspectorPanel({ data }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard?.writeText(data.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const fields = [
    { label: 'Type', value: data.type },
    { label: 'Landmark', value: data.landmark },
    { label: 'Created by', value: data.createdBy },
    { label: 'Last verified', value: data.lastVerified },
    { label: 'Accuracy', value: data.accuracy, color: '#34D399' },
    { label: 'Used', value: `${data.used} times` },
  ];

  return (
    <div style={{
      width: 260, flexShrink: 0,
      background: '#0F1015', borderLeft: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.40)',
          letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399' }} />
          Inspector · Selection
        </div>
        <PPCode code={data.code} size={13} />
        <div style={{ fontSize: 12, color: '#A1A1A6', marginTop: 5 }}>
          {data.street}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)', marginTop: 2 }}>
          {data.area}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8 }}>
        <button style={{
          flex: 1, height: 34, borderRadius: 9, border: 'none',
          background: '#FFC72C', color: '#0A0B0D',
          fontSize: 12, fontWeight: 800, fontFamily: PP.font, cursor: 'pointer',
        }}>
          Navigate
        </button>
        <button style={{
          flex: 1, height: 34, borderRadius: 9, border: '1px solid rgba(255,255,255,0.12)',
          background: 'transparent', color: '#FFFFFF',
          fontSize: 12, fontWeight: 700, fontFamily: PP.font, cursor: 'pointer',
        }}>
          Share
        </button>
      </div>

      {/* Fields */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        {fields.map((f, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', paddingBottom: 12, marginBottom: 12,
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>
              {f.label}
            </span>
            <span style={{ fontSize: 12, color: f.color || '#FFFFFF', fontWeight: 600, textAlign: 'right' }}>
              {f.value}
            </span>
          </div>
        ))}
      </div>

      {/* QR + API */}
      <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {/* QR placeholder */}
        <div style={{
          background: '#FFFFFF', borderRadius: 8, padding: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 12, height: 80,
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 8px)', gap: 1.5,
          }}>
            {Array.from({ length: 49 }).map((_, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: 1,
                background: Math.random() > 0.5 ? '#000000' : 'transparent',
              }} />
            ))}
          </div>
        </div>

        {/* Download / Copy */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button style={{
            flex: 1, height: 30, borderRadius: 7,
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'transparent', color: '#A1A1A6',
            fontSize: 11, fontWeight: 700, fontFamily: PP.font, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>
            <QRIcon /> Download
          </button>
          <button
            onClick={copyCode}
            style={{
              flex: 1, height: 30, borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.10)',
              background: 'transparent', color: copied ? '#34D399' : '#A1A1A6',
              fontSize: 11, fontWeight: 700, fontFamily: PP.font, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
          >
            <CopyIcon /> {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* API snippet */}
        <div style={{
          background: '#13141A', borderRadius: 8, padding: '10px 12px',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', marginBottom: 5, fontWeight: 700, letterSpacing: 0.5 }}>
            curl · API
          </div>
          <code style={{
            fontSize: 10, color: '#A1A1A6', fontFamily: PP.mono,
            display: 'block', lineHeight: 1.6, wordBreak: 'break-all',
          }}>
            <span style={{ color: '#FFC72C' }}>curl</span>{' '}
            ppoint.africa/v1/
            <br />
            resolve/
            <span style={{ color: '#34D399' }}>{data.code}</span>
          </code>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ active }) {
  const navigate = useNavigate();

  return (
    <div style={{
      width: 200, flexShrink: 0,
      background: '#0A0B0D',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column',
      padding: '20px 12px',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 8px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        marginBottom: 8,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9, background: '#FFC72C',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 15, color: '#0A0B0D', fontFamily: PP.font,
        }}>
          P
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.2 }}>PPOINNT</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>ppoint.africa</div>
        </div>
      </div>

      {/* Main nav */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map((item, i) => {
          const isActive = active === item.label;
          return (
            <button
              key={i}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%', padding: '9px 10px', borderRadius: 10, border: 'none',
                background: isActive ? '#FFC72C18' : 'transparent',
                color: isActive ? '#FFC72C' : 'rgba(255,255,255,0.55)',
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13, fontWeight: isActive ? 700 : 600, fontFamily: PP.font,
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                borderLeft: isActive ? '2px solid #FFC72C' : '2px solid transparent',
              }}
            >
              <item.icon />
              {item.label}
            </button>
          );
        })}

        {/* Workspace section */}
        <div style={{
          fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)',
          letterSpacing: 0.8, textTransform: 'uppercase',
          padding: '16px 10px 6px',
        }}>
          Workspace
        </div>

        {workspaceItems.map((item, i) => (
          <button
            key={i}
            onClick={() => navigate(item.path)}
            style={{
              width: '100%', padding: '9px 10px', borderRadius: 10, border: 'none',
              background: 'transparent',
              color: 'rgba(255,255,255,0.40)',
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: 13, fontWeight: 600, fontFamily: PP.font,
              cursor: 'pointer', textAlign: 'left',
              borderLeft: '2px solid transparent',
            }}
          >
            <item.icon />
            {item.label}
          </button>
        ))}
      </div>

      {/* User */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.07)',
        marginTop: 8,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: '#FFC72C22', border: '1.5px solid #FFC72C44',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, color: '#FFC72C',
        }}>
          E
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Emmanuel O.
          </div>
          <div style={{ fontSize: 10, color: '#FFC72C', fontWeight: 600 }}>🛡 Agent</div>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function WebDashboardPage() {
  const [timeFilter, setTimeFilter] = useState('Week');
  const [selectedCode, setSelectedCode] = useState('PPT-NG-LAG-IKD-1234');

  const selectedPpoint = recentPpoints.find(p => p.code === selectedCode) || recentPpoints[0];

  return (
    <div style={{
      display: 'flex', height: '100vh', width: '100%',
      background: '#0A0B0D', fontFamily: PP.font,
      overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <Sidebar active="Overview" />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top bar */}
        <div style={{
          height: 56, flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '0 24px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          {/* Search */}
          <div style={{
            flex: 1, maxWidth: 360, height: 36,
            background: '#13141A', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10, display: 'flex', alignItems: 'center', gap: 9,
            padding: '0 12px',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.40)' }}><SearchIcon /></span>
            <input
              placeholder="Search PPOINNT code, street, or place"
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: '#FFFFFF', fontSize: 13, fontFamily: PP.font,
              }}
            />
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
            <button style={{
              width: 36, height: 36, borderRadius: 10, border: 'none',
              background: '#13141A', color: 'rgba(255,255,255,0.60)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              position: 'relative',
            }}>
              <BellIcon />
              <div style={{
                position: 'absolute', top: 8, right: 8, width: 6, height: 6,
                borderRadius: '50%', background: '#F87171',
              }} />
            </button>

            <button style={{
              height: 36, padding: '0 16px', borderRadius: 10, border: 'none',
              background: '#FFC72C', color: '#0A0B0D',
              fontSize: 13, fontWeight: 800, fontFamily: PP.font, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <span style={{ fontSize: 15, fontWeight: 900 }}>+</span>
              Generate PPOINNT
            </button>
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Center scroll area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', minWidth: 0 }}>

            {/* Territory header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399' }} />
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.3 }}>
                    Ikorodu territory
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: '#34D399',
                    background: '#34D39918', padding: '2px 8px', borderRadius: 6,
                  }}>
                    live
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)' }}>
                  Lagos, Nigeria · Updated 2 min ago
                </div>
              </div>

              {/* Time filter */}
              <div style={{
                display: 'flex', gap: 4,
                background: '#13141A', borderRadius: 10, padding: 4,
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                {['Today', 'Week', 'Month', 'All time'].map(f => (
                  <button
                    key={f}
                    onClick={() => setTimeFilter(f)}
                    style={{
                      padding: '5px 12px', borderRadius: 7, border: 'none',
                      background: timeFilter === f ? '#FFFFFF0F' : 'transparent',
                      color: timeFilter === f ? '#FFFFFF' : 'rgba(255,255,255,0.40)',
                      fontSize: 12, fontWeight: 700, fontFamily: PP.font, cursor: 'pointer',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <KPICard label="PPOINNTs created" value="128" change="+12%" positive color="#FFC72C" />
              <KPICard label="Verified" value="94" change="+8%" positive color="#34D399" />
              <KPICard label="Earnings" value="₦24,650" change="+₦2,100" positive color="#A78BFA" />
              <KPICard label="Accuracy score" value="98%" change="↑ 3 ranks" positive color="#60A5FA" />
            </div>

            {/* Map */}
            <div style={{ marginBottom: 20 }}>
              <LiveMap onSelectPin={setSelectedCode} />
            </div>

            {/* Recent PPOINNTs */}
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.40)',
                  letterSpacing: 0.8, textTransform: 'uppercase',
                }}>
                  Recent PPOINNTs
                </div>
                <button style={{
                  background: 'none', border: 'none', color: '#FFC72C',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: PP.font,
                }}>
                  View all
                </button>
              </div>

              {recentPpoints.map((p, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedCode(p.code)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 14px', borderRadius: 11,
                    background: selectedCode === p.code ? '#FFC72C0A' : 'transparent',
                    border: `1px solid ${selectedCode === p.code ? 'rgba(255,199,44,0.20)' : 'transparent'}`,
                    cursor: 'pointer', marginBottom: 4, transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: p.verified ? '#34D399' : '#F59E0B',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <PPCode code={p.code} size={11} />
                    <div style={{ fontSize: 12, color: '#A1A1A6', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name} · {p.street}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)', flexShrink: 0 }}>
                    {p.time}
                  </div>
                </div>
              ))}
            </div>

            {/* Agent Leaderboard */}
            <div style={{ marginTop: 28 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.40)',
                letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12,
              }}>
                Agent Leaderboard · Ikorodu
              </div>
              <div style={{
                background: '#13141A', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, overflow: 'hidden',
              }}>
                {/* Header row */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr 80px 70px 90px',
                  padding: '10px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                }}>
                  {['#', 'Agent', 'Created', 'Accuracy', 'Earnings'].map((h, i) => (
                    <div key={i} style={{
                      fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.30)',
                      letterSpacing: 0.5, textTransform: 'uppercase',
                      textAlign: i > 1 ? 'right' : 'left',
                    }}>
                      {h}
                    </div>
                  ))}
                </div>

                {agents.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid', gridTemplateColumns: '40px 1fr 80px 70px 90px',
                      padding: '12px 16px', alignItems: 'center',
                      borderBottom: i < agents.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      background: a.badge === 'you' ? '#FFC72C08' : 'transparent',
                    }}
                  >
                    <div style={{
                      fontSize: 13, fontWeight: 800,
                      color: a.rank === 1 ? '#FFC72C' : 'rgba(255,255,255,0.50)',
                    }}>
                      {a.rank}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: a.badge === 'you' ? '#FFC72C22' : '#1A1B21',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800,
                        color: a.badge === 'you' ? '#FFC72C' : '#FFFFFF',
                      }}>
                        {a.name[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{a.name}</div>
                      </div>
                      {a.badge && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                          background: a.badge === 'you' ? '#FFC72C' : '#34D39922',
                          color: a.badge === 'you' ? '#0A0B0D' : '#34D399',
                        }}>
                          {a.badge === 'you' ? 'you' : 'top'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', textAlign: 'right' }}>
                      {a.created}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#34D399', textAlign: 'right' }}>
                      {a.accuracy}%
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', textAlign: 'right' }}>
                      ₦{a.earnings.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Inspector Panel */}
          <InspectorPanel data={inspector} />
        </div>
      </div>
    </div>
  );
}
