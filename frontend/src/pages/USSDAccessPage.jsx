import { useNavigate } from 'react-router-dom';
import { PP } from '../styles/tokens';

const I = {
  back: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  phone: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M9 21h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  message: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l5 5 9-11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  copy: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.8"/></svg>,
};

export default function USSDAccessPage() {
  const navigate = useNavigate();

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const carriers = [
    { name: 'MTN', code: '*450#', primary: true },
    { name: 'Airtel', code: '*450#', primary: true },
    { name: '9mobile', code: '*450#', primary: true },
    { name: 'Glo', code: '*450#', primary: true },
  ];

  const commands = [
    {
      title: 'Generate PPOINNT Code',
      steps: [
        'Dial *850#',
        'Press 1 for "Generate PPOINNT"',
        'Send your GPS coordinates',
        'Receive your code via SMS',
      ],
      example: '*850*1*6.5244*3.3792#',
      icon: I.phone,
    },
    {
      title: 'Search PPOINNT Code',
      steps: [
        'Dial *850#',
        'Press 2 for "Search"',
        'Enter the PPOINNT code',
        'Get location details',
      ],
      example: '*850*2*PPT-NG-LAG-IKD-1234#',
      icon: I.phone,
    },
    {
      title: 'SMS Commands',
      steps: [
        'Text to 850',
        'Use command + coordinates',
        'Get instant SMS reply',
        'Save & share code',
      ],
      example: 'ADDR 6.5244 3.3792',
      icon: I.message,
    },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: PP.bg, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '52px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${PP.line}` }}>
        <button onClick={() => navigate(-1)} style={{
          width: 38, height: 38, borderRadius: 12, border: 'none',
          background: PP.card, color: PP.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>{I.back()}</button>
        <div style={{ fontSize: 18, fontWeight: 800 }}>USSD + SMS Access</div>
        <div style={{ width: 38 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {/* Intro */}
        <div style={{
          background: `linear-gradient(135deg, ${PP.blue}, rgba(46,107,255,0.1))`,
          borderRadius: 18, padding: '20px', marginBottom: 20,
          border: `1px solid ${PP.blue}33`,
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 32 }}>📱</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>No Internet? No Problem.</div>
              <div style={{ fontSize: 12, color: PP.text3, lineHeight: 1.6 }}>
                Access PPOINNT on any phone via USSD or SMS. Generate, search, and share addresses without internet.
              </div>
            </div>
          </div>
        </div>

        {/* Main Methods */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginBottom: 20 }}>
          {commands.map((cmd, idx) => (
            <div key={idx} style={{
              background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 16,
              padding: '16px', overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, background: PP.yellowSoft,
                  color: PP.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>{cmd.icon()}</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{cmd.title}</div>
              </div>

              <div style={{ marginBottom: 14 }}>
                {cmd.steps.map((step, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    padding: '8px 0', borderBottom: i < cmd.steps.length - 1 ? `1px solid ${PP.line}` : 'none',
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 6, background: PP.yellowSoft,
                      color: '#0A0B0D', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>{i + 1}</div>
                    <div style={{ fontSize: 12, color: PP.text2, paddingTop: 2 }}>{step}</div>
                  </div>
                ))}
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 10,
                fontFamily: PP.mono, fontSize: 12, fontWeight: 600, color: PP.yellow,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                {cmd.example}
                <button onClick={() => copyToClipboard(cmd.example)} style={{
                  background: 'none', border: 'none', color: PP.text3, cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                }}>{I.copy()}</button>
              </div>
            </div>
          ))}
        </div>

        {/* SMS Commands Reference */}
        <div style={{
          background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 16,
          padding: '16px', marginBottom: 20,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: PP.text3, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>SMS Commands (Text to 850)</div>

          {[
            { cmd: 'ADDR 6.5244 3.3792', desc: 'Generate address at coordinates' },
            { cmd: 'FIND PPT-NG-LAG-IKD-1234', desc: 'Search for an address' },
            { cmd: 'HELP', desc: 'Get command list' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '10px 0', borderBottom: i < 2 ? `1px solid ${PP.line}` : 'none',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontFamily: PP.mono, fontWeight: 700, fontSize: 12, color: PP.yellow, marginBottom: 2 }}>{item.cmd}</div>
                <div style={{ fontSize: 11, color: PP.text3 }}>{item.desc}</div>
              </div>
              <button onClick={() => copyToClipboard(item.cmd)} style={{
                background: 'none', border: 'none', color: PP.text3, cursor: 'pointer', display: 'flex',
              }}>{I.copy()}</button>
            </div>
          ))}
        </div>

        {/* Carrier Info */}
        <div style={{
          background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 16,
          padding: '16px', marginBottom: 20,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: PP.text3, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>Works on All Carriers</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {carriers.map((c, i) => (
              <div key={i} style={{
                background: c.primary ? `${PP.yellow}18` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${c.primary ? PP.yellow : PP.line}`,
                borderRadius: 12, padding: '12px', textAlign: 'center',
              }}>
                <div style={{ fontWeight: 700, color: c.primary ? PP.yellow : PP.text, fontSize: 13, marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontFamily: PP.mono, fontSize: 11, color: PP.text3 }}>{c.code}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{
          background: PP.card, border: `1px solid ${PP.line}`, borderRadius: 16,
          padding: '16px', marginBottom: 20,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: PP.text3, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 }}>FAQ</div>

          {[
            { q: 'Do I need internet?', a: 'No! USSD and SMS work on any network.' },
            { q: 'Is it free?', a: 'USSD calls cost standard call rates. SMS depends on your plan.' },
            { q: 'Can I generate codes offline?', a: 'Yes, but you need GPS coordinates (use your phone\'s GPS).' },
            { q: 'How do I share my code?', a: 'SMS the code to anyone, or get a shareable link.' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '12px 0', borderBottom: i < 3 ? `1px solid ${PP.line}` : 'none',
            }}>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4, color: PP.text }}>{item.q}</div>
              <div style={{ fontSize: 11, color: PP.text3 }}>{item.a}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
