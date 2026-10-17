import { Link } from 'react-router-dom';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { BadgeCheck, Store, Info, CircleHelp, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { Source } from '../types';

type Variant = 'primary' | 'secondary' | 'ghost' | 'quiet';
const variants: Record<Variant, string> = {
  primary: 'bg-sage-700 text-white hover:bg-sage-800 shadow-sm',
  secondary: 'bg-paper text-ink border border-line hover:border-sage-300 hover:bg-sage-50',
  ghost: 'text-sage-700 hover:bg-sage-50',
  quiet: 'text-muted hover:text-ink hover:bg-ivory',
};
const base = 'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const sizes = { sm: 'text-sm px-3.5 py-1.5', md: 'text-[15px] px-5 py-2.5', lg: 'text-base px-6 py-3' };

export function Button({ variant = 'primary', size = 'md', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof sizes }) {
  return <button type="button" className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest} />;
}
export function LinkButton({ to, variant = 'primary', size = 'md', className = '', children }: { to: string; variant?: Variant; size?: keyof typeof sizes; className?: string; children: ReactNode }) {
  return <Link to={to} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>{children}</Link>;
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`bg-paper border border-line rounded-card ${className}`}>{children}</div>;
}

const SRC: Record<Source, { label: string; cls: string; Icon: typeof Info }> = {
  brand: { label: 'Brand page', cls: 'bg-sage-50 text-sage-800 border-sage-100', Icon: BadgeCheck },
  retailer: { label: 'Retailer listing', cls: 'bg-sand-100 text-[#6B5532] border-[#E9DCC4]', Icon: Store },
  general: { label: 'General guidance', cls: 'bg-ivory text-muted border-line', Icon: Info },
  unverified: { label: 'Check the label', cls: 'bg-blush-50 text-blush-700 border-blush-100', Icon: CircleHelp },
};
export function SourceBadge({ source, className = '' }: { source: Source; className?: string }) {
  const s = SRC[source];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] font-medium whitespace-nowrap ${s.cls} ${className}`} title={sourceTitle(source)}>
      <s.Icon size={12} aria-hidden /> {s.label}
    </span>
  );
}
export const sourceTitle = (s: Source) =>
  ({ brand: 'Stated on the Be Bodywise product page (read Oct 2026). Verify against your pack.', retailer: 'Stated on an authorised retailer listing. Verify against your pack.', general: 'General guidance, not specific to this product.', unverified: 'Not verified. Follow the instructions on your product label.' })[s];

export function Notice({ tone = 'info', title, children, className = '' }: { tone?: 'info' | 'caution' | 'urgent' | 'calm'; title?: string; children: ReactNode; className?: string }) {
  const t = {
    info: 'bg-sage-50 border-sage-100 text-sage-800',
    calm: 'bg-ivory border-line text-ink',
    caution: 'bg-blush-50 border-blush-100 text-blush-700',
    urgent: 'bg-[#FBE9E6] border-[#EBB5AC] text-alert',
  }[tone];
  const Icon = tone === 'urgent' ? ShieldAlert : tone === 'caution' ? AlertTriangle : Info;
  return (
    <div className={`flex gap-3 rounded-xl border p-4 text-[14.5px] leading-relaxed ${t} ${className}`} role={tone === 'urgent' ? 'alert' : undefined}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0">{title && <p className="font-semibold mb-0.5">{title}</p>}{children}</div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, intro, children }: { eyebrow?: string; title: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <header className="pt-8 pb-6 sm:pt-12 sm:pb-8">
      {eyebrow && <p className="text-sm text-sage-700 font-medium mb-2">{eyebrow}</p>}
      <h1 className="font-display text-[34px] sm:text-[44px] leading-[1.08] text-ink">{title}</h1>
      {intro && <div className="mt-3 max-w-2xl text-[16.5px] text-muted leading-relaxed">{intro}</div>}
      {children && <div className="mt-5 flex flex-wrap gap-3">{children}</div>}
    </header>
  );
}

export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-line bg-paper/60 px-6 py-10 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-sage-50 text-sage-700">{icon}</div>
      <h3 className="font-display text-2xl">{title}</h3>
      <div className="mx-auto mt-2 max-w-md text-muted">{children}</div>
      {action && <div className="mt-5 flex justify-center gap-3 flex-wrap">{action}</div>}
    </div>
  );
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${active ? 'bg-ink text-white border-ink' : 'bg-paper border-line text-ink hover:border-sage-300'}`}>
      {children}
    </button>
  );
}
