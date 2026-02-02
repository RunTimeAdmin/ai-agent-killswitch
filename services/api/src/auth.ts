import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'killswitch-dev-secret-change-in-production';
const JWT_EXPIRES = '24h';

// In-memory user store (replace with database in production)
interface User {
  id: string;
  email: string;
  passwordHash: string;
  apiKey: string;
  role: 'user' | 'admin' | 'agent';
  createdAt: number;
}

const users: Map<string, User> = new Map();
const apiKeys: Map<string, User> = new Map();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// ============================================
// Password hashing
// ============================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================
// JWT Token handling
// ============================================

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

export function verifyToken(token: string): { id: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

// ============================================
// API Key generation
// ============================================

export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'ks_';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// ============================================
// User management
// ============================================

export async function createUser(email: string, password: string, role: 'user' | 'admin' | 'agent' = 'user'): Promise<User> {
  const id = 'user_' + Date.now().toString(36);
  const passwordHash = await hashPassword(password);
  const apiKey = generateApiKey();
  
  const user: User = {
    id,
    email,
    passwordHash,
    apiKey,
    role,
    createdAt: Date.now()
  };
  
  users.set(id, user);
  users.set(email, user);
  apiKeys.set(apiKey, user);
  
  return user;
}

export function getUserById(id: string): User | undefined {
  return users.get(id);
}

export function getUserByEmail(email: string): User | undefined {
  return users.get(email);
}

export function getUserByApiKey(apiKey: string): User | undefined {
  return apiKeys.get(apiKey);
}

// ============================================
// Authentication Middleware
// ============================================

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] as string;
  
  // Try API key first
  if (apiKey) {
    const user = getUserByApiKey(apiKey);
    if (user) {
      req.user = user;
      return next();
    }
  }
  
  // Try JWT token
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (decoded) {
      const user = getUserById(decoded.id);
      if (user) {
        req.user = user;
        return next();
      }
    }
  }
  
  res.status(401).json({ 
    error: 'Unauthorized', 
    message: 'Valid API key or JWT token required' 
  });
}

// Optional auth - doesn't fail if no auth provided
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] as string;
  
  if (apiKey) {
    const user = getUserByApiKey(apiKey);
    if (user) req.user = user;
  } else if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      const user = getUserById(decoded.id);
      if (user) req.user = user;
    }
  }
  
  next();
}

// Admin-only middleware
export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' }) as any;
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' }) as any;
  }
  
  next();
}

// Agent-only middleware (for fence clients)
export function agentAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' }) as any;
  }
  
  if (req.user.role !== 'agent' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Agent access required' }) as any;
  }
  
  next();
}

// ============================================
// Rate limiting
// ============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits: Map<string, RateLimitEntry> = new Map();

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();
    
    let entry = rateLimits.get(key);
    
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      rateLimits.set(key, entry);
    }
    
    entry.count++;
    
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', entry.resetAt);
    
    if (entry.count > maxRequests) {
      res.status(429).json({ 
        error: 'Too Many Requests', 
        retryAfter: Math.ceil((entry.resetAt - now) / 1000) 
      });
      return;
    }
    
    next();
  };
}
