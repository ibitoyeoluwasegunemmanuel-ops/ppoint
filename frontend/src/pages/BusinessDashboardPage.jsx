import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PP } from '../styles/tokens';

const I = {
  back:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l5 5 9-11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  api:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 9l-4 4 4 4M16 9l4 4-4 4M12 5l-2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  copy:    () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.8"/></svg>,
  truck:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>,
  chart:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 21V9l6-4 6 4 6-4v16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 21V9M15 21V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  key:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="15" r="5" stroke="currentColor" strokeWidth="1.8"/><path d="M11.5 11.5l9 9M15 15l3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  webhook: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9a6 6 0 0 1 11.93-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M9 9h11l-4 7H9l-3-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M6 21a3 3 0 0 1-3-3c0-1.5 1-2.5 2-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  pin:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 22s-7-7.5-7-13a7 7 0 1 1 14 0c0 5.5-7 13-7 13z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>,
  chevD:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

const TABS = ['Overview', 'API', 'Verify', 'Deliveries'];

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 16, padding: '16px 14px' }}>
      <div style={{ fontSize: 11, color: PP.text3, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, color: color || PP.text }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: PP.text3, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function ApiKey({ label, value, onCopy, copied }) {
  return (
    <div style={{ background: PP.card, borderRadius: 14, border: `1px solid ${PP.line}`, padding: '14px 16px', marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: PP.text3, fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, fontFamily: PP.mono, fontSize: 12, color: PP.text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
        <button onClick={onCopy} style={{
          width: 34, height: 34, borderRadius: 10, border: 'none',
          background: copied ? PP.greenSoft : 'rgba(255,255,255,0.06)',
          color: copied ? PP.green : PP.text3, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {copied ? I.check() : I.copy()}
        </button>
      </div>
    </div>
  );
}

export default function BusinessDashboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('Overview');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');

  const copyKey = async (key, id) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const verifyAddress = async () => {
    if (!verifyCode.trim()) return;
    setVerifyLoading(true);
    setVerifyResult(null);
    try {
      const res = await fetch(`/api/address/search?code=${verifyCode.trim().toUpperCase()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setVerifyResult({ found: true, data: data.data });
      } else {
        setVerifyResult({ found: false });
      }
    } catch {
      setVerifyResult({ found: false });
    }
    setVerifyLoading(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: PP.bg, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${PP.line}`, background: PP.card, color: PP.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{I.back()}</button>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}>Business Dashboard</div>
          <div style={{ fontSize: 12, color: '#A78BFA', fontWeight: 600, marginTop: 2 }}>🏢 Business Access</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 20px 16px', display: 'flex', gap: 8 }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 14px', borderRadius: 10,
            background: tab === t ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${tab === t ? 'rgba(167,139,250,0.3)' : PP.line}`,
            color: tab === t ? '#A78BFA' : PP.text3,
            fontFamily: PP.font, fontWeight: 700, fontSize: 12, cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>

        {/* ── OVERVIEW ── */}
        {tab === 'Overview' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <StatCard label="Total Verifications" value="1,847" sub="+12% this week" color="#A78BFA" />
              <StatCard label="Delivery Success" value="97.2%" sub="Above average" color={PP.green} />
              <StatCard label="Active API Keys" value="2" sub="3 webhooks set" />
              <StatCard label="Addresses Used" value="4,320" sub="Bulk + API calls" />
            </div>

            {/* Quick actions */}
            <div style={{ background: PP.card, borderRadius: 18, border: `1px solid ${PP.line}`, overflow: 'hidden', marginBottom: 16 }}>
              {[
                { icon: I.truck, label: 'Delivery Analytics', sub: 'Track delivery accuracy rates', onClick: () => setTab('Deliveries') },
                { icon: I.api, label: 'API Dashboard', sub: 'Keys, webhooks, usage', onClick: () => setTab('API') },
                { icon: I.pin, label: 'Verify Address', sub: 'Check a PPOINNT code', onClick: () => setTab('Verify') },
              ].map((item, i, arr) => (
                <button key={i} onClick={item.onClick} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px',
                  width: '100%', background: 'none', border: 'none',
                  borderBottom: i < arr.length - 1 ? `1px solid ${PP.line}` : 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(167,139,250,0.12)', color: '#A78BFA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: PP.text }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: PP.text3, marginTop: 2 }}>{item.sub}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: PP.text3 }}><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              ))}
            </div>

            {/* Docs note */}
            <div style={{ background: 'rgba(46,107,255,0.08)', borderRadius: 14, border: `1px solid rgba(46,107,255,0.2)`, padding: '14px 16px', marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PP.blue, marginBottom: 4 }}>📚 API Documentation</div>
              <div style={{ fontSize: 12, color: PP.text3, lineHeight: 1.5 }}>Full REST API docs, SDKs, and webhook examples in the Developer Platform.</div>
              <button onClick={() => navigate('/developers')} style={{ marginTop: 10, padding: '8px 14px', borderRadius: 10, background: PP.blueSoft, border: `1px solid rgba(46,107,255,0.3)`, color: PP.blue, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: PP.font }}>Open Docs</button>
            </div>
          </>
        )}

        {/* ── API ── */}
        {tab === 'API' && (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Your API Keys</div>
            <ApiKey label="Live Key" value="ppk_live_9fXj2mK8rTvQ4sNbYuW3" onCopy={() => copyKey('ppk_live_9fXj2mK8rTvQ4sNbYuW3', 'live')} copied={copiedKey === 'live'} />
            <ApiKey label="Test Key" value="ppk_test_2aHm7nL3qPxW6cRjYzT1" onCopy={() => copyKey('ppk_test_2aHm7nL3qPxW6cRjYzT1', 'test')} copied={copiedKey === 'test'} />

            <div style={{ height: 1, background: PP.line, margin: '20px 0 16px' }} />
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Quick Integration</div>
            <div style={{ background: PP.card, borderRadius: 14, border: `1px solid ${PP.line}`, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: PP.text3, fontWeight: 600, marginBottom: 10 }}>Verify an address</div>
              <pre style={{ fontFamily: PP.mono, fontSize: 11, color: PP.green, margin: 0, overflowX: 'auto', lineHeight: 1.6 }}>{`fetch('/api/address/search?code=PPT-NG-LAG-XY-1234', {
  headers: { 'X-API-Key': 'ppk_live_...' }
})`}</pre>
            </div>

            <div style={{ background: PP.card, borderRadius: 14, border: `1px solid ${PP.line}`, padding: '14px 16px', marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: PP.text3, fontWeight: 600, marginBottom: 10 }}>Bulk verify addresses</div>
              <pre style={{ fontFamily: PP.mono, fontSize: 11, color: PP.green, margin: 0, overflowX: 'auto', lineHeight: 1.6 }}>{`POST /api/government/bulk-lookup
{ "codes": ["PPT-NG-..."], "min_confidence": 60 }`}</pre>
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Webhooks</div>
            {[
              { event: 'address.verified', url: 'https://myapp.com/webhook', active: true },
              { event: 'delivery.confirmed', url: 'https://myapp.com/delivery', active: true },
              { event: 'address.disputed', url: '—', active: false },
            ].map((w, i) => (
              <div key={i} style={{ background: PP.card, borderRadius: 14, border: `1px solid ${PP.line}`, padding: '13px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontFamily: PP.mono, color: PP.yellow }}>{w.event}</div>
                  <div style={{ fontSize: 11, color: PP.text3, marginTop: 3 }}>{w.url}</div>
                </div>
                <span style={{ padding: '3px 8px', borderRadius: 8, background: w.active ? PP.greenSoft : 'rgba(255,255,255,0.05)', color: w.active ? PP.green : PP.text3, fontSize: 11, fontWeight: 700 }}>
                  {w.active ? 'Active' : 'Off'}
                </span>
              </div>
            ))}
            <div style={{ height: 24 }} />
          </>
        )}

        {/* ── VERIFY ── */}
        {tab === 'Verify' && (
          <>
            <div style={{ fontSize: 14, color: PP.text3, marginBottom: 20, lineHeight: 1.5 }}>
              Verify a customer's PPOINNT code before dispatching delivery.
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value)}
                placeholder="PPT-NG-LAG-XY-1234"
                style={{
                  flex: 1, padding: '13px 14px', borderRadius: 14,
                  background: PP.card, border: `1px solid ${PP.line}`,
                  color: PP.text, fontSize: 14, fontFamily: PP.mono, outline: 'none',
                }}
              />
              <button onClick={verifyAddress} disabled={verifyLoading || !verifyCode} style={{
                width: 52, height: 52, borderRadius: 14, border: 'none',
                background: verifyCode ? PP.yellow : PP.card, color: verifyCode ? '#0A0B0D' : PP.text3,
                cursor: verifyCode ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {verifyLoading
                  ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #0A0B0D', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                  : I.check()
                }
              </button>
            </div>

            {verifyResult && (
              <div style={{
                padding: '16px', borderRadius: 16,
                background: verifyResult.found ? PP.greenSoft : PP.redSoft,
                border: `1px solid ${verifyResult.found ? PP.green + '40' : PP.red + '40'}`,
                marginBottom: 20,
              }}>
                {verifyResult.found ? (
                  <>
                    <div style={{ color: PP.green, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>✓ Valid PPOINNT</div>
                    {[
                      ['Code', verifyResult.data.code],
                      ['Type', verifyResult.data.place_type],
                      ['City', verifyResult.data.city],
                      ['State', verifyResult.data.state],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: PP.text3, width: 60, flexShrink: 0 }}>{k}:</span>
                        <span style={{ color: PP.text, fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ color: PP.red, fontWeight: 700, fontSize: 14 }}>✗ PPOINNT not found or invalid</div>
                )}
              </div>
            )}

            <div style={{ fontSize: 13, fontWeight: 700, color: PP.text3, marginBottom: 12 }}>Bulk Verification</div>
            <div style={{ background: PP.card, borderRadius: 14, border: `1px solid ${PP.line}`, padding: '14px 16px', marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: PP.text3, marginBottom: 10 }}>Paste multiple codes (one per line) for batch verification</div>
              <textarea rows={5} placeholder="PPT-NG-LAG-XY-1234&#10;PPT-NG-FCT-AB-5678&#10;..." style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${PP.line}`, borderRadius: 10, padding: '10px 12px', color: PP.text, fontFamily: PP.mono, fontSize: 12, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
              <button style={{ marginTop: 10, width: '100%', padding: '12px 0', borderRadius: 12, background: PP.yellow, color: '#0A0B0D', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: PP.font }}>Run Bulk Verification</button>
            </div>
          </>
        )}

        {/* ── DELIVERIES ── */}
        {tab === 'Deliveries' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <StatCard label="Successful" value="1,802" color={PP.green} />
              <StatCard label="Failed" value="45" color={PP.red} />
              <StatCard label="Avg Accuracy" value="94%" color={PP.yellow} />
              <StatCard label="Disputes" value="12" sub="3 unresolved" />
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Recent Deliveries</div>
            {[
              { code: 'PPT-NG-LAG-IK-1234', status: 'success', accuracy: 8, time: '2 min ago' },
              { code: 'PPT-NG-ABJ-GK-5678', status: 'success', accuracy: 15, time: '22 min ago' },
              { code: 'PPT-NG-KAN-TB-9012', status: 'disputed', accuracy: 65, time: '1 hr ago' },
              { code: 'PPT-NG-LAG-VK-3456', status: 'success', accuracy: 5, time: '2 hr ago' },
            ].map((d, i) => (
              <div key={i} style={{ background: PP.card, borderRadius: 14, border: `1px solid ${PP.line}`, padding: '13px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: d.status === 'success' ? PP.greenSoft : PP.redSoft, color: d.status === 'success' ? PP.green : PP.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {d.status === 'success' ? '✓' : '!'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: PP.mono, fontSize: 12, color: PP.yellow }}>{d.code}</div>
                  <div style={{ fontSize: 11, color: PP.text3, marginTop: 2 }}>±{d.accuracy}m · {d.time}</div>
                </div>
                <span style={{ padding: '3px 8px', borderRadius: 8, background: d.status === 'success' ? PP.greenSoft : PP.redSoft, color: d.status === 'success' ? PP.green : PP.red, fontSize: 11, fontWeight: 700 }}>
                  {d.status === 'success' ? 'OK' : 'Disputed'}
                </span>
              </div>
            ))}
            <div style={{ height: 24 }} />
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
