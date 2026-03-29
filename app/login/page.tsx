// app/login/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

type Step = 'email' | 'otp' | 'done';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  // If already logged in, redirect straight to newsroom
  useEffect(() => {
    try {
      const match = document.cookie.match(/my-et-session=([^;]+)/);
      if (match) {
        const decoded = JSON.parse(atob(decodeURIComponent(match[1])));
        if (decoded?.email) router.replace('/newsroom');
      }
    } catch { /* not logged in */ }
  }, [router]);

  const sendOTP = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (data.success) {
        setSentTo(trimmed);
        setStep('otp');
      } else {
        setError(data.error ?? 'Failed to send OTP. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sentTo, otp }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('done');
        // Small delay so user sees the success state, then redirect
        setTimeout(() => router.push('/newsroom'), 1000);
      } else {
        setError(data.error ?? 'Incorrect OTP. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[85vh] flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="w-full max-w-sm">

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Logo */}
          <div className="text-center mb-7">
            <Link href="/" className="inline-block">
              <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                My <span className="text-brand-600">ET</span>
              </h1>
            </Link>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
              Sign in to personalise your newsroom
            </p>
          </div>

          {/* ── Step: Email ── */}
          {step === 'email' && (
            <div className="space-y-4">
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && sendOTP()}
                  placeholder="you@example.com"
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: error ? '#ef4444' : 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
                {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
              </div>

              <button
                onClick={sendOTP}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-60 transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Sending…
                  </span>
                ) : 'Continue →'}
              </button>

              {/* Demo hint */}
              <div
                className="rounded-xl p-3.5 flex items-start gap-2.5"
                style={{ backgroundColor: 'rgba(234,88,12,0.06)', border: '1px solid rgba(234,88,12,0.15)' }}
              >
                <Sparkles size={14} className="text-brand-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-brand-700">Demo mode active</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Use any email — OTP is always <span className="font-mono font-bold text-brand-600">123456</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step: OTP ── */}
          {step === 'otp' && (
            <div className="space-y-4">
              <div className="text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl"
                  style={{ backgroundColor: 'rgba(234,88,12,0.1)' }}
                >
                  📬
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  OTP sent to
                </p>
                <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                  {sentTo}
                </p>
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  Demo: enter <span className="font-mono font-bold text-brand-600">123456</span>
                </p>
              </div>

              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && verifyOTP()}
                  placeholder="——————"
                  autoFocus
                  className="w-full px-4 py-4 rounded-xl border text-center text-3xl font-mono tracking-[0.6em] focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: error ? '#ef4444' : 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
                {error && <p className="text-xs text-red-500 mt-1.5 text-center">{error}</p>}
              </div>

              <button
                onClick={verifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Verifying…
                  </span>
                ) : 'Sign In →'}
              </button>

              <button
                onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                className="w-full py-2 text-sm text-center transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                ← Use a different email
              </button>
            </div>
          )}

          {/* ── Step: Success ── */}
          {step === 'done' && (
            <div className="text-center py-6 space-y-3">
              <div className="text-5xl mb-2">✅</div>
              <p
                className="font-display text-xl font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Welcome back!
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Taking you to your newsroom…
              </p>
              <div className="flex justify-center mt-2">
                <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Skip login note */}
        {step === 'email' && (
          <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
            All features work without an account.{' '}
            <Link href="/newsroom" className="text-brand-600 hover:underline font-medium">
              Skip →
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
