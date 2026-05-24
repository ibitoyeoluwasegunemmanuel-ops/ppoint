import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { PP } from '../styles/tokens';

const I = {
  back:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  shield:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  chart:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 21V9l6-4 6 4 6-4v16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 21V9M15 21V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  map:       () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  check:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l5 5 9-11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trending:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 21v-6l7-7 5 5 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M18 9h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  users:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/></svg>,
  crown:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  money:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v8M9.5 12h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  calendar:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M3 10h18M8 1v6M16 1v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  home:      () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-7h-6v7H5a1 1 0 0 1-1-1v-9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
};

function StatCard({ label, value, sub, color, icon: Icon, trend }) {
  return (
    <div style={{ background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 16, padding: '16px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: PP.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
        {Icon && <div style={{ color: color || PP.text3 }}>{Icon()}</div>}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, color: color || PP.text, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: PP.text3 }}>{sub}</div>}
      {trend && <div style={{ fontSize: 12, color: trend > 0 ? PP.green : PP.red, fontWeight: 700, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
        {I.trending()} {trend > 0 ? '+' : ''}{trend}% this week
      </div>}
    </div>
  );
}

function CertificationBadge({ level }) {
  const badges = { Bronze: { color: '#CD7F32', emoji: '🥉' }, Silver: { color: PP.yellow, emoji: '🥈' }, Gold: { color: '#FFD700', emoji: '🥇' } };
  const badge = badges[level] || badges.Bronze;
  return <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 10, background: `${badge.color}18`, color: badge.color, fontSize: 12, fontWeight: 700 }}>{badge.emoji} {level}</div>;
}

function EarningsChart({ data = [] }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartData = days.map((day, i) => ({ day, value: data[i]?.value || 0 }));

  return (
    <div style={{ background: PP.card, borderRadius: 16, border: `1px solid ${PP.line}`, padding: '16px', marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: PP.text, marginBottom: 14 }}>Weekly Earnings</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, justifyContent: 'space-between' }}>
        {chartData.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: '100%', height: `${(d.value / maxValue) * 100}%`, background: PP.yellow, borderRadius: '4px 4px 0 0',
              minHeight: d.value > 0 ? 8 : 2, transition: 'all 0.3s', cursor: 'pointer',
            }} title={`₦${d.value}`} />
            <div style={{ fontSize: 10, color: PP.text3, fontWeight: 600 }}>{d.day}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: PP.text3, textAlign: 'center' }}>Total: ₦{chartData.reduce((s, d) => s + d.value, 0)}</div>
    </div>
  );
}

function PayoutCard({ balance, pending, nextWithdrawal, onWithdraw }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${PP.yellow}15 0%, ${PP.blue}15 100%)`, borderRadius: 20, border: `1px solid ${PP.line}`, padding: '20px', marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: PP.text3, fontWeight: 600, marginBottom: 6 }}>Available Balance</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: PP.yellow }}>₦{balance.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: PP.text3, fontWeight: 600, marginBottom: 6 }}>Pending Payouts</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: PP.blue }}>₦{pending.toLocaleString()}</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: PP.text3, marginBottom: 12 }}>Next payout available in 3 days</div>
      <button onClick={onWithdraw} disabled={balance < 5000} style={{
        width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
        background: balance >= 5000 ? PP.yellow : 'rgba(255,255,255,0.1)',
        color: balance >= 5000 ? '#0A0B0D' : PP.text3,
        fontWeight: 700, fontSize: 13, cursor: balance >= 5000 ? 'pointer' : 'not-allowed',
        fontFamily: PP.font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        {I.money()} Withdraw ₦{Math.min(balance, 100000)}
      </button>
    </div>
  );
}

function PlaceTypeBreakdown({ data = {} }) {
  const types = ['House', 'Shop', 'Office', 'School', 'Other'];
  const sorted = types.sort((a, b) => (data[b] || 0) - (data[a] || 0));
  const total = Object.values(data).reduce((s, v) => s + (v || 0), 0);

  return (
    <div style={{ background: PP.card, borderRadius: 16, border: `1px solid ${PP.line}`, padding: '16px', marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: PP.text, marginBottom: 14 }}>Verifications by Type</div>
      {sorted.map((type, i) => {
        const count = data[type] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={i} style={{ marginBottom: i < sorted.length - 1 ? 12 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: PP.text }}>{type}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: PP.yellow }}>{count} ({pct}%)</div>
            </div>
            <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: PP.yellow, transition: 'width 0.3s' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AgentsPageEnhanced() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');
  const [agentId] = useState(1);
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Mock data for enhanced features
  const mockEarnings = [
    { day: 'Mon', value: 7500 },
    { day: 'Tue', value: 6200 },
    { day: 'Wed', value: 8900 },
    { day: 'Thu', value: 5400 },
    { day: 'Fri', value: 9100 },
    { day: 'Sat', value: 4800 },
    { day: 'Sun', value: 6500 },
  ];

  const mockPlaceTypes = {
    House: 42,
    Shop: 28,
    Office: 15,
    School: 8,
    Other: 7,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, tasksRes, leaderRes] = await Promise.all([
          api.get(`/platform/agents/${agentId}/stats`),
          api.get(`/platform/agents/${agentId}/verification-tasks`),
          api.get(`/platform/agents/leaderboard/Lagos`),
        ]);
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
    } catch (err) { console.error('Verification failed', err); }
    setVerifying(null);
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: PP.bg }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${PP.yellow}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  const certLevel = stats?.certification_level || 'Bronze';
  const verificationCount = stats?.verification_count || 0;
  const nextTierThreshold = certLevel === 'Bronze' ? 100 : certLevel === 'Silver' ? 500 : 1000;
  const certProgress = Math.min((verificationCount / nextTierThreshold) * 100, 100);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: PP.bg, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: PP.card, color: PP.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{I.back()}</button>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Agent Dashboard</div>
        <CertificationBadge level={certLevel} />
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 20px 14px', display: 'flex', gap: 8 }}>
        {['dashboard', 'earnings', 'verify', 'leaderboard'].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 14px', borderRadius: 10,
            background: tab === t ? 'rgba(255,199,44,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${tab === t ? 'rgba(255,199,44,0.3)' : PP.line}`,
            color: tab === t ? PP.yellow : PP.text3,
            fontFamily: PP.font, fontWeight: 700, fontSize: 12, cursor: 'pointer',
          }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <>
            {/* Certification progress */}
            <div style={{ background: PP.card, borderRadius: 18, border: `1px solid ${PP.line}`, padding: '18px 16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: PP.text3, fontWeight: 600, marginBottom: 4 }}>Next Certification</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: PP.text }}>
                    {certLevel === 'Bronze' ? 'Silver' : certLevel === 'Silver' ? 'Gold' : 'Max'} — {Math.round(certProgress)}%
                  </div>
                </div>
                <div style={{ fontSize: 24 }}>{certLevel === 'Bronze' ? '🥉' : certLevel === 'Silver' ? '🥈' : '🥇'}</div>
              </div>
              <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ height: '100%', width: `${certProgress}%`, background: PP.yellow, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: 11, color: PP.text3 }}>
                {nextTierThreshold - verificationCount} verifications to next tier (at ₦{certLevel === 'Bronze' ? '150' : '250'}/each)
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <StatCard label="Total Earned" value={`₦${stats?.total_earned?.toLocaleString() || '0'}`} color={PP.green} />
              <StatCard label="Verifications" value={verificationCount} trend={12} color={PP.yellow} />
              <StatCard label="Accuracy Score" value={`${stats?.accuracy_score || 98}%`} color={PP.blue} />
              <StatCard label="Territory" value={stats?.territory || 'Lagos'} sub="Assigned zone" />
            </div>

            {/* Quick actions */}
            <div style={{ background: PP.card, borderRadius: 18, border: `1px solid ${PP.line}`, overflow: 'hidden', marginBottom: 16 }}>
              {[
                { icon: I.chart, label: 'View Analytics', sub: 'Earnings & trends', action: () => setTab('earnings') },
                { icon: I.home, label: 'Verify Addresses', sub: `${tasks.length} pending`, action: () => setTab('verify') },
                { icon: I.users, label: 'Leaderboard', sub: 'Top performers', action: () => setTab('leaderboard') },
              ].map((item, i, arr) => (
                <button key={i} onClick={item.action} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', width: '100%', background: 'none', border: 'none',
                  borderBottom: i < arr.length - 1 ? `1px solid ${PP.line}` : 'none', cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: PP.yellowSoft, color: PP.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: PP.text }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: PP.text3, marginTop: 2 }}>{item.sub}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: PP.text3 }}><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── EARNINGS ── */}
        {tab === 'earnings' && (
          <>
            <EarningsChart data={mockEarnings} />
            <PayoutCard balance={48000} pending={12500} nextWithdrawal={3} onWithdraw={() => setShowWithdrawModal(true)} />
            <PlaceTypeBreakdown data={mockPlaceTypes} />
            <div style={{ height: 24 }} />
          </>
        )}

        {/* ── VERIFY ── */}
        {tab === 'verify' && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: PP.text }}>Pending Verifications ({tasks.length})</div>
            {tasks.slice(0, 5).map((task, i) => (
              <div key={i} style={{ background: PP.card, borderRadius: 14, border: `1px solid ${PP.line}`, padding: '13px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: PP.mono, fontSize: 11, color: PP.yellow, fontWeight: 700, marginBottom: 4 }}>{task.code || 'PPT-NG-LAG-...'}</div>
                  <div style={{ fontSize: 12, color: PP.text, fontWeight: 600 }}>{task.address || 'Unknown location'}</div>
                  <div style={{ fontSize: 11, color: PP.text3, marginTop: 2 }}>Type: {task.place_type || 'House'}</div>
                </div>
                <button onClick={() => handleVerifyAddress(task.code)} disabled={verifying === task.code} style={{
                  padding: '10px 14px', borderRadius: 10, border: 'none', background: PP.yellow, color: '#0A0B0D',
                  fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0,
                  opacity: verifying === task.code ? 0.7 : 1,
                }}>
                  {verifying === task.code ? '...' : I.check()}
                </button>
              </div>
            ))}
            <div style={{ height: 24 }} />
          </>
        )}

        {/* ── LEADERBOARD ── */}
        {tab === 'leaderboard' && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: PP.text }}>Top Agents This Month</div>
            {leaderboard.slice(0, 8).map((agent, i) => (
              <div key={i} style={{ background: PP.card, borderRadius: 14, border: `1px solid ${PP.line}`, padding: '13px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: i < 3 ? (i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32') : PP.blueSoft, color: i < 3 ? '#0A0B0D' : PP.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                  {i < 3 ? I.crown() : i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: PP.text }}>{agent.name || `Agent ${i + 1}`}</div>
                  <div style={{ fontSize: 11, color: PP.text3, marginTop: 2 }}>{agent.verification_count || 0} verifications · {agent.certification_level || 'Bronze'}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: PP.yellow }}>₦{((agent.verification_count || 0) * 150).toLocaleString()}</div>
              </div>
            ))}
            <div style={{ height: 24 }} />
          </>
        )}
      </div>

      {/* Withdraw modal */}
      {showWithdrawModal && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ width: '100%', background: PP.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '24px 20px 32px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Withdraw Funds</div>
              <button onClick={() => setShowWithdrawModal(false)} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: PP.card, color: PP.text3, cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[10000, 25000, 50000, 100000].map((amt, i) => (
                <button key={i} style={{
                  padding: '16px 12px', borderRadius: 14, border: `2px solid ${PP.line}`, background: PP.card, color: PP.text, fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>
                  ₦{(amt / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
            <button onClick={() => setShowWithdrawModal(false)} style={{
              width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', background: PP.yellow, color: '#0A0B0D', fontWeight: 700, cursor: 'pointer', fontFamily: PP.font,
            }}>
              Withdraw ₦48,000 to Bank Account
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
