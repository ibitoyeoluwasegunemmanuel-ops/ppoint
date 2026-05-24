import { useState } from 'react';
import { PP } from '../styles/tokens';

export default function AdminModerationPage() {
  const [activeTab, setActiveTab] = useState('agents');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  // Mock data
  const pendingAgents = [
    {
      id: 'a1',
      full_name: 'Chioma Okonkwo',
      email: 'chioma@example.com',
      phone_number: '+2341234567890',
      state: 'Lagos',
      territory: 'Ikeja Zone A',
      submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      risk_score: 'low',
      documents: ['national_id', 'proof_of_residence'],
    },
    {
      id: 'a2',
      full_name: 'Aminata Hassan',
      email: 'aminata@example.com',
      phone_number: '+2349876543210',
      state: 'Abuja',
      territory: 'Wuse Zone B',
      submitted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      risk_score: 'medium',
      documents: ['national_id'],
    },
  ];

  const payoutRequests = [
    {
      agent_id: 'ag1',
      agent_name: 'Tunde Adeyemi',
      balance_available: 125000,
      withdrawal_requests: [
        { id: 'wr1', amount: 50000, requested_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), status: 'pending' },
        { id: 'wr2', amount: 25000, requested_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), status: 'pending' },
      ],
      certification_level: 'Silver',
      verification_count: 145,
    },
    {
      agent_id: 'ag2',
      agent_name: 'Fatima Barako',
      balance_available: 350000,
      withdrawal_requests: [
        { id: 'wr3', amount: 100000, requested_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), status: 'pending' },
      ],
      certification_level: 'Gold',
      verification_count: 520,
    },
  ];

  const openDisputes = [
    {
      id: 'd1',
      ppoinnt_code: 'PP-LG-2024-001',
      reporter_name: 'Driver A',
      dispute_type: 'inaccurate_location',
      description: 'Location pin was 500m away from actual address',
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      status: 'open',
      priority: 'high',
    },
    {
      id: 'd2',
      ppoinnt_code: 'PP-AB-2024-045',
      reporter_name: 'Business',
      dispute_type: 'duplicate_address',
      description: 'Same address registered twice with different codes',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'open',
      priority: 'medium',
    },
  ];

  const fraudAlerts = [
    {
      agent_id: 'fa1',
      agent_name: 'Unknown Agent 1',
      risk_score: 'high',
      risk_factors: ['multiple_rejections', 'high_dispute_rate', 'unusual_pattern'],
      verification_count: 12,
      accuracy_score: 45,
      territory: 'Lagos Zone C',
      flagged_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      agent_id: 'fa2',
      agent_name: 'Agent with Surge',
      risk_score: 'medium',
      risk_factors: ['sudden_verification_spike'],
      verification_count: 98,
      accuracy_score: 62,
      territory: 'Kano Zone A',
      flagged_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const territoryConflicts = [
    {
      agents: [
        { id: 'tc1', name: 'Oladele Okafor', certified_date: '2024-01-10' },
        { id: 'tc2', name: 'Jamal Ibrahim', certified_date: '2024-01-15' },
      ],
      territory: 'Surulere Zone A',
      state: 'Lagos',
      conflict_type: 'duplicate_territory',
    },
  ];

  const handleApproveAgent = (agent) => {
    console.log('Approved agent:', agent.id, 'Notes:', approvalNotes);
    setSelectedAgent(null);
    setApprovalNotes('');
  };

  const handleRejectAgent = (agentId) => {
    console.log('Rejected agent:', agentId);
    setSelectedAgent(null);
  };

  const handleApproveWithdrawal = (wrId) => {
    console.log('Approved withdrawal:', wrId);
  };

  const handleRejectWithdrawal = (wrId) => {
    console.log('Rejected withdrawal:', wrId);
  };

  const handleResolveDispute = (disputeId, ruling) => {
    console.log('Resolved dispute:', disputeId, 'Ruling:', ruling);
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: PP.bg,
      paddingBottom: 20,
      paddingTop: 16,
    }}>
      {/* Header */}
      <div style={{
        padding: '0 16px 24px',
        borderBottom: `1px solid ${PP.border}`,
      }}>
        <h1 style={{
          margin: 0,
          marginBottom: 8,
          fontSize: 28,
          fontWeight: '700',
          color: PP.text.primary,
        }}>
          Moderation Center
        </h1>
        <p style={{
          margin: 0,
          fontSize: 14,
          color: PP.text.secondary,
        }}>
          Manage verifications, disputes, and fraud detection
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        borderBottom: `1px solid ${PP.border}`,
        padding: '0 16px',
        marginBottom: 20,
        scrollBehavior: 'smooth',
      }}>
        {[
          { key: 'agents', label: '🔍 Agents', count: pendingAgents.length },
          { key: 'payouts', label: '💰 Payouts', count: payoutRequests.length },
          { key: 'disputes', label: '⚖️ Disputes', count: openDisputes.length },
          { key: 'fraud', label: '🚨 Fraud Alerts', count: fraudAlerts.length },
          { key: 'territory', label: '🗺️ Territory', count: territoryConflicts.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 16px',
              borderBottom: activeTab === tab.key ? `3px solid ${PP.accent}` : `3px solid transparent`,
              background: 'transparent',
              color: activeTab === tab.key ? PP.accent : PP.text.secondary,
              fontSize: 13,
              fontWeight: activeTab === tab.key ? '600' : '500',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 200ms',
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ padding: '0 16px' }}>
        {/* Agent Verification Tab */}
        {activeTab === 'agents' && (
          <div>
            <h2 style={{
              margin: '0 0 16px',
              fontSize: 16,
              fontWeight: '600',
              color: PP.text.primary,
            }}>
              Pending Verification ({pendingAgents.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingAgents.map(agent => (
                <div
                  key={agent.id}
                  style={{
                    padding: 16,
                    border: `1px solid ${PP.border}`,
                    borderRadius: 12,
                    background: PP.card,
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedAgent(agent)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: 16,
                        fontWeight: '600',
                        color: PP.text.primary,
                      }}>
                        {agent.full_name}
                      </h3>
                      <p style={{
                        margin: '4px 0 0',
                        fontSize: 13,
                        color: PP.text.secondary,
                      }}>
                        {agent.state} • {agent.territory}
                      </p>
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: agent.risk_score === 'low' ? '#10B98120' : '#FDB02220',
                      color: agent.risk_score === 'low' ? '#10B981' : '#FDB022',
                      fontSize: 12,
                      fontWeight: '600',
                    }}>
                      {agent.risk_score.toUpperCase()}
                    </div>
                  </div>
                  <div style={{
                    marginTop: 12,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    fontSize: 13,
                  }}>
                    <div>
                      <span style={{ color: PP.text.secondary }}>Email:</span>
                      <div style={{ color: PP.text.primary }}>{agent.email}</div>
                    </div>
                    <div>
                      <span style={{ color: PP.text.secondary }}>Phone:</span>
                      <div style={{ color: PP.text.primary }}>{agent.phone_number}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedAgent && (
              <div style={{
                marginTop: 24,
                padding: 16,
                border: `2px solid ${PP.accent}`,
                borderRadius: 12,
                background: PP.card,
              }}>
                <h3 style={{
                  margin: 0,
                  marginBottom: 12,
                  fontSize: 16,
                  fontWeight: '600',
                  color: PP.text.primary,
                }}>
                  Review: {selectedAgent.full_name}
                </h3>
                <textarea
                  placeholder="Add approval notes..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 8,
                    border: `1px solid ${PP.border}`,
                    background: PP.bg,
                    color: PP.text.primary,
                    fontSize: 14,
                    fontFamily: 'inherit',
                    marginBottom: 12,
                    minHeight: 80,
                    resize: 'none',
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleApproveAgent(selectedAgent)}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 8,
                      background: '#10B981',
                      color: '#fff',
                      border: 'none',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleRejectAgent(selectedAgent.id)}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 8,
                      background: '#EF4444',
                      color: '#fff',
                      border: 'none',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payout Requests Tab */}
        {activeTab === 'payouts' && (
          <div>
            <h2 style={{
              margin: '0 0 16px',
              fontSize: 16,
              fontWeight: '600',
              color: PP.text.primary,
            }}>
              Pending Payout Requests ({payoutRequests.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {payoutRequests.map(agent => (
                <div
                  key={agent.agent_id}
                  style={{
                    padding: 16,
                    border: `1px solid ${PP.border}`,
                    borderRadius: 12,
                    background: PP.card,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <h3 style={{
                        margin: 0,
                        fontSize: 16,
                        fontWeight: '600',
                        color: PP.text.primary,
                      }}>
                        {agent.agent_name}
                      </h3>
                      <p style={{
                        margin: '4px 0 0',
                        fontSize: 13,
                        color: PP.text.secondary,
                      }}>
                        {agent.certification_level} • {agent.verification_count} verifications
                      </p>
                    </div>
                    <div style={{
                      textAlign: 'right',
                      fontSize: 14,
                      color: PP.text.primary,
                    }}>
                      Available: <strong>₦{agent.balance_available.toLocaleString()}</strong>
                    </div>
                  </div>

                  {agent.withdrawal_requests.map(req => (
                    <div
                      key={req.id}
                      style={{
                        padding: 12,
                        background: PP.bg,
                        borderRadius: 8,
                        marginBottom: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: PP.accent,
                        }}>
                          ₦{req.amount.toLocaleString()}
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: PP.text.secondary,
                          marginTop: 4,
                        }}>
                          {new Date(req.requested_at).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleApproveWithdrawal(req.id)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 6,
                            background: '#10B98120',
                            color: '#10B981',
                            border: 'none',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectWithdrawal(req.id)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 6,
                            background: '#EF444420',
                            color: '#EF4444',
                            border: 'none',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disputes Tab */}
        {activeTab === 'disputes' && (
          <div>
            <h2 style={{
              margin: '0 0 16px',
              fontSize: 16,
              fontWeight: '600',
              color: PP.text.primary,
            }}>
              Open Disputes ({openDisputes.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {openDisputes.map(dispute => (
                <div
                  key={dispute.id}
                  style={{
                    padding: 16,
                    border: `1px solid ${dispute.priority === 'high' ? '#EF4444' : PP.border}`,
                    borderRadius: 12,
                    background: PP.card,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <h3 style={{
                        margin: 0,
                        fontSize: 16,
                        fontWeight: '600',
                        color: PP.text.primary,
                      }}>
                        {dispute.ppoinnt_code}
                      </h3>
                      <p style={{
                        margin: '4px 0 0',
                        fontSize: 13,
                        color: PP.text.secondary,
                      }}>
                        {dispute.dispute_type.replace('_', ' ')} • {dispute.reporter_name}
                      </p>
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: dispute.priority === 'high' ? '#EF444420' : '#FDB02220',
                      color: dispute.priority === 'high' ? '#EF4444' : '#FDB022',
                      fontSize: 12,
                      fontWeight: '600',
                    }}>
                      {dispute.priority.toUpperCase()}
                    </div>
                  </div>
                  <p style={{
                    margin: '0 0 12px',
                    fontSize: 14,
                    color: PP.text.secondary,
                    lineHeight: 1.4,
                  }}>
                    {dispute.description}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleResolveDispute(dispute.id, 'favor_agent')}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 6,
                        background: '#10B98120',
                        color: '#10B981',
                        border: 'none',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Favor Agent
                    </button>
                    <button
                      onClick={() => handleResolveDispute(dispute.id, 'partial_refund')}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 6,
                        background: '#FDB02220',
                        color: '#FDB022',
                        border: 'none',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Partial Refund
                    </button>
                    <button
                      onClick={() => handleResolveDispute(dispute.id, 'favor_reporter')}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 6,
                        background: '#EF444420',
                        color: '#EF4444',
                        border: 'none',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Favor Reporter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fraud Alerts Tab */}
        {activeTab === 'fraud' && (
          <div>
            <h2 style={{
              margin: '0 0 16px',
              fontSize: 16,
              fontWeight: '600',
              color: PP.text.primary,
            }}>
              Active Fraud Alerts ({fraudAlerts.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {fraudAlerts.map(alert => (
                <div
                  key={alert.agent_id}
                  style={{
                    padding: 16,
                    border: `1px solid ${alert.risk_score === 'high' ? '#EF4444' : '#FDB022'}`,
                    borderRadius: 12,
                    background: PP.card,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <h3 style={{
                        margin: 0,
                        fontSize: 16,
                        fontWeight: '600',
                        color: PP.text.primary,
                      }}>
                        {alert.agent_name}
                      </h3>
                      <p style={{
                        margin: '4px 0 0',
                        fontSize: 13,
                        color: PP.text.secondary,
                      }}>
                        {alert.territory} • {alert.verification_count} verifications
                      </p>
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: alert.risk_score === 'high' ? '#EF444420' : '#FDB02220',
                      color: alert.risk_score === 'high' ? '#EF4444' : '#FDB022',
                      fontSize: 12,
                      fontWeight: '600',
                    }}>
                      {alert.risk_score.toUpperCase()}
                    </div>
                  </div>
                  <div style={{
                    marginBottom: 12,
                    padding: 8,
                    background: PP.bg,
                    borderRadius: 6,
                    fontSize: 13,
                  }}>
                    <div style={{ color: PP.text.secondary, marginBottom: 4 }}>Risk Factors:</div>
                    <div style={{ color: PP.text.primary }}>
                      {alert.risk_factors.map(f => f.replace('_', ' ')).join(' • ')}
                    </div>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    marginBottom: 12,
                    fontSize: 13,
                  }}>
                    <div>
                      <span style={{ color: PP.text.secondary }}>Accuracy:</span>
                      <div style={{ color: PP.text.primary, fontWeight: '600' }}>{alert.accuracy_score}%</div>
                    </div>
                    <div>
                      <span style={{ color: PP.text.secondary }}>Flagged:</span>
                      <div style={{ color: PP.text.primary }}>
                        {new Date(alert.flagged_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{
                        flex: 1,
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
                      Investigate
                    </button>
                    <button
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 6,
                        background: '#10B98120',
                        color: '#10B981',
                        border: 'none',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Clear Alert
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Territory Conflicts Tab */}
        {activeTab === 'territory' && (
          <div>
            <h2 style={{
              margin: '0 0 16px',
              fontSize: 16,
              fontWeight: '600',
              color: PP.text.primary,
            }}>
              Territory Conflicts ({territoryConflicts.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {territoryConflicts.map((conflict, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 16,
                    border: `1px solid ${PP.border}`,
                    borderRadius: 12,
                    background: PP.card,
                  }}
                >
                  <h3 style={{
                    margin: '0 0 12px',
                    fontSize: 16,
                    fontWeight: '600',
                    color: PP.text.primary,
                  }}>
                    {conflict.territory}, {conflict.state}
                  </h3>
                  <div style={{
                    marginBottom: 12,
                    padding: 12,
                    background: PP.bg,
                    borderRadius: 8,
                  }}>
                    {conflict.agents.map((agent, i) => (
                      <div
                        key={i}
                        style={{
                          padding: 8,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: i < conflict.agents.length - 1 ? `1px solid ${PP.border}` : 'none',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '600', color: PP.text.primary }}>
                            {agent.name}
                          </div>
                          <div style={{ fontSize: 12, color: PP.text.secondary, marginTop: 2 }}>
                            Certified: {agent.certified_date}
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: PP.text.secondary }}>
                          Agent {i + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: 6,
                        background: '#10B98120',
                        color: '#10B981',
                        border: 'none',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Reassign Secondary
                    </button>
                    <button
                      style={{
                        flex: 1,
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
                      Split Territory
                    </button>
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
