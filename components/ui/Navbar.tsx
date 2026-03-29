// components/ui/Navbar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ThemeToggle } from './ThemeProvider';

const NAV_LINKS = [
  { href: '/newsroom',   label: 'Newsroom',   emoji: '🗞️' },
  { href: '/navigator',  label: 'Navigator',  emoji: '🧭' },
  { href: '/video',      label: 'Video',      emoji: '🎬' },
  { href: '/tracker',    label: 'Tracker',    emoji: '🔍' },
  { href: '/vernacular', label: 'Vernacular', emoji: '🌐' },
  { href: '/chatbot',    label: 'Chatbot',    emoji: '💬' },
  { href: '/briefing',   label: 'Briefing',   emoji: '🧠' },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 shadow-sm"
      style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
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

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                pathname.startsWith(link.href)
                  ? 'bg-brand-50 text-brand-700'
                  : 'hover:bg-ink-50',
              )}
              style={!pathname.startsWith(link.href) ? { color: 'var(--text-secondary)' } : {}}
            >
              <span>{link.emoji}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* Login */}
          <Link
            href="/login"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}
          >
            👤 Login
          </Link>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className="text-xl">{open ? '✕' : '☰'}</span>
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
                pathname.startsWith(link.href)
                  ? 'bg-brand-50 text-brand-700'
                  : '',
              )}
              style={!pathname.startsWith(link.href) ? { color: 'var(--text-secondary)' } : {}}
            >
              <span>{link.emoji}</span>
              <span>{link.label}</span>
            </Link>
          ))}
          <Link href="/login" onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium"
            style={{ color: 'var(--text-secondary)' }}>
            👤 Login
          </Link>
        </div>
      )}
    </nav>
  );
}
