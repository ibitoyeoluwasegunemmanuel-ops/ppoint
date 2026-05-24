import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PP } from '../styles/tokens';

// ── Mock Data ─────────────────────────────────────────────────────────────────
const recent = [
  { code: 'PP-LAG-IKD-4821', name: 'Home - Ikeja', type: 'House', time: '2 hours ago' },
  { code: 'PP-LAG-VI-2901', name: 'Work Office', type: 'Office', time: 'Yesterday' },
  { code: 'PP-ABJ-GRA-1203', name: "Mum's Place", type: 'House', time: '3 days ago' },
];

const saved = [
  { code: 'PP-LAG-IKD-4821', name: 'Home', emoji: '🏠', color: '#FFC72C', added: 'Jan 12, 2025' },
  { code: 'PP-LAG-VI-2901', name: 'Work', emoji: '💼', color: '#3B82F6', added: 'Jan 8, 2025' },
  { code: 'PP-ABJ-GRA-1203', name: "Mum's House", emoji: '❤️', color: '#EF4444', added: 'Dec 28, 2024' },
];

const activity = [
  { type: 'navigated', label: 'Navigated to PP-LAG-IKD-4821', time: '2h ago', code: 'PP-LAG-IKD-4821' },
  { type: 'generated', label: 'Generated PP-LAG-VI-2200', time: 'Yesterday', code: 'PP-LAG-VI-2200' },
  { type: 'shared', label: 'Shared PP-ABJ-GRA-1203 via WhatsApp', time: '3 days ago', code: 'PP-ABJ-GRA-1203' },
  { type: 'verified', label: 'Verified 5 addresses in Ikeja', time: 'Last week', code: null },
  { type: 'navigated', label: 'Navigated to PP-LAG-YBA-5678', time: 'Last week', code: 'PP-LAG-YBA-5678' },
  { type: 'generated', label: 'Generated PP-KAN-MUN-0091', time: '2 weeks ago', code: 'PP-KAN-MUN-0091' },
];

const collections = [
  { emoji: '🏠', name: 'Family Homes', count: 4, updated: '2 days ago' },
  { emoji: '🏢', name: 'Work Locations', count: 7, updated: 'Last week' },
  { emoji: '🛒', name: 'Shopping', count: 2, updated: '2 weeks ago' },
  { emoji: '🚑', name: 'Medical', count: 3, updated: 'Last month' },
];

// ── Activity type colors ───────────────────────────────────────────────────────
const activityColors = {
  navigated: '#3B82F6',
  generated: '#FFC72C',
  shared: '#34D399',
  verified: '#A78BFA',
};

const activityIcons = {
  navigated: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M3 11L21 4l-7 17-2-7-9-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  generated: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  shared: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 11l7-4M8.5 13l7 4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  verified: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5l5 5 9-11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// ── Icon SVGs ─────────────────────────────────────────────────────────────────
const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
    <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

// ── Reusable CodeChip ─────────────────────────────────────────────────────────
function CodeChip({ code, small }) {
  if (!code) return null;
  const parts = code.split('-');
  return (
    <span style={{ fontFamily: PP.mono, fontWeight: 700, fontSize: small ? 10 : 11, letterSpacing: 0.3 }}>
      {parts.map((p, i) => (
        <span key={i}>
          <span style={{ color: i === parts.length - 1 ? '#FFC72C' : '#FFFFFF' }}>{p}</span>
          {i < parts.length - 1 && <span style={{ color: 'rgba(255,255,255,0.40)' }}>-</span>}
        </span>
      ))}
    </span>
  );
}

// ── Sections ──────────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.40)',
      letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function RecentRow() {
  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Recently Visited</SectionLabel>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {recent.map((r, i) => (
          <div key={i} style={{
            minWidth: 160, width: 160, height: 100,
            background: '#13141A', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '12px 14px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div>
              <CodeChip code={r.code} small />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', marginBottom: 2 }}>
                {r.type === 'House' ? '🏠' : '🏢'} {r.name}
              </div>
              <div style={{ fontSize: 11, color: '#A1A1A6' }}>{r.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SavedList({ detailed }) {
  const navigate = useNavigate();
  return (
    <div style={{ marginBottom: 28 }}>
      {!detailed && <SectionLabel>Saved Places</SectionLabel>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {saved.map((s, i) => (
          <div key={i} style={{
            background: '#13141A', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: s.color + '22', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 20,
            }}>
              {s.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 3 }}>{s.name}</div>
              <CodeChip code={s.code} small />
              {detailed && (
                <div style={{ fontSize: 11, color: '#A1A1A6', marginTop: 3 }}>Added {s.added}</div>
              )}
            </div>
            <button
              onClick={() => navigate(`/drivers?code=${s.code}`)}
              style={{
                width: 34, height: 34, borderRadius: 10, border: 'none',
                background: 'rgba(255,255,255,0.06)', color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <ArrowIcon />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityFeed({ items }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Activity Feed</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {items.map((a, i) => {
          const color = activityColors[a.type] || '#A1A1A6';
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              paddingBottom: 16,
              borderLeft: `2px solid ${color}33`,
              paddingLeft: 14,
              marginLeft: 6,
            }}>
              {/* Dot */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: color + '22', color: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginLeft: -21,
              }}>
                {activityIcons[a.type]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', marginBottom: 4, lineHeight: 1.3 }}>
                  {a.label}
                </div>
                {a.code && (
                  <div style={{ marginBottom: 4 }}>
                    <span style={{
                      background: '#FFC72C18', border: '1px solid #FFC72C33',
                      borderRadius: 6, padding: '2px 6px', display: 'inline-block',
                    }}>
                      <CodeChip code={a.code} small />
                    </span>
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#A1A1A6' }}>{a.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CollectionsGrid({ showCreate }) {
  return (
    <div style={{ marginBottom: 28 }}>
      {!showCreate && <SectionLabel>Collections</SectionLabel>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: showCreate ? 16 : 0 }}>
        {collections.map((c, i) => (
          <div key={i} style={{
            background: '#13141A', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '16px',
            display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer',
          }}>
            <div style={{ fontSize: 28 }}>{c.emoji}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginBottom: 3 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: '#A1A1A6' }}>{c.count} places</div>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)' }}>{c.updated}</div>
          </div>
        ))}
      </div>
      {showCreate && (
        <button style={{
          width: '100%', height: 48, borderRadius: 14,
          border: '1.5px dashed rgba(255,255,255,0.15)',
          background: 'transparent', color: '#A1A1A6',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: PP.font,
        }}>
          <PlusIcon /> Create Collection
        </button>
      )}
    </div>
  );
}

// ── Guest lock screen ─────────────────────────────────────────────────────────
function GuestScreen({ onContinue }) {
  const navigate = useNavigate();
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 32px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 64, marginBottom: 20, opacity: 0.5 }}>🔒</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', marginBottom: 10, letterSpacing: -0.3 }}>
        Save your places
      </div>
      <div style={{ fontSize: 14, color: '#A1A1A6', lineHeight: 1.6, marginBottom: 32, maxWidth: 280 }}>
        Sign in to save addresses, sync across devices, and build your location library.
      </div>
      <button
        onClick={() => navigate('/auth')}
        style={{
          width: '100%', maxWidth: 280, height: 50, borderRadius: 14, border: 'none',
          background: '#FFC72C', color: '#0A0B0D',
          fontSize: 15, fontWeight: 800, fontFamily: PP.font, cursor: 'pointer',
          marginBottom: 16,
        }}
      >
        Sign In
      </button>
      <button
        onClick={onContinue}
        style={{
          background: 'none', border: 'none', color: '#A1A1A6',
          fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: PP.font,
          padding: '8px 16px',
        }}
      >
        Continue as Guest
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const TABS = ['All', 'Saved', 'Recent', 'Collections'];

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [guestContinued, setGuestContinued] = useState(false);

  const user = localStorage.getItem('ppoint_user');
  const isGuest = !user && !guestContinued;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: '#0A0B0D', overflow: 'hidden',
      fontFamily: PP.font,
    }}>
      {/* Header */}
      <div style={{
        padding: '52px 20px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.3 }}>Library</div>
        <button style={{
          width: 38, height: 38, borderRadius: 12, border: 'none',
          background: '#13141A', color: '#FFFFFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <FilterIcon />
        </button>
      </div>

      {/* Tab pills (scrollable) */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto',
        padding: '0 20px 14px', scrollbarWidth: 'none',
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 18px', borderRadius: 20, border: 'none',
              background: activeTab === tab ? '#FFC72C' : '#13141A',
              color: activeTab === tab ? '#0A0B0D' : '#A1A1A6',
              fontSize: 13, fontWeight: 700, fontFamily: PP.font,
              whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#13141A', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '0 14px', height: 46,
        }}>
          <span style={{ color: '#A1A1A6', flexShrink: 0 }}><SearchIcon /></span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search places, codes..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: '#FFFFFF', fontSize: 14, fontFamily: PP.font,
            }}
          />
        </div>
      </div>

      {/* Content */}
      {isGuest ? (
        <GuestScreen onContinue={() => setGuestContinued(true)} />
      ) : (
        <div style={{
          flex: 1, overflowY: 'auto', padding: '4px 20px 20px',
        }}>
          {/* ALL tab */}
          {activeTab === 'All' && (
            <>
              <RecentRow />
              <SavedList detailed={false} />
              <ActivityFeed items={activity.slice(0, 4)} />
              <CollectionsGrid showCreate={false} />
            </>
          )}

          {/* SAVED tab */}
          {activeTab === 'Saved' && (
            <>
              <SectionLabel>Your Saved Places</SectionLabel>
              <SavedList detailed />
            </>
          )}

          {/* RECENT tab */}
          {activeTab === 'Recent' && (
            <ActivityFeed items={activity} />
          )}

          {/* COLLECTIONS tab */}
          {activeTab === 'Collections' && (
            <CollectionsGrid showCreate />
          )}
        </div>
      )}
    </div>
  );
}
