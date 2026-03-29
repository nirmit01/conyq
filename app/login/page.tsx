// app/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Step = 'email' | 'otp' | 'done';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  const sendOTP = async () => {
    if (!email || !email.includes('@')) { setError('Enter a valid email'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) { setSentTo(email); setStep('otp'); }
      else setError(data.error ?? 'Failed to send OTP');
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('done');
        setTimeout(() => router.push('/newsroom'), 1200);
      } else {
        setError(data.error ?? 'Invalid OTP');
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div
      className="min-h-[80vh] flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-lg"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            My <span className="text-brand-600">ET</span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Sign in to personalise your newsroom
          </p>
        </div>

        {/* Step: Email */}
        {step === 'email' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendOTP()}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={sendOTP}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Sending OTP…' : 'Send OTP →'}
            </button>

            <div
              className="rounded-xl p-4 text-xs"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
            >
              💡 <strong>Demo mode:</strong> Use OTP <code className="font-mono font-bold text-brand-600">123456</code> to log in with any email.
            </div>
          </div>
        )}

        {/* Step: OTP */}
        {step === 'otp' && (
          <div className="space-y-4">
            <div className="text-center py-2">
              <div className="text-4xl mb-3">📬</div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                OTP sent to <strong style={{ color: 'var(--text-primary)' }}>{sentTo}</strong>
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Demo: use <span className="font-mono font-bold text-brand-600">123456</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Enter 6-digit OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && verifyOTP()}
                placeholder="123456"
                className="w-full px-4 py-3 rounded-xl border text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

            <button
              onClick={verifyOTP}
              disabled={loading || otp.length !== 6}
              className="w-full py-3 rounded-xl bg-brand-600 text-white font-medium text-sm hover:bg-brand-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Verifying…' : 'Verify & Login →'}
            </button>

            <button
              onClick={() => { setStep('email'); setOtp(''); setError(''); }}
              className="w-full py-2 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              ← Change email
            </button>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="text-center py-8 space-y-3">
            <div className="text-5xl">✅</div>
            <p className="font-display text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Welcome back!
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Redirecting to your newsroom…
            </p>
          </div>
        )}

        {/* Footer */}
        {step === 'email' && (
          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            By signing in you agree to our{' '}
            <Link href="/" className="text-brand-600 hover:underline">Terms</Link>
          </p>
        )}
      </div>
    </div>
  );
}
