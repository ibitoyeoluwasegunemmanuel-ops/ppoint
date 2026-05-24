import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { PP } from '../styles/tokens';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState({
    voiceGuidance: localStorage.getItem('ppoint_voice_guidance') !== 'false',
    voiceVolume: parseInt(localStorage.getItem('ppoint_voice_volume')) || 80,
    navigationStyle: localStorage.getItem('ppoint_nav_style') || 'detailed',
    lowDataMode: localStorage.getItem('ppoint_low_data_mode') === 'true',
    hapticFeedback: localStorage.getItem('ppoint_haptic') !== 'false',
    darkMode: localStorage.getItem('ppoint_dark_mode') !== 'false',
    notifications: localStorage.getItem('ppoint_notifications') !== 'false',
    locationTracking: localStorage.getItem('ppoint_location_tracking') !== 'false',
    biometric: localStorage.getItem('ppoint_biometric') === 'true',
  });

  const [activeTab, setActiveTab] = useState('general');
  const [savedMessage, setSavedMessage] = useState('');

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSavedMessage('Saving...');

    // Save to localStorage
    if (typeof value === 'boolean') {
      localStorage.setItem(`ppoint_${key}`, value ? 'true' : 'false');
    } else {
      localStorage.setItem(`ppoint_${key}`, value);
    }

    setTimeout(() => setSavedMessage('✓ Saved'), 500);
    setTimeout(() => setSavedMessage(''), 2000);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
      navigate('/');
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: PP.bg,
      paddingBottom: 80,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${PP.border}`,
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: 24,
            fontWeight: '700',
            color: PP.text.primary,
          }}>
            Settings ⚙️
          </h1>
          <p style={{
            margin: '4px 0 0',
            fontSize: 12,
            color: PP.text.secondary,
          }}>
            Customize your experience
          </p>
        </div>
        {savedMessage && (
          <div style={{
            fontSize: 12,
            color: '#10B981',
            fontWeight: '600',
          }}>
            {savedMessage}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        borderBottom: `1px solid ${PP.border}`,
        padding: '0 16px',
        marginBottom: 16,
      }}>
        {[
          { id: 'general', label: '📱 General' },
          { id: 'navigation', label: '🧭 Navigation' },
          { id: 'voice', label: '🎙️ Voice' },
          { id: 'privacy', label: '🔒 Privacy' },
          { id: 'about', label: 'ℹ️ About' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 16px',
              borderBottom: activeTab === tab.id ? `3px solid ${PP.accent}` : '3px solid transparent',
              background: 'transparent',
              color: activeTab === tab.id ? PP.accent : PP.text.secondary,
              fontSize: 12,
              fontWeight: activeTab === tab.id ? '600' : '500',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 200ms',
              border: 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '0 16px' }}>
        {/* GENERAL SETTINGS */}
        {activeTab === 'general' && (
          <div>
            <SettingSection title="Display">
              <SettingToggle
                label="Dark Mode"
                description="Use dark theme (recommended)"
                enabled={settings.darkMode}
                onChange={() => handleSettingChange('darkMode', !settings.darkMode)}
              />
              <SettingToggle
                label="Low Data Mode"
                description="Reduce data usage by limiting images"
                enabled={settings.lowDataMode}
                onChange={() => handleSettingChange('lowDataMode', !settings.lowDataMode)}
              />
            </SettingSection>

            <SettingSection title="Features">
              <SettingToggle
                label="Haptic Feedback"
                description="Feel vibrations for interactions"
                enabled={settings.hapticFeedback}
                onChange={() => handleSettingChange('hapticFeedback', !settings.hapticFeedback)}
              />
              <SettingToggle
                label="Notifications"
                description="Receive push notifications"
                enabled={settings.notifications}
                onChange={() => handleSettingChange('notifications', !settings.notifications)}
              />
            </SettingSection>

            <SettingSection title="Account">
              <div style={{
                padding: '12px 0',
                borderBottom: `1px solid ${PP.border}`,
              }}>
                <div style={{
                  fontSize: 13,
                  color: PP.text.secondary,
                  marginBottom: 4,
                }}>
                  Logged in as
                </div>
                <div style={{
                  fontSize: 14,
                  color: PP.text.primary,
                  fontWeight: '600',
                  marginBottom: 12,
                }}>
                  {user?.full_name || user?.email || 'Guest User'}
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: 12,
                  marginTop: 12,
                  borderRadius: 8,
                  background: '#EF444420',
                  color: '#EF4444',
                  border: '1px solid #EF444440',
                  fontWeight: '600',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Sign Out
              </button>
            </SettingSection>
          </div>
        )}

        {/* NAVIGATION SETTINGS */}
        {activeTab === 'navigation' && (
          <div>
            <SettingSection title="Navigation Style">
              {['detailed', 'minimal', 'voice-only'].map(style => (
                <div
                  key={style}
                  onClick={() => handleSettingChange('navigationStyle', style)}
                  style={{
                    padding: '12px 16px',
                    marginBottom: 8,
                    borderRadius: 8,
                    background: settings.navigationStyle === style ? PP.accent + '20' : PP.card,
                    border: `1px solid ${settings.navigationStyle === style ? PP.accent : PP.border}`,
                    cursor: 'pointer',
                    transition: 'all 200ms',
                  }}
                >
                  <div style={{
                    fontSize: 13,
                    fontWeight: settings.navigationStyle === style ? '600' : '500',
                    color: settings.navigationStyle === style ? PP.accent : PP.text.primary,
                    marginBottom: 4,
                  }}>
                    {style === 'detailed' && '📍 Detailed Map + Directions'}
                    {style === 'minimal' && '🎯 Minimal - Just Distance & ETA'}
                    {style === 'voice-only' && '🎙️ Voice Only - Audio Guidance'}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: PP.text.secondary,
                  }}>
                    {style === 'detailed' && 'Full map with turn-by-turn directions'}
                    {style === 'minimal' && 'Minimal UI showing only essential info'}
                    {style === 'voice-only' && 'Audio guidance with no visual map'}
                  </div>
                </div>
              ))}
            </SettingSection>

            <SettingSection title="Map Behavior">
              <SettingToggle
                label="Auto-Center on Driver"
                description="Keep map centered on your location"
                enabled={true}
                onChange={() => {}}
              />
              <SettingToggle
                label="Show Traffic"
                description="Display real-time traffic conditions"
                enabled={true}
                onChange={() => {}}
              />
              <SettingToggle
                label="Auto-Zoom"
                description="Automatically adjust map zoom level"
                enabled={true}
                onChange={() => {}}
              />
            </SettingSection>
          </div>
        )}

        {/* VOICE SETTINGS */}
        {activeTab === 'voice' && (
          <div>
            <SettingSection title="Voice Guidance">
              <SettingToggle
                label="Enable Voice Navigation"
                description="Listen to turn-by-turn directions"
                enabled={settings.voiceGuidance}
                onChange={() => handleSettingChange('voiceGuidance', !settings.voiceGuidance)}
              />

              {settings.voiceGuidance && (
                <>
                  <div style={{ marginTop: 16 }}>
                    <div style={{
                      fontSize: 13,
                      color: PP.text.secondary,
                      marginBottom: 8,
                    }}>
                      Voice Volume: {settings.voiceVolume}%
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.voiceVolume}
                      onChange={(e) => handleSettingChange('voiceVolume', parseInt(e.target.value))}
                      style={{
                        width: '100%',
                        height: 6,
                        borderRadius: 3,
                        outline: 'none',
                        background: PP.border,
                        WebkitAppearance: 'slider-horizontal',
                        cursor: 'pointer',
                      }}
                    />
                  </div>

                  <div style={{
                    marginTop: 16,
                    padding: 12,
                    background: PP.card,
                    borderRadius: 8,
                    border: `1px solid ${PP.border}`,
                  }}>
                    <button
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: 6,
                        background: PP.accent,
                        color: '#000',
                        border: 'none',
                        fontWeight: '600',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      🔊 Test Voice
                    </button>
                    <div style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: PP.text.secondary,
                      textAlign: 'center',
                    }}>
                      (Example: "Turn left in 100 meters")
                    </div>
                  </div>
                </>
              )}
            </SettingSection>

            <SettingSection title="Voice Prompts">
              <SettingToggle
                label="Turn Announcements"
                description="Announce upcoming turns"
                enabled={true}
                onChange={() => {}}
              />
              <SettingToggle
                label="Arrival Announcement"
                description="Announce arrival at destination"
                enabled={true}
                onChange={() => {}}
              />
              <SettingToggle
                label="Street Names"
                description="Include street names in directions"
                enabled={true}
                onChange={() => {}}
              />
            </SettingSection>
          </div>
        )}

        {/* PRIVACY SETTINGS */}
        {activeTab === 'privacy' && (
          <div>
            <SettingSection title="Location">
              <SettingToggle
                label="Share Location"
                description="Allow location tracking for navigation"
                enabled={settings.locationTracking}
                onChange={() => handleSettingChange('locationTracking', !settings.locationTracking)}
              />
              <SettingToggle
                label="Background Location"
                description="Track location when app is in background"
                enabled={false}
                onChange={() => {}}
              />
            </SettingSection>

            <SettingSection title="Security">
              <SettingToggle
                label="Biometric Login"
                description="Use fingerprint or face recognition"
                enabled={settings.biometric}
                onChange={() => handleSettingChange('biometric', !settings.biometric)}
              />
            </SettingSection>

            <SettingSection title="Data">
              <button
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  background: PP.card,
                  color: PP.text.primary,
                  border: `1px solid ${PP.border}`,
                  fontWeight: '600',
                  fontSize: 13,
                  cursor: 'pointer',
                  marginBottom: 8,
                }}
              >
                📥 Export My Data
              </button>
              <button
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  background: '#EF444420',
                  color: '#EF4444',
                  border: '1px solid #EF444440',
                  fontWeight: '600',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                🗑️ Delete All Data
              </button>
            </SettingSection>
          </div>
        )}

        {/* ABOUT */}
        {activeTab === 'about' && (
          <div>
            <SettingSection title="App Info">
              <div style={{ padding: '12px 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: PP.text.secondary }}>Version</div>
                    <div style={{ fontSize: 14, fontWeight: '600', color: PP.text.primary, marginTop: 4 }}>
                      1.0.0
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: PP.text.secondary }}>Build</div>
                    <div style={{ fontSize: 14, fontWeight: '600', color: PP.text.primary, marginTop: 4 }}>
                      2024.05.24
                    </div>
                  </div>
                </div>
              </div>
            </SettingSection>

            <SettingSection title="Resources">
              <button
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  background: PP.card,
                  color: PP.text.primary,
                  border: `1px solid ${PP.border}`,
                  fontWeight: '600',
                  fontSize: 13,
                  cursor: 'pointer',
                  marginBottom: 8,
                }}
              >
                📖 Help & Documentation
              </button>
              <button
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  background: PP.card,
                  color: PP.text.primary,
                  border: `1px solid ${PP.border}`,
                  fontWeight: '600',
                  fontSize: 13,
                  cursor: 'pointer',
                  marginBottom: 8,
                }}
              >
                📧 Contact Support
              </button>
              <button
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  background: PP.card,
                  color: PP.text.primary,
                  border: `1px solid ${PP.border}`,
                  fontWeight: '600',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                📋 Privacy Policy
              </button>
            </SettingSection>

            <SettingSection title="Credits">
              <div style={{
                padding: '12px 0',
                fontSize: 12,
                color: PP.text.secondary,
                lineHeight: 1.6,
              }}>
                <strong>PPOINT</strong> — The physical point address system for Nigeria
                <br /><br />
                Enabling reliable delivery, emergency response, and government services through precise address identification.
                <br /><br />
                © 2024 PPOINT. All rights reserved.
              </div>
            </SettingSection>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingSection({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{
        margin: '0 0 12px',
        fontSize: 13,
        fontWeight: '700',
        color: PP.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
        {title}
      </h2>
      <div style={{
        padding: 16,
        background: PP.card,
        borderRadius: 12,
        border: `1px solid ${PP.border}`,
      }}>
        {children}
      </div>
    </div>
  );
}

function SettingToggle({ label, description, enabled, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: `1px solid ${PP.border}`,
        cursor: 'pointer',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 13,
          fontWeight: '600',
          color: PP.text.primary,
          marginBottom: 2,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 12,
          color: PP.text.secondary,
        }}>
          {description}
        </div>
      </div>
      <div
        style={{
          width: 50,
          height: 28,
          borderRadius: 14,
          background: enabled ? PP.accent : PP.border,
          display: 'flex',
          alignItems: 'center',
          padding: '2px',
          transition: 'all 200ms',
          marginLeft: 12,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            background: '#fff',
            transition: 'all 200ms',
            marginLeft: enabled ? 'auto' : 0,
            marginRight: enabled ? 0 : 'auto',
          }}
        />
      </div>
    </div>
  );
}
