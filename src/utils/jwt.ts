import jwt from 'jsonwebtoken';
import { User, UserRole } from '../types';
import { getUserPermissions } from './auth';
import { createHash } from 'crypto';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'teklifpro-access-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'teklifpro-refresh-secret-change-in-production';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface JWTPayload {
  sub: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: ReturnType<typeof getUserPermissions>;
  jti: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export function generateAccessToken(user: User): { token: string; payload: JWTPayload } {
  const permissions = getUserPermissions(user.role);
  const jti = crypto.randomUUID();
  const payload: JWTPayload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    permissions,
    jti,
    type: 'access'
  };
  const token = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  return { token, payload };
}

export function generateRefreshToken(user: User, accessJti: string): { token: string; payload: JWTPayload } {
  const jti = crypto.randomUUID();
  const payload: JWTPayload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    permissions: getUserPermissions(user.role),
    jti,
    type: 'refresh'
  };
  const token = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  return { token, payload };
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const TOKEN_EXPIRY = {
  access: ACCESS_TOKEN_EXPIRY,
  refresh: REFRESH_TOKEN_EXPIRY
};