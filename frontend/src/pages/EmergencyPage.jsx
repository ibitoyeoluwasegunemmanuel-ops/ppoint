import { useState } from 'react';
import { PP } from '../styles/tokens';

export default function EmergencyPage() {
  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emergencyId, setEmergencyId] = useState('');

  const emergencyTypes = [
    { id: 'ambulance', name: 'Ambulance', icon: '🚑', color: '#EF4444' },
    { id: 'fire', name: 'Fire Service', icon: '🚒', color: '#F97316' },
    { id: 'police', name: 'Police', icon: '🚔', color: '#0EA5E9' },
    { id: 'flood', name: 'Flood/Disaster', icon: '🌊', color: '#6366F1' },
  ];

  const handleSubmit = async () => {
    if (!selectedType) {
      alert('Please select emergency type');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/emergency/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emergency_type: selectedType,
          caller_phone: 'USSD',
          description: description || `${selectedType} emergency`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEmergencyId(data.data.emergency_id);
        setSubmitted(true);
      } else {
        alert('Failed to submit emergency. Try again.');
      }
    } catch (error) {
      console.error('Emergency submission failed:', error);
      alert('Network error. Try again.');
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div style={{ padding: '16px', maxWidth: '430px', margin: '0 auto', textAlign: 'center', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🚨</div>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: PP.green }}>Help is on the way!</h1>
        <p style={{ color: PP.text3, marginBottom: 24 }}>Emergency ID: {emergencyId}</p>
        <p style={{ color: PP.text3, fontSize: 14, marginBottom: 32, lineHeight: 1.5 }}>Emergency services have been notified of your location and are dispatching responders.</p>

        <div style={{ background: PP.bg2, padding: 16, borderRadius: 12, textAlign: 'left', marginBottom: 24, border: `1px solid ${PP.border}` }}>
          <div style={{ fontSize: 12, color: PP.text3, marginBottom: 8 }}>📍 Stay in a safe location</div>
          <div style={{ fontSize: 12, color: PP.text3, marginBottom: 8 }}>📞 Keep your phone nearby</div>
          <div style={{ fontSize: 12, color: PP.text3 }}>📱 Don't hang up</div>
        </div>

        <button
          onClick={() => {
            setSubmitted(false);
            setSelectedType(null);
            setDescription('');
            setEmergencyId('');
          }}
          style={{
            width: '100%',
            padding: '12px',
            background: PP.bg2,
            color: PP.text,
            border: `1px solid ${PP.border}`,
            borderRadius: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', maxWidth: '430px', margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24, color: PP.text }}>Emergency Alert</h1>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, color: PP.text3, marginBottom: 12, fontWeight: 600 }}>Select Emergency Type</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {emergencyTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              style={{
                padding: '16px',
                background: selectedType === type.id ? type.color : PP.bg2,
                color: selectedType === type.id ? '#FFFFFF' : PP.text,
                border: selectedType === type.id ? `2px solid ${type.color}` : `1px solid ${PP.border}`,
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 32 }}>{type.icon}</span>
              {type.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 12, color: PP.text3, marginBottom: 8, fontWeight: 600 }}>Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the emergency..."
          style={{
            width: '100%',
            padding: '12px',
            background: PP.bg2,
            border: `1px solid ${PP.border}`,
            borderRadius: 12,
            color: PP.text,
            fontSize: 14,
            fontFamily: PP.font,
            resize: 'vertical',
            minHeight: '80px',
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedType || loading}
        style={{
          width: '100%',
          padding: '16px',
          background: selectedType ? '#EF4444' : PP.bg2,
          color: selectedType ? '#FFFFFF' : PP.text3,
          border: 'none',
          borderRadius: 12,
          fontWeight: 600,
          fontSize: 16,
          cursor: selectedType && !loading ? 'pointer' : 'not-allowed',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Sending...' : '🚨 SEND EMERGENCY ALERT'}
      </button>

      <p style={{ fontSize: 12, color: PP.text3, marginTop: 16, textAlign: 'center', lineHeight: 1.5 }}>
        Emergency services will be notified immediately with your PPOINNT location.
      </p>
    </div>
  );
}
