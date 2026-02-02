/**
 * $KILLSWITCH Usage Tracking Middleware
 * Track API calls and enforce tier limits
 */
import { Request, Response, NextFunction } from 'express';
import { TIERS, TierName } from './subscription-service';

// In-memory usage tracking (replace with database in production)
const usageCache: Map<string, { count: number; periodStart: Date }> = new Map();

export interface UsageInfo {
  userId: string;
  tier: TierName;
  apiCallsUsed: number;
  apiCallsLimit: number;
  percentUsed: number;
}

/**
 * Get current billing period start
 */
function getPeriodStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Get usage for a user
 */
export function getUsage(userId: string): { count: number; periodStart: Date } {
  const key = userId;
  const periodStart = getPeriodStart();

  const cached = usageCache.get(key);
  if (cached && cached.periodStart.getTime() === periodStart.getTime()) {
    return cached;
  }

  // Reset for new period
  const usage = { count: 0, periodStart };
  usageCache.set(key, usage);
  return usage;
}

/**
 * Increment usage
 */
export function incrementUsage(userId: string): number {
  const usage = getUsage(userId);
  usage.count++;
  usageCache.set(userId, usage);
  return usage.count;
}

/**
 * Check if user is within limits
 */
export function checkLimit(userId: string, tier: TierName): boolean {
  const limit = TIERS[tier].apiCalls;
  if (limit === -1) return true; // Unlimited

  const usage = getUsage(userId);
  return usage.count < limit;
}

/**
 * Get usage info for user
 */
export function getUsageInfo(userId: string, tier: TierName): UsageInfo {
  const usage = getUsage(userId);
  const limit = TIERS[tier].apiCalls;

  return {
    userId,
    tier,
    apiCallsUsed: usage.count,
    apiCallsLimit: limit,
    percentUsed: limit === -1 ? 0 : Math.round((usage.count / limit) * 100),
  };
}

/**
 * Usage tracking middleware
 */
export function trackUsage(metricType: string = 'api_calls') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return next();

    const userId = user.id;
    const tier = user.tier || 'basic';

    // Check limits before processing
    if (!checkLimit(userId, tier)) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `You have exceeded your ${tier} tier limit of ${TIERS[tier].apiCalls} API calls per month`,
        upgrade: 'Upgrade your plan at /settings/subscription',
      });
    }

    // Track the request
    const newCount = incrementUsage(userId);

    // Add usage headers
    const limit = TIERS[tier].apiCalls;
    res.setHeader('X-Usage-Count', newCount.toString());
    res.setHeader('X-Usage-Limit', limit === -1 ? 'unlimited' : limit.toString());
    res.setHeader('X-Usage-Remaining', limit === -1 ? 'unlimited' : (limit - newCount).toString());

    // Warn when approaching limit
    if (limit !== -1 && newCount >= limit * 0.8) {
      res.setHeader('X-Usage-Warning', 'Approaching rate limit');
    }

    next();
  };
}

/**
 * Agent limit middleware
 */
export function checkAgentLimit(tier: TierName, currentAgents: number): boolean {
  const limit = TIERS[tier].agents;
  if (limit === -1) return true; // Unlimited
  return currentAgents < limit;
}

/**
 * Storage limit middleware
 */
export function checkStorageLimit(tier: TierName, currentStorageGb: number): boolean {
  const limit = TIERS[tier].storageGb;
  if (limit === -1) return true; // Unlimited
  return currentStorageGb < limit;
}

/**
 * Reset usage (for testing)
 */
export function resetUsage(userId: string): void {
  usageCache.delete(userId);
}

/**
 * Get all usage stats (admin)
 */
export function getAllUsageStats(): Map<string, { count: number; periodStart: Date }> {
  return new Map(usageCache);
}
