import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PP } from '../styles/tokens';

const I = {
  back: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  bell: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M10 21a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  chevR: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  shield: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  star: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7 7.5.6-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5L9 9l3-7z"/></svg>,
  up: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M7 14l5-5 5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

const TABS = ['Dashboard', 'Addresses', 'Earnings', 'Tasks'];

export default function AgentsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showWithdraw, setShowWithdraw] = useState(false);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: PP.bg, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '52px 20px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{
            width: 38, height: 38, borderRadius: 12, border: 'none',
            background: PP.card, color: PP.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>{I.back()}</button>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Agent Dashboard</div>
        </div>
        <button style={{
          width: 38, height: 38, borderRadius: 12, border: '1px solid ' + PP.line,
          background: PP.card, color: PP.text2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>{I.bell()}</button>
      </div>

      {/* Tab bar */}
      <div style={{ padding: '16px 20px 0', display: 'flex', gap: 6 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: activeTab === t ? PP.yellow : PP.card,
            color: activeTab === t ? '#0A0B0D' : PP.text3,
            fontSize: 13, fontWeight: 700, fontFamily: PP.font,
            transition: 'all 0.15s',
          }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Earnings hero card */}
        <div style={{
          background: 'linear-gradient(135deg, #1A1D24 0%, #14171C 100%)',
          border: '1px solid ' + PP.line, borderRadius: 22, padding: '18px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -30, right: -30, width: 160, height: 160,
            background: 'radial-gradient(closest-side, rgba(255,199,44,0.22), transparent)',
            pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: PP.text3, fontWeight: 600 }}>Earnings balance</div>
            <button onClick={() => setShowWithdraw(true)} style={{
              padding: '6px 12px', borderRadius: 9, background: PP.yellow, color: '#0A0B0D',
              fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer', fontFamily: PP.font,
            }}>Withdraw</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 10, position: 'relative' }}>
            <div style={{ fontSize: 15, color: PP.text2, fontWeight: 600 }}>₦</div>
            <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1 }}>24,650</div>
            <div style={{ fontSize: 20, color: PP.text2, fontWeight: 700 }}>.00</div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: PP.green }}>{I.up()}</span>
            <span style={{ fontSize: 12, color: PP.green, fontWeight: 700 }}>+₦2,150 this week</span>
            <span style={{ fontSize: 12, color: PP.text3 }}>· Instant payout enabled</span>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { v: '128', l: 'PPOINNT created', sub: 'This month' },
            { v: '₦48,230', l: 'Total earned', sub: 'All time' },
          ].map((s, i) => (
            <div key={i} style={{
              background: PP.card, border: '1px solid ' + PP.line, borderRadius: 18, padding: '14px 16px',
            }}>
              <div style={{ fontSize: 11.5, color: PP.text3, fontWeight: 600 }}>{s.l}</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6, letterSpacing: -0.4 }}>{s.v}</div>
              <div style={{ fontSize: 11, color: PP.text3, marginTop: 3 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Territory */}
        <div style={{ background: PP.card, border: '1px solid ' + PP.line, borderRadius: 18, padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11.5, color: PP.text3, fontWeight: 600 }}>Your territory</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>Ikorodu, Lagos</div>
            </div>
            <button style={{
              padding: '6px 12px', borderRadius: 9,
              background: 'rgba(255,255,255,0.04)', border: 'none',
              fontSize: 12, fontWeight: 700, color: PP.text2, cursor: 'pointer', fontFamily: PP.font,
            }}>Change</button>
          </div>
          {/* Territory map visual */}
          <div style={{
            height: 80, borderRadius: 12, position: 'relative', overflow: 'hidden',
            background: '#1B1F26',
          }}>
            <svg width="100%" height="100%" viewBox="0 0 300 80" preserveAspectRatio="xMidYMid slice">
              <rect width="300" height="80" fill="#1B1F26"/>
              {/* simple road grid */}
              <line x1="0" y1="40" x2="300" y2="40" stroke="rgba(120,140,180,0.14)" strokeWidth="4"/>
              <line x1="150" y1="0" x2="150" y2="80" stroke="rgba(120,140,180,0.14)" strokeWidth="4"/>
              {/* territory polygon */}
              <polygon points="50,15 210,12 258,55 148,76 42,65" fill="rgba(255,199,44,0.18)" stroke={PP.yellow} strokeWidth="1.5"/>
              <circle cx="150" cy="44" r="4" fill={PP.yellow}/>
            </svg>
          </div>
        </div>

        {/* Performance */}
        <div style={{ background: PP.card, border: '1px solid ' + PP.line, borderRadius: 18, padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11.5, color: PP.text3, fontWeight: 600 }}>Performance · Accuracy score</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: PP.green }}>
              {I.star()} Silver Agent
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.6 }}>98%</div>
            <div style={{ fontSize: 12, color: PP.text3, fontWeight: 600 }}>· rank #14 in Ikorodu</div>
          </div>
          <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div style={{ width: '98%', height: '100%', background: 'linear-gradient(90deg, ' + PP.green + ', #5EE6A0)' }} />
          </div>
        </div>

        {/* Task card */}
        <div style={{
          background: 'rgba(46,107,255,0.07)', border: '1px solid rgba(46,107,255,0.22)',
          borderRadius: 18, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: PP.blueSoft, color: PP.blue,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>{I.shield()}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>3 PPOINNTs to verify</div>
            <div style={{ fontSize: 12, color: PP.text3, marginTop: 2 }}>Earn ₦500 per verification</div>
          </div>
          <span style={{ color: PP.text3 }}>{I.chevR()}</span>
        </div>

        <div style={{ height: 20 }} />
      </div>

      {/* Withdraw modal */}
      {showWithdraw && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(10,11,13,0.7)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'flex-end',
        }} onClick={() => setShowWithdraw(false)}>
          <div style={{
            width: '100%', background: PP.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
            padding: '28px 24px 40px',
          }} onClick={e => e.stopPropagation()} className="animate-slide-up">
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Withdraw earnings</div>
            <div style={{ fontSize: 14, color: PP.text3, marginBottom: 24 }}>Available: ₦24,650.00</div>
            <input placeholder="Enter amount" style={{
              width: '100%', height: 54, borderRadius: 14,
              background: PP.card, border: '1px solid ' + PP.line,
              color: PP.text, fontSize: 18, fontWeight: 700, fontFamily: PP.font,
              padding: '0 16px', outline: 'none', boxSizing: 'border-box',
            }} />
            <button style={{
              width: '100%', height: 54, marginTop: 14, borderRadius: 18, border: 'none',
              background: PP.yellow, color: '#0A0B0D',
              fontSize: 16, fontWeight: 700, fontFamily: PP.font, cursor: 'pointer',
            }}>Request Withdrawal</button>
          </div>
        </div>
      )}
    </div>
  );
}
