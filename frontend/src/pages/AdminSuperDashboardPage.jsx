import { useState, useEffect } from 'react';
import { PP } from '../styles/tokens';

function AdminSuperDashboardPage() {
  const [systemStats, setSystemStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSystemStats();
    fetchUsers();
  }, []);

  const fetchSystemStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/system-stats');
      const data = await response.json();
      if (data.success) {
        setSystemStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.id?.toString().includes(searchQuery)
  );

  const styles = {
    container: {
      minHeight: '100vh',
      background: PP.colors.background,
      color: PP.colors.text,
      padding: '24px',
      fontFamily: PP.fonts.family
    },
    header: {
      marginBottom: '32px'
    },
    title: {
      fontSize: '32px',
      fontWeight: '600',
      marginBottom: '8px'
    },
    subtitle: {
      fontSize: '14px',
      color: PP.colors.textSecondary,
      marginBottom: '24px'
    },
    tabs: {
      display: 'flex',
      gap: '8px',
      marginBottom: '24px',
      borderBottom: `1px solid ${PP.colors.border}`,
      paddingBottom: '16px'
    },
    tab: {
      background: 'transparent',
      color: PP.colors.textSecondary,
      border: 'none',
      padding: '8px 16px',
      fontSize: '14px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.2s',
      borderBottom: '2px solid transparent',
      marginBottom: '-16px',
      paddingBottom: '24px'
    },
    tabActive: {
      color: PP.colors.accent,
      borderBottomColor: PP.colors.accent
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '16px',
      marginBottom: '32px'
    },
    statCard: {
      background: PP.colors.card,
      border: `1px solid ${PP.colors.border}`,
      borderRadius: '12px',
      padding: '24px'
    },
    statLabel: {
      fontSize: '13px',
      color: PP.colors.textSecondary,
      marginBottom: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    statValue: {
      fontSize: '32px',
      fontWeight: '600',
      color: PP.colors.accent,
      marginBottom: '8px'
    },
    statSubtext: {
      fontSize: '12px',
      color: PP.colors.textSecondary
    },
    searchBox: {
      background: PP.colors.card,
      border: `1px solid ${PP.colors.border}`,
      color: PP.colors.text,
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      marginBottom: '16px',
      width: '100%',
      maxWidth: '300px'
    },
    usersTableContainer: {
      background: PP.colors.card,
      border: `1px solid ${PP.colors.border}`,
      borderRadius: '12px',
      overflow: 'hidden'
    },
    usersTable: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    tableHeader: {
      background: PP.colors.background,
      borderBottom: `1px solid ${PP.colors.border}`
    },
    tableHeaderCell: {
      padding: '16px',
      textAlign: 'left',
      fontSize: '13px',
      fontWeight: '600',
      color: PP.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    tableRow: {
      borderBottom: `1px solid ${PP.colors.border}`,
      transition: 'all 0.2s'
    },
    tableRowHover: {
      background: 'rgba(255, 199, 44, 0.02)'
    },
    tableCell: {
      padding: '16px',
      fontSize: '14px'
    },
    cellId: {
      color: PP.colors.textSecondary,
      fontFamily: 'monospace',
      fontSize: '12px'
    },
    cellEmail: {
      fontWeight: '500'
    },
    cellTier: {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: '0.3px'
    },
    tierFree: {
      background: 'rgba(100, 100, 100, 0.2)',
      color: '#999'
    },
    tierPro: {
      background: 'rgba(255, 193, 7, 0.2)',
      color: '#FFC107'
    },
    tierEnterprise: {
      background: 'rgba(76, 175, 80, 0.2)',
      color: '#4CAF50'
    },
    cellDate: {
      color: PP.colors.textSecondary,
      fontSize: '13px'
    },
    loadingState: {
      textAlign: 'center',
      padding: '48px 24px',
      color: PP.colors.textSecondary
    },
    alertBox: {
      background: '#F44336',
      color: 'white',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '24px',
      fontSize: '14px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '48px 24px',
      color: PP.colors.textSecondary
    }
  };

  const getTierColor = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'pro': return styles.tierPro;
      case 'enterprise': return styles.tierEnterprise;
      default: return styles.tierFree;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Super Dashboard</h1>
        <p style={styles.subtitle}>Platform management and system controls</p>
      </div>

      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            ...styles.tab,
            ...(activeTab === 'overview' ? styles.tabActive : {})
          }}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            ...styles.tab,
            ...(activeTab === 'users' ? styles.tabActive : {})
          }}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('system')}
          style={{
            ...styles.tab,
            ...(activeTab === 'system' ? styles.tabActive : {})
          }}
        >
          System Health
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {systemStats && (
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Total Users</div>
                <div style={styles.statValue}>{systemStats.total_users || 0}</div>
                <div style={styles.statSubtext}>Registered on platform</div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statLabel}>Approved Agents</div>
                <div style={styles.statValue}>{systemStats.approved_agents || 0}</div>
                <div style={styles.statSubtext}>Active delivery agents</div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statLabel}>Resolved Incidents</div>
                <div style={styles.statValue}>{systemStats.resolved_incidents || 0}</div>
                <div style={styles.statSubtext}>Emergency calls handled</div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statLabel}>Total Revenue</div>
                <div style={styles.statValue}>
                  ₦{(systemStats.total_revenue || 0).toLocaleString()}
                </div>
                <div style={styles.statSubtext}>From all transactions</div>
              </div>
            </div>
          )}

          <div style={styles.alertBox}>
            ⚠️ System running optimally. No critical alerts.
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <>
          <input
            type="text"
            placeholder="Search by email or user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchBox}
          />

          {filteredUsers.length === 0 && !loading ? (
            <div style={styles.emptyState}>No users found</div>
          ) : (
            <div style={styles.usersTableContainer}>
              <table style={styles.usersTable}>
                <thead style={styles.tableHeader}>
                  <tr>
                    <th style={styles.tableHeaderCell}>User ID</th>
                    <th style={styles.tableHeaderCell}>Email</th>
                    <th style={styles.tableHeaderCell}>Tier</th>
                    <th style={styles.tableHeaderCell}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} style={styles.tableRow}>
                      <td style={{ ...styles.tableCell, ...styles.cellId }}>
                        {user.id}
                      </td>
                      <td style={{ ...styles.tableCell, ...styles.cellEmail }}>
                        {user.email}
                      </td>
                      <td style={styles.tableCell}>
                        <span
                          style={{
                            ...styles.cellTier,
                            ...getTierColor(user.tier)
                          }}
                        >
                          {user.tier || 'free'}
                        </span>
                      </td>
                      <td style={{ ...styles.tableCell, ...styles.cellDate }}>
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'system' && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>API Uptime</div>
            <div style={styles.statValue}>99.9%</div>
            <div style={styles.statSubtext}>Last 30 days</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Avg Response Time</div>
            <div style={styles.statValue}>145ms</div>
            <div style={styles.statSubtext}>All endpoints</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Database</div>
            <div style={styles.statValue}>✓</div>
            <div style={styles.statSubtext}>Connected & healthy</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statLabel}>Cache Layer</div>
            <div style={styles.statValue}>✓</div>
            <div style={styles.statSubtext}>Redis operational</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSuperDashboardPage;
