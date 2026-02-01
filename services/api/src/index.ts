import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { KillSwitch, AgentConfig, TransactionRequest } from '@killswitch/core';

const app = express();
const killSwitch = new KillSwitch();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.post('/api/v1/agents', (req: Request, res: Response) => {
  const agent: AgentConfig = req.body;
  killSwitch.registerAgent(agent);
  res.json({ success: true, agentId: agent.id });
});

app.post('/api/v1/validate', async (req: Request, res: Response) => {
  const tx: TransactionRequest = req.body;
  const result = await killSwitch.validate(tx);
  res.json(result);
});

app.post('/api/v1/killswitch/trigger', (req: Request, res: Response) => {
  const { agentId, reason } = req.body;
  killSwitch.triggerKillSwitch(agentId || null, 'manual', reason || 'Manual trigger');
  res.json({ success: true, triggered: true });
});

app.post('/api/v1/killswitch/reset', (req: Request, res: Response) => {
  const { agentId } = req.body;
  killSwitch.resetKillSwitch(agentId);
  res.json({ success: true, reset: true });
});

app.get('/api/v1/killswitch/status', (req: Request, res: Response) => {
  res.json({ globalKillActive: killSwitch.isGlobalKillActive() });
});

app.get('/api/v1/agents/:agentId/status', (req: Request, res: Response) => {
  const status = killSwitch.getAgentStatus(req.params.agentId);
  res.json({ agentId: req.params.agentId, status });
});

// ============================================
// Runtime Fence Endpoints
// ============================================

app.post('/api/runtime/assess', async (req: Request, res: Response) => {
  const { agentId, action, context } = req.body;
  const tx = { agentId, action, target: context?.target || 'unknown', timestamp: Date.now() };
  const result = await killSwitch.validate(tx);
  res.json({
    agentId,
    riskScore: result.riskScore,
    riskLevel: result.riskLevel,
    allowed: result.allowed,
    reasons: result.reasons,
    timestamp: Date.now()
  });
});

app.post('/api/runtime/kill', (req: Request, res: Response) => {
  const { agentId, reason, immediate } = req.body;
  killSwitch.triggerKillSwitch(agentId || null, 'emergency', reason || 'Emergency kill switch activated');
  res.json({
    success: true,
    agentId: agentId || 'all',
    status: 'terminated',
    immediate: immediate ?? true,
    timestamp: Date.now()
  });
});

app.get('/api/runtime/status', (req: Request, res: Response) => {
  const globalKillActive = killSwitch.isGlobalKillActive();
  res.json({
    operational: !globalKillActive,
    globalKillActive,
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// ============================================
// Token Endpoints
// ============================================

app.get('/api/token/holdings', async (req: Request, res: Response) => {
  const { wallet } = req.query;
  // TODO: Integrate with Solana Web3.js for actual token balance
  res.json({
    wallet: wallet || 'unknown',
    token: '$KILLSWITCH',
    balance: 0,
    staked: 0,
    governancePower: 0,
    timestamp: Date.now()
  });
});

// ============================================
// Governance Endpoints
// ============================================

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  votes: { for: number; against: number };
  status: 'active' | 'passed' | 'rejected' | 'pending';
  createdAt: number;
}

const proposals: Map<string, Proposal> = new Map();

app.post('/api/governance/propose', (req: Request, res: Response) => {
  const { title, description, proposer } = req.body;
  const id = 'PROP-' + Date.now().toString(36).toUpperCase();
  const proposal: Proposal = {
    id,
    title,
    description,
    proposer,
    votes: { for: 0, against: 0 },
    status: 'active',
    createdAt: Date.now()
  };
  proposals.set(id, proposal);
  res.json({ success: true, proposalId: id, proposal });
});

app.post('/api/governance/vote', (req: Request, res: Response) => {
  const { proposalId, voter, vote, weight } = req.body;
  const proposal = proposals.get(proposalId);
  if (!proposal) {
    return res.status(404).json({ error: 'Proposal not found' });
  }
  if (vote === 'for') {
    proposal.votes.for += weight || 1;
  } else {
    proposal.votes.against += weight || 1;
  }
  res.json({ success: true, proposalId, currentVotes: proposal.votes });
});

app.get('/api/governance/proposals', (req: Request, res: Response) => {
  res.json({ proposals: Array.from(proposals.values()) });
});

app.get('/api/governance/proposals/:id', (req: Request, res: Response) => {
  const proposal = proposals.get(req.params.id);
  if (!proposal) {
    return res.status(404).json({ error: 'Proposal not found' });
  }
  res.json(proposal);
});

// ============================================
// Audit Endpoints
// ============================================

interface AuditRequest {
  id: string;
  requesterId: string;
  contractAddress: string;
  auditType: 'basic' | 'comprehensive' | 'emergency';
  status: 'pending' | 'in_progress' | 'complete' | 'failed';
  results: Record<string, unknown> | null;
  createdAt: number;
}

const audits: Map<string, AuditRequest> = new Map();

app.post('/api/audit/submit', (req: Request, res: Response) => {
  const { requesterId, contractAddress, auditType } = req.body;
  const id = 'AUDIT-' + Date.now().toString(36).toUpperCase();
  const audit: AuditRequest = {
    id,
    requesterId,
    contractAddress,
    auditType: auditType || 'basic',
    status: 'pending',
    results: null,
    createdAt: Date.now()
  };
  audits.set(id, audit);
  res.json({ success: true, auditId: id, audit });
});

app.get('/api/audit/status/:id', (req: Request, res: Response) => {
  const audit = audits.get(req.params.id);
  if (!audit) {
    return res.status(404).json({ error: 'Audit not found' });
  }
  res.json(audit);
});

app.get('/api/audit/list', (req: Request, res: Response) => {
  const { requesterId } = req.query;
  let results = Array.from(audits.values());
  if (requesterId) {
    results = results.filter(a => a.requesterId === requesterId);
  }
  res.json({ audits: results });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('API running on port ' + PORT));

export default app;

