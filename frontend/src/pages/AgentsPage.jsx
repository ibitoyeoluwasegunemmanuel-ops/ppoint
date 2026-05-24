import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PP } from '../styles/tokens';

const I = {
  back: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  shield: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  map: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l5 5 9-11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  star: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7 7.5.6-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5L9 9l3-7z"/></svg>,
  trending: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 21v-6l7-7 5 5 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M18 9h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  users: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  crown: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
};

function CertificationBadge({ level }) {
  const badges = {
    Bronze: { color: '#CD7F32', emoji: '🥉' },
    Silver: { color: PP.yellow, emoji: '🥈' },
    Gold: { color: '#FFD700', emoji: '🥇' },
  };
  const badge = badges[level] || badges.Bronze;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 12px', borderRadius: 10,
      background: `${badge.color}18`, color: badge.color,
      fontSize: 12, fontWeight: 700,
    }}>
      {badge.emoji} {level}
    </div>
  );
}

export default function AgentsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [agentId] = useState(1); // TODO: Get from auth
  const [territory, setTerritory] = useState(null);
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [territoryRes, statsRes, tasksRes, leaderRes] = await Promise.all([
          api.get(`/platform/agents/${agentId}/territory`),
          api.get(`/platform/agents/${agentId}/stats`),
          api.get(`/platform/agents/${agentId}/verification-tasks`),
          api.get(`/platform/agents/leaderboard/Lagos`), // TODO: Dynamic state
        ]);

        setTerritory(territoryRes.data.data);
        setStats(statsRes.data.data);
        setTasks(tasksRes.data.data?.tasks || []);
        setLeaderboard(leaderRes.data.data?.agents || []);
      } catch (err) {
        console.error('Failed to load agent data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [agentId]);

  const handleVerifyAddress = async (code) => {
    setVerifying(code);
    try {
      await api.post(`/platform/agents/${agentId}/verify-address/${code}`, { verified: true });
      setTasks(t => t.filter(task => task.code !== code));
      setStats(s => ({
        ...s,
        verification_count: (s.verification_count || 0) + 1,
        earnings_balance: (s.earnings_balance || 0) + (s.certification_level === 'Gold' ? 250 : s.certification_level === 'Silver' ? 150 : 50),
      }));
    } catch (err) {
      console.error('Verification failed', err);
    }
    setVerifying(null);
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: PP.bg }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${PP.yellow}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: PP.bg, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate(-1)} style={{
          width: 38, height: 38, borderRadius: 12, border: 'none',
          background: PP.card, color: PP.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>{I.back()}</button>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Agent Dashboard</div>
        <div style={{ width: 38 }} />
      </div>

      {/* Tab Navigation */}
      <div style={{ padding: '0 20px 14px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'verify', label: `Verify (${tasks.length})` },
          { id: 'leaderboard', label: 'Leaderboard' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: tab === t.id ? PP.yellow : PP.card,
            color: tab === t.id ? '#0A0B0D' : PP.text2,
            fontFamily: PP.font, fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && stats && (
          <>
            {/* Certification Progress */}
            <div style={{
              background: 'linear-gradient(135deg, ' + (stats.certification_level === 'Gold' ? '#FFD700' : stats.certification_level === 'Silver' ? PP.yellow : '#CD7F32') + ' 0%, rgba(255,255,255,0.1) 100%)',
              borderRadius: 18, padding: '20px', marginBottom: 16,
              border: `1px solid ${stats.certification_level === 'Gold' ? '#FFD700' : stats.certification_level === 'Silver' ? PP.yellow : '#CD7F32'}33`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Current Tier</div>
                  <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}><CertificationBadge level={stats.certification_level} /></div>
                </div>
                <div style={{ fontSize: 40 }}>{I.shield()}</div>
              </div>

              {stats.certification_progress?.next_tier && (
                <>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 6 }}>
                    Progress to {stats.certification_progress.next_tier}
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${stats.certification_progress.progress_to_next}%`,
                      height: '100%', background: '#fff', transition: 'width 0.3s',
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                    {stats.verification_count} / {stats.certification_progress.next_threshold}
                  </div>
                </>
              )}

              <div style({ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 10, fontWeight: 600 }}>
                Earn ₦{stats.certification_level === 'Gold' ? '250' : stats.certification_level === 'Silver' ? '150' : '50'} per verified address
              </div>
            </div>

            {/* Territory Card */}
            {territory && (
              <div style={{
                background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 18,
                padding: '16px', marginBottom: 16,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: PP.text3, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>Territory</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, background: PP.yellowSoft, color: PP.yellow,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{I.map()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{territory.territory || 'Unassigned'}</div>
                    <div style={{ fontSize: 12, color: PP.text3, marginTop: 2 }}>{territory.city}, {territory.state}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Verified', value: stats.verification_count, icon: I.check, color: PP.green },
                { label: 'Accuracy', value: stats.accuracy_score + '%', icon: I.shield, color: PP.blue },
                { label: 'Balance', value: '₦' + (stats.earnings_balance || 0).toLocaleString(), icon: I.trending, color: PP.yellow },
                { label: 'Lifetime', value: '₦' + (stats.total_earnings || 0).toLocaleString(), icon: I.star, color: PP.greenSoft },
              ].map((s, i) => (
                <div key={i} style={{
                  background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 14,
                  padding: '14px', display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: s.color + '18', color: s.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{s.icon()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: PP.text3, fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2 }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* VERIFY TAB */}
        {tab === 'verify' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: PP.text3 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>All caught up!</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>No addresses to verify right now.</div>
              </div>
            ) : (
              tasks.map(task => (
                <div key={task.code} style={{
                  background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 14,
                  padding: '14px', display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: PP.text3, fontFamily: PP.mono }}>{task.code}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{task.landmark || task.place_type}</div>
                    </div>
                    <div style={{ fontSize: 12, color: PP.text3 }}>
                      {task.verification_count} verified
                    </div>
                  </div>
                  <button
                    onClick={() => handleVerifyAddress(task.code)}
                    disabled={verifying === task.code}
                    style={{
                      width: '100%', padding: '10px 0', borderRadius: 10, border: 'none',
                      background: verifying === task.code ? 'rgba(255,199,44,0.3)' : PP.yellow,
                      color: '#0A0B0D', fontFamily: PP.font, fontWeight: 700, fontSize: 12,
                      cursor: verifying === task.code ? 'not-allowed' : 'pointer',
                      opacity: verifying === task.code ? 0.7 : 1,
                    }}
                  >
                    {verifying === task.code ? 'Verifying…' : 'Verify Address'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {tab === 'leaderboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {leaderboard.map((agent, idx) => (
              <div key={agent.agent_id} style={{
                background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 14,
                padding: '14px', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: idx < 3 ? PP.yellowSoft : PP.card,
                  color: idx < 3 ? PP.yellow : PP.text3, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 14,
                }}>
                  {idx < 3 ? I.crown() : idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{agent.name}</div>
                  <div style={{ fontSize: 11, color: PP.text3, marginTop: 2 }}>{agent.territory} • {agent.verification_count} verified</div>
                </div>
                <CertificationBadge level={agent.certification_level} />
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
