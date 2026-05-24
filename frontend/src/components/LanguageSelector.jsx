import { useLanguage } from '../i18n/useLanguage.jsx';
import { PP } from '../styles/tokens';

const I = {
  globe: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="1.8"/></svg>,
};

export function LanguageSelector() {
  const { language, setLanguage, languages } = useLanguage();

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <span style={{ color: PP.text3, fontSize: 12 }}>{I.globe()}</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        style={{
          background: 'none',
          border: 'none',
          color: PP.text2,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none',
          fontFamily: PP.font,
        }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} style={{ background: PP.bg, color: PP.text }}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}

export default LanguageSelector;
