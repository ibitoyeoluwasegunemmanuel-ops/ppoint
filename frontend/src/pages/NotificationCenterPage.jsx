import { useState, useEffect } from 'react';
import { PP } from '../styles/tokens';

function NotificationCenterPage() {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) return;

      const response = await fetch(`/api/notifications/users/${userId}`);
      const data = await response.json();
      if (data.success) {
        let filtered = data.data || [];
        if (filter !== 'all') {
          filtered = filtered.filter(n => {
            if (filter === 'unread') return n.status === 'pending';
            if (filter === 'read') return n.status === 'read';
            return n.type === filter;
          });
        }
        setNotifications(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/notifications/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      fetchNotifications();
      fetchStats();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getChannelIcon = (channel) => {
    const icons = {
      email: '📧',
      sms: '📱',
      push: '🔔',
      inapp: '💬'
    };
    return icons[channel] || '📬';
  };

  const getTypeColor = (type) => {
    const colors = {
      welcome: PP.colors.accent,
      verification: '#4CAF50',
      payment: '#FF9800',
      emergency: '#F44336',
      application_status: '#2196F3',
      agent_dispatch: '#9C27B0',
      government_alert: '#00BCD4'
    };
    return colors[type] || PP.colors.textSecondary;
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: PP.colors.background,
      color: PP.colors.text,
      padding: '24px',
      fontFamily: PP.fonts.family,
      maxWidth: '900px',
      margin: '0 auto'
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
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '12px',
      marginBottom: '32px'
    },
    statCard: {
      background: PP.colors.card,
      border: `1px solid ${PP.colors.border}`,
      borderRadius: '8px',
      padding: '16px',
      textAlign: 'center'
    },
    statValue: {
      fontSize: '24px',
      fontWeight: '600',
      color: PP.colors.accent,
      marginBottom: '4px'
    },
    statLabel: {
      fontSize: '12px',
      color: PP.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    filterButtons: {
      display: 'flex',
      gap: '8px',
      marginBottom: '24px',
      flexWrap: 'wrap'
    },
    filterButton: {
      background: 'transparent',
      color: PP.colors.textSecondary,
      border: `1px solid ${PP.colors.border}`,
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      '&:hover': {
        borderColor: PP.colors.accent
      }
    },
    filterButtonActive: {
      background: PP.colors.accent,
      color: PP.colors.background,
      borderColor: PP.colors.accent
    },
    notificationsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    notificationItem: {
      background: PP.colors.card,
      border: `1px solid ${PP.colors.border}`,
      borderRadius: '8px',
      padding: '16px',
      display: 'flex',
      gap: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      '&:hover': {
        borderColor: PP.colors.accent,
        background: 'rgba(255, 199, 44, 0.02)'
      }
    },
    notificationIcon: {
      fontSize: '24px',
      flexShrink: 0
    },
    notificationContent: {
      flex: 1,
      minWidth: 0
    },
    notificationSubject: {
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '4px',
      color: PP.colors.text
    },
    notificationMessage: {
      fontSize: '13px',
      color: PP.colors.textSecondary,
      marginBottom: '8px',
      lineHeight: '1.4'
    },
    notificationMeta: {
      display: 'flex',
      gap: '12px',
      fontSize: '12px',
      color: PP.colors.textSecondary
    },
    notificationBadge: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: '0.3px'
    },
    markReadButton: {
      background: 'transparent',
      color: PP.colors.accent,
      border: 'none',
      fontSize: '12px',
      cursor: 'pointer',
      padding: '4px 8px',
      borderRadius: '4px',
      transition: 'all 0.2s',
      '&:hover': {
        background: 'rgba(255, 199, 44, 0.1)'
      }
    },
    emptyState: {
      textAlign: 'center',
      padding: '48px 24px',
      color: PP.colors.textSecondary
    }
  };

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Unread', value: 'unread' },
    { label: 'Verification', value: 'verification' },
    { label: 'Payment', value: 'payment' },
    { label: 'Emergency', value: 'emergency' }
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Notification Center</h1>
        <p style={styles.subtitle}>Manage all your notifications and alerts</p>
      </div>

      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.total || 0}</div>
            <div style={styles.statLabel}>Total</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.sent || 0}</div>
            <div style={styles.statLabel}>Sent</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.pending || 0}</div>
            <div style={styles.statLabel}>Pending</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.failed || 0}</div>
            <div style={styles.statLabel}>Failed</div>
          </div>
        </div>
      )}

      <div style={styles.filterButtons}>
        {filterOptions.map(option => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            style={{
              ...styles.filterButton,
              ...(filter === option.value ? styles.filterButtonActive : {})
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading && !notifications.length ? (
        <div style={styles.emptyState}>Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div style={styles.emptyState}>No notifications yet</div>
      ) : (
        <div style={styles.notificationsList}>
          {notifications.map(notification => (
            <div key={notification.id} style={styles.notificationItem}>
              <div style={styles.notificationIcon}>
                {getChannelIcon(notification.channel)}
              </div>
              <div style={styles.notificationContent}>
                <div style={styles.notificationSubject}>
                  {notification.subject}
                </div>
                <div style={styles.notificationMessage}>
                  {notification.message}
                </div>
                <div style={styles.notificationMeta}>
                  <span
                    style={{
                      ...styles.notificationBadge,
                      background: getTypeColor(notification.type) + '20',
                      color: getTypeColor(notification.type)
                    }}
                  >
                    {notification.type}
                  </span>
                  <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                  {notification.status !== 'read' && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      style={styles.markReadButton}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationCenterPage;
