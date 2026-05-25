import AgentApplication from '../models/AgentApplication.js';

const success = (message, data = {}) => ({ status: 'success', success: true, message, data });
const failure = (message) => ({ status: 'error', success: false, message });

export class AgentApplicationService {
  // Submit a new application
  static async submitApplication(userData) {
    try {
      // Validate required fields
      if (!userData.name || !userData.email || !userData.phone) {
        return failure('Name, email, and phone are required');
      }

      if (!userData.country || !userData.state) {
        return failure('Country and state are required');
      }

      if (userData.experience === undefined || userData.experience === null) {
        return failure('Experience is required');
      }

      // Create application
      const application = await AgentApplication.create({
        userId: userData.userId || null,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        country: userData.country,
        state: userData.state,
        experience: parseInt(userData.experience, 10),
        references: userData.references || '',
        documents: userData.documents || [],
        status: 'pending'
      });

      // Calculate initial score
      const score = AgentApplication.generateScore(application);

      return success('Application submitted successfully', {
        ...application,
        score
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      return failure(error.message || 'Failed to submit application');
    }
  }

  // Review application (approve/reject)
  static async reviewApplication(id, approvalData) {
    try {
      const { status, reviewedBy, notes } = approvalData;

      // Validate status
      if (!['approved', 'rejected'].includes(status)) {
        return failure('Status must be "approved" or "rejected"');
      }

      if (!reviewedBy) {
        return failure('Reviewed by is required');
      }

      const application = await AgentApplication.updateReview(id, {
        status,
        reviewedBy,
        notes: notes || ''
      });

      if (!application) {
        return failure('Application not found');
      }

      return success(`Application ${status} successfully`, application);
    } catch (error) {
      console.error('Error reviewing application:', error);
      return failure(error.message || 'Failed to review application');
    }
  }

  // Get applications with filters
  static async getApplications(filters = {}) {
    try {
      const applications = await AgentApplication.findAll(filters);

      // Add scores to each application
      const applicationsWithScores = applications.map(app => ({
        ...app,
        score: AgentApplication.generateScore(app)
      }));

      return success('Applications retrieved', applicationsWithScores);
    } catch (error) {
      console.error('Error getting applications:', error);
      return failure(error.message || 'Failed to retrieve applications');
    }
  }

  // Get single application
  static async getApplication(id) {
    try {
      const application = await AgentApplication.findById(id);

      if (!application) {
        return failure('Application not found', null, 404);
      }

      return success('Application retrieved', {
        ...application,
        score: AgentApplication.generateScore(application)
      });
    } catch (error) {
      console.error('Error getting application:', error);
      return failure(error.message || 'Failed to retrieve application');
    }
  }

  // Get user's applications
  static async getUserApplications(userId) {
    try {
      const applications = await AgentApplication.findByUserId(userId);

      const applicationsWithScores = applications.map(app => ({
        ...app,
        score: AgentApplication.generateScore(app)
      }));

      return success('User applications retrieved', applicationsWithScores);
    } catch (error) {
      console.error('Error getting user applications:', error);
      return failure(error.message || 'Failed to retrieve user applications');
    }
  }

  // Get statistics
  static async getStatistics() {
    try {
      const pending = await AgentApplication.countByStatus('pending');
      const approved = await AgentApplication.countByStatus('approved');
      const rejected = await AgentApplication.countByStatus('rejected');

      return success('Statistics retrieved', {
        pending,
        approved,
        rejected,
        total: pending + approved + rejected
      });
    } catch (error) {
      console.error('Error getting statistics:', error);
      return failure(error.message || 'Failed to retrieve statistics');
    }
  }

  // Generate mock data (for development/testing)
  static async generateMockData() {
    try {
      const mockApplications = [
        // Pending applications
        {
          userId: null,
          name: 'Adaeze Okafor',
          email: 'adaeze@example.com',
          phone: '+234803456789',
          country: 'Nigeria',
          state: 'Lagos',
          experience: 5,
          references: 'Lagos Chamber of Commerce\nLocal Business Association',
          documents: ['license.pdf', 'certificate.pdf'],
          status: 'pending'
        },
        {
          userId: null,
          name: 'Tunde Akinbade',
          email: 'tunde@example.com',
          phone: '+234814567890',
          country: 'Nigeria',
          state: 'Oyo',
          experience: 3,
          references: 'Oyo State Government\nLocal Community Leader',
          documents: ['id_card.pdf'],
          status: 'pending'
        },
        {
          userId: null,
          name: 'Chisom Umeh',
          email: 'chisom@example.com',
          phone: '+234905678901',
          country: 'Nigeria',
          state: 'Enugu',
          experience: 2,
          references: 'Enugu Business Hub',
          documents: [],
          status: 'pending'
        },
        // Approved applications
        {
          userId: null,
          name: 'Emmanuel Okonkwo',
          email: 'emmanuel@example.com',
          phone: '+234916789012',
          country: 'Nigeria',
          state: 'Anambra',
          experience: 7,
          references: 'Anambra State Chamber\nNational Business Council\nLocal Authority',
          documents: ['license.pdf', 'certificate.pdf', 'training.pdf'],
          status: 'approved'
        },
        {
          userId: null,
          name: 'Amara Mensah',
          email: 'amara@example.com',
          phone: '+233279012345',
          country: 'Ghana',
          state: 'Greater Accra',
          experience: 6,
          references: 'Accra Business Forum\nCommunity Development',
          documents: ['license.pdf', 'certification.pdf'],
          status: 'approved'
        },
        // Rejected application
        {
          userId: null,
          name: 'Kwame Asante',
          email: 'kwame@example.com',
          phone: '+233249012345',
          country: 'Ghana',
          state: 'Ashanti',
          experience: 1,
          references: '',
          documents: [],
          status: 'rejected'
        }
      ];

      // Check if mock data already exists
      const existing = await AgentApplication.findAll({});
      if (existing.length > 0) {
        return success('Mock data already exists', { count: existing.length });
      }

      // Create mock applications
      const created = [];
      for (const app of mockApplications) {
        const result = await AgentApplication.create(app);
        created.push(result);
      }

      return success('Mock data generated', { count: created.length, applications: created });
    } catch (error) {
      console.error('Error generating mock data:', error);
      return failure(error.message || 'Failed to generate mock data');
    }
  }
}

export default AgentApplicationService;
