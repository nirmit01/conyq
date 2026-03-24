// app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get('default') as { id: string; name: string; interests: string } | undefined;
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user: { ...user, interests: JSON.parse(user.interests) } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { interests, name } = await req.json();
    const db = getDb();
    db.prepare('UPDATE users SET interests = ?, name = ? WHERE id = ?')
      .run(JSON.stringify(interests ?? []), name ?? 'Guest Reader', 'default');
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get('default') as { id: string; name: string; interests: string };
    return NextResponse.json({ user: { ...user, interests: JSON.parse(user.interests) } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
