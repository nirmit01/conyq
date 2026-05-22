// components/ui/Navbar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ThemeToggle } from './ThemeProvider';
import {
  Newspaper, Compass, Brain, MapPin, Languages, FileSearch
} from 'lucide-react';

const NAV_LINKS = [
  { href: '/newsroom', label: 'Newsroom', icon: Newspaper },
  { href: '/navigator', label: 'Navigator', icon: Compass },
  { href: '/briefing', label: 'Briefing', icon: Brain },
  { href: '/analyzer', label: 'Analyzer', icon: FileSearch },
  { href: '/tracker', label: 'Tracker', icon: MapPin },
  { href: '/vernacular', label: 'Vernacular', icon: Languages },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 shadow-sm"
      style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-12 md:h-14">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="font-display text-lg md:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Conyq
          </span>
          <span
            className="hidden lg:block text-xs border-l pl-2 ml-1"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}
          >
            AI Native News
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {NAV_LINKS.map(link => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                  isActive
                    ? 'text-brand-700'
                    : 'hover:text-ink-800',
                )}
                style={!isActive ? { color: 'var(--text-secondary)' } : {}}
              >
                <Icon size={15} className="flex-shrink-0" />
                <span>{link.label}</span>
                {/* Sliding underline */}
                <span className={cn(
                  'absolute bottom-1 left-2 right-2 h-0.5 bg-brand-600 rounded-full transition-transform origin-left',
                  isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                )} />
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden border-t px-4 py-3 flex flex-col gap-1"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          {NAV_LINKS.map(link => {
            const isActive = pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : '',
                )}
                style={!isActive ? { color: 'var(--text-secondary)' } : {}}
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}