import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PP } from '../styles/tokens';

const I = {
  back: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  upload: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  download: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  stats: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 3v18a1 1 0 0 0 1 1h16M10 8v8M14 8v6M18 8v4M6 18V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  map: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l5 5 9-11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  alert: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2l9 16H3l9-16z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
};

export default function AdminGovernmentPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [state, setState] = useState('Lagos');
  const [stats, setStats] = useState(null);
  const [coverage, setCoverage] = useState(null);
  const [bulkCodes, setBulkCodes] = useState('');
  const [bulkResults, setBulkResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, coverageRes] = await Promise.all([
          api.get(`/platform/government/stats/${state}`),
          api.get(`/platform/government/coverage/${state}`),
        ]);
        setStats(statsRes.data.data);
        setCoverage(coverageRes.data.data);
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [state]);

  const handleBulkLookup = async () => {
    setLoading(true);
    try {
      const codes = bulkCodes.split('\n').map(c => c.trim().toUpperCase()).filter(Boolean);
      const res = await api.post('/platform/government/bulk-lookup', { codes, confidence_threshold: 85 });
      setBulkResults(res.data.data);
    } catch (err) {
      console.error('Bulk lookup failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await api.post('/platform/government/export/csv', { state, confidence_threshold: 85 });
      // Trigger download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ppoinnt_${state}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentChild.removeChild(link);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: PP.bg, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${PP.line}` }}>
        <button onClick={() => navigate('/admin')} style={{
          width: 38, height: 38, borderRadius: 12, border: 'none',
          background: PP.card, color: PP.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>{I.back()}</button>
        <div style={{ fontSize: 18, fontWeight: 800 }}>Government Integration</div>
        <div style={{ width: 38 }} />
      </div>

      {/* State Selector */}
      <div style={{ padding: '12px 20px', display: 'flex', gap: 8, alignItems: 'center', borderBottom: `1px solid ${PP.line}` }}>
        <span style={{ fontSize: 12, color: PP.text3, fontWeight: 600 }}>State:</span>
        <select value={state} onChange={(e) => setState(e.target.value)} style={{
          padding: '6px 10px', borderRadius: 8, border: `1px solid ${PP.line}`,
          background: PP.card, color: PP.text, fontFamily: PP.font, fontSize: 13, fontWeight: 600,
        }}>
          {['Lagos', 'Abuja', 'Kano', 'Katsina', 'Sokoto', 'Kaduna', 'Oyo', 'Ogun', 'Ondo'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Tab Navigation */}
      <div style={{ padding: '12px 20px', display: 'flex', gap: 8, borderBottom: `1px solid ${PP.line}`, overflowX: 'auto' }}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: I.stats },
          { id: 'coverage', label: 'Coverage', icon: I.map },
          { id: 'emergency', label: 'Emergency', icon: I.alert },
          { id: 'property', label: 'Property', icon: I.map },
          { id: 'bulk', label: 'Bulk', icon: I.search },
          { id: 'export', label: 'Export', icon: I.download },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: tab === t.id ? PP.yellow : PP.card,
            color: tab === t.id ? '#0A0B0D' : PP.text2,
            fontFamily: PP.font, fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {tab === t.id ? t.icon() : null} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {/* DASHBOARD */}
        {tab === 'dashboard' && stats && (
          <>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total Addresses', value: stats.total_addresses?.toLocaleString(), icon: I.map, color: PP.blue },
                { label: 'Active Agents', value: stats.agents_active, icon: I.stats, color: PP.green },
                { label: 'Avg Confidence', value: stats.average_confidence + '%', icon: I.check, color: PP.yellow },
                { label: 'This Month', value: stats.addresses_this_month, icon: I.upload, color: PP.green },
              ].map((s, i) => (
                <div key={i} style={{
                  background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 16,
                  padding: '16px', display: 'flex', alignItems: 'flex-start', gap: 12,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: s.color + '18', color: s.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{s.icon()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: PP.text3, fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top Agents */}
            <div style={{
              background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 16,
              padding: '16px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PP.text3, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>Top 5 Agents</div>
              {stats.top_agents?.map((a, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: i < stats.top_agents.length - 1 ? `1px solid ${PP.line}` : 'none',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: PP.text3, marginTop: 2 }}>{a.verifications} verified</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: PP.green }}>{a.accuracy}%</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* COVERAGE */}
        {tab === 'coverage' && coverage && (
          <>
            <div style={{
              background: `linear-gradient(135deg, ${PP.blue}, rgba(46,107,255,0.1))`,
              borderRadius: 16, padding: '20px', marginBottom: 20,
              border: `1px solid ${PP.blue}33`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PP.text3, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>Coverage Overview</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: PP.text3, fontWeight: 600 }}>High Confidence (90%+)</div>
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{coverage.high_confidence?.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: PP.text3, fontWeight: 600 }}>Medium (70-89%)</div>
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{coverage.medium_confidence?.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div style={{
              background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 16,
              padding: '16px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, color: PP.text3, fontWeight: 600, marginBottom: 8 }}>Coverage Quality</div>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                  width: `${coverage.coverage_percentage}%`, height: '100%',
                  background: `linear-gradient(90deg, ${PP.blue}, ${PP.green})`,
                  transition: 'width 0.3s',
                }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 8 }}>{coverage.coverage_percentage}% verified</div>
            </div>
          </>
        )}

        {/* EMERGENCY SERVICES */}
        {tab === 'emergency' && (
          <>
            <div style={{
              background: 'linear-gradient(135deg, #EF4444, rgba(239,68,68,0.1))',
              borderRadius: 16, padding: '20px', marginBottom: 20,
              border: `1px solid #EF444433`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PP.text3, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 16 }}>Emergency Services Integration</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { name: 'Ambulances', total: 245, active: 189, coverage: 77, icon: '🚑', time: '12.5min' },
                  { name: 'Fire Services', total: 89, active: 73, coverage: 82, icon: '🚒', time: '8.2min' },
                  { name: 'Police', total: 567, active: 502, coverage: 88, icon: '🚔', time: '6.8min' },
                ].map((service, i) => (
                  <div key={i} style={{
                    background: PP.card, borderRadius: 12, padding: 12, border: `1px solid ${PP.line}`,
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{service.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: PP.text3, marginBottom: 8 }}>{service.name}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: PP.yellow, marginBottom: 4 }}>{service.active}/{service.total}</div>
                    <div style={{ fontSize: 11, color: PP.text3, marginBottom: 8 }}>Coverage: {service.coverage}%</div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${service.coverage}%`, height: '100%',
                        background: service.coverage > 80 ? '#10B981' : '#FDB022',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: PP.text3, marginTop: 8 }}>Avg: {service.time}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 16,
              padding: '16px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PP.text3, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>Last 24 Hours Dispatches</div>
              {[
                { type: 'Ambulance', count: 156, icon: '🚑', color: '#EF4444' },
                { type: 'Fire', count: 23, icon: '🚒', color: '#FDB022' },
                { type: 'Police', count: 342, icon: '🚔', color: '#3B82F6' },
              ].map((dispatch, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 0', borderBottom: i < 2 ? `1px solid ${PP.line}` : 'none',
                }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 20 }}>{dispatch.icon}</span>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{dispatch.type}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: dispatch.color }}>{dispatch.count}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* PROPERTY REGISTRY */}
        {tab === 'property' && (
          <>
            <div style={{
              background: 'linear-gradient(135deg, #10B981, rgba(16,185,129,0.1))',
              borderRadius: 16, padding: '20px', marginBottom: 20,
              border: `1px solid #10B98133`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PP.text3, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 16 }}>Property Registry Integration</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: PP.text3, fontWeight: 600, marginBottom: 4 }}>Total Properties</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: PP.text }}>45.2K</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: PP.text3, fontWeight: 600, marginBottom: 4 }}>Linked to PPOINNT</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: PP.yellow }}>34.8K</div>
                </div>
              </div>
            </div>

            <div style={{
              background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 16,
              padding: '16px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PP.text3, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>Linking Status: 77.0%</div>
              <div style={{ height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 12 }}>
                <div style={{
                  width: '77%', height: '100%',
                  background: `linear-gradient(90deg, #10B981, #FDB022)`,
                  transition: 'width 0.3s',
                }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: 12, background: '#10B98110', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: PP.text3, marginBottom: 4 }}>Linked</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#10B981' }}>34.8K</div>
                </div>
                <div style={{ padding: 12, background: '#FDB02210', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: PP.text3, marginBottom: 4 }}>Pending</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#FDB022' }}>10.4K</div>
                </div>
              </div>
            </div>

            <div style={{
              background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 16,
              padding: '16px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PP.text3, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>Property Categories</div>
              {[
                { category: 'Residential', count: 28340, percentage: 62.6 },
                { category: 'Commercial', count: 10200, percentage: 22.5 },
                { category: 'Institutional', count: 4560, percentage: 10.1 },
                { category: 'Mixed-Use', count: 2100, percentage: 4.8 },
              ].map((cat, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: i < 3 ? `1px solid ${PP.line}` : 'none',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{cat.category}</div>
                    <div style={{ fontSize: 12, color: PP.text3, marginTop: 2 }}>{cat.count.toLocaleString()}</div>
                  </div>
                  <div style={{
                    fontSize: 14, fontWeight: 800, color: PP.yellow,
                    minWidth: 40, textAlign: 'right',
                  }}>
                    {cat.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* BULK LOOKUP */}
        {tab === 'bulk' && (
          <>
            <div style={{
              background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 16,
              padding: '16px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PP.text3, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>Bulk Address Lookup</div>
              <textarea value={bulkCodes} onChange={(e) => setBulkCodes(e.target.value)} placeholder="Enter PPOINNT codes (one per line)..." style={{
                width: '100%', minHeight: 120, padding: '12px', borderRadius: 10,
                background: 'rgba(0,0,0,0.2)', border: `1px solid ${PP.line}`, color: PP.text,
                fontFamily: PP.mono, fontSize: 12, resize: 'vertical', outline: 'none',
              }} />
              <button onClick={handleBulkLookup} disabled={loading} style={{
                width: '100%', padding: '12px', marginTop: 12, borderRadius: 10, border: 'none',
                background: loading ? 'rgba(255,199,44,0.3)' : PP.yellow, color: '#0A0B0D',
                fontFamily: PP.font, fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? 'Processing…' : 'Lookup Codes'}
              </button>
            </div>

            {bulkResults && (
              <div style={{
                background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 16,
                padding: '16px',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Results: {bulkResults.verified} of {bulkResults.requested} verified</div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {bulkResults.results?.map((r, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 0', borderBottom: `1px solid ${PP.line}`, fontSize: 12,
                    }}>
                      <span style={{ fontFamily: PP.mono, fontWeight: 600 }}>{r.code}</span>
                      <span style={{
                        color: r.verified ? PP.green : PP.red,
                        fontWeight: 700,
                      }}>
                        {r.verified ? '✓ ' + r.confidence_score + '%' : '✗ Not found'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* EXPORT */}
        {tab === 'export' && (
          <>
            <div style={{
              background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 16,
              padding: '20px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Export Verified Addresses</div>
              <div style={{ fontSize: 12, color: PP.text3, marginBottom: 16 }}>Download all high-confidence (90%+) addresses from {state} as CSV</div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 10, marginBottom: 16, fontSize: 12, color: PP.text3, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                {I.alert()}
                <span>File includes: Code, Latitude, Longitude, Landmark, City, Confidence Score, Verification Count</span>
              </div>

              <button onClick={handleExportCSV} disabled={exporting} style={{
                width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                background: exporting ? 'rgba(46,107,255,0.3)' : PP.blue, color: '#fff',
                fontFamily: PP.font, fontWeight: 700, fontSize: 13, cursor: exporting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {I.download()} {exporting ? 'Exporting…' : 'Download CSV'}
              </button>
            </div>

            <div style={{
              background: PP.cardHi, border: `1px solid ${PP.line}`, borderRadius: 16,
              padding: '16px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>API Integration</div>
              <code style={{
                display: 'block', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: 8,
                fontFamily: PP.mono, fontSize: 11, color: PP.yellow, overflow: 'auto', marginBottom: 8,
              }}>
                POST /api/platform/government/bulk-lookup<br/>
                {'{'}<br/>
                &nbsp;&nbsp;"codes": ["PPT-NG-LAG-IKD-1234", ...],<br/>
                &nbsp;&nbsp;"confidence_threshold": 85<br/>
                {'}'}
              </code>
              <div style={{ fontSize: 11, color: PP.text3 }}>Governments can integrate directly via API for real-time address verification.</div>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
