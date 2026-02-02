import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { KillSwitch, AgentConfig, TransactionRequest } from '@killswitch/core';
import {
  authMiddleware,
  optionalAuth,
  adminOnly,
  agentAuth,
  rateLimit,
  createUser,
  getUserByEmail,
  verifyPassword,
  generateToken,
  generateApiKey
} from './auth';

const app = express();
const killSwitch = new KillSwitch();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Apply rate limiting globally
app.use(rateLimit(100, 60000));

// ============================================
// Public Endpoints (no auth required)
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ============================================
// Auth Endpoints
// ============================================

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const existing = getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Only allow 'user' role for self-registration, 'agent' for API clients
    const allowedRole = role === 'agent' ? 'agent' : 'user';
    const user = await createUser(email, password, allowedRole);
    const token = generateToken(user);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        apiKey: user.apiKey
      },
      token
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const user = getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(user);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/refresh-key', authMiddleware, (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  
  const newKey = generateApiKey();
  req.user.apiKey = newKey;
  
  res.json({ success: true, apiKey: newKey });
});

app.get('/api/auth/me', authMiddleware, (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  
  res.json({
    id: req.user.id,
    email: req.user.email,
    role: req.user.role,
    createdAt: req.user.createdAt
  });
});

// ============================================
// Agent Management (auth required)
// ============================================

app.post('/api/v1/agents', authMiddleware, (req: Request, res: Response) => {
  const agent: AgentConfig = req.body;
  killSwitch.registerAgent(agent);
  res.json({ success: true, agentId: agent.id });
});

app.post('/api/v1/validate', authMiddleware, async (req: Request, res: Response) => {
  const tx: TransactionRequest = req.body;
  const result = await killSwitch.validate(tx);
  res.json(result);
});

app.post('/api/v1/killswitch/trigger', authMiddleware, (req: Request, res: Response) => {
  const { agentId, reason } = req.body;
  killSwitch.triggerKillSwitch(agentId || null, 'manual', reason || 'Manual trigger');
  res.json({ success: true, triggered: true });
});

app.post('/api/v1/killswitch/reset', authMiddleware, adminOnly, (req: Request, res: Response) => {
  const { agentId } = req.body;
  killSwitch.resetKillSwitch(agentId);
  res.json({ success: true, reset: true });
});

app.get('/api/v1/killswitch/status', optionalAuth, (req: Request, res: Response) => {
  res.json({ globalKillActive: killSwitch.isGlobalKillActive() });
});

app.get('/api/v1/agents/:agentId/status', authMiddleware, (req: Request, res: Response) => {
  const status = killSwitch.getAgentStatus(req.params.agentId);
  res.json({ agentId: req.params.agentId, status });
});

// ============================================
// Runtime Fence Endpoints (agent auth)
// ============================================

app.post('/api/runtime/assess', agentAuth, async (req: Request, res: Response) => {
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

app.post('/api/runtime/kill', authMiddleware, (req: Request, res: Response) => {
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

app.get('/api/runtime/status', optionalAuth, (req: Request, res: Response) => {
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
// Token Endpoints (auth required)
// ============================================

app.get('/api/token/holdings', authMiddleware, async (req: Request, res: Response) => {
  const { wallet } = req.query;
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
// Governance Endpoints (auth required)
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

app.post('/api/governance/propose', authMiddleware, (req: Request, res: Response) => {
  const { title, description } = req.body;
  const proposer = req.user?.id || 'anonymous';
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

app.post('/api/governance/vote', authMiddleware, (req: Request, res: Response) => {
  const { proposalId, vote, weight } = req.body;
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

app.get('/api/governance/proposals', optionalAuth, (req: Request, res: Response) => {
  res.json({ proposals: Array.from(proposals.values()) });
});

app.get('/api/governance/proposals/:id', optionalAuth, (req: Request, res: Response) => {
  const proposal = proposals.get(req.params.id);
  if (!proposal) {
    return res.status(404).json({ error: 'Proposal not found' });
  }
  res.json(proposal);
});

// ============================================
// Audit Endpoints (auth required)
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

app.post('/api/audit/submit', authMiddleware, (req: Request, res: Response) => {
  const { contractAddress, auditType } = req.body;
  const requesterId = req.user?.id || 'anonymous';
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

app.get('/api/audit/status/:id', authMiddleware, (req: Request, res: Response) => {
  const audit = audits.get(req.params.id);
  if (!audit) {
    return res.status(404).json({ error: 'Audit not found' });
  }
  res.json(audit);
});

app.get('/api/audit/list', authMiddleware, (req: Request, res: Response) => {
  const requesterId = req.user?.id;
  let results = Array.from(audits.values());
  if (requesterId && req.user?.role !== 'admin') {
    results = results.filter(a => a.requesterId === requesterId);
  }
  res.json({ audits: results });
});

// ============================================
// Error handling
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('API running on port ' + PORT));

export default app;
