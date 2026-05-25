import APIUsage from '../models/APIUsage.js';
import DeveloperAccount from '../models/DeveloperAccount.js';

class BusinessAnalyticsService {
  static async getDeveloperDashboard(developerId) {
    const account = await DeveloperAccount.findById(developerId);
    if (!account) throw new Error('Developer account not found');

    const metrics = await DeveloperAccount.getDeveloperMetrics(developerId);
    const usageStats = await APIUsage.getUsageStats(account.api_key);
    const endpointStats = await APIUsage.getEndpointStats(account.api_key, 5);
    const dailyStats = await APIUsage.getDailyStats(account.api_key, 7);

    return {
      account: {
        id: account.id,
        businessName: account.business_name,
        tier: account.tier,
        email: account.email,
        createdAt: account.created_at,
        status: account.status
      },
      metrics: {
        uniqueEndpoints: metrics?.unique_endpoints || 0,
        totalApiCalls: metrics?.total_api_calls || 0,
        avgResponseTime: metrics?.avg_response_time || 0
      },
      usageStats: {
        totalRequests: parseInt(usageStats?.total_requests || 0),
        successfulRequests: parseInt(usageStats?.successful_requests || 0),
        failedRequests: parseInt(usageStats?.failed_requests || 0),
        avgResponseTime: Math.round(usageStats?.avg_response_time || 0),
        totalDataTransfer: Math.round((usageStats?.total_request_size || 0 + usageStats?.total_response_size || 0) / 1024 / 1024) // MB
      },
      topEndpoints: endpointStats,
      dailyStats
    };
  }

  static async getPlatformStats(startDate = null) {
    const freeTierStats = await APIUsage.getTierStats('free', startDate);
    const prοTierStats = await APIUsage.getTierStats('pro', startDate);
    const enterpriseTierStats = await APIUsage.getTierStats('enterprise', startDate);

    const freeCount = await DeveloperAccount.countByTier('free');
    const proCount = await DeveloperAccount.countByTier('pro');
    const enterpriseCount = await DeveloperAccount.countByTier('enterprise');

    return {
      developers: {
        free: freeCount,
        pro: proCount,
        enterprise: enterpriseCount,
        total: freeCount + proCount + enterpriseCount
      },
      apiUsage: {
        free: {
          requests: freeTierStats?.total_requests || 0,
          users: freeTierStats?.unique_users || 0,
          avgResponseTime: Math.round(freeTierStats?.avg_response_time || 0),
          errors: freeTierStats?.error_count || 0
        },
        pro: {
          requests: proTierStats?.total_requests || 0,
          users: proTierStats?.unique_users || 0,
          avgResponseTime: Math.round(proTierStats?.avg_response_time || 0),
          errors: proTierStats?.error_count || 0
        },
        enterprise: {
          requests: enterpriseTierStats?.total_requests || 0,
          users: enterpriseTierStats?.unique_users || 0,
          avgResponseTime: Math.round(enterpriseTierStats?.avg_response_time || 0),
          errors: enterpriseTierStats?.error_count || 0
        }
      }
    };
  }

  static async getEndpointMetrics(endpoint, startDate = null) {
    const query = startDate
      ? `SELECT COUNT(*) as calls, AVG(response_time_ms) as avg_time,
           SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errors
         FROM api_usage_logs
         WHERE endpoint = $1 AND created_at > $2`
      : `SELECT COUNT(*) as calls, AVG(response_time_ms) as avg_time,
           SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errors
         FROM api_usage_logs
         WHERE endpoint = $1`;

    return {
      endpoint,
      calls: 0,
      avgResponseTime: 0,
      errors: 0
    };
  }

  static calculateRateLimit(tier) {
    const limits = {
      free: { requestsPerHour: 1000, requestsPerDay: 10000, dataLimitMB: 100 },
      pro: { requestsPerHour: 10000, requestsPerDay: 500000, dataLimitMB: 10000 },
      enterprise: { requestsPerHour: null, requestsPerDay: null, dataLimitMB: null }
    };
    return limits[tier] || limits.free;
  }

  static generateMockDeveloperAccount() {
    const names = ['TechCorp', 'DataFlow', 'LocationHub', 'MapSync', 'AddressNet'];
    const name = names[Math.floor(Math.random() * names.length)];
    const tier = ['free', 'pro', 'enterprise'][Math.floor(Math.random() * 3)];

    return {
      businessName: `${name} Solutions`,
      website: `https://${name.toLowerCase()}.example.com`,
      email: `contact@${name.toLowerCase()}.example.com`,
      contactPhone: `+234${Math.random().toString().slice(2, 11)}`,
      tier
    };
  }
}

export default BusinessAnalyticsService;
