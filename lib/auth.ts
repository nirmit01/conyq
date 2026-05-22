// lib/auth.ts
// Core authentication utilities: password hashing, JWT, rate limiting, cookie parsing

import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import type { Database } from 'better-sqlite3';

// ─── Secrets ────────────────────────────────────────────────────────────────
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'my-et-dev-secret-change-in-production';
  return new TextEncoder().encode(secret);
}

const TOKEN_EXPIRY_DAYS = parseInt(process.env.AUTH_TOKEN_EXPIRY_DAYS || '7');

// ─── Password ────────────────────────────────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT ─────────────────────────────────────────────────────────────────────
export async function createToken(userId: string, email: string): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_EXPIRY_DAYS}d`)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return { userId: payload.userId as string, email: payload.email as string };
  } catch {
    return null;
  }
}

// ─── Cookie parsing ──────────────────────────────────────────────────────────
export function parseAuthCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/my-et-session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function createSessionCookie(token: string): string {
  const maxAge = TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
  return `my-et-session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie(): string {
  return 'my-et-session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}

// ─── Rate limiting ──────────────────────────────────────────────────────────
export function checkRateLimit(
  db: Database.Database,
  key: string,
  maxRequests: number,
  windowSeconds: number
): { allowed: boolean; retryAfter?: number } {
  const windowStart = Math.floor(Date.now() / 1000 / windowSeconds) * windowSeconds;
  const row = db.prepare(
    'SELECT count FROM rate_limits WHERE key = ? AND window_start = ?'
  ).get(key, windowStart) as { count: number } | undefined;

  const count = row?.count ?? 0;

  if (count >= maxRequests) {
    const retryAfter = windowStart + windowSeconds - Math.floor(Date.now() / 1000);
    return { allowed: false, retryAfter };
  }

  db.prepare(`
    INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)
    ON CONFLICT(key, window_start) DO UPDATE SET count = count + 1
  `).run(key, windowStart);

  return { allowed: true };
}

// ─── Auth helpers ───────────────────────────────────────────────────────────
export function sanitizeUser(user: {
  id: string;
  email: string;
  name: string;
  interests: string;
  password_hash?: string;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    interests: JSON.parse(user.interests),
  };
}