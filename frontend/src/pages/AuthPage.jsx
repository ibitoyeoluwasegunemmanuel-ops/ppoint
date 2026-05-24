import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { PP } from '../styles/tokens';

// ── Icons ──────────────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.9 2.4 30.3 0 24 0 14.7 0 6.7 5.4 2.9 13.3l7.9 6.2C12.6 13.1 17.9 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h12.4c-.5 2.9-2.2 5.3-4.7 6.9l7.3 5.7c4.3-3.9 6.8-9.7 6.8-16.7h.3z"/>
      <path fill="#FBBC05" d="M10.8 28.5c-.6-1.6-.9-3.3-.9-5s.3-3.4.9-5l-7.9-6.2C1 15.5 0 19.6 0 24s1 8.5 2.9 11.7l7.9-7.2z"/>
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2.2 1.5-5 2.4-8.6 2.4-6.1 0-11.3-3.6-13.2-9l-7.9 6.2C6.7 42.6 14.7 48 24 48z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#000" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function NigeriaFlag() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" style={{ borderRadius: 2, flexShrink: 0 }} aria-hidden="true">
      <rect width="6.67" height="14" fill="#008751"/>
      <rect x="6.67" width="6.66" height="14" fill="#ffffff"/>
      <rect x="13.33" width="6.67" height="14" fill="#008751"/>
    </svg>
  );
}

function ArrowRight({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 13l4 4L19 7" stroke="#0A0B0D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── PPOINT Logo ────────────────────────────────────────────────────────────────
function PPLogo({ size = 80 }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: PP.yellow,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      boxShadow: `0 8px 32px rgba(255,199,44,0.28)`,
    }}>
      <span style={{
        fontSize: size * 0.45,
        fontWeight: 900,
        color: '#0A0B0D',
        fontFamily: PP.font,
        letterSpacing: -1,
        lineHeight: 1,
        userSelect: 'none',
      }}>P</span>
    </div>
  );
}

// ── Shared input style factory ────────────────────────────────────────────────
function inputStyle(focused) {
  return {
    width: '100%',
    padding: '15px 16px',
    background: PP.card,
    border: `1px solid ${focused ? PP.yellow : PP.line}`,
    borderRadius: 14,
    color: PP.text,
    fontFamily: PP.font,
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.18s',
    WebkitAppearance: 'none',
  };
}

// ── Step 1: Method ─────────────────────────────────────────────────────────────
function MethodStep({ onSendOTP, onGuest, onEnterCode }) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const handleSend = () => {
    const contact = phone.trim() || email.trim();
    onSendOTP(contact);
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: PP.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '0 24px 48px',
      fontFamily: PP.font,
    }}>
      {/* Logo + tagline */}
      <div style={{
        paddingTop: 72,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        marginBottom: 48,
      }}>
        <PPLogo size={80} />
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 30,
            fontWeight: 900,
            color: PP.text,
            letterSpacing: -0.8,
            lineHeight: 1.1,
          }}>PPOINT</div>
          <div style={{
            fontSize: 13,
            color: PP.text3,
            marginTop: 6,
            fontWeight: 500,
            letterSpacing: 0.2,
          }}>Africa's Address Infrastructure</div>
        </div>
      </div>

      {/* Auth options */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Google */}
        <button
          onClick={handleSend}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            padding: '14px 20px',
            background: '#FFFFFF',
            borderRadius: 14,
            border: 'none',
            cursor: 'pointer',
            fontFamily: PP.font,
            fontWeight: 600,
            fontSize: 15,
            color: '#111111',
            transition: 'opacity 0.15s',
          }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Apple */}
        <button
          onClick={handleSend}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            padding: '14px 20px',
            background: '#FFFFFF',
            borderRadius: 14,
            border: 'none',
            cursor: 'pointer',
            fontFamily: PP.font,
            fontWeight: 600,
            fontSize: 15,
            color: '#111111',
            transition: 'opacity 0.15s',
          }}
        >
          <AppleIcon />
          Continue with Apple
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
          <div style={{ flex: 1, height: 1, background: PP.line }} />
          <span style={{ fontSize: 12, color: PP.text3, fontWeight: 600, letterSpacing: 0.4 }}>or</span>
          <div style={{ flex: 1, height: 1, background: PP.line }} />
        </div>

        {/* Phone number input */}
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            pointerEvents: 'none',
            zIndex: 1,
          }}>
            <NigeriaFlag />
            <span style={{ fontSize: 14, color: PP.text2, fontWeight: 600 }}>+234</span>
            <div style={{ width: 1, height: 16, background: PP.lineStrong || 'rgba(255,255,255,0.1)' }} />
          </div>
          <input
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => setPhoneFocused(false)}
            style={{
              ...inputStyle(phoneFocused),
              paddingLeft: 88,
            }}
          />
        </div>

        {/* Email input */}
        <input
          type="email"
          placeholder="or Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onFocus={() => setEmailFocused(true)}
          onBlur={() => setEmailFocused(false)}
          style={inputStyle(emailFocused)}
        />

        {/* Send OTP CTA */}
        <button
          onClick={handleSend}
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
            marginTop: 4,
            letterSpacing: -0.1,
            transition: 'opacity 0.15s',
          }}
        >
          Send OTP
        </button>

        {/* Enter code link */}
        <button
          onClick={onEnterCode}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: PP.text3,
            fontFamily: PP.font,
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 0',
          }}
        >
          Already have a code? Enter it <ArrowRight />
        </button>
      </div>

      {/* Guest CTA — pushed to bottom */}
      <div style={{ marginTop: 'auto', paddingTop: 32, display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={onGuest}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: PP.text3,
            fontFamily: PP.font,
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Continue as Guest <ArrowRight />
        </button>
      </div>
    </div>
  );
}

// ── Step 2: OTP ────────────────────────────────────────────────────────────────
function OTPStep({ contact, onVerify }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [focused, setFocused] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleDigit = useCallback((index, value) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (char && index === 5) {
      const code = next.join('');
      if (code.length === 6) {
        setTimeout(() => onVerify(code), 80);
      }
    }
  }, [digits, onVerify]);

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  }, [digits]);

  // Handle paste of full 6-digit code
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
    if (pasted.length === 6) {
      setTimeout(() => onVerify(pasted), 80);
    }
  }, [onVerify]);

  const handleResend = () => {
    setCountdown(30);
    setCanResend(false);
    setDigits(['', '', '', '', '', '']);
    setTimeout(() => inputRefs.current[0]?.focus(), 50);
  };

  const displayContact = contact
    ? (contact.includes('@') ? contact : `+234 ${contact.replace(/^0/, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}`)
    : '+234 XXX XXX XXXX';

  const code = digits.join('');
  const isComplete = code.length === 6;

  return (
    <div style={{
      minHeight: '100dvh',
      background: PP.bg,
      display: 'flex',
      flexDirection: 'column',
      padding: '0 24px 80px',
      fontFamily: PP.font,
    }}>
      {/* Small logo */}
      <div style={{ paddingTop: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 44 }}>
        <PPLogo size={52} />
      </div>

      <div style={{
        fontSize: 26,
        fontWeight: 800,
        color: PP.text,
        letterSpacing: -0.5,
        marginBottom: 8,
        lineHeight: 1.2,
      }}>
        Enter the 6-digit code
      </div>
      <div style={{ color: PP.text3, fontSize: 14, marginBottom: 36, lineHeight: 1.6 }}>
        Sent to{' '}
        <span style={{ color: PP.text2, fontWeight: 600 }}>{displayContact}</span>
      </div>

      {/* 6 digit boxes */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleDigit(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onFocus={() => setFocused(i)}
            onBlur={() => setFocused(null)}
            onPaste={handlePaste}
            style={{
              width: 48,
              height: 56,
              flex: 1,
              background: PP.card,
              border: `1.5px solid ${focused === i ? PP.yellow : (d ? (PP.lineStrong || 'rgba(255,255,255,0.1)') : PP.line)}`,
              borderRadius: 14,
              color: PP.text,
              fontSize: 22,
              fontWeight: 700,
              textAlign: 'center',
              fontFamily: PP.mono,
              outline: 'none',
              caretColor: PP.yellow,
              transition: 'border-color 0.15s',
              WebkitAppearance: 'none',
            }}
          />
        ))}
      </div>

      {/* Resend */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        {canResend ? (
          <button
            onClick={handleResend}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: PP.yellow,
              fontFamily: PP.font,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Resend code
          </button>
        ) : (
          <span style={{ color: PP.text3, fontSize: 13 }}>
            Resend in{' '}
            <span style={{ color: PP.text2, fontWeight: 600, fontFamily: PP.mono }}>{countdown}s</span>
          </span>
        )}
      </div>

      {/* Verify button */}
      <button
        onClick={() => onVerify(code)}
        disabled={!isComplete}
        style={{
          width: '100%',
          height: 52,
          background: isComplete ? PP.yellow : 'rgba(255,199,44,0.15)',
          borderRadius: 14,
          border: 'none',
          color: isComplete ? '#0A0B0D' : PP.text3,
          fontFamily: PP.font,
          fontWeight: 700,
          fontSize: 16,
          cursor: isComplete ? 'pointer' : 'not-allowed',
          transition: 'all 0.18s',
          letterSpacing: -0.1,
        }}
      >
        Verify
      </button>
    </div>
  );
}

// ── Step 3: Account Type ───────────────────────────────────────────────────────
const TIERS = [
  {
    id: 'account',
    emoji: '🏠',
    title: 'Personal',
    desc: 'Find and share addresses, navigate',
  },
  {
    id: 'agent',
    emoji: '🛡',
    title: 'Agent',
    desc: 'Map locations and earn ₦50-₦250 per address',
  },
  {
    id: 'business',
    emoji: '🏢',
    title: 'Business',
    desc: 'Verify deliveries and integrate address APIs',
  },
  {
    id: 'government',
    emoji: '🏛',
    title: 'Government',
    desc: 'Infrastructure monitoring and emergency services',
  },
  {
    id: 'developer',
    emoji: '👨‍💻',
    title: 'Developer',
    desc: "Build on Africa's address API platform",
  },
];

function AccountTypeStep({ onGetStarted }) {
  const [selected, setSelected] = useState('account');

  return (
    <div style={{
      minHeight: '100dvh',
      background: PP.bg,
      display: 'flex',
      flexDirection: 'column',
      padding: '0 24px 80px',
      fontFamily: PP.font,
    }}>
      {/* Small logo */}
      <div style={{ paddingTop: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
        <PPLogo size={52} />
      </div>

      <div style={{
        fontSize: 26,
        fontWeight: 800,
        color: PP.text,
        letterSpacing: -0.5,
        marginBottom: 6,
        lineHeight: 1.2,
      }}>
        What brings you to PPOINT?
      </div>
      <div style={{ color: PP.text3, fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>
        Choose your experience. You can change this later.
      </div>

      {/* Tier option cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
        {TIERS.map(tier => {
          const isSelected = selected === tier.id;
          return (
            <button
              key={tier.id}
              onClick={() => setSelected(tier.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px 18px',
                background: isSelected ? 'rgba(255,199,44,0.07)' : PP.card,
                border: `1.5px solid ${isSelected ? PP.yellow : PP.line}`,
                borderRadius: 16,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 26, flexShrink: 0, lineHeight: 1 }}>{tier.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: isSelected ? PP.yellow : PP.text,
                  fontFamily: PP.font,
                  transition: 'color 0.15s',
                }}>
                  {tier.title}
                </div>
                <div style={{
                  fontSize: 13,
                  color: PP.text3,
                  marginTop: 3,
                  fontFamily: PP.font,
                  lineHeight: 1.4,
                }}>
                  {tier.desc}
                </div>
              </div>
              {isSelected && (
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: PP.yellow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <CheckIcon />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Get Started CTA */}
      <button
        onClick={() => onGetStarted(selected)}
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
        }}
      >
        Get Started <ArrowRight />
      </button>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [step, setStep] = useState('method'); // 'method' | 'otp' | 'account-type'
  const [contact, setContact] = useState('');

  const handleSendOTP = (value = '') => {
    setContact(value);
    setStep('otp');
  };

  const handleVerify = (_code) => {
    // In production this would validate the OTP; here we advance to account type
    setStep('account-type');
  };

  const handleGetStarted = (tier) => {
    signIn({
      id: Date.now().toString(),
      name: 'New User',
      tier,
      joined: new Date().toISOString(),
    });
    navigate('/');
  };

  const handleGuest = () => {
    navigate('/');
  };

  const handleEnterCode = () => {
    setStep('otp');
  };

  return (
    <div style={{ background: PP.bg, minHeight: '100dvh' }}>
      {step === 'method' && (
        <MethodStep
          onSendOTP={handleSendOTP}
          onGuest={handleGuest}
          onEnterCode={handleEnterCode}
        />
      )}
      {step === 'otp' && (
        <OTPStep
          contact={contact}
          onVerify={handleVerify}
        />
      )}
      {step === 'account-type' && (
        <AccountTypeStep onGetStarted={handleGetStarted} />
      )}
    </div>
  );
}
