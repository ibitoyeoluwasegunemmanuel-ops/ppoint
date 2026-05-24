import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { inMemoryStore } from '../data/inMemoryStore.js';
import FieldAgent from '../models/FieldAgent.js';

const router = express.Router();

router.use(adminAuth);

// Agent Verification Approval Queue
router.get('/agents/pending-verification', async (req, res) => {
  try {
    const agents = inMemoryStore.listAgents()
      .filter(a => a.verification_status === 'pending')
      .map(a => ({
        id: a.id,
        full_name: a.full_name,
        email: a.email,
        phone_number: a.phone_number,
        state: a.state,
        territory: a.territory,
        submitted_at: a.created_at,
        documents: a.documents || [],
        risk_score: a.risk_score || 'low',
      }));

    res.json({ success: true, data: agents, total: agents.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/agents/:id/approve', async (req, res) => {
  try {
    const { notes } = req.body;
    const agent = inMemoryStore.getAgentById(req.params.id);
    if (!agent) return res.status(404).json({ success: false, error: 'Agent not found' });

    agent.verification_status = 'approved';
    agent.verified_at = new Date().toISOString();
    agent.verification_notes = notes || '';
    agent.certification_level = 'Bronze';

    res.json({ success: true, data: agent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/agents/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const agent = inMemoryStore.getAgentById(req.params.id);
    if (!agent) return res.status(404).json({ success: false, error: 'Agent not found' });

    agent.verification_status = 'rejected';
    agent.rejection_reason = reason || 'Does not meet verification criteria';

    res.json({ success: true, data: agent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Payout Request Review Dashboard
router.get('/payouts/pending', async (req, res) => {
  try {
    const agents = inMemoryStore.listAgents()
      .filter(a => a.pending_withdrawals && a.pending_withdrawals.length > 0)
      .map(a => ({
        agent_id: a.id,
        agent_name: a.full_name,
        state: a.state,
        territory: a.territory,
        certification_level: a.certification_level || 'Bronze',
        total_earnings: a.total_earnings || 0,
        balance_available: a.earnings_balance || 0,
        withdrawal_requests: a.pending_withdrawals || [],
      }));

    res.json({ success: true, data: agents, total: agents.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/payouts/:withdrawalId/approve', async (req, res) => {
  try {
    const { notes } = req.body;
    const agents = inMemoryStore.listAgents();
    let updated = false;

    for (const agent of agents) {
      const withdrawal = agent.pending_withdrawals?.find(w => w.id === req.params.withdrawalId);
      if (withdrawal) {
        withdrawal.status = 'approved';
        withdrawal.approved_at = new Date().toISOString();
        withdrawal.admin_notes = notes || '';
        updated = true;
        return res.json({ success: true, data: { withdrawal, agent_id: agent.id } });
      }
    }

    if (!updated) return res.status(404).json({ success: false, error: 'Withdrawal request not found' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/payouts/:withdrawalId/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const agents = inMemoryStore.listAgents();
    let updated = false;

    for (const agent of agents) {
      const withdrawal = agent.pending_withdrawals?.find(w => w.id === req.params.withdrawalId);
      if (withdrawal) {
        withdrawal.status = 'rejected';
        withdrawal.rejection_reason = reason || 'Fails compliance checks';
        withdrawal.rejected_at = new Date().toISOString();
        updated = true;
        return res.json({ success: true, data: { withdrawal, agent_id: agent.id } });
      }
    }

    if (!updated) return res.status(404).json({ success: false, error: 'Withdrawal request not found' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Payout History & Analytics
router.get('/payouts/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const state = req.query.state || null;

    let agents = inMemoryStore.listAgents();
    if (state) agents = agents.filter(a => a.state === state);

    const payoutHistory = agents.flatMap(a =>
      (a.withdrawal_history || []).map(w => ({
        id: w.id,
        agent_id: a.id,
        agent_name: a.full_name,
        amount: w.amount,
        status: w.status,
        requested_at: w.requested_at,
        processed_at: w.processed_at,
        method: w.method || 'bank_transfer',
      }))
    ).sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at));

    const paginated = payoutHistory.slice((page - 1) * limit, page * limit);
    res.json({ success: true, data: paginated, total: payoutHistory.length, page, limit });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dispute Resolution
router.get('/disputes/open', async (req, res) => {
  try {
    const disputes = inMemoryStore.listDisputes?.() || [];
    const openDisputes = disputes.filter(d => ['open', 'in_review'].includes(d.status))
      .map(d => ({
        id: d.id,
        ppoinnt_code: d.ppoinnt_code,
        reporter_id: d.reporter_id,
        reporter_name: d.reporter_name,
        dispute_type: d.dispute_type,
        description: d.description,
        created_at: d.created_at,
        status: d.status,
        priority: d.priority || 'medium',
        assigned_to: d.assigned_to || null,
      }));

    res.json({ success: true, data: openDisputes, total: openDisputes.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/disputes/:id/assign', async (req, res) => {
  try {
    const { admin_id, admin_name } = req.body;
    const disputes = inMemoryStore.listDisputes?.() || [];
    const dispute = disputes.find(d => d.id === req.params.id);

    if (!dispute) return res.status(404).json({ success: false, error: 'Dispute not found' });

    dispute.assigned_to = admin_id;
    dispute.assigned_name = admin_name;
    dispute.assigned_at = new Date().toISOString();
    dispute.status = 'in_review';

    res.json({ success: true, data: dispute });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/disputes/:id/resolve', async (req, res) => {
  try {
    const { resolution, ruling } = req.body;
    const disputes = inMemoryStore.listDisputes?.() || [];
    const dispute = disputes.find(d => d.id === req.params.id);

    if (!dispute) return res.status(404).json({ success: false, error: 'Dispute not found' });

    dispute.status = 'resolved';
    dispute.resolution = resolution;
    dispute.ruling = ruling; // 'favor_agent', 'favor_reporter', 'partial_refund'
    dispute.resolved_at = new Date().toISOString();

    res.json({ success: true, data: dispute });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fraud Detection & Alerts
router.get('/fraud-alerts', async (req, res) => {
  try {
    const agents = inMemoryStore.listAgents();
    const alerts = agents
      .filter(a => (a.risk_score === 'high' || a.risk_score === 'medium'))
      .map(a => ({
        agent_id: a.id,
        agent_name: a.full_name,
        risk_score: a.risk_score,
        risk_factors: a.risk_factors || [],
        verification_count: a.verification_count || 0,
        accuracy_score: a.accuracy_score || 0,
        territory: a.territory,
        state: a.state,
        flagged_at: a.flagged_at || new Date().toISOString(),
      }));

    res.json({ success: true, data: alerts, total: alerts.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/fraud-alerts/:agentId/investigate', async (req, res) => {
  try {
    const { finding, action } = req.body;
    const agent = inMemoryStore.getAgentById(req.params.agentId);
    if (!agent) return res.status(404).json({ success: false, error: 'Agent not found' });

    agent.investigation_status = 'in_progress';
    agent.investigation_finding = finding;
    agent.investigation_action = action; // 'suspend', 'monitor', 'clear'
    agent.investigated_at = new Date().toISOString();

    if (action === 'suspend') {
      agent.verification_status = 'suspended';
      agent.suspension_reason = finding;
    }

    res.json({ success: true, data: agent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Territory Conflict Resolution
router.get('/territory-conflicts', async (req, res) => {
  try {
    const agents = inMemoryStore.listAgents();
    const conflicts = [];

    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        if (agents[i].state === agents[j].state &&
            agents[i].territory === agents[j].territory &&
            agents[i].verification_status === 'approved' &&
            agents[j].verification_status === 'approved') {
          conflicts.push({
            agents: [
              { id: agents[i].id, name: agents[i].full_name, certified_date: agents[i].verified_at },
              { id: agents[j].id, name: agents[j].full_name, certified_date: agents[j].verified_at },
            ],
            territory: agents[i].territory,
            state: agents[i].state,
            conflict_type: 'duplicate_territory',
          });
        }
      }
    }

    res.json({ success: true, data: conflicts, total: conflicts.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/territory-conflicts/resolve', async (req, res) => {
  try {
    const { primary_agent_id, secondary_agent_id, resolution } = req.body;

    const primary = inMemoryStore.getAgentById(primary_agent_id);
    const secondary = inMemoryStore.getAgentById(secondary_agent_id);

    if (!primary || !secondary) {
      return res.status(404).json({ success: false, error: 'One or both agents not found' });
    }

    if (resolution === 'reassign_secondary') {
      secondary.territory = `${secondary.territory}_reassigned`;
      secondary.territory_reassigned_at = new Date().toISOString();
    } else if (resolution === 'split_territory') {
      primary.territory = `${primary.territory}_zone_a`;
      secondary.territory = `${secondary.territory}_zone_b`;
    }

    res.json({
      success: true,
      data: {
        primary_agent: primary,
        secondary_agent: secondary,
        resolution_applied: resolution
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
