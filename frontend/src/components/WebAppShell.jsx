import { PP } from '../styles/tokens';

export default function WebAppShell({ children }) {
  return (
    <div style={{
      width: '100%',
      minHeight: '100dvh',
      background: PP.bg,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {children}
    </div>
  );
}
