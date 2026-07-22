const ACCESS_TOKEN_SECRET = 'teklifpro-access-secret-change-in-production';

export interface JWTPayload {
  sub: string;
  username: string;
  email: string;
  role: string;
  permissions: any;
  jti: string;
  type: 'access' | 'refresh';
  exp?: number;
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return jsonPayload;
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeToken(token);
    if (!payload || !payload.exp) return true;
    const now = Date.now() / 1000;
    return payload.exp < now;
  } catch {
    return true;
  }
}

export function getTokenExpiry(token: string): number | null {
  try {
    const payload = decodeToken(token);
    return payload?.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export async function hashRefreshToken(token: string): Promise<string> {
  const crypto = window.crypto;
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const payload = decodeToken(token);
    if (!payload) return null;
    if (payload.type !== 'access') return null;
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const payload = decodeToken(token);
    if (!payload) return null;
    if (payload.type !== 'refresh') return null;
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
