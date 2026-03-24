// app/layout.tsx
import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Navbar } from '@/components/ui/Navbar';
import { Ticker } from '@/components/ui/Ticker';

export const metadata: Metadata = {
  title: 'My ET — AI Native News Experience',
  description: 'Personalized business news powered by AI. Your newsroom, your way.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-50 flex flex-col">
        <Ticker />
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-ink-200 py-6 text-center text-ink-400 text-sm bg-white">
          <p className="font-display italic">My ET — AI Native News Experience</p>
          <p className="mt-1 text-xs">Built with Next.js · SQLite · AI-powered</p>
        </footer>
      </body>
    </html>
  );
}
