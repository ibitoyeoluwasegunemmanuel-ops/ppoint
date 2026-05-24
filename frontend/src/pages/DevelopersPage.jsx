import { useState } from 'react';
import { PP } from '../styles/tokens';

export default function DevelopersPageEnhanced() {
  const [activeTab, setActiveTab] = useState('api-keys');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState(['address.verified']);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [testingWebhook, setTestingWebhook] = useState(null);

  // Mock data
  const apiKeys = [
    {
      id: 'pk_live_abc123',
      type: 'Live',
      created_at: '2024-01-15T10:30:00Z',
      last_used: '2024-05-23T14:20:00Z',
      requests_24h: 1245,
      requests_7d: 8932,
    },
    {
      id: 'pk_test_def456',
      type: 'Test',
      created_at: '2024-01-15T10:30:00Z',
      last_used: '2024-05-24T09:15:00Z',
      requests_24h: 342,
      requests_7d: 2450,
    },
  ];

  const webhooks = [
    {
      id: 'wh_12345',
      url: 'https://example.com/webhooks',
      events: ['address.verified', 'delivery.completed'],
      status: 'active',
      last_triggered: '2024-05-23T14:20:00Z',
      success_count: 1245,
      failure_count: 3,
    },
  ];

  const sdkExamples = {
    javascript: `import { PPOINT } from '@ppoint/sdk';

const ppoint = new PPOINT({ apiKey: 'pk_live_...' });
const address = await ppoint.addresses.lookup('PPT-NG-LAG-IKD-1234');`,
    python: `from ppoint import PPOINT

ppoint = PPOINT(api_key='pk_live_...')
address = ppoint.addresses.lookup('PPT-NG-LAG-IKD-1234')`,
    curl: `curl -X GET "https://api.ppoint.online/api/addresses/PPT-NG-LAG-IKD-1234" \\
  -H "Authorization: Bearer pk_live_..."`,
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: PP.bg,
      paddingBottom: 20,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${PP.border}`,
        marginBottom: 16,
      }}>
        <h1 style={{
          margin: 0,
          fontSize: 24,
          fontWeight: '700',
          color: PP.text.primary,
        }}>
          Developer Dashboard
        </h1>
        <p style={{
          margin: '8px 0 0',
          fontSize: 13,
          color: PP.text.secondary,
        }}>
          API keys, webhooks, and integration tools
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        borderBottom: `1px solid ${PP.border}`,
        padding: '0 16px',
        marginBottom: 20,
      }}>
        {[
          { id: 'api-keys', label: '🔑 API Keys' },
          { id: 'webhooks', label: '🪝 Webhooks' },
          { id: 'documentation', label: '📚 Docs' },
          { id: 'usage', label: '📊 Usage' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 16px',
              borderBottom: activeTab === tab.id ? `3px solid ${PP.accent}` : '3px solid transparent',
              background: 'transparent',
              color: activeTab === tab.id ? PP.accent : PP.text.secondary,
              fontSize: 13,
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
        {/* API Keys Tab */}
        {activeTab === 'api-keys' && (
          <div>
            <h2 style={{
              margin: '0 0 16px',
              fontSize: 16,
              fontWeight: '600',
              color: PP.text.primary,
            }}>
              API Keys
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {apiKeys.map(key => (
                <div
                  key={key.id}
                  style={{
                    padding: 16,
                    border: `1px solid ${PP.border}`,
                    borderRadius: 12,
                    background: PP.card,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div>
                      <h3 style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: '600',
                        color: PP.text.primary,
                        marginBottom: 4,
                      }}>
                        {key.type} Environment
                      </h3>
                      <code style={{
                        fontSize: 12,
                        color: PP.text.secondary,
                        fontFamily: 'monospace',
                        backgroundColor: PP.bg,
                        padding: '4px 8px',
                        borderRadius: 4,
                      }}>
                        {key.id}
                      </code>
                    </div>
                    <button
                      onClick={() => handleCopy(key.id)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        background: PP.bg,
                        color: PP.text.primary,
                        border: `1px solid ${PP.border}`,
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Copy
                    </button>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    marginBottom: 12,
                  }}>
                    <div>
                      <div style={{ fontSize: 12, color: PP.text.secondary, marginBottom: 4 }}>
                        Created
                      </div>
                      <div style={{ fontSize: 13, color: PP.text.primary, fontWeight: '600' }}>
                        {new Date(key.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: PP.text.secondary, marginBottom: 4 }}>
                        Last Used
                      </div>
                      <div style={{ fontSize: 13, color: PP.text.primary, fontWeight: '600' }}>
                        {new Date(key.last_used).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: PP.text.secondary, marginBottom: 4 }}>
                        Requests (24h)
                      </div>
                      <div style={{ fontSize: 13, color: PP.accent, fontWeight: '600' }}>
                        {key.requests_24h.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: PP.text.secondary, marginBottom: 4 }}>
                        Requests (7d)
                      </div>
                      <div style={{ fontSize: 13, color: PP.accent, fontWeight: '600' }}>
                        {key.requests_7d.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <button
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 8,
                      background: PP.bg,
                      color: PP.text.primary,
                      border: `1px solid ${PP.border}`,
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    Rotate Key
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div>
            <h2 style={{
              margin: '0 0 16px',
              fontSize: 16,
              fontWeight: '600',
              color: PP.text.primary,
            }}>
              Webhooks
            </h2>

            {/* Add Webhook */}
            <div style={{
              padding: 16,
              border: `1px solid ${PP.border}`,
              borderRadius: 12,
              background: PP.card,
              marginBottom: 20,
            }}>
              <h3 style={{
                margin: '0 0 12px',
                fontSize: 14,
                fontWeight: '600',
                color: PP.text.primary,
              }}>
                Add New Webhook
              </h3>
              <input
                type="url"
                placeholder="Webhook URL"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${PP.border}`,
                  background: PP.bg,
                  color: PP.text.primary,
                  marginBottom: 12,
                  fontFamily: 'inherit',
                  fontSize: 13,
                }}
              />
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: PP.text.secondary, display: 'block', marginBottom: 8 }}>
                  Events
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['address.verified', 'delivery.completed', 'tracking.updated'].map(event => (
                    <label
                      key={event}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        background: webhookEvents.includes(event) ? PP.accent : PP.bg,
                        color: webhookEvents.includes(event) ? '#000' : PP.text.primary,
                        fontSize: 12,
                        fontWeight: '600',
                        cursor: 'pointer',
                        userSelect: 'none',
                        border: `1px solid ${PP.border}`,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={webhookEvents.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWebhookEvents([...webhookEvents, event]);
                          } else {
                            setWebhookEvents(webhookEvents.filter(ev => ev !== event));
                          }
                        }}
                        style={{ marginRight: 6, cursor: 'pointer' }}
                      />
                      {event}
                    </label>
                  ))}
                </div>
              </div>
              <button
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  background: PP.accent,
                  color: '#000',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Create Webhook
              </button>
            </div>

            {/* Active Webhooks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {webhooks.map(webhook => (
                <div
                  key={webhook.id}
                  style={{
                    padding: 16,
                    border: `1px solid ${PP.border}`,
                    borderRadius: 12,
                    background: PP.card,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div>
                      <h3 style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: '600',
                        color: PP.text.primary,
                        marginBottom: 4,
                      }}>
                        {webhook.url}
                      </h3>
                      <div style={{ fontSize: 12, color: PP.text.secondary }}>
                        Events: {webhook.events.join(', ')}
                      </div>
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: '#10B98120',
                      color: '#10B981',
                      fontSize: 12,
                      fontWeight: '600',
                    }}>
                      {webhook.status.toUpperCase()}
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    marginBottom: 12,
                  }}>
                    <div>
                      <div style={{ fontSize: 12, color: PP.text.secondary, marginBottom: 4 }}>
                        Successful
                      </div>
                      <div style={{ fontSize: 16, color: '#10B981', fontWeight: '600' }}>
                        {webhook.success_count}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: PP.text.secondary, marginBottom: 4 }}>
                        Failed
                      </div>
                      <div style={{ fontSize: 16, color: '#EF4444', fontWeight: '600' }}>
                        {webhook.failure_count}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setTestingWebhook(webhook.id)}
                    style={{
                      width: '100%',
                      padding: 12,
                      borderRadius: 8,
                      background: PP.bg,
                      color: PP.text.primary,
                      border: `1px solid ${PP.border}`,
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    📤 Send Test Webhook
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documentation Tab */}
        {activeTab === 'documentation' && (
          <div>
            <h2 style={{
              margin: '0 0 16px',
              fontSize: 16,
              fontWeight: '600',
              color: PP.text.primary,
            }}>
              SDK & Documentation
            </h2>

            {/* Language Selector */}
            <div style={{
              marginBottom: 16,
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
            }}>
              {['javascript', 'python', 'curl'].map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: selectedLanguage === lang ? PP.accent : PP.card,
                    color: selectedLanguage === lang ? '#000' : PP.text.primary,
                    border: `1px solid ${PP.border}`,
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Code Block */}
            <div style={{
              padding: 16,
              border: `1px solid ${PP.border}`,
              borderRadius: 12,
              background: PP.bg,
              marginBottom: 16,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <code style={{
                  fontSize: 11,
                  color: PP.text.secondary,
                  fontFamily: 'monospace',
                }}>
                  {selectedLanguage.toUpperCase()} example
                </code>
                <button
                  onClick={() => handleCopy(sdkExamples[selectedLanguage])}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: PP.accent,
                    color: '#000',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  Copy Code
                </button>
              </div>
              <pre style={{
                margin: 0,
                overflow: 'auto',
                maxHeight: 300,
                fontSize: 11,
                color: '#10B981',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
              }}>
                {sdkExamples[selectedLanguage]}
              </pre>
            </div>

            <div style={{
              padding: 16,
              border: `1px solid ${PP.border}`,
              borderRadius: 12,
              background: PP.card,
            }}>
              <h3 style={{
                margin: '0 0 12px',
                fontSize: 14,
                fontWeight: '600',
                color: PP.text.primary,
              }}>
                API Endpoints
              </h3>
              {[
                { method: 'GET', path: '/api/addresses/:code', desc: 'Lookup address' },
                { method: 'POST', path: '/api/addresses', desc: 'Create address' },
                { method: 'POST', path: '/api/tracking/session/start', desc: 'Start tracking' },
                { method: 'POST', path: '/api/delivery/proof', desc: 'Submit proof' },
              ].map((endpoint, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 0',
                    borderTop: i > 0 ? `1px solid ${PP.border}` : 'none',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'start',
                  }}
                >
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 4,
                    background: endpoint.method === 'GET' ? '#3B82F6' : '#10B981',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: '700',
                    minWidth: 40,
                    textAlign: 'center',
                  }}>
                    {endpoint.method}
                  </span>
                  <div style={{ flex: 1 }}>
                    <code style={{
                      fontSize: 12,
                      color: PP.text.primary,
                      fontFamily: 'monospace',
                      display: 'block',
                      marginBottom: 4,
                    }}>
                      {endpoint.path}
                    </code>
                    <div style={{ fontSize: 12, color: PP.text.secondary }}>
                      {endpoint.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <div>
            <h2 style={{
              margin: '0 0 16px',
              fontSize: 16,
              fontWeight: '600',
              color: PP.text.primary,
            }}>
              API Usage
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 20,
            }}>
              {[
                { label: 'Total Requests', value: '45.2K', color: '#3B82F6' },
                { label: 'Success Rate', value: '99.1%', color: '#10B981' },
                { label: 'Avg Response', value: '145ms', color: PP.accent },
                { label: 'Errors (24h)', value: '12', color: '#EF4444' },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    padding: 16,
                    border: `1px solid ${PP.border}`,
                    borderRadius: 12,
                    background: PP.card,
                  }}
                >
                  <div style={{ fontSize: 12, color: PP.text.secondary, marginBottom: 8 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: '800', color: stat.color }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              padding: 16,
              border: `1px solid ${PP.border}`,
              borderRadius: 12,
              background: PP.card,
            }}>
              <h3 style={{
                margin: '0 0 16px',
                fontSize: 14,
                fontWeight: '600',
                color: PP.text.primary,
              }}>
                Top Endpoints
              </h3>
              {[
                { path: '/api/addresses/:code', requests: 18932, rate: 99.8 },
                { path: '/api/tracking/session/start', requests: 12450, rate: 98.9 },
                { path: '/api/delivery/proof', requests: 8340, rate: 99.5 },
              ].map((endpoint, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 0',
                    borderTop: i > 0 ? `1px solid ${PP.border}` : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <code style={{
                      fontSize: 12,
                      color: PP.text.primary,
                      fontFamily: 'monospace',
                      display: 'block',
                      marginBottom: 4,
                    }}>
                      {endpoint.path}
                    </code>
                    <div style={{ fontSize: 11, color: PP.text.secondary }}>
                      {endpoint.requests.toLocaleString()} requests
                    </div>
                  </div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: '#10B981',
                  }}>
                    {endpoint.rate}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
