import { useState, useEffect } from 'react';
import { PP } from '../styles/tokens';

function AnalyticsDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [eventType, setEventType] = useState('login');
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, [days]);

  useEffect(() => {
    fetchTrends();
  }, [eventType, days]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/dashboard?days=${days}`);
      const data = await response.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
    setLoading(false);
  };

  const fetchTrends = async () => {
    try {
      const response = await fetch(`/api/analytics/trends/${eventType}?days=${days}`);
      const data = await response.json();
      if (data.success) {
        setTrends(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch trends:', error);
    }
  };

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
    controls: {
      display: 'flex',
      gap: '16px',
      marginBottom: '24px',
      flexWrap: 'wrap'
    },
    select: {
      background: PP.colors.card,
      color: PP.colors.text,
      border: `1px solid ${PP.colors.border}`,
      padding: '8px 12px',
      borderRadius: '8px',
      fontSize: '14px',
      cursor: 'pointer'
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '16px',
      marginBottom: '32px'
    },
    metricCard: {
      background: PP.colors.card,
      border: `1px solid ${PP.colors.border}`,
      borderRadius: '12px',
      padding: '24px',
      position: 'relative'
    },
    metricLabel: {
      fontSize: '13px',
      color: PP.colors.textSecondary,
      marginBottom: '12px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    metricValue: {
      fontSize: '28px',
      fontWeight: '600',
      color: PP.colors.accent
    },
    trendsContainer: {
      background: PP.colors.card,
      border: `1px solid ${PP.colors.border}`,
      borderRadius: '12px',
      padding: '24px'
    },
    trendsHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px'
    },
    trendsTitle: {
      fontSize: '18px',
      fontWeight: '600'
    },
    trendsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    trendItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px',
      background: PP.colors.background,
      borderRadius: '8px',
      fontSize: '14px'
    },
    trendDate: {
      color: PP.colors.textSecondary
    },
    trendCount: {
      fontWeight: '600',
      color: PP.colors.accent
    },
    barChart: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '8px',
      height: '120px',
      marginTop: '16px'
    },
    bar: {
      flex: 1,
      background: PP.colors.accent,
      borderRadius: '4px 4px 0 0',
      minHeight: '8px'
    },
    loadingState: {
      textAlign: 'center',
      padding: '48px 24px',
      color: PP.colors.textSecondary
    }
  };

  if (loading && !metrics) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>Loading analytics...</div>
      </div>
    );
  }

  const maxTrendValue = trends?.reduce((max, t) => Math.max(max, t.count), 0) || 1;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Analytics Dashboard</h1>
        <p style={styles.subtitle}>Monitor platform activity and user engagement</p>
      </div>

      <div style={styles.controls}>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          style={styles.select}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>

        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          style={styles.select}
        >
          <option value="login">Logins</option>
          <option value="transaction">Transactions</option>
          <option value="address_creation">Address Creation</option>
          <option value="api_call">API Calls</option>
        </select>
      </div>

      {metrics && (
        <div style={styles.metricsGrid}>
          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Active Users</div>
            <div style={styles.metricValue}>{metrics.active_users || 0}</div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Total Events</div>
            <div style={styles.metricValue}>{metrics.total_events || 0}</div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Logins</div>
            <div style={styles.metricValue}>{metrics.logins || 0}</div>
          </div>

          <div style={styles.metricCard}>
            <div style={styles.metricLabel}>Transactions</div>
            <div style={styles.metricValue}>{metrics.transactions || 0}</div>
          </div>
        </div>
      )}

      {trends && (
        <div style={styles.trendsContainer}>
          <div style={styles.trendsHeader}>
            <h2 style={styles.trendsTitle}>{eventType.replace('_', ' ').toUpperCase()} Trend</h2>
          </div>

          {trends.length > 0 ? (
            <>
              <div style={styles.barChart}>
                {trends.slice(0, 7).map((trend, idx) => {
                  const height = (trend.count / maxTrendValue) * 100;
                  return (
                    <div
                      key={idx}
                      style={{
                        ...styles.bar,
                        height: `${Math.max(height, 8)}px`
                      }}
                      title={`${trend.date}: ${trend.count} events`}
                    />
                  );
                })}
              </div>

              <div style={styles.trendsList}>
                {trends.map((trend, idx) => (
                  <div key={idx} style={styles.trendItem}>
                    <span style={styles.trendDate}>{trend.date}</span>
                    <span style={styles.trendCount}>{trend.count} events</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={styles.loadingState}>No data available for this period</p>
          )}
        </div>
      )}
    </div>
  );
}

export default AnalyticsDashboardPage;
