import { Request, Response, Router } from 'express';
import { authMiddleware } from './auth';
import fs from 'fs';
import path from 'path';

const router = Router();

// Settings storage (in-memory for now, replace with database)
interface UserSettings {
  userId: string;
  preset: string;
  blockedActions: string[];
  blockedTargets: string[];
  spendingLimit: number;
  riskThreshold: 'low' | 'medium' | 'high';
  autoKill: boolean;
  offlineMode: boolean;
  updatedAt: number;
}

const userSettings: Map<string, UserSettings> = new Map();

// Default settings for new users
const DEFAULT_SETTINGS: Omit<UserSettings, 'userId' | 'updatedAt'> = {
  preset: 'coding',
  blockedActions: ['exec', 'shell', 'rm', 'sudo'],
  blockedTargets: ['.env', '.ssh', 'credentials'],
  spendingLimit: 0,
  riskThreshold: 'medium',
  autoKill: true,
  offlineMode: false
};

// Get user settings
router.get('/api/settings', authMiddleware, (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const settings = userSettings.get(userId);
  
  if (!settings) {
    // Return defaults if no settings exist
    return res.json({
      ...DEFAULT_SETTINGS,
      userId,
      updatedAt: Date.now()
    });
  }

  res.json(settings);
});

// Update user settings
router.post('/api/settings', authMiddleware, (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const {
    preset,
    blockedActions,
    blockedTargets,
    spendingLimit,
    riskThreshold,
    autoKill,
    offlineMode
  } = req.body;

  const settings: UserSettings = {
    userId,
    preset: preset || 'custom',
    blockedActions: blockedActions || [],
    blockedTargets: blockedTargets || [],
    spendingLimit: spendingLimit ?? 0,
    riskThreshold: riskThreshold || 'medium',
    autoKill: autoKill ?? true,
    offlineMode: offlineMode ?? false,
    updatedAt: Date.now()
  };

  userSettings.set(userId, settings);

  res.json({ success: true, settings });
});

// Get settings for a specific agent
router.get('/api/settings/agent/:agentId', authMiddleware, (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const agentId = req.params.agentId;
  const key = `${userId}:${agentId}`;
  const settings = userSettings.get(key);

  if (!settings) {
    // Fall back to user's default settings
    const userDefault = userSettings.get(userId);
    return res.json(userDefault || { ...DEFAULT_SETTINGS, userId, updatedAt: Date.now() });
  }

  res.json(settings);
});

// Update settings for a specific agent
router.post('/api/settings/agent/:agentId', authMiddleware, (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const agentId = req.params.agentId;
  const key = `${userId}:${agentId}`;

  const settings: UserSettings = {
    userId,
    ...req.body,
    updatedAt: Date.now()
  };

  userSettings.set(key, settings);

  res.json({ success: true, agentId, settings });
});

// Export settings as JSON file
router.get('/api/settings/export', authMiddleware, (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const settings = userSettings.get(userId) || { ...DEFAULT_SETTINGS, userId, updatedAt: Date.now() };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=fence-settings.json');
  res.json(settings);
});

// Import settings from JSON
router.post('/api/settings/import', authMiddleware, (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const imported = req.body;

  // Validate imported settings
  if (!imported.blockedActions || !Array.isArray(imported.blockedActions)) {
    return res.status(400).json({ error: 'Invalid settings format' });
  }

  const settings: UserSettings = {
    userId,
    preset: imported.preset || 'custom',
    blockedActions: imported.blockedActions,
    blockedTargets: imported.blockedTargets || [],
    spendingLimit: imported.spendingLimit ?? 0,
    riskThreshold: imported.riskThreshold || 'medium',
    autoKill: imported.autoKill ?? true,
    offlineMode: imported.offlineMode ?? false,
    updatedAt: Date.now()
  };

  userSettings.set(userId, settings);

  res.json({ success: true, settings });
});

// Reset to defaults
router.post('/api/settings/reset', authMiddleware, (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const settings: UserSettings = {
    ...DEFAULT_SETTINGS,
    userId,
    updatedAt: Date.now()
  };

  userSettings.set(userId, settings);

  res.json({ success: true, settings });
});

// Get available presets
router.get('/api/settings/presets', (req: Request, res: Response) => {
  const presets = [
    {
      id: 'coding',
      name: 'Coding Assistant',
      description: 'For AI coding tools',
      blockedActions: ['exec', 'shell', 'rm', 'sudo', 'install', 'push', 'deploy'],
      blockedTargets: ['.env', '.ssh', 'node_modules', '/etc', 'credentials'],
      spendingLimit: 0,
      riskThreshold: 'medium'
    },
    {
      id: 'email',
      name: 'Email Bot',
      description: 'For email automation',
      blockedActions: ['send_bulk', 'forward_all', 'delete_all', 'export'],
      blockedTargets: ['all_contacts', 'external', 'spam'],
      spendingLimit: 100,
      riskThreshold: 'medium'
    },
    {
      id: 'data',
      name: 'Data Analyst',
      description: 'For data processing',
      blockedActions: ['delete', 'drop_table', 'truncate', 'export_pii'],
      blockedTargets: ['production', 'pii_table', 'financial'],
      spendingLimit: 1000000,
      riskThreshold: 'high'
    },
    {
      id: 'web',
      name: 'Web Browser',
      description: 'For web scraping',
      blockedActions: ['submit_form', 'login', 'purchase', 'download_exe'],
      blockedTargets: ['banking', 'payment', 'admin', '.exe'],
      spendingLimit: 0,
      riskThreshold: 'medium'
    },
    {
      id: 'autonomous',
      name: 'Autonomous Agent',
      description: 'For AutoGPT-style agents',
      blockedActions: ['spawn_agent', 'modify_self', 'execute_code', 'purchase'],
      blockedTargets: ['api_keys', 'wallets', 'bank', 'production'],
      spendingLimit: 10,
      riskThreshold: 'low'
    }
  ];

  res.json({ presets });
});

export default router;
