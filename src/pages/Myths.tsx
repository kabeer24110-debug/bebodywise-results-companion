import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Eye } from 'lucide-react';
import { Container } from '../components/Layout';
import { Button, PageHeader, SourceBadge } from '../components/ui';
import { MYTHS } from '../data/myths';
import { productById } from '../data/products';

export default function Myths() {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const revealed = Object.values(open).filter(Boolean).length;
  return (
    <Container>
      <PageHeader eyebrow="Myth Buster" title="Things people often get wrong" intro="Each card starts with a common belief. Tap to see what the product information actually says.">
        {revealed > 0 && <Button variant="quiet" size="sm" onClick={() => setOpen({})}><RotateCcw size={14} /> Hide all</Button>}
        <Button variant="secondary" size="sm" onClick={() => setOpen(Object.fromEntries(MYTHS.map((m) => [m.id, true])))}><Eye size={14} /> Reveal all</Button>
      </PageHeader>
      <p className="text-sm text-muted mb-4 tabular">{revealed} of {MYTHS.length} revealed</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {MYTHS.map((m, i) => {
          const isOpen = !!open[m.id];
          const p = productById(m.productId);
          return (
            <div key={m.id} className={`rounded-card border p-5 sm:p-6 transition-colors ${isOpen ? 'bg-paper border-sage-100' : 'bg-blush-50/60 border-blush-100'}`}>
              <p className="text-[12.5px] font-semibold tracking-wide text-blush-700 tabular">MYTH {String(i + 1).padStart(2, '0')}</p>
              <p className={`mt-2 font-display text-[22px] leading-snug ${isOpen ? 'text-muted line-through decoration-blush-300 decoration-1' : ''}`}>{m.myth}</p>
              {isOpen ? (
                <div className="mt-3 fade-in">
                  <p className="text-[12.5px] font-semibold tracking-wide text-sage-700">WHAT THE INFORMATION SAYS</p>
                  <p className="mt-1.5 leading-relaxed">{m.fact}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                    <SourceBadge source={m.source} />
                    {p && <Link to={`/products/${p.id}`} className="text-sage-700 underline">{p.shortName} guide</Link>}
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setOpen((o) => ({ ...o, [m.id]: true }))} aria-expanded={false}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-paper border border-line px-3.5 py-1.5 text-sm font-medium hover:border-sage-300">
                  <Eye size={14} /> Reveal the facts
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Container>
  );
}
