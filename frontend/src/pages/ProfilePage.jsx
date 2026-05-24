import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.jsx';
import { PP } from '../styles/tokens';

const I = {
  chevR:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  agent:   () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  biz:     () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 21h18M5 21V9.5L12 4l7 5.5V21M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  gov:     () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 21h18M3 10l9-7 9 7M5 10v11M19 10v11M9 10v11M15 10v11M12 3v7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  api:     () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M8 9l-4 4 4 4M16 9l4 4-4 4M12 5l-2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  user:    () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  logout:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  save:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 4h12v17l-6-4-6 4V4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  map:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  help:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>,
  star:    () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7 7.5.6-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5L9 9l3-7z"/></svg>,
  nav:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 11L21 4l-7 17-2-7-9-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  dev:     () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M8 9l-4 4 4 4M16 9l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 5l-2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  ussd:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  settings:() => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" stroke="currentColor" strokeWidth="1.6"/></svg>,
};

function TierBadge({ tier, meta }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20,
      background: meta.color + '18', color: meta.color,
      fontSize: 11, fontWeight: 700,
    }}>
      {meta.emoji} {meta.label}
    </span>
  );
}

function MenuItem({ icon, label, badge, badgeColor, onClick, danger }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '15px 18px', width: '100%', background: 'none', border: 'none',
      cursor: 'pointer', textAlign: 'left',
    }}>
      <span style={{ color: danger ? PP.red : PP.text2, display: 'flex', flexShrink: 0 }}>{icon()}</span>
      <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: danger ? PP.red : PP.text, fontFamily: PP.font }}>{label}</span>
      {badge && (
        <span style={{
          padding: '3px 8px', borderRadius: 8,
          background: (badgeColor || PP.yellow) + '18', color: badgeColor || PP.yellow,
          fontSize: 11, fontWeight: 700,
        }}>{badge}</span>
      )}
      {!danger && <span style={{ color: PP.text3 }}>{I.chevR()}</span>}
    </button>
  );
}

function MenuCard({ items }) {
  return (
    <div style={{ margin: '0 20px 14px', background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 18, overflow: 'hidden' }}>
      {items.map((item, i) => (
        <div key={i} style={{ borderBottom: i < items.length - 1 ? `1px solid ${PP.line}` : 'none' }}>
          <MenuItem {...item} />
        </div>
      ))}
    </div>
  );
}

// ── GUEST PROFILE ─────────────────────────────────────────────────────────────
function GuestProfile({ navigate, mockSignIn }) {
  const accessCards = [
    {
      icon: I.agent, label: 'Become an Agent',
      sub: 'Map locations & earn money',
      color: PP.yellow, bg: PP.yellowSoft,
      onClick: () => mockSignIn('agent'),
    },
    {
      icon: I.biz, label: 'Business Access',
      sub: 'Logistics & API tools',
      color: '#A78BFA', bg: 'rgba(167,139,250,0.12)',
      onClick: () => mockSignIn('business'),
    },
    {
      icon: I.gov, label: 'Government Access',
      sub: 'Infrastructure dashboards',
      color: '#34D399', bg: 'rgba(52,211,153,0.12)',
      onClick: () => mockSignIn('government'),
    },
    {
      icon: I.dev, label: 'Developer Platform',
      sub: 'API keys & documentation',
      color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',
      onClick: () => navigate('/developers'),
    },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: PP.bg, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 24px' }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>Profile</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Hero auth card */}
        <div style={{ margin: '0 20px 24px', padding: '24px', background: `linear-gradient(135deg, ${PP.surface} 0%, #1A1D24 100%)`, borderRadius: 24, border: `1px solid ${PP.lineStrong}` }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(255,199,44,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={PP.yellow} strokeWidth="1.8"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7" stroke={PP.yellow} strokeWidth="1.8" strokeLinecap="round"/></svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, marginBottom: 6 }}>Welcome to PPOINNT</div>
          <div style={{ fontSize: 13, color: PP.text3, lineHeight: 1.5, marginBottom: 20 }}>Sign in to save addresses, earn as an agent, and access powerful tools.</div>

          <button onClick={() => mockSignIn('account')} style={{
            width: '100%', padding: '14px 0', borderRadius: 14,
            background: `linear-gradient(135deg, ${PP.yellow} 0%, #FFB400 100%)`,
            color: '#0A0B0D', fontFamily: PP.font, fontWeight: 700, fontSize: 14,
            border: 'none', cursor: 'pointer', marginBottom: 10,
          }}>Login / Sign Up</button>

          <button onClick={() => {}} style={{
            width: '100%', padding: '13px 0', borderRadius: 14,
            background: 'rgba(255,255,255,0.05)',
            color: PP.text2, fontFamily: PP.font, fontWeight: 600, fontSize: 14,
            border: `1px solid ${PP.line}`, cursor: 'pointer',
          }}>Continue as Guest</button>
        </div>

        {/* Access tier cards */}
        <div style={{ padding: '0 20px 8px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: PP.text3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Access Levels</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 20px 24px' }}>
          {accessCards.map((c, i) => (
            <button key={i} onClick={c.onClick} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px', borderRadius: 18,
              background: c.bg, border: `1px solid ${c.color}22`,
              cursor: 'pointer', width: '100%', textAlign: 'left',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: c.color + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: c.color, flexShrink: 0,
              }}>{c.icon()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: PP.text }}>{c.label}</div>
                <div style={{ fontSize: 12, color: PP.text3, marginTop: 2 }}>{c.sub}</div>
              </div>
              <span style={{ color: PP.text3 }}>{I.chevR()}</span>
            </button>
          ))}
        </div>

        {/* USSD row */}
        <MenuCard items={[
          { icon: I.ussd, label: 'USSD Access (*850#)', badge: 'No Internet', badgeColor: PP.green, onClick: () => navigate('/ussd') },
          { icon: I.help, label: 'Help & Support', onClick: () => {} },
        ]} />

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

// ── AGENT PROFILE ─────────────────────────────────────────────────────────────
function AgentProfile({ user, navigate, signOut, tierMeta }) {
  const initial = (user?.name || 'U')[0].toUpperCase();
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: PP.bg, overflow: 'hidden' }}>
      <div style={{ padding: '52px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>Profile</div>
        <button onClick={() => {}} style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${PP.line}`, background: PP.card, color: PP.text2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{I.settings()}</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* User hero */}
        <div style={{ padding: '0 20px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: `linear-gradient(135deg, ${PP.yellow} 0%, #FFB400 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: '#0A0B0D', flexShrink: 0,
          }}>{initial}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{user?.name}</div>
            <div style={{ marginTop: 4 }}><TierBadge tier="agent" meta={tierMeta} /></div>
            <div style={{ fontSize: 13, color: PP.text3, marginTop: 4 }}>{user?.phone}</div>
          </div>
        </div>

        {/* Earnings stats */}
        <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[{ v: '128', l: 'PPOINNTs' }, { v: '98%', l: 'Accuracy' }, { v: '₦48k', l: 'Earned' }].map((s, i) => (
            <div key={i} style={{ background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}>{s.v}</div>
              <div style={{ fontSize: 11, color: PP.text3, marginTop: 3, fontWeight: 600 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Agent CTA */}
        <div style={{ padding: '0 20px 16px' }}>
          <button onClick={() => navigate('/agents')} style={{
            width: '100%', padding: '14px 18px', borderRadius: 16,
            background: PP.yellowSoft, border: `1px solid rgba(255,199,44,0.2)`,
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: PP.yellow, color: '#0A0B0D', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{I.agent()}</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: PP.yellow }}>Agent Dashboard</div>
              <div style={{ fontSize: 12, color: PP.text3, marginTop: 2 }}>Earnings, territory & tasks</div>
            </div>
            <span style={{ color: PP.yellow }}>{I.chevR()}</span>
          </button>
        </div>

        <MenuCard items={[
          { icon: I.save, label: 'Saved Addresses', onClick: () => navigate('/saved') },
          { icon: I.map, label: 'Offline Maps', badge: 'Download', badgeColor: PP.green, onClick: () => {} },
          { icon: I.settings, label: 'Settings', onClick: () => navigate('/settings') },
        ]} />
        <MenuCard items={[
          { icon: I.ussd, label: 'USSD Access (*850#)', onClick: () => navigate('/ussd') },
          { icon: I.help, label: 'Help & Support', onClick: () => {} },
        ]} />
        <MenuCard items={[
          { icon: I.logout, label: 'Sign Out', onClick: signOut, danger: true },
        ]} />
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

// ── BUSINESS PROFILE ──────────────────────────────────────────────────────────
function BusinessProfile({ user, navigate, signOut, tierMeta }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: PP.bg, overflow: 'hidden' }}>
      <div style={{ padding: '52px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>Profile</div>
        <TierBadge tier="business" meta={tierMeta} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '0 20px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏢</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: PP.text3, marginTop: 4 }}>Business Account</div>
          </div>
        </div>

        <MenuCard items={[
          { icon: I.biz, label: 'Business Dashboard', badge: 'New', badgeColor: '#A78BFA', onClick: () => navigate('/business') },
          { icon: I.api, label: 'API Dashboard', badge: 'Active', badgeColor: PP.green, onClick: () => navigate('/developers') },
          { icon: I.nav, label: 'Delivery Analytics', onClick: () => {} },
        ]} />
        <MenuCard items={[
          { icon: I.save, label: 'Address Verification', onClick: () => {} },
          { icon: I.help, label: 'Help & Support', onClick: () => {} },
        ]} />
        <MenuCard items={[{ icon: I.logout, label: 'Sign Out', onClick: signOut, danger: true }]} />
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

// ── GOVERNMENT PROFILE ────────────────────────────────────────────────────────
function GovernmentProfile({ user, navigate, signOut, tierMeta }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: PP.bg, overflow: 'hidden' }}>
      <div style={{ padding: '52px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>Profile</div>
        <TierBadge tier="government" meta={tierMeta} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '0 20px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏛</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: PP.text3, marginTop: 4 }}>Government Account</div>
          </div>
        </div>

        <MenuCard items={[
          { icon: I.gov, label: 'Infrastructure Dashboard', badge: 'Live', badgeColor: '#34D399', onClick: () => navigate('/admin/government') },
          { icon: I.map, label: 'Coverage Analytics', onClick: () => navigate('/admin/government') },
          { icon: I.agent, label: 'Emergency Services', onClick: () => navigate('/emergency') },
        ]} />
        <MenuCard items={[
          { icon: I.help, label: 'Support', onClick: () => {} },
        ]} />
        <MenuCard items={[{ icon: I.logout, label: 'Sign Out', onClick: signOut, danger: true }]} />
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

// ── STANDARD LOGGED-IN PROFILE ────────────────────────────────────────────────
function AccountProfile({ user, navigate, signOut, tierMeta }) {
  const initial = (user?.name || 'U')[0].toUpperCase();
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: PP.bg, overflow: 'hidden' }}>
      <div style={{ padding: '52px 20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>Profile</div>
        <button onClick={() => navigate('/settings')} style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${PP.line}`, background: PP.card, color: PP.text2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{I.settings()}</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '0 20px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${PP.blue} 0%, #1E4EC0 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{initial}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{user?.name}</div>
            <div style={{ marginTop: 4 }}><TierBadge tier="account" meta={tierMeta} /></div>
            <div style={{ fontSize: 13, color: PP.text3, marginTop: 4 }}>{user?.phone}</div>
          </div>
        </div>

        <MenuCard items={[
          { icon: I.save, label: 'Saved Addresses', onClick: () => navigate('/saved') },
          { icon: I.map, label: 'Offline Maps', badge: 'Download', badgeColor: PP.green, onClick: () => {} },
          { icon: I.settings, label: 'Settings', onClick: () => navigate('/settings') },
        ]} />

        {/* Upgrade to Agent */}
        <div style={{ margin: '0 20px 14px', padding: '16px', background: PP.yellowSoft, borderRadius: 18, border: `1px solid rgba(255,199,44,0.18)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 24 }}>🛡</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: PP.yellow }}>Become an Agent</div>
              <div style={{ fontSize: 12, color: PP.text3, marginTop: 2 }}>Map locations & earn ₦50-₦250 per verification</div>
            </div>
            <button onClick={() => navigate('/agents')} style={{ padding: '8px 14px', borderRadius: 10, background: PP.yellow, color: '#0A0B0D', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Join</button>
          </div>
        </div>

        <MenuCard items={[
          { icon: I.ussd, label: 'USSD Access (*850#)', onClick: () => navigate('/ussd') },
          { icon: I.help, label: 'Help & Support', onClick: () => {} },
        ]} />
        <MenuCard items={[{ icon: I.logout, label: 'Sign Out', onClick: signOut, danger: true }]} />
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, tier, isGuest, tierMeta, signOut, mockSignIn } = useAuth();

  if (isGuest) return <GuestProfile navigate={navigate} mockSignIn={mockSignIn} />;
  if (tier === 'agent' || tier === 'admin') return <AgentProfile user={user} navigate={navigate} signOut={signOut} tierMeta={tierMeta} />;
  if (tier === 'business') return <BusinessProfile user={user} navigate={navigate} signOut={signOut} tierMeta={tierMeta} />;
  if (tier === 'government') return <GovernmentProfile user={user} navigate={navigate} signOut={signOut} tierMeta={tierMeta} />;
  return <AccountProfile user={user} navigate={navigate} signOut={signOut} tierMeta={tierMeta} />;
}
