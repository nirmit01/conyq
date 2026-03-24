// components/ui/Navbar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/newsroom',  label: 'Newsroom', emoji: '🗞️' },
  { href: '/navigator', label: 'Navigator', emoji: '🧭' },
  { href: '/video',     label: 'Video',     emoji: '🎬' },
  { href: '/tracker',   label: 'Tracker',   emoji: '🔍' },
  { href: '/vernacular',label: 'Vernacular',emoji: '🌐' },
  { href: '/chatbot',   label: 'Chatbot',   emoji: '💬' },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-ink-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-display text-xl font-bold text-ink-950">
            My <span className="text-brand-600">ET</span>
          </span>
          <span className="hidden sm:block text-xs text-ink-400 border-l border-ink-200 pl-2 ml-1">
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
                  : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
              )}>
              <span>{link.emoji}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md text-ink-600 hover:bg-ink-50"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu">
          <span className="text-xl">{open ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-ink-100 bg-white px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium',
                pathname.startsWith(link.href)
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink-600 hover:bg-ink-50',
              )}>
              <span>{link.emoji}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
