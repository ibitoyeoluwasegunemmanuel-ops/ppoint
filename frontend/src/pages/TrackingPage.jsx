import { useState, useEffect } from 'react';
import { PP } from '../styles/tokens';

export default function TrackingPage() {
  const [sessionId, setSessionId] = useState('');
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState('');

  const fetchTracking = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tracking/session/${sessionId}`);
      const data = await res.json();
      if (data.success) {
        setTracking(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch tracking:', error);
    }
    setLoading(false);
  };

  const shareTracking = async () => {
    if (!recipientPhone || !sessionId) return;
    setSharing(true);
    try {
      const res = await fetch(`/api/tracking/session/${sessionId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_phone: recipientPhone }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Tracking link shared! Recipient will receive an SMS.');
        setRecipientPhone('');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
    setSharing(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionId && tracking?.status === 'active') {
        fetchTracking();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [sessionId, tracking?.status]);

  return (
    <div style={{ padding: '16px', maxWidth: '430px', margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, color: PP.text }}>Live Tracking</h1>

      {!tracking ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input
            type="text"
            placeholder="Enter Session ID"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            style={{
              padding: '12px',
              background: PP.bg2,
              border: `1px solid ${PP.border}`,
              borderRadius: 12,
              color: PP.text,
              fontSize: 14,
            }}
          />
          <button
            onClick={fetchTracking}
            disabled={loading}
            style={{
              padding: '12px',
              background: PP.yellow,
              color: PP.bg,
              border: 'none',
              borderRadius: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {loading ? 'Loading...' : 'Track Delivery'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              background: PP.bg2,
              padding: 16,
              borderRadius: 12,
              border: `1px solid ${PP.border}`,
            }}
          >
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: PP.text3, marginBottom: 4 }}>Driver Status</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: PP.text }}>
                {tracking.status === 'active' ? '🚗 On the Way' : '✅ Arrived'}
              </div>
            </div>

            {tracking.current_location && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: PP.text3, marginBottom: 4 }}>Distance to Destination</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: PP.yellow }}>
                    {Math.round(tracking.current_location.distance_to_destination / 1000)} km away
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: PP.text3, marginBottom: 4 }}>ETA</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: PP.text }}>
                    ~{tracking.current_location.estimated_arrival_seconds} seconds
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: PP.text3, marginBottom: 4 }}>Speed</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: PP.text }}>
                    {tracking.current_location.speed} km/h
                  </div>
                </div>
              </>
            )}

            <div style={{ fontSize: 12, color: PP.text3 }}>
              Last update: {new Date(tracking.current_location?.timestamp || tracking.started_at).toLocaleTimeString()}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="tel"
              placeholder="Recipient phone number"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              style={{
                padding: '12px',
                background: PP.bg2,
                border: `1px solid ${PP.border}`,
                borderRadius: 12,
                color: PP.text,
                fontSize: 14,
              }}
            />
            <button
              onClick={shareTracking}
              disabled={sharing || !recipientPhone}
              style={{
                padding: '12px',
                background: PP.blue,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: sharing || !recipientPhone ? 0.5 : 1,
              }}
            >
              {sharing ? 'Sharing...' : '📤 Share Tracking Link'}
            </button>
          </div>

          <button
            onClick={() => {
              setTracking(null);
              setSessionId('');
            }}
            style={{
              padding: '12px',
              background: PP.bg2,
              color: PP.text,
              border: `1px solid ${PP.border}`,
              borderRadius: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
