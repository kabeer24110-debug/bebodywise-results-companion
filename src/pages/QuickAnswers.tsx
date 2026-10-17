import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Plus, Minus, MessageCircle, BookOpen } from 'lucide-react';
import { Container } from '../components/Layout';
import { Chip, PageHeader, SourceBadge } from '../components/ui';
import { FAQS } from '../data/faqs';
import { PRODUCTS, productById } from '../data/products';
import type { FaqItem } from '../types';

const TOPICS: { id: FaqItem['topic']; label: string }[] = [
  { id: 'application', label: 'How to use' },
  { id: 'frequency', label: 'How often' },
  { id: 'expectations', label: 'Results' },
  { id: 'precautions', label: 'Precautions' },
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'routine', label: 'Routine' },
];
const STOP = new Set(['the', 'a', 'an', 'i', 'my', 'is', 'it', 'to', 'do', 'can', 'how', 'what', 'of', 'and', 'for', 'should', 'on', 'in', 'with', 'use']);

export default function QuickAnswers() {
  const [q, setQ] = useState('');
  const [product, setProduct] = useState('');
  const [topic, setTopic] = useState<FaqItem['topic'] | ''>('');

  const results = useMemo(() => {
    const words = q.toLowerCase().split(/[^a-z0-9%]+/).filter((w) => w.length > 1 && !STOP.has(w));
    return FAQS.map((f) => {
      const hay = `${f.q} ${f.a} ${productById(f.productId)?.name ?? ''}`.toLowerCase();
      const score = words.reduce((s, w) => s + (hay.includes(w) ? (f.q.toLowerCase().includes(w) ? 2 : 1) : 0), 0);
      return { f, score };
    })
      .filter(({ f, score }) => (!product || f.productId === product || (product === 'general' && f.productId === null)) && (!topic || f.topic === topic) && (words.length === 0 || score > 0))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.f);
  }, [q, product, topic]);

  const clear = () => { setQ(''); setProduct(''); setTopic(''); };

  return (
    <Container>
      <PageHeader eyebrow="Quick Answers" title="Common questions, answered" intro="Short answers taken from product information, each labelled with its source. If your question isn’t here, the coach or the product guide may help." />

      <div className="grid gap-3 md:grid-cols-[1fr_260px]">
        <label className="relative block">
          <span className="sr-only">Search questions</span>
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, e.g. shaving, missed, how long" className="w-full rounded-full border border-line bg-paper pl-10 pr-10 py-2.5 text-[15px] outline-none focus:border-sage-500" />
          {q && <button type="button" onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" aria-label="Clear search"><X size={16} /></button>}
        </label>
        <label>
          <span className="sr-only">Filter by product</span>
          <select value={product} onChange={(e) => setProduct(e.target.value)} className="w-full rounded-full border border-line bg-paper px-4 py-2.5 text-[15px]">
            <option value="">All products</option>
            <option value="general">General questions</option>
            {PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by topic">
        <Chip active={topic === ''} onClick={() => setTopic('')}>All topics</Chip>
        {TOPICS.map((t) => <Chip key={t.id} active={topic === t.id} onClick={() => setTopic(t.id)}>{t.label}</Chip>)}
      </div>

      <p className="mt-6 mb-3 text-sm text-muted tabular" aria-live="polite">{results.length} answer{results.length === 1 ? '' : 's'}</p>

      {results.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-paper/60 p-6 sm:p-8">
          <p className="font-display text-2xl">We don’t have an answer for that yet</p>
          <p className="mt-1 text-muted max-w-xl">We’d rather not guess. Your product label is the most reliable source. You could also try:</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to={`/coach`} className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-[15px] hover:border-sage-300"><MessageCircle size={16} /> Ask the coach</Link>
            <Link to="/products" className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-[15px] hover:border-sage-300"><BookOpen size={16} /> Open a product guide</Link>
            <button type="button" onClick={clear} className="text-sm text-muted underline px-2">Clear search</button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-line rounded-card border border-line bg-paper">
          {results.map((f) => {
            const p = productById(f.productId);
            return (
              <details key={f.id} className="group p-4 sm:px-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                  <span>
                    <span className="block font-medium">{f.q}</span>
                    <span className="block text-[13px] text-muted mt-0.5">{p ? p.name : 'General'}</span>
                  </span>
                  <Plus size={17} className="mt-1 shrink-0 text-muted group-open:hidden" /><Minus size={17} className="mt-1 shrink-0 text-muted hidden group-open:block" />
                </summary>
                <p className="mt-2 leading-relaxed">{f.a}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-sm">
                  <SourceBadge source={f.source} />
                  {p && <Link to={`/products/${p.id}`} className="text-sage-700 underline">Product guide</Link>}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </Container>
  );
}
