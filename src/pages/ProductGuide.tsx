import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, Plus, LineChart, MessageCircle, ExternalLink, CircleHelp, Minus } from 'lucide-react';
import { Container } from '../components/Layout';
import { Button, Card, EmptyState, LinkButton, Notice, SourceBadge } from '../components/ui';
import { ProductArt } from '../components/ProductArt';
import { categoryLabel, productById } from '../data/products';
import { FAQS } from '../data/faqs';
import { useStore } from '../lib/store';
import type { Fact } from '../types';

export default function ProductGuide() {
  const { id } = useParams();
  const p = productById(id);
  const { inRoutine, addToRoutine, removeFromRoutine, state } = useStore();

  if (!p) {
    return (
      <Container className="py-16">
        <EmptyState icon={<CircleHelp size={22} />} title="Product not found" action={<LinkButton to="/products">See all products</LinkButton>}>
          We don’t have a guide for that product in this prototype.
        </EmptyState>
      </Container>
    );
  }

  const added = inRoutine(p.id);
  const journey = state.journeys.find((j) => j.productId === p.id && j.status !== 'stopped');
  const faqs = FAQS.filter((f) => f.productId === p.id);
  const allUnverified = [p.howToUse, p.frequency, p.quantity, p.timeline].every((f) => f.source === 'unverified');

  return (
    <Container className="pb-6">
      <Link to="/products" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mt-6"><ArrowLeft size={15} /> All products</Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <div className="grid gap-6 sm:grid-cols-[200px_1fr] items-start">
            <ProductArt product={p} />
            <div>
              <p className="text-sm text-sage-700 font-medium">{categoryLabel(p.category)}</p>
              <h1 className="font-display text-[34px] sm:text-[42px] leading-[1.08] mt-1">{p.name}</h1>
              <p className="mt-3 text-[16.5px] text-muted leading-relaxed">{p.intendedFor.text}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
                <SourceBadge source={p.intendedFor.source} />
                <span>{p.size.source !== 'unverified' ? p.size.text : 'Size: check the pack'}</span>
              </div>
            </div>
          </div>

          {allUnverified && (
            <Notice tone="caution" title="Product information needs verification" className="mt-6">
              We couldn’t confirm the usage instructions for this product from an official source. Follow the instructions on your product label.
            </Notice>
          )}
          {p.variantNote && <Notice tone="calm" className="mt-4">{p.variantNote}</Notice>}

          <div className="mt-8 grid gap-4">
            <Section title="How to use it" fact={p.howToUse}>
              {p.howToUse.steps && p.howToUse.source !== 'unverified' ? (
                <ol className="mt-1 space-y-2.5">
                  {p.howToUse.steps.map((s, i) => (
                    <li key={s} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sage-100 text-sage-800 text-[13px] font-semibold tabular">{i + 1}</span><span className="pt-0.5">{s}</span></li>
                  ))}
                </ol>
              ) : <FactText fact={p.howToUse} />}
            </Section>
            <div className="grid gap-4 md:grid-cols-2">
              <Section title="How often" fact={p.frequency}><FactText fact={p.frequency} /></Section>
              <Section title="How much" fact={p.quantity}><FactText fact={p.quantity} /></Section>
            </div>
            <Section title="What to expect, and when" fact={p.timeline}>
              <FactText fact={p.timeline} />
              {p.milestones.length > 0 && (
                <ol className="mt-4 relative border-l-2 border-sage-100 ml-2 space-y-3">
                  {p.milestones.map((m) => (
                    <li key={m.week} className="pl-5 relative">
                      <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-sage-500 ring-4 ring-paper" />
                      <p className="text-sm text-muted tabular">Week {m.week}</p>
                      <p>{m.label}</p>
                    </li>
                  ))}
                </ol>
              )}
              {p.milestones.length > 0 && <p className="mt-3 text-sm text-muted">These are the source’s own expectations, not a guarantee. Individual results vary.</p>}
            </Section>
            <Section title="Key ingredients" fact={p.keyIngredients}><FactText fact={p.keyIngredients} /></Section>
            <Card className="p-5 sm:p-6">
              <h2 className="font-display text-[22px]">Precautions</h2>
              <ul className="mt-3 space-y-3">
                {p.precautions.map((f) => (
                  <li key={f.text} className="flex flex-wrap items-start gap-x-3 gap-y-1">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blush-600 shrink-0" />
                    <span className="flex-1 min-w-[200px]">{f.text}</span>
                    <SourceBadge source={f.source} />
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted">If you notice irritation, stop using it and read your label. For swelling of the face or lips, or trouble breathing, get urgent medical help.</p>
            </Card>
            <Section title="Using it with other products" fact={p.compatibility}><FactText fact={p.compatibility} /></Section>
          </div>

          {faqs.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display text-[26px] mb-3">Common questions</h2>
              <div className="divide-y divide-line rounded-card border border-line bg-paper">
                {faqs.map((f) => (
                  <details key={f.id} className="group p-4 sm:px-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                      {f.q}
                      <Plus size={17} className="shrink-0 text-muted group-open:hidden" /><Minus size={17} className="shrink-0 text-muted hidden group-open:block" />
                    </summary>
                    <p className="mt-2 text-muted leading-relaxed">{f.a}</p>
                    <div className="mt-2"><SourceBadge source={f.source} /></div>
                  </details>
                ))}
              </div>
            </div>
          )}

          <p className="mt-8 text-sm text-muted">
            Source: {p.sourceLabel}.{' '}
            {p.sourceUrl && <a href={p.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline hover:text-ink">View source <ExternalLink size={13} /></a>}
            {' '}Product pages change, so your pack is the final word.
          </p>
        </div>

        {/* Action rail */}
        <aside className="lg:sticky lg:top-24 self-start grid gap-4">
          <Card className="p-5">
            <p className="font-display text-xl">Use this product</p>
            {p.schedule ? (
              <p className="mt-1 text-sm text-muted">Your checklist will show it {p.schedule.label.toLowerCase()}, as the {p.schedule.source === 'brand' ? 'brand' : 'listing'} says.</p>
            ) : (
              <p className="mt-1 text-sm text-muted">We don’t have a verified schedule, so your checklist will say “use as directed on the label”.</p>
            )}
            <div className="mt-4 grid gap-2">
              {added ? (
                <>
                  <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-sage-50 text-sage-800 px-4 py-2.5 text-[15px] font-medium"><Check size={16} /> In your routine</span>
                  <Button variant="quiet" size="sm" onClick={() => removeFromRoutine(p.id)}>Remove from routine</Button>
                </>
              ) : (
                <Button onClick={() => addToRoutine(p.id)}><Plus size={16} /> Add to my routine</Button>
              )}
              {journey ? (
                <LinkButton to={`/journeys/${journey.id}`} variant="secondary"><LineChart size={16} /> View my journey</LinkButton>
              ) : (
                <LinkButton to={`/journeys?start=${p.id}`} variant="secondary"><LineChart size={16} /> Start a Results Journey</LinkButton>
              )}
              <LinkButton to={`/coach?product=${p.id}`} variant="ghost"><MessageCircle size={16} /> Ask about this product</LinkButton>
            </div>
          </Card>
          <Card className="p-5 text-sm">
            <p className="font-medium mb-2">What the labels mean</p>
            <ul className="space-y-2 text-muted">
              <li className="flex gap-2 items-start"><SourceBadge source="brand" /> <span>From the Be Bodywise product page.</span></li>
              <li className="flex gap-2 items-start"><SourceBadge source="retailer" /> <span>From a retailer listing.</span></li>
              <li className="flex gap-2 items-start"><SourceBadge source="general" /> <span>General advice, not specific to this product.</span></li>
              <li className="flex gap-2 items-start"><SourceBadge source="unverified" /> <span>Not verified. Follow your label.</span></li>
            </ul>
          </Card>
        </aside>
      </div>
    </Container>
  );
}

function Section({ title, fact, children }: { title: string; fact: Fact; children: React.ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h2 className="font-display text-[22px]">{title}</h2>
        <SourceBadge source={fact.source} />
      </div>
      {children}
      {fact.note && <p className="mt-3 text-sm text-blush-700 bg-blush-50 rounded-lg px-3 py-2">{fact.note}</p>}
    </Card>
  );
}

function FactText({ fact }: { fact: Fact }) {
  if (fact.source === 'unverified')
    return <p className="text-ink">{fact.text.trim() ? fact.text : 'Check the product label.'}</p>;
  return <p className="leading-relaxed">{fact.text}</p>;
}
