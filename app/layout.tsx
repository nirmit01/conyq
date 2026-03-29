// app/layout.tsx
import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Navbar } from '@/components/ui/Navbar';
import { Ticker } from '@/components/ui/Ticker';
import { ThemeProvider } from '@/components/ui/ThemeProvider';

export const metadata: Metadata = {
  title: 'My ET — AI Native News Experience',
  description: 'Personalized business news powered by AI. Your newsroom, your way.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        <ThemeProvider>
          <Ticker />
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <footer
            className="border-t py-6 text-center text-sm"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-muted)',
            }}
          >
            <p className="font-display italic" style={{ color: 'var(--text-secondary)' }}>
              My ET — AI Native News Experience
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Built with Next.js · SQLite · AI-powered · Live RSS
            </p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
