import { useLocation } from 'react-router-dom';
import TabBar from './TabBar';
import { PP } from '../styles/tokens';

const TABBED_ROUTES = ['/', '/map', '/saved', '/activity', '/profile'];
const FULL_SCREEN_ROUTES = ['/navigate', '/generate', '/drivers', '/share'];

export default function AppShell({ children }) {
  const location = useLocation();
  const path = location.pathname;

  const isAdmin = path.startsWith('/admin');
  const isDev = path.startsWith('/developers') || path.startsWith('/developer');
  const isFullScreen = FULL_SCREEN_ROUTES.some(r => path.startsWith(r));
  const hasTabBar = TABBED_ROUTES.includes(path);

  if (isAdmin || isDev) {
    return <>{children}</>;
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      minHeight: '100dvh',
      background: '#050607',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 430,
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: PP.bg,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 0 60px rgba(0,0,0,0.6)',
      }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {children}
        </div>
        {hasTabBar && <TabBar />}
      </div>
    </div>
  );
}
