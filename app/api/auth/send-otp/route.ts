// app/api/auth/send-otp/route.ts
// In demo mode: always succeeds, OTP is always "123456"
// To enable real email: set SMTP_* env vars and uncomment nodemailer code

import { NextRequest, NextResponse } from 'next/server';

// In-memory OTP store (use Redis in production)
const OTP_STORE = new Map<string, { otp: string; expires: number }>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const otp = process.env.DEMO_OTP ?? generateOTP();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    OTP_STORE.set(email.toLowerCase(), { otp, expires });

    // ── Real email sending (uncomment + set env vars to enable) ──────────────
    // const SMTP_HOST = process.env.SMTP_HOST;
    // if (SMTP_HOST) {
    //   const nodemailer = await import('nodemailer');
    //   const transporter = nodemailer.createTransport({
    //     host: SMTP_HOST,
    //     port: Number(process.env.SMTP_PORT ?? 587),
    //     auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    //   });
    //   await transporter.sendMail({
    //     from: `"My ET" <${process.env.SMTP_FROM}>`,
    //     to: email,
    //     subject: 'Your My ET Login OTP',
    //     html: `<p>Your OTP is <strong style="font-size:24px;letter-spacing:4px">${otp}</strong>. Valid for 10 minutes.</p>`,
    //   });
    // }

    console.log(`[Auth] OTP for ${email}: ${otp}`); // Remove in production

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      // In demo mode, expose OTP so user can see it
      demo_otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    });
  } catch (err) {
    console.error('[Auth/send-otp]', err);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}

// Export store for verify route (same process)
export { OTP_STORE };
