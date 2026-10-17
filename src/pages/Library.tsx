import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Check, X } from 'lucide-react';
import { Container } from '../components/Layout';
import { Chip, EmptyState, PageHeader, SourceBadge } from '../components/ui';
import { ProductArt } from '../components/ProductArt';
import { CATEGORIES, PRODUCTS, categoryLabel } from '../data/products';
import { useStore } from '../lib/store';
import type { CategoryId, Product } from '../types';

const FIELDS: (keyof Pick<Product, 'howToUse' | 'frequency' | 'quantity' | 'timeline'>)[] = ['howToUse', 'frequency', 'quantity', 'timeline'];

export default function Library() {
  const { inRoutine } = useStore();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<CategoryId | 'all'>('all');
  const [mine, setMine] = useState(false);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return PRODUCTS.filter((p) => (cat === 'all' || p.category === cat) && (!mine || inRoutine(p.id)) &&
      (!t || [p.name, p.intendedFor.text, p.keyIngredients.text, categoryLabel(p.category)].join(' ').toLowerCase().includes(t)));
  }, [q, cat, mine, inRoutine]);

  return (
    <Container>
      <PageHeader eyebrow="Decode My Product" title="Product guides, in plain language"
        intro="What each product is for, how to use it, how often, and what to expect. Every detail is labelled with where it came from, and anything we couldn’t verify says so." />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <label className="relative block md:w-80">
          <span className="sr-only">Search products</span>
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or ingredient"
            className="w-full rounded-full border border-line bg-paper pl-10 pr-10 py-2.5 text-[15px] placeholder:text-muted/70 focus:border-sage-500 outline-none" />
          {q && <button type="button" onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" aria-label="Clear search"><X size={16} /></button>}
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter products">
          <Chip active={cat === 'all'} onClick={() => setCat('all')}>All</Chip>
          {CATEGORIES.map((c) => <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</Chip>)}
          <Chip active={mine} onClick={() => setMine((m) => !m)}>In my routine</Chip>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
        <span>Source labels:</span>
        <SourceBadge source="brand" /><SourceBadge source="retailer" /><SourceBadge source="general" /><SourceBadge source="unverified" />
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<Search size={22} />} title="No products match" action={<button className="underline text-sage-700" onClick={() => { setQ(''); setCat('all'); setMine(false); }}>Clear filters</button>}>
          Try a different word, or clear the filters to see all seven products.
        </EmptyState>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => {
            const verified = FIELDS.filter((f) => p[f].source !== 'unverified').length;
            return (
              <Link key={p.id} to={`/products/${p.id}`} className="group flex flex-col rounded-card border border-line bg-paper p-4 hover:border-sage-300 hover:shadow-soft transition">
                <ProductArt product={p} />
                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-[13px] text-muted">{categoryLabel(p.category)}</span>
                  {inRoutine(p.id) && <span className="inline-flex items-center gap-1 text-[12.5px] text-sage-700"><Check size={13} /> In routine</span>}
                </div>
                <h2 className="mt-1 font-display text-[22px] leading-snug group-hover:text-sage-700">{p.name}</h2>
                <p className="mt-1.5 text-[14.5px] text-muted line-clamp-2">{p.intendedFor.text}</p>
                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-between text-[12.5px] text-muted mb-1.5"><span>Usage details verified</span><span className="tabular">{verified} of {FIELDS.length}</span></div>
                  <div className="flex gap-1" aria-hidden>{FIELDS.map((f) => <span key={f} className={`h-1.5 flex-1 rounded-full ${p[f].source === 'unverified' ? 'bg-blush-100' : 'bg-sage-300'}`} />)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}
