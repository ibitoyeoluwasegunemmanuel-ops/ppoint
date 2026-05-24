import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PP } from '../styles/tokens';

const I = {
  settings: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" stroke="currentColor" strokeWidth="1.6"/></svg>,
  chevR: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  star: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7 7.5.6-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5L9 9l3-7z"/></svg>,
  bookmark: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 4h12v17l-6-4-6 4V4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  map: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  speaker: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" opacity="0.5"/><path d="M16 8a5 5 0 0 1 0 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  nav: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 11L21 4l-7 17-2-7-9-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  user: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  shield: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  help: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>,
  info: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const isAgent = localStorage.getItem('user_role') === 'agent';

  const menuSections = [
    {
      items: [
        { label: 'Saved Addresses', icon: I.bookmark, to: '/saved' },
        { label: 'Offline Maps', icon: I.map, badge: 'Download', badgeColor: PP.green },
        { label: 'Voice Settings', icon: I.speaker },
        { label: 'Navigation Settings', icon: I.nav },
      ],
    },
    {
      items: [
        { label: 'Account Type', icon: I.user, badge: isAgent ? 'Agent' : 'User', badgeColor: isAgent ? PP.yellow : PP.text3 },
        { label: 'Help & Support', icon: I.help },
        { label: 'About PPOINNT', icon: I.info },
      ],
    },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: PP.bg, overflow: 'hidden' }}>
      <div style={{ padding: '52px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>Profile</div>
        <button style={{
          width: 40, height: 40, borderRadius: 12, border: '1px solid ' + PP.line,
          background: PP.card, color: PP.text2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>{I.settings()}</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '0 20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, ' + PP.yellow + ' 0%, #FFB400 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: '#0A0B0D', flexShrink: 0,
          }}>E</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>Emmanuel O.</div>
            {isAgent && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ color: PP.yellow }}>{I.star()}</span>
                <span style={{ fontSize: 12, color: PP.text3, fontWeight: 600 }}>Silver Agent</span>
              </div>
            )}
            <div style={{ fontSize: 13, color: PP.text3, marginTop: 4 }}>+234 801 234 5678</div>
          </div>
        </div>

        {isAgent && (
          <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[{ v: '128', l: 'PPOINNTs' }, { v: '98%', l: 'Accuracy' }, { v: '₦48k', l: 'Earned' }].map((s, i) => (
              <div key={i} style={{
                background: PP.card, border: '1px solid ' + PP.line, borderRadius: 14,
                padding: '14px 12px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}>{s.v}</div>
                <div style={{ fontSize: 11, color: PP.text3, marginTop: 3, fontWeight: 600 }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}

        {isAgent && (
          <div style={{ padding: '0 20px 16px' }}>
            <button onClick={() => navigate('/agents')} style={{
              width: '100%', padding: '14px 18px', borderRadius: 16,
              background: PP.yellowSoft, border: '1px solid rgba(255,199,44,0.2)',
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: PP.yellow,
                color: '#0A0B0D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>{I.shield()}</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: PP.yellow }}>Agent Dashboard</div>
                <div style={{ fontSize: 12, color: PP.text3, marginTop: 2 }}>View earnings and territory</div>
              </div>
              <span style={{ color: PP.yellow }}>{I.chevR()}</span>
            </button>
          </div>
        )}

        {menuSections.map((section, si) => (
          <div key={si} style={{
            margin: '0 20px 14px',
            background: PP.card, border: '1px solid ' + PP.line, borderRadius: 18, overflow: 'hidden',
          }}>
            {section.items.map((item, ii) => (
              <button key={ii} onClick={() => item.to && navigate(item.to)} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '15px 18px', width: '100%', background: 'none', border: 'none',
                borderBottom: ii < section.items.length - 1 ? '1px solid ' + PP.line : 'none',
                cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ color: PP.text2, display: 'flex' }}>{item.icon()}</span>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: PP.text, fontFamily: PP.font }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    padding: '3px 8px', borderRadius: 8,
                    background: item.badgeColor + '18', color: item.badgeColor,
                    fontSize: 11, fontWeight: 700,
                  }}>{item.badge}</span>
                )}
                <span style={{ color: PP.text3 }}>{I.chevR()}</span>
              </button>
            ))}
          </div>
        ))}

        <div style={{ padding: '0 20px 36px' }}>
          <button onClick={() => {
            localStorage.setItem('user_role', isAgent ? 'user' : 'agent');
            window.location.reload();
          }} style={{
            width: '100%', padding: '14px', borderRadius: 14,
            border: '1px solid ' + PP.line, background: PP.card,
            color: isAgent ? PP.red : PP.yellow,
            fontFamily: PP.font, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>{isAgent ? 'Switch to User Mode' : 'Switch to Agent Mode'}</button>
        </div>
      </div>
    </div>
  );
}
