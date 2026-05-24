import { useState, useEffect } from 'react';
import { useOfflineMode } from '../hooks/useOfflineMode';
import { PP } from '../styles/tokens';

export default function DataUsageMonitor() {
  const { isOnline, lowDataMode, toggleLowDataMode, bandwidth } = useOfflineMode();
  const [dataUsedThisSession, setDataUsedThisSession] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.transferSize) {
          setDataUsedThisSession(prev => prev + entry.transferSize);
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
    return () => observer.disconnect();
  }, []);

  const dataUsageMB = (dataUsedThisSession / 1024 / 1024).toFixed(2);
  const isLowBandwidth = bandwidth === '2g' || bandwidth === '3g';

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 40,
          width: 44,
          height: 44,
          borderRadius: 22,
          background: isLowBandwidth ? '#FDB022' : PP.accent,
          border: 'none',
          color: '#000',
          fontWeight: '700',
          fontSize: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
        title="Data usage"
      >
        📊
      </button>

      {/* Panel */}
      {showPanel && (
        <div
          style={{
            position: 'fixed',
            bottom: 70,
            right: 20,
            zIndex: 39,
            background: PP.card,
            border: `1px solid ${PP.border}`,
            borderRadius: 12,
            padding: 16,
            width: 280,
            maxWidth: '90vw',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: '700', color: PP.text.primary }}>
              Data & Network
            </h3>
            <button
              onClick={() => setShowPanel(false)}
              style={{
                background: 'none',
                border: 'none',
                color: PP.text.secondary,
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              ✕
            </button>
          </div>

          {/* Status */}
          <div style={{
            padding: 12,
            background: isOnline ? '#10B98120' : '#EF444420',
            borderRadius: 8,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              background: isOnline ? '#10B981' : '#EF4444',
            }} />
            <div style={{ fontSize: 12, color: PP.text.primary, fontWeight: '600' }}>
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>

          {/* Bandwidth Info */}
          <div style={{
            padding: 12,
            background: PP.bg,
            borderRadius: 8,
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 11, color: PP.text.secondary, marginBottom: 4 }}>
              Connection Type
            </div>
            <div style={{
              fontSize: 14,
              fontWeight: '700',
              color: isLowBandwidth ? '#FDB022' : '#10B981',
              marginBottom: 8,
            }}>
              {bandwidth.toUpperCase()}
              {isLowBandwidth && ' ⚠️'}
            </div>
            <div style={{ fontSize: 10, color: PP.text.secondary }}>
              {bandwidth === '4g' && 'Fast - All features enabled'}
              {bandwidth === '3g' && 'Moderate - Some images compressed'}
              {(bandwidth === '2g' || bandwidth === 'slow-2g') && 'Slow - Low-data mode recommended'}
            </div>
          </div>

          {/* Data Usage */}
          <div style={{
            padding: 12,
            background: PP.bg,
            borderRadius: 8,
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 11, color: PP.text.secondary, marginBottom: 4 }}>
              Data Used (Session)
            </div>
            <div style={{ fontSize: 18, fontWeight: '800', color: PP.accent }}>
              {dataUsageMB} MB
            </div>
          </div>

          {/* Low Data Mode Toggle */}
          <button
            onClick={toggleLowDataMode}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 8,
              background: lowDataMode ? PP.accent : PP.bg,
              border: `1px solid ${PP.border}`,
              color: lowDataMode ? '#000' : PP.text.primary,
              fontWeight: '700',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 200ms',
            }}
          >
            {lowDataMode ? '✓ Low-Data Mode ON' : '📵 Low-Data Mode OFF'}
          </button>

          {lowDataMode && (
            <div style={{
              marginTop: 12,
              padding: 10,
              background: '#FDB02220',
              borderRadius: 8,
              fontSize: 11,
              color: '#FDB022',
              lineHeight: 1.4,
            }}>
              • Images limited to 50% quality
              <br/>
              • Auto-play disabled
              <br/>
              • Maps load on-demand
            </div>
          )}
        </div>
      )}
    </>
  );
}
