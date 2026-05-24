import { useState } from 'react';
import { PP } from '../styles/tokens';

const FILTER_OPTIONS = ['All', 'Created', 'Verified', 'Used'];

const ACTIVITIES = [
  { id: 1, type: 'used', code: 'PPT-NG-LAG-IKD-1234', desc: 'Used by delivery partner', time: '2 min ago', earn: '+₦50.00', earnColor: '#23C57A' },
  { id: 2, type: 'verified', code: 'PPT-NG-LAG-IKD-1234', desc: 'Address verified', time: '1 hr ago', earn: '+₦500.00', earnColor: '#23C57A' },
  { id: 3, type: 'created', code: 'PPT-NG-LAG-YBA-5678', desc: 'PPOINNT created', time: '3 hrs ago', earn: '+₦50.00', earnColor: '#23C57A' },
  { id: 4, type: 'used', code: 'PPT-NG-LAG-YBA-5678', desc: 'Used by driver', time: '5 hrs ago', earn: '+₦50.00', earnColor: '#23C57A' },
  { id: 5, type: 'created', code: 'PPT-NG-ABJ-GRK-9012', desc: 'PPOINNT created', time: 'Yesterday', earn: '+₦50.00', earnColor: '#23C57A' },
];

const TypeDot = ({ type }) => {
  const colors = { created: PP.yellow, verified: PP.green, used: PP.blue };
  const icons = {
    created: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>,
    verified: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l5 5 9-11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    used: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 11L21 4l-7 17-2-7-9-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  };
  return (
    <div style={{
      width: 38, height: 38, borderRadius: '50%',
      background: `${colors[type]}18`,
      color: colors[type],
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{icons[type]}</div>
  );
};

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

export default function ActivityPage() {
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All'
    ? ACTIVITIES
    : ACTIVITIES.filter(a => a.type === filter.toLowerCase());

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: PP.bg, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>Activity</div>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{
          background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 10,
          padding: '8px 12px', color: PP.text, fontSize: 13, fontFamily: PP.font,
          fontWeight: 600, outline: 'none', cursor: 'pointer',
        }}>
          {FILTER_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {/* Filter chips */}
      <div style={{ padding: '0 20px 14px', display: 'flex', gap: 8 }}>
        {FILTER_OPTIONS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: filter === f ? PP.yellow : PP.card,
            color: filter === f ? '#0A0B0D' : PP.text3,
            fontSize: 13, fontWeight: 700, fontFamily: PP.font,
            transition: 'all 0.15s',
          }}>{f}</button>
        ))}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((a) => (
          <div key={a.id} style={{
            background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 16,
            padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <TypeDot type={a.type} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ marginBottom: 4 }}><CodeChip code={a.code} /></div>
              <div style={{ fontSize: 12, color: PP.text3 }}>{a.desc}</div>
              <div style={{ fontSize: 11, color: PP.text3, marginTop: 4 }}>{a.time}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: a.earnColor, flexShrink: 0 }}>{a.earn}</div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: PP.text3 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>No activity yet</div>
          </div>
        )}
      </div>
    </div>
  );
}
