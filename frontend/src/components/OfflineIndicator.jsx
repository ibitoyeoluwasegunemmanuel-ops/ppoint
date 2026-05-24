import { useServiceWorker } from '../hooks/useServiceWorker';
import { PP } from '../styles/tokens';

export function OfflineIndicator() {
  const { isOnline } = useServiceWorker();

  if (isOnline) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '8px 16px',
        background: '#D97706',
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 600,
        textAlign: 'center',
        zIndex: 9999,
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      📡 You're offline. Some features may be limited.
    </div>
  );
}

export default OfflineIndicator;
