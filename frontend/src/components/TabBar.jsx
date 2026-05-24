import { NavLink } from 'react-router-dom';
import { PP } from '../styles/tokens';

const tabs = [
  {
    id: 'home', to: '/', label: 'Home',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-7h-6v7H5a1 1 0 0 1-1-1v-9z"
          stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinejoin="round"
          fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}/>
      </svg>
    ),
  },
  {
    id: 'map', to: '/map', label: 'Map',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinejoin="round"/>
        <path d="M9 4v14M15 6v14" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}/>
      </svg>
    ),
  },
  {
    id: 'saved', to: '/saved', label: 'Saved',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M6 4h12v17l-6-4-6 4V4z"
          stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinejoin="round"
          fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}/>
      </svg>
    ),
  },
  {
    id: 'activity', to: '/activity', label: 'Activity',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 12h4l3-8 4 16 3-8h4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'profile', to: '/profile', label: 'Profile',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
          fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}/>
        <path d="M4 21c0-4 4-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function TabBar() {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '10px 8px 28px',
      borderTop: `1px solid ${PP.line}`,
      background: PP.bg,
    }}>
      {tabs.map((tab) => (
        <NavLink
          key={tab.id}
          to={tab.to}
          end={tab.to === '/'}
          style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: isActive ? PP.yellow : PP.text3,
            padding: '4px 8px',
            textDecoration: 'none',
            transition: 'color 0.15s',
            minWidth: 44,
          })}
        >
          {({ isActive }) => (
            <>
              {tab.icon(isActive)}
              <span style={{
                fontSize: 10.5, fontWeight: isActive ? 700 : 500,
                letterSpacing: 0.1, fontFamily: PP.font,
              }}>
                {tab.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
