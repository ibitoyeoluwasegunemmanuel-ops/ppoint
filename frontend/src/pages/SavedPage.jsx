import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PP } from '../styles/tokens';

const SAVED = [
  { code: 'PPT-NG-LAG-IKD-1234', label: 'Home', name: '15, Abraham Adesanya, Lekki', type: 'house', color: PP.yellow },
  { code: 'PPT-NG-LAG-YBA-5678', label: 'Office', name: '23, Kudirat Abiola Way, Oregun', type: 'office', color: PP.blue },
  { code: 'PPT-NG-ABJ-GRK-9012', label: 'Dad\'s Place', name: 'Block 12, Garki, Abuja', type: 'house', color: PP.green },
];

const I = {
  bookmark: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" fillOpacity="0.2"><path d="M6 4h12v17l-6-4-6 4V4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  nav: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 11L21 4l-7 17-2-7-9-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  share: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M8.5 11l7-4M8.5 13l7 4" stroke="currentColor" strokeWidth="1.6"/></svg>,
  plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>,
  house: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-7h-6v7H5a1 1 0 0 1-1-1v-9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  office: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="1" stroke="currentColor" strokeWidth="1.8"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
};

const TYPE_ICONS = { house: I.house, office: I.office };

function CodeChip({ code }) {
  const parts = code.split('-');
  return (
    <span style={{ fontFamily: PP.mono, fontWeight: 700, fontSize: 12, letterSpacing: 0.3 }}>
      {parts.map((p, i) => (
        <span key={i}>
          <span style={{ color: i === parts.length - 1 ? PP.yellow : PP.text }}>{p}</span>
          {i < parts.length - 1 && <span style={{ color: PP.text3 }}>-</span>}
        </span>
      ))}
    </span>
  );
}

export default function SavedPage() {
  const navigate = useNavigate();
  const [saved] = useState(SAVED);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: PP.bg, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>Saved</div>
        <button onClick={() => navigate('/generate')} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 12, border: 'none',
          background: PP.yellow, color: '#0A0B0D',
          fontSize: 13, fontWeight: 700, fontFamily: PP.font, cursor: 'pointer',
        }}>{I.plus()} Add</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {saved.map((s) => {
          const Ic = TYPE_ICONS[s.type] || I.house;
          return (
            <div key={s.code} style={{
              background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 18,
              padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: `${s.color}18`, color: s.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><Ic /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{s.label}</div>
                  <div style={{ marginBottom: 3 }}><CodeChip code={s.code} /></div>
                  <div style={{ fontSize: 12, color: PP.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => navigate(`/drivers?code=${s.code}`)} style={{
                  flex: 1, height: 40, borderRadius: 12, border: 'none',
                  background: PP.blue, color: '#fff',
                  fontSize: 13, fontWeight: 700, fontFamily: PP.font,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer',
                }}>{I.nav()} Navigate</button>
                <button style={{
                  flex: 1, height: 40, borderRadius: 12,
                  border: `1px solid ${PP.line}`, background: 'transparent', color: PP.text2,
                  fontSize: 13, fontWeight: 700, fontFamily: PP.font,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer',
                }}>{I.share()} Share</button>
              </div>
            </div>
          );
        })}

        {saved.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: PP.text3 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔖</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No saved addresses</div>
            <div style={{ fontSize: 13 }}>Generate a PPOINNT and save it here.</div>
          </div>
        )}
      </div>
    </div>
  );
}
