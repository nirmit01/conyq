// app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory store (matches send-otp store via module singleton)
const OTP_STORE = new Map<string, { otp: string; expires: number }>();
const DEMO_OTP = '123456'; // Always valid in demo mode

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 });
    }

    const key = email.toLowerCase();

    // Demo mode: accept 123456 for any email
    if (otp === DEMO_OTP) {
      const response = NextResponse.json({ success: true, user: { email, name: email.split('@')[0] } });
      // Set session cookie (simple demo session)
      response.cookies.set('my-et-session', Buffer.from(JSON.stringify({ email, ts: Date.now() })).toString('base64'), {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        sameSite: 'lax',
      });
      return response;
    }

    // Real OTP check
    const stored = OTP_STORE.get(key);
    if (!stored) {
      return NextResponse.json({ error: 'OTP expired or not found. Please request a new one.' }, { status: 400 });
    }
    if (Date.now() > stored.expires) {
      OTP_STORE.delete(key);
      return NextResponse.json({ error: 'OTP expired. Please request a new one.' }, { status: 400 });
    }
    if (stored.otp !== otp) {
      return NextResponse.json({ error: 'Incorrect OTP. Please try again.' }, { status: 400 });
    }

    OTP_STORE.delete(key);

    const response = NextResponse.json({ success: true, user: { email, name: email.split('@')[0] } });
    response.cookies.set('my-et-session', Buffer.from(JSON.stringify({ email, ts: Date.now() })).toString('base64'), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    });
    return response;
  } catch (err) {
    console.error('[Auth/verify-otp]', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
