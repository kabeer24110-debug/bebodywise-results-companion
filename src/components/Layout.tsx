import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Bell, Menu, X, Compass, BookOpen, LineChart, MessageCircle, ListChecks, Search, Sparkles, BellRing, Info } from 'lucide-react';
import { useStore } from '../lib/store';
import { dueReminders } from '../lib/reminders';

const MAIN = [
  { to: '/fit-finder', label: 'Fit Finder', Icon: Compass },
  { to: '/products', label: 'Products', Icon: BookOpen },
  { to: '/journeys', label: 'My Results Journey', short: 'My Journey', Icon: LineChart },
  { to: '/coach', label: 'Routine Coach', Icon: MessageCircle },
];
export const UTILITIES = [
  { to: '/routine', label: 'Daily routine', Icon: ListChecks },
  { to: '/answers', label: 'Quick Answers', Icon: Search },
  { to: '/myths', label: 'Myth Buster', Icon: Sparkles },
  { to: '/reminders', label: 'Reminders', Icon: BellRing },
  { to: '/about', label: 'About this prototype', Icon: Info },
];

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const { pathname } = useLocation();
  const { state, dismissReminder, storageOk } = useStore();
  const reminders = dueReminders(state);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpen(false); setBell(false); window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBell(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setBell(false); setOpen(false); } };
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, []);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-full text-[14.5px] transition-colors ${isActive ? 'bg-sage-100 text-sage-800 font-medium' : 'text-ink/80 hover:text-ink hover:bg-paper'}`;

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] bg-ink text-white px-3 py-2 rounded-lg">Skip to content</a>
      <header className="sticky z-50 border-b border-line/80 bg-ivory/95 backdrop-blur" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="gutter mx-auto max-w-6xl flex h-16 items-center gap-3">
          <Link to="/" className="flex items-baseline gap-2 mr-2 shrink-0" aria-label="Results Companion home">
            <span className="font-display text-[21px] leading-none text-ink">Results Companion</span>
            <span className="hidden sm:inline text-[12px] text-muted">for Be Bodywise</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-1 ml-auto" aria-label="Main">
            {MAIN.map((m) => <NavLink key={m.to} to={m.to} className={linkCls}>{m.short ?? m.label}</NavLink>)}
            <NavLink to="/routine" className={linkCls}>Routine</NavLink>
          </nav>
          <div className="ml-auto lg:ml-1 flex items-center gap-1">
            <div className="relative" ref={bellRef}>
              <button type="button" onClick={() => setBell((b) => !b)} className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-paper" aria-label={`In-app reminders, ${reminders.length} due`} aria-expanded={bell}>
                <Bell size={19} />
                {reminders.length > 0 && <span className="absolute top-1.5 right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-blush-600 text-white text-[10.5px] font-semibold grid place-items-center tabular">{reminders.length}</span>}
              </button>
              {bell && (
                <div className="absolute right-0 mt-2 w-[min(340px,calc(100vw-32px))] rounded-card border border-line bg-paper shadow-soft p-3 z-50">
                  <div className="flex items-center justify-between px-1 pb-2">
                    <p className="font-semibold text-[15px]">Reminders</p>
                    <Link to="/reminders" className="text-sm text-sage-700 hover:underline">Settings</Link>
                  </div>
                  {!state.reminders.enabled ? (
                    <p className="px-1 pb-2 text-sm text-muted">Reminders are off. Turn them on in <Link className="text-sage-700 underline" to="/reminders">settings</Link>.</p>
                  ) : reminders.length === 0 ? (
                    <p className="px-1 pb-2 text-sm text-muted">You’re all caught up for now.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {reminders.map((r) => (
                        <li key={r.id} className="rounded-xl bg-ivory p-3">
                          <Link to={r.to} className="block text-[14.5px] font-medium hover:text-sage-700">{r.title}</Link>
                          <p className="text-[13px] text-muted mt-0.5">{r.detail}</p>
                          <button type="button" className="mt-1.5 text-[12.5px] text-muted hover:text-ink underline" onClick={() => dismissReminder(r.id)}>Dismiss</button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="px-1 pt-2 text-[11.5px] text-muted">Shown inside this app only. No push notifications, SMS or email are sent.</p>
                </div>
              )}
            </div>
            <button type="button" className="lg:hidden grid h-10 w-10 place-items-center rounded-full hover:bg-paper" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="lg:hidden border-t border-line bg-ivory gutter pb-4" aria-label="Mobile">
            <div className="mx-auto max-w-6xl grid gap-1 pt-3">
              {MAIN.map((m) => <NavLink key={m.to} to={m.to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 ${isActive ? 'bg-sage-100 text-sage-800' : 'hover:bg-paper'}`}><m.Icon size={18} />{m.label}</NavLink>)}
              <p className="px-3 pt-3 pb-1 text-[12.5px] text-muted">Tools</p>
              {UTILITIES.map((m) => <NavLink key={m.to} to={m.to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] ${isActive ? 'bg-sage-100 text-sage-800' : 'hover:bg-paper'}`}><m.Icon size={17} />{m.label}</NavLink>)}
            </div>
          </nav>
        )}
      </header>

      {!storageOk && (
        <div className="gutter bg-blush-50 border-b border-blush-100 text-blush-700 text-sm py-2 text-center">This browser is blocking storage, so your progress won’t be saved after you close the page.</div>
      )}

      <main id="main" className="flex-1">{children}</main>

      <footer className="mt-16 border-t border-line bg-paper/60">
        <div className="gutter mx-auto max-w-6xl py-10 grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-md">
            <p className="font-display text-xl">Results Companion</p>
            <p className="mt-2 text-sm text-muted leading-relaxed">A prototype built for a Mosaic Fellowship assignment. Not an official Be Bodywise product, and not medical advice. Product facts are labelled by source; always follow your product label.</p>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Explore</p>
            <ul className="space-y-1.5 text-sm text-muted">{MAIN.map((m) => <li key={m.to}><Link className="hover:text-ink" to={m.to}>{m.label}</Link></li>)}</ul>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Tools</p>
            <ul className="space-y-1.5 text-sm text-muted">{UTILITIES.map((m) => <li key={m.to}><Link className="hover:text-ink" to={m.to}>{m.label}</Link></li>)}</ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`gutter mx-auto max-w-6xl ${className}`}>{children}</div>;
}
