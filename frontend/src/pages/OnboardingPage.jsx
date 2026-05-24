import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PP } from '../styles/tokens';

// ── CSS-only illustrations ─────────────────────────────────────────────────────

/** Screen 1: Map with colored location pins */
function MapIllustration() {
  const pins = [
    { top: '22%', left: '28%', color: PP.yellow, size: 10 },
    { top: '38%', left: '55%', color: PP.green, size: 8 },
    { top: '55%', left: '35%', color: '#2E6BFF', size: 9 },
    { top: '30%', left: '70%', color: PP.yellow, size: 7 },
    { top: '62%', left: '62%', color: '#E5484D', size: 8 },
    { top: '48%', left: '20%', color: PP.green, size: 7 },
    { top: '70%', left: '45%', color: PP.yellow, size: 9 },
    { top: '18%', left: '48%', color: '#2E6BFF', size: 6 },
  ];

  const roads = [
    { top: '40%', left: 0, width: '100%', rotate: 0, opacity: 0.18 },
    { top: '60%', left: 0, width: '100%', rotate: 0, opacity: 0.12 },
    { top: 0, left: '35%', width: '2px', height: '100%', rotate: 0, opacity: 0.15, vertical: true },
    { top: 0, left: '65%', width: '2px', height: '100%', rotate: 0, opacity: 0.1, vertical: true },
    { top: '20%', left: '10%', width: '50%', rotate: -8, opacity: 0.09 },
    { top: '55%', left: '30%', width: '60%', rotate: 6, opacity: 0.08 },
  ];

  return (
    <div style={{
      width: '100%',
      height: 220,
      background: `linear-gradient(145deg, #0E1016 0%, #131720 50%, #0A0D13 100%)`,
      borderRadius: 24,
      border: `1px solid ${PP.line}`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Grid lines simulating map tiles */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
      }} />

      {/* Road lines */}
      {roads.map((r, i) =>
        r.vertical ? (
          <div key={i} style={{
            position: 'absolute',
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
            background: `rgba(255,255,255,${r.opacity})`,
          }} />
        ) : (
          <div key={i} style={{
            position: 'absolute',
            top: r.top,
            left: r.left,
            width: r.width,
            height: 2,
            background: `rgba(255,255,255,${r.opacity})`,
            transform: `rotate(${r.rotate}deg)`,
            transformOrigin: 'left center',
          }} />
        )
      )}

      {/* Location pins */}
      {pins.map((pin, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: pin.top,
          left: pin.left,
          transform: 'translate(-50%, -100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          filter: `drop-shadow(0 2px 8px ${pin.color}66)`,
          animation: `pin-float ${1.8 + i * 0.35}s ease-in-out infinite`,
          animationDelay: `${i * 0.2}s`,
        }}>
          <div style={{
            width: pin.size + 6,
            height: pin.size + 6,
            borderRadius: '50% 50% 50% 0',
            background: pin.color,
            transform: 'rotate(-45deg)',
            boxShadow: `0 2px 12px ${pin.color}55`,
          }} />
          <div style={{
            width: pin.size * 0.4,
            height: 4,
            background: `${pin.color}44`,
            borderRadius: 2,
            marginTop: 2,
          }} />
        </div>
      ))}

      {/* Center glow */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(255,199,44,0.12) 0%, transparent 70%)`,
      }} />

      {/* PPOINT code chip floating */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        background: 'rgba(10,11,13,0.82)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${PP.line}`,
        borderRadius: 10,
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: PP.green, boxShadow: `0 0 6px ${PP.green}` }} />
        <span style={{ fontFamily: PP.mono, fontSize: 11, fontWeight: 700, color: PP.text2, letterSpacing: 0.5 }}>PP-LAG-IKD-4821</span>
      </div>
    </div>
  );
}

/** Screen 2: Phone with animated dropping pin */
function PhoneIllustration() {
  return (
    <div style={{
      width: '100%',
      height: 220,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}>
      {/* Phone body */}
      <div style={{
        width: 120,
        height: 200,
        borderRadius: 22,
        background: `linear-gradient(160deg, #1A1D24 0%, #0E1016 100%)`,
        border: `2px solid rgba(255,255,255,0.12)`,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Screen top bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 28,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ width: 28, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Map area inside phone */}
        <div style={{
          position: 'absolute',
          top: 28,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, #0E1521 0%, #111820 100%)`,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '16px 16px',
          overflow: 'hidden',
        }}>
          {/* Ripple rings at drop point */}
          {[1, 2, 3].map(n => (
            <div key={n} style={{
              position: 'absolute',
              top: '45%',
              left: '50%',
              width: n * 22,
              height: n * 22,
              borderRadius: '50%',
              border: `1.5px solid rgba(255,199,44,${0.35 - n * 0.1})`,
              transform: 'translate(-50%, -50%)',
              animation: `ripple-out ${1.2 + n * 0.25}s ease-out infinite`,
              animationDelay: `${n * 0.2}s`,
            }} />
          ))}

          {/* Dropping pin */}
          <div style={{
            position: 'absolute',
            top: '28%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: 'pin-drop 1.4s cubic-bezier(0.34,1.56,0.64,1) infinite',
          }}>
            <div style={{
              width: 18,
              height: 18,
              borderRadius: '50% 50% 50% 0',
              background: PP.yellow,
              transform: 'rotate(-45deg)',
              boxShadow: `0 4px 16px rgba(255,199,44,0.5)`,
            }} />
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: `rgba(255,199,44,0.3)`,
              marginTop: 1,
            }} />
          </div>
        </div>
      </div>

      {/* Floating "30s" badge */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: '12%',
        background: PP.yellow,
        borderRadius: 12,
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'baseline',
        gap: 2,
        boxShadow: `0 8px 24px rgba(255,199,44,0.3)`,
        animation: 'float-badge 2s ease-in-out infinite',
      }}>
        <span style={{ fontFamily: PP.mono, fontWeight: 900, fontSize: 18, color: '#0A0B0D' }}>30</span>
        <span style={{ fontFamily: PP.font, fontWeight: 700, fontSize: 10, color: '#0A0B0D' }}>s</span>
      </div>
    </div>
  );
}

/** Screen 3: Chat bubble UI with PPOINT code */
function ChatIllustration() {
  return (
    <div style={{
      width: '100%',
      height: 220,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      position: 'relative',
      padding: '0 20px',
    }}>
      {/* WhatsApp-style received bubble */}
      <div style={{
        alignSelf: 'flex-start',
        background: '#1F2C34',
        borderRadius: '4px 16px 16px 16px',
        padding: '10px 14px',
        maxWidth: '75%',
        animation: 'slide-up-in 0.4s ease-out both',
      }}>
        <div style={{ fontSize: 12, color: '#A1A1A6', marginBottom: 4 }}>Delivery driver</div>
        <div style={{ fontSize: 13, color: '#E9EBE4', lineHeight: 1.4 }}>
          Please send your PPOINT address
        </div>
        <div style={{ fontSize: 10, color: '#8696A0', marginTop: 4, textAlign: 'right' }}>10:24</div>
      </div>

      {/* Sent bubble with code */}
      <div style={{
        alignSelf: 'flex-end',
        background: '#005C4B',
        borderRadius: '16px 4px 16px 16px',
        padding: '10px 14px',
        maxWidth: '80%',
        animation: 'slide-up-in 0.4s ease-out 0.2s both',
      }}>
        <div style={{ fontSize: 13, color: '#E9EBE4', marginBottom: 6, lineHeight: 1.4 }}>
          Here's my address 📍
        </div>
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          borderRadius: 8,
          padding: '6px 10px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: PP.yellow, flexShrink: 0 }} />
          <span style={{ fontFamily: PP.mono, fontSize: 13, fontWeight: 700, color: PP.yellow, letterSpacing: 0.8 }}>
            PP-LAG-IKD-4821
          </span>
        </div>
        <div style={{ fontSize: 10, color: '#8696A0', marginTop: 4, textAlign: 'right' }}>10:25 ✓✓</div>
      </div>

      {/* USSD / SMS badge */}
      <div style={{
        alignSelf: 'center',
        display: 'flex',
        gap: 8,
        marginTop: 4,
        animation: 'slide-up-in 0.4s ease-out 0.35s both',
      }}>
        {['WhatsApp', 'SMS', '*850# USSD', 'QR'].map(label => (
          <div key={label} style={{
            background: PP.card,
            border: `1px solid ${PP.line}`,
            borderRadius: 20,
            padding: '4px 9px',
            fontSize: 10,
            fontWeight: 600,
            color: PP.text3,
            fontFamily: PP.font,
          }}>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Dot indicator ──────────────────────────────────────────────────────────────
function DotIndicators({ total, active }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === active ? 22 : 7,
          height: 7,
          borderRadius: 4,
          background: i === active ? PP.yellow : 'rgba(255,255,255,0.18)',
          transition: 'all 0.3s cubic-bezier(0.34,1.2,0.64,1)',
        }} />
      ))}
    </div>
  );
}

// ── Screen data ────────────────────────────────────────────────────────────────
const SCREENS = [
  {
    id: 'welcome',
    Illustration: MapIllustration,
    heading: 'Your address, everywhere in Africa',
    subtext: 'Generate a unique PPOINT code for any location. Works with any delivery, navigation, or emergency service.',
    cta: 'Next',
  },
  {
    id: 'generate',
    Illustration: PhoneIllustration,
    heading: 'Generate in 30 seconds',
    subtext: 'Stand at your entrance. Drop a pin. Choose your place type. Get a shareable code instantly.',
    cta: 'Next',
  },
  {
    id: 'share',
    Illustration: ChatIllustration,
    heading: 'Share with anyone, works offline too',
    subtext: 'Works via WhatsApp, SMS, *850# USSD, or QR code. No internet required for delivery drivers.',
    cta: 'Get Started',
  },
];

// ── Root component ─────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [exiting, setExiting] = useState(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const containerRef = useRef(null);

  // Advance to next screen with slide animation
  const goNext = useCallback(() => {
    if (exiting) return;
    if (current < SCREENS.length - 1) {
      setExiting(true);
      setTimeout(() => {
        setCurrent(c => c + 1);
        setExiting(false);
      }, 280);
    } else {
      localStorage.setItem('ppoint_onboarded', 'true');
      navigate('/auth');
    }
  }, [current, exiting, navigate]);

  const handleSkip = () => {
    localStorage.setItem('ppoint_onboarded', 'true');
    navigate('/auth');
  };

  // Swipe gesture support
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    // Only swipe horizontally (not a scroll)
    if (Math.abs(dx) > 50 && dy < 60) {
      if (dx > 0) {
        goNext(); // swipe left = next
      } else if (current > 0) {
        setCurrent(c => c - 1); // swipe right = back
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [current, goNext]);

  const screen = SCREENS[current];
  const { Illustration } = screen;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        minHeight: '100dvh',
        background: PP.bg,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: PP.font,
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Skip button — top right */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 20,
        padding: '52px 24px 0',
      }}>
        <button
          onClick={handleSkip}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: PP.text3,
            fontFamily: PP.font,
            fontSize: 14,
            fontWeight: 600,
            padding: '4px 0',
          }}
        >
          Skip
        </button>
      </div>

      {/* Sliding content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '52px 24px 0',
          opacity: exiting ? 0 : 1,
          transform: exiting ? 'translateX(-32px)' : 'translateX(0)',
          transition: 'opacity 0.28s ease, transform 0.28s ease',
          willChange: 'opacity, transform',
        }}
      >
        {/* PPOINT wordmark */}
        <div style={{
          fontSize: 26,
          fontWeight: 900,
          color: PP.yellow,
          letterSpacing: -0.8,
          marginBottom: 28,
          lineHeight: 1,
        }}>
          PPOINT
        </div>

        {/* CSS illustration */}
        <div style={{ marginBottom: 32 }}>
          <Illustration key={screen.id} />
        </div>

        {/* Dot indicators */}
        <div style={{ marginBottom: 28 }}>
          <DotIndicators total={SCREENS.length} active={current} />
        </div>

        {/* Heading */}
        <div style={{
          fontSize: 26,
          fontWeight: 800,
          color: PP.text,
          letterSpacing: -0.6,
          lineHeight: 1.25,
          marginBottom: 12,
        }}>
          {screen.heading}
        </div>

        {/* Subtext */}
        <div style={{
          fontSize: 15,
          color: PP.text3,
          lineHeight: 1.65,
          fontWeight: 400,
          maxWidth: 340,
        }}>
          {screen.subtext}
        </div>
      </div>

      {/* Bottom CTA — fixed safe area */}
      <div style={{
        padding: '24px 24px 80px',
        flexShrink: 0,
      }}>
        <button
          onClick={goNext}
          style={{
            width: '100%',
            height: 52,
            background: PP.yellow,
            borderRadius: 14,
            border: 'none',
            color: '#0A0B0D',
            fontFamily: PP.font,
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            letterSpacing: -0.1,
            boxShadow: `0 8px 32px rgba(255,199,44,0.22)`,
            transition: 'opacity 0.15s',
          }}
        >
          {screen.cta}
          {current < SCREENS.length - 1 && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>

      {/* Global animation keyframes */}
      <style>{`
        @keyframes pin-float {
          0%, 100% { transform: translate(-50%, -100%) translateY(0); }
          50% { transform: translate(-50%, -100%) translateY(-6px); }
        }
        @keyframes pin-drop {
          0%   { transform: translateX(-50%) translateY(-28px); opacity: 0; }
          30%  { opacity: 1; }
          55%  { transform: translateX(-50%) translateY(0); }
          70%  { transform: translateX(-50%) translateY(-6px); }
          82%  { transform: translateX(-50%) translateY(0); }
          90%  { transform: translateX(-50%) translateY(-2px); }
          100% { transform: translateX(-50%) translateY(0); }
        }
        @keyframes ripple-out {
          0%   { opacity: 0.7; transform: translate(-50%, -50%) scale(0.4); }
          100% { opacity: 0;   transform: translate(-50%, -50%) scale(1.6); }
        }
        @keyframes float-badge {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes slide-up-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
