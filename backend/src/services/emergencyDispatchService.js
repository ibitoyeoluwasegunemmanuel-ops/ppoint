import EmergencyIncident from '../models/EmergencyIncident.js';

class EmergencyDispatchService {
  static async reportIncident(data) {
    const { reporterName, reporterPhone, location, latitude, longitude, incidentType, description, severity, address } = data;

    if (!reporterName || !reporterPhone || !location || !incidentType || !severity) {
      throw new Error('Missing required fields: reporterName, reporterPhone, location, incidentType, severity');
    }

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      throw new Error('Invalid severity level');
    }

    const incident = await EmergencyIncident.create({
      reporterName,
      reporterPhone,
      location,
      latitude,
      longitude,
      incidentType,
      description,
      severity,
      address
    });

    return {
      ...incident,
      responseTime: null,
      priority: this.calculatePriority(incident)
    };
  }

  static async getIncidents(filters = {}) {
    const incidents = await EmergencyIncident.findAll(filters);
    return incidents.map(inc => ({
      ...inc,
      priority: this.calculatePriority(inc),
      age: this.getIncidentAge(inc.created_at)
    }));
  }

  static async assignDispatcher(incidentId, dispatcherId, dispatcherName) {
    const incident = await EmergencyIncident.assignDispatcher(incidentId, dispatcherId, dispatcherName);
    return {
      ...incident,
      priority: this.calculatePriority(incident)
    };
  }

  static async updateIncidentStatus(incidentId, status) {
    const validStatuses = ['reported', 'assigned', 'in_progress', 'closed'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    const incident = await EmergencyIncident.updateStatus(incidentId, status);
    return {
      ...incident,
      priority: this.calculatePriority(incident)
    };
  }

  static async closeIncident(incidentId, resolutionNotes) {
    const incident = await EmergencyIncident.closeIncident(incidentId, resolutionNotes);
    return {
      ...incident,
      responseTime: this.getResponseTime(incident)
    };
  }

  static async getStats() {
    const stats = await EmergencyIncident.getStats();
    return {
      ...stats,
      avgResponseTimeMinutes: stats.avg_response_time ? Math.round(stats.avg_response_time / 60) : 0,
      criticalPercentage: stats.total > 0 ? Math.round((stats.critical_count / stats.total) * 100) : 0
    };
  }

  static calculatePriority(incident) {
    const severityScore = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };

    const ageMinutes = this.getIncidentAge(incident.created_at);
    let priority = severityScore[incident.severity] || 0;

    if (ageMinutes > 30) priority += 2;
    else if (ageMinutes > 15) priority += 1;

    return Math.min(priority, 5);
  }

  static getIncidentAge(createdAt) {
    const now = new Date();
    const created = new Date(createdAt);
    return Math.round((now - created) / 60000);
  }

  static getResponseTime(incident) {
    if (!incident.closed_at) return null;
    const created = new Date(incident.created_at);
    const closed = new Date(incident.closed_at);
    return Math.round((closed - created) / 60000);
  }

  static async generateMockIncidents() {
    const mockIncidents = [
      {
        reporterName: 'Chioma Adeyemi',
        reporterPhone: '+2348056789012',
        location: 'Ikoyi, Lagos',
        latitude: 6.4654,
        longitude: 3.6386,
        incidentType: 'Medical Emergency',
        description: 'Severe car accident with multiple casualties',
        severity: 'critical',
        address: 'Third Mainland Bridge, Lagos'
      },
      {
        reporterName: 'Ibrahim Hassan',
        reporterPhone: '+2347031234567',
        location: 'Victoria Island, Lagos',
        latitude: 6.4298,
        longitude: 3.5629,
        incidentType: 'Fire',
        description: 'Building fire in commercial area',
        severity: 'high',
        address: 'VI Waterfront, Lagos'
      },
      {
        reporterName: 'Blessing Okoro',
        reporterPhone: '+2349056781234',
        location: 'Lekki, Lagos',
        latitude: 6.4550,
        longitude: 3.5700,
        incidentType: 'Security Threat',
        description: 'Attempted robbery at residential area',
        severity: 'high',
        address: 'Lekki Phase 1, Lagos'
      }
    ];

    const incidents = [];
    for (const mock of mockIncidents) {
      const incident = await EmergencyIncident.create(mock);
      incidents.push(incident);
    }

    return incidents;
  }
}

export default EmergencyDispatchService;
