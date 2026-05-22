// app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken, parseAuthCookie, sanitizeUser } from '@/lib/auth';

async function getAuthenticatedUser(req: NextRequest) {
  const token = parseAuthCookie(req.headers.get('cookie'));
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId) as Parameters<typeof sanitizeUser>[0] | undefined;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ user: sanitizeUser(user) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { interests, name } = await req.json();
    const db = getDb();
    db.prepare('UPDATE users SET interests = ?, name = ? WHERE id = ?')
      .run(JSON.stringify(interests ?? []), name ?? user.name, user.id);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id) as Parameters<typeof sanitizeUser>[0];
    return NextResponse.json({ user: sanitizeUser(updated) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
