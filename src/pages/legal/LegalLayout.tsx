import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import type { ReactNode } from 'react';

export const LEGAL_LINKS = [
  { to: '/about', label: 'About Us' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
  { to: '/licenses', label: 'Licenses' },
];

export default function LegalLayout({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-extrabold"><Shield className="w-4 h-4 text-primary" />Almien</Link>
          <Link to="/dashboard" className="flex items-center gap-1 text-sm text-primary hover:underline"><ArrowLeft className="w-4 h-4" />Back to app</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        {updated && <p className="text-xs text-muted-foreground mb-8">Last updated: {updated}</p>}
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-8 [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </main>
      <footer className="border-t border-border">
        <nav className="max-w-3xl mx-auto px-4 py-6 flex flex-wrap gap-4 text-xs text-primary">
          {LEGAL_LINKS.map((l) => <Link key={l.to} to={l.to} className="hover:underline">{l.label}</Link>)}
          <span className="ml-auto text-muted-foreground">© {new Date().getFullYear()} Almien Safety Intelligence</span>
        </nav>
      </footer>
    </div>
  );
}
