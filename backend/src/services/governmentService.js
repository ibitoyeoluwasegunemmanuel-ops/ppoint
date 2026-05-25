import GovernmentHierarchy from '../models/GovernmentHierarchy.js';
import GovernmentAgent from '../models/GovernmentAgent.js';
import GovernmentMetrics from '../models/GovernmentMetrics.js';

class GovernmentService {
  static roles = [
    'National Admin',
    'Infrastructure Analyst',
    'Emergency Admin',
    'Urban Planning',
    'Tax/Revenue'
  ];

  static levels = ['continent', 'country', 'state', 'city', 'area'];

  static async setupCountryHierarchy(country) {
    const countryRegion = await GovernmentHierarchy.createRegion({
      level: 'country',
      name: country,
      code: country.substring(0, 2).toUpperCase(),
      country,
      type: 'sovereign'
    });

    return countryRegion;
  }

  static async addRegionAdmin(regionId, agentData) {
    if (!this.roles.includes(agentData.role)) {
      throw new Error('Invalid role');
    }

    const region = await GovernmentHierarchy.findById(regionId);
    if (!region) throw new Error('Region not found');

    const agent = await GovernmentAgent.create({
      regionId,
      ...agentData,
      level: region.level,
      jurisdiction: region.code,
      status: 'active'
    });

    return agent;
  }

  static async getGovernmentDashboard(regionId) {
    const region = await GovernmentHierarchy.findById(regionId);
    if (!region) throw new Error('Region not found');

    const agents = await GovernmentAgent.findByRole(region.level);
    const metrics = await GovernmentMetrics.getCoverageStats(regionId);
    const agentStats = await GovernmentAgent.getStats();
    const hierarchyStats = await GovernmentHierarchy.getStats();

    const children = await GovernmentHierarchy.getChildren(regionId);

    return {
      region: {
        id: region.id,
        name: region.name,
        level: region.level,
        country: region.country
      },
      coverage: {
        totalAddresses: metrics?.total_addresses || 0,
        verifiedAddresses: metrics?.verified_addresses || 0,
        pendingVerification: metrics?.pending_verification || 0,
        verificationRate: metrics?.verified_addresses && metrics?.total_addresses 
          ? Math.round((metrics.verified_addresses / metrics.total_addresses) * 100)
          : 0
      },
      operations: {
        activeAgents: metrics?.active_agents || 0,
        totalAgents: agentStats?.total_agents || 0,
        activeAdmins: agentStats?.active_agents || 0
      },
      subregions: {
        count: children.length,
        items: children.slice(0, 10)
      },
      hierarchy: {
        totalRegions: hierarchyStats?.total_regions || 0,
        countries: hierarchyStats?.countries || 0,
        states: hierarchyStats?.states || 0,
        cities: hierarchyStats?.cities || 0
      }
    };
  }

  static async recordCoverageData(regionId, data) {
    const metrics = [];
    
    if (data.totalAddresses !== undefined) {
      metrics.push(
        await GovernmentMetrics.recordMetric({
          regionId,
          metricType: 'total_addresses',
          value: data.totalAddresses,
          category: 'coverage'
        })
      );
    }

    if (data.verifiedAddresses !== undefined) {
      metrics.push(
        await GovernmentMetrics.recordMetric({
          regionId,
          metricType: 'verified_addresses',
          value: data.verifiedAddresses,
          category: 'coverage'
        })
      );
    }

    if (data.activeAgents !== undefined) {
      metrics.push(
        await GovernmentMetrics.recordMetric({
          regionId,
          metricType: 'active_agents',
          value: data.activeAgents,
          category: 'operations'
        })
      );
    }

    return metrics;
  }

  static async getPanAfricanStats() {
    const countries = await GovernmentHierarchy.getCountries();
    const hierarchyStats = await GovernmentHierarchy.getStats();
    const agentStats = await GovernmentAgent.getStats();
    const coverageStats = await GovernmentMetrics.getCoverageStats();

    return {
      countries: countries.length,
      coverage: {
        totalAddresses: coverageStats?.total_addresses || 0,
        verifiedAddresses: coverageStats?.verified_addresses || 0,
        verificationRate: coverageStats?.verified_addresses && coverageStats?.total_addresses
          ? Math.round((coverageStats.verified_addresses / coverageStats.total_addresses) * 100)
          : 0,
        totalAgents: coverageStats?.active_agents || 0
      },
      infrastructure: {
        totalRegions: hierarchyStats?.total_regions || 0,
        states: hierarchyStats?.states || 0,
        cities: hierarchyStats?.cities || 0
      },
      administration: {
        totalAdmins: agentStats?.total_agents || 0,
        activeAdmins: agentStats?.active_agents || 0,
        roles: agentStats?.unique_roles || 0
      },
      countries: countries
    };
  }

  static generateMockHierarchy() {
    return [
      { name: 'Nigeria', level: 'country', code: 'NG' },
      { name: 'Kenya', level: 'country', code: 'KE' },
      { name: 'Ghana', level: 'country', code: 'GH' },
      { name: 'South Africa', level: 'country', code: 'ZA' },
      { name: 'Egypt', level: 'country', code: 'EG' }
    ];
  }
}

export default GovernmentService;
