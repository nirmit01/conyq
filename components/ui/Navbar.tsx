// components/ui/Navbar.tsx
'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { ThemeToggle } from './ThemeProvider';

const NAV_LINKS = [
  { href: '/newsroom',   label: 'Newsroom',   emoji: '🗞️' },
  { href: '/navigator',  label: 'Navigator',  emoji: '🧭' },
  { href: '/briefing',   label: 'Briefing',   emoji: '🧠' },
  { href: '/video',      label: 'Video',      emoji: '🎬' },
  { href: '/tracker',    label: 'Tracker',    emoji: '🔍' },
  { href: '/vernacular', label: 'Vernacular', emoji: '🌐' },
  { href: '/chatbot',    label: 'Chatbot',    emoji: '💬' },
];

interface SessionUser {
  email: string;
  name: string;
}

function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Read session cookie on the client
    try {
      const match = document.cookie.match(/my-et-session=([^;]+)/);
      if (match) {
        const decoded = JSON.parse(atob(decodeURIComponent(match[1])));
        if (decoded?.email) {
          setUser({
            email: decoded.email,
            name: decoded.email.split('@')[0],
          });
        }
      }
    } catch {
      // Cookie malformed — ignore
    }
    setChecked(true);
  }, []);

  const logout = () => {
    // Delete the cookie
    document.cookie = 'my-et-session=; Max-Age=0; path=/';
    setUser(null);
  };

  return { user, checked, logout };
}

// ─── User Avatar + Dropdown ────────────────────────────────────────────────────
function UserMenu({ user, logout }: { user: SessionUser; logout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user.name.slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-colors hover:border-brand-400"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}
      >
        {/* Avatar circle */}
        <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {initials}
        </div>
        <span className="text-sm font-medium hidden sm:block" style={{ color: 'var(--text-primary)' }}>
          {user.name}
        </span>
        {/* Chevron */}
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-muted)' }}
        >
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-lg z-50 overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* User info */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/newsroom"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-ink-50"
              style={{ color: 'var(--text-secondary)' }}
            >
              🗞️ My Newsroom
            </Link>
            <Link
              href="/briefing"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-ink-50"
              style={{ color: 'var(--text-secondary)' }}
            >
              🧠 AI Briefing
            </Link>
          </div>

          {/* Logout */}
          <div className="py-1" style={{ borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-red-50 text-left"
              style={{ color: '#ef4444' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Navbar ───────────────────────────────────────────────────────────────
export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { user, checked, logout } = useSession();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav
      className="sticky top-0 z-50 shadow-sm"
      style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            My <span className="text-brand-600">ET</span>
          </span>
          <span
            className="hidden sm:block text-xs border-l pl-2 ml-1"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}
          >
            AI Native News
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-0.5 overflow-x-auto">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                pathname.startsWith(link.href)
                  ? 'bg-brand-50 text-brand-700'
                  : 'hover:bg-ink-50',
              )}
              style={!pathname.startsWith(link.href) ? { color: 'var(--text-secondary)' } : {}}
            >
              <span className="text-base leading-none">{link.emoji}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Only render auth UI after cookie check to avoid flash */}
          {checked && (
            user ? (
              <UserMenu user={user} logout={handleLogout} />
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'transparent',
                }}
              >
                👤 Login
              </Link>
            )
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md"
            style={{ color: 'var(--text-secondary)' }}
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className="text-xl leading-none">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden border-t px-4 py-3 flex flex-col gap-1"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
                pathname.startsWith(link.href) ? 'bg-brand-50 text-brand-700' : '',
              )}
              style={!pathname.startsWith(link.href) ? { color: 'var(--text-secondary)' } : {}}
            >
              <span>{link.emoji}</span>
              <span>{link.label}</span>
            </Link>
          ))}

          {/* Mobile auth */}
          <div className="pt-2 mt-1" style={{ borderTop: '1px solid var(--border-color)' }}>
            {checked && (
              user ? (
                <div>
                  <p className="px-3 py-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    Signed in as {user.email}
                  </p>
                  <button
                    onClick={() => { handleLogout(); setOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm w-full text-left"
                    style={{ color: '#ef4444' }}
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  👤 Login
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
