import { Request, Response, Router, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// Audit log entry structure
interface AuditLogEntry {
  id: string;
  timestamp: number;
  userId: string | null;
  agentId: string | null;
  action: string;
  target: string;
  result: 'allowed' | 'blocked' | 'killed';
  riskScore: number;
  riskLevel: string;
  reasons: string[];
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, unknown>;
}

// In-memory log store (replace with database/file in production)
const auditLogs: AuditLogEntry[] = [];
const MAX_LOGS = 10000; // Keep last 10k entries in memory

// Log file path
const LOG_DIR = process.env.LOG_DIR || './logs';
const LOG_FILE = path.join(LOG_DIR, 'audit.jsonl');

// Ensure log directory exists
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

// Write log entry to file (append-only JSONL format)
function writeToFile(entry: AuditLogEntry) {
  try {
    ensureLogDir();
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

// Create new audit log entry
export function logAuditEvent(
  userId: string | null,
  agentId: string | null,
  action: string,
  target: string,
  result: 'allowed' | 'blocked' | 'killed',
  riskScore: number,
  riskLevel: string,
  reasons: string[],
  req?: Request,
  metadata?: Record<string, unknown>
): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: 'LOG-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    timestamp: Date.now(),
    userId,
    agentId,
    action,
    target,
    result,
    riskScore,
    riskLevel,
    reasons,
    ipAddress: req?.ip || 'unknown',
    userAgent: req?.get('User-Agent') || 'unknown',
    metadata: metadata || {}
  };

  // Add to in-memory store
  auditLogs.push(entry);
  
  // Trim if too many
  if (auditLogs.length > MAX_LOGS) {
    auditLogs.shift();
  }

  // Write to file
  writeToFile(entry);

  return entry;
}

// Middleware to log all fence-related requests
export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);
  
  res.json = function(body: any) {
    // Log fence assessment results
    if (req.path.includes('/runtime/assess') && body) {
      logAuditEvent(
        (req as any).user?.id || null,
        body.agentId || req.body?.agentId || null,
        req.body?.action || 'unknown',
        req.body?.context?.target || 'unknown',
        body.allowed ? 'allowed' : 'blocked',
        body.riskScore || 0,
        body.riskLevel || 'unknown',
        body.reasons || [],
        req
      );
    }
    
    // Log kill switch activations
    if (req.path.includes('/runtime/kill') && body?.success) {
      logAuditEvent(
        (req as any).user?.id || null,
        req.body?.agentId || 'all',
        'kill_switch',
        'system',
        'killed',
        100,
        'critical',
        [req.body?.reason || 'Manual kill'],
        req
      );
    }

    return originalJson(body);
  };

  next();
}

// ============================================
// Audit Log API Endpoints
// ============================================

// Get recent audit logs
router.get('/api/audit-logs', (req: Request, res: Response) => {
  const { limit = 100, offset = 0, agentId, action, result } = req.query;
  
  let filtered = [...auditLogs];
  
  // Apply filters
  if (agentId) {
    filtered = filtered.filter(log => log.agentId === agentId);
  }
  if (action) {
    filtered = filtered.filter(log => log.action === action);
  }
  if (result) {
    filtered = filtered.filter(log => log.result === result);
  }
  
  // Sort by timestamp descending (most recent first)
  filtered.sort((a, b) => b.timestamp - a.timestamp);
  
  // Paginate
  const start = Number(offset);
  const end = start + Number(limit);
  const paginated = filtered.slice(start, end);
  
  res.json({
    total: filtered.length,
    offset: start,
    limit: Number(limit),
    logs: paginated
  });
});

// Get audit log by ID
router.get('/api/audit-logs/:id', (req: Request, res: Response) => {
  const log = auditLogs.find(l => l.id === req.params.id);
  
  if (!log) {
    return res.status(404).json({ error: 'Log entry not found' });
  }
  
  res.json(log);
});

// Get audit log statistics
router.get('/api/audit-logs/stats', (req: Request, res: Response) => {
  const { since } = req.query;
  const sinceTs = since ? Number(since) : Date.now() - 24 * 60 * 60 * 1000; // Last 24 hours
  
  const recentLogs = auditLogs.filter(log => log.timestamp >= sinceTs);
  
  const stats = {
    totalEvents: recentLogs.length,
    allowed: recentLogs.filter(l => l.result === 'allowed').length,
    blocked: recentLogs.filter(l => l.result === 'blocked').length,
    killed: recentLogs.filter(l => l.result === 'killed').length,
    avgRiskScore: recentLogs.length > 0 
      ? Math.round(recentLogs.reduce((sum, l) => sum + l.riskScore, 0) / recentLogs.length)
      : 0,
    topBlockedActions: getTopItems(recentLogs.filter(l => l.result === 'blocked'), 'action', 5),
    topBlockedTargets: getTopItems(recentLogs.filter(l => l.result === 'blocked'), 'target', 5),
    activeAgents: [...new Set(recentLogs.map(l => l.agentId).filter(Boolean))].length,
    period: {
      from: sinceTs,
      to: Date.now()
    }
  };
  
  res.json(stats);
});

// Helper: Get top N items by frequency
function getTopItems(logs: AuditLogEntry[], field: keyof AuditLogEntry, n: number): { value: string; count: number }[] {
  const counts: Record<string, number> = {};
  
  logs.forEach(log => {
    const value = String(log[field]);
    counts[value] = (counts[value] || 0) + 1;
  });
  
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([value, count]) => ({ value, count }));
}

// Export logs as CSV
router.get('/api/audit-logs/export/csv', (req: Request, res: Response) => {
  const { since, until } = req.query;
  const sinceTs = since ? Number(since) : 0;
  const untilTs = until ? Number(until) : Date.now();
  
  const filtered = auditLogs.filter(log => 
    log.timestamp >= sinceTs && log.timestamp <= untilTs
  );
  
  const headers = ['id', 'timestamp', 'userId', 'agentId', 'action', 'target', 'result', 'riskScore', 'riskLevel', 'reasons'];
  const csvRows = [
    headers.join(','),
    ...filtered.map(log => [
      log.id,
      new Date(log.timestamp).toISOString(),
      log.userId || '',
      log.agentId || '',
      log.action,
      log.target,
      log.result,
      log.riskScore,
      log.riskLevel,
      `"${log.reasons.join('; ')}"`
    ].join(','))
  ];
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
  res.send(csvRows.join('\n'));
});

// Export logs as JSON
router.get('/api/audit-logs/export/json', (req: Request, res: Response) => {
  const { since, until } = req.query;
  const sinceTs = since ? Number(since) : 0;
  const untilTs = until ? Number(until) : Date.now();
  
  const filtered = auditLogs.filter(log => 
    log.timestamp >= sinceTs && log.timestamp <= untilTs
  );
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.json');
  res.json({ exported: Date.now(), logs: filtered });
});

export default router;
