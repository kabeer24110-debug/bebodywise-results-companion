import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Compass, BookOpen, LineChart, MessageCircle, ListChecks, Search, Sparkles, BellRing } from 'lucide-react';
import { Container } from '../components/Layout';
import { Card, Chip, LinkButton, SourceBadge } from '../components/ui';
import { ProductArt } from '../components/ProductArt';
import { CATEGORIES, PRODUCTS, productById } from '../data/products';
import { useStore, stepsFor } from '../lib/store';
import { daysBetween, todayKey } from '../lib/dates';
import type { CategoryId } from '../types';

export default function Home() {
  const { state, loadDemo } = useStore();
  const [cat, setCat] = useState<CategoryId | 'all'>('all');
  const list = PRODUCTS.filter((p) => cat === 'all' || p.category === cat);
  const active = state.journeys.filter((j) => j.status === 'active');
  const today = state.checklist[todayKey()] || {};
  const steps = state.routine.flatMap(stepsFor);
  const done = steps.filter((s) => today[s.key]).length;
  const hasData = state.routine.length > 0 || state.journeys.length > 0;

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line/70">
        <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center py-12 sm:py-16">
          <div>
            <p className="text-sage-700 font-medium text-sm mb-4">For Be Bodywise customers</p>
            <h1 className="font-display text-[44px] sm:text-[60px] leading-[1.02] text-ink">Your routine, made clearer.</h1>
            <p className="mt-5 max-w-xl text-[17.5px] leading-relaxed text-muted">Find products that fit your needs, understand how to use them, and follow your progress with more confidence.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton to="/fit-finder" size="lg">Find My Products <ArrowRight size={18} /></LinkButton>
              <LinkButton to="/products" size="lg" variant="secondary">Explore My Products</LinkButton>
            </div>
          </div>
          <HeroVisual />
        </Container>
      </section>

      {/* Flagships */}
      <Container className="py-14">
        <div className="max-w-2xl mb-8">
          <h2 className="font-display text-[32px] sm:text-[38px] leading-tight">From choosing a product to knowing it’s working</h2>
          <p className="mt-2 text-muted text-[16.5px]">Most questions come after you buy: how much, how often, and how long until something changes. These four tools cover that whole stretch.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Flagship to="/fit-finder" Icon={Compass} title="Fit Finder" text="A few short questions about what you want help with. You get product suggestions and the reason for each one." cta="Start the Fit Finder" art={<FitArt />} />
          <Flagship to="/products" Icon={BookOpen} title="Decode My Product" text="Plain-language guides: what a product is for, how to use it, what to expect and when, and what still needs checking on your label." cta="Open the product guides" art={<DecodeArt />} />
          <Flagship to="/journeys" Icon={LineChart} title="My Results Journey" text="Note where you started, check in every few weeks, and see the timeline the source gives, so you don’t judge a product too early." cta="Start a journey" art={<JourneyArt />} />
          <Flagship to="/coach" Icon={MessageCircle} title="Routine Coach" text="Ask about usage, missed days or irritation. Answers come from verified product information, and it tells you when it doesn’t know." cta="Ask the coach" art={<CoachArt />} />
        </div>
      </Container>

      {/* Continue */}
      <section className="bg-paper border-y border-line">
        <Container className="py-12">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <h2 className="font-display text-[30px] leading-tight">Continue your journey</h2>
            {hasData && <Link to="/routine" className="text-sage-700 font-medium inline-flex items-center gap-1 hover:underline">Today’s routine <ArrowRight size={16} /></Link>}
          </div>
          {!hasData ? (
            <div className="grid gap-6 md:grid-cols-[1.3fr_1fr] items-center rounded-card border border-dashed border-line p-6 sm:p-8">
              <div>
                <p className="text-lg font-medium">Nothing here yet.</p>
                <p className="mt-1 text-muted max-w-lg">Add a product to your routine from its guide, or start with the Fit Finder. Your routine and journeys will show up here, saved in this browser.</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <LinkButton to="/fit-finder">Start the Fit Finder</LinkButton>
                  <button type="button" onClick={loadDemo} className="text-sm text-muted underline hover:text-ink px-2">Load example data to look around</button>
                </div>
              </div>
              <ol className="space-y-3 text-[15px]">
                {['Find a product that fits', 'Add it to your routine', 'Start a Results Journey'].map((t, i) => (
                  <li key={t} className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-full bg-sage-100 text-sage-800 text-sm font-semibold tabular">{i + 1}</span>{t}</li>
                ))}
              </ol>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              <Card className="p-5">
                <p className="text-sm text-muted">Today’s routine</p>
                <p className="mt-1 font-display text-4xl tabular">{done}<span className="text-muted text-2xl">/{steps.length}</span></p>
                <div className="mt-3 h-1.5 rounded-full bg-sage-50 overflow-hidden"><div className="h-full bg-sage-500 rounded-full transition-all" style={{ width: `${steps.length ? (done / steps.length) * 100 : 0}%` }} /></div>
                <LinkButton to="/routine" variant="secondary" size="sm" className="mt-4">Open checklist</LinkButton>
              </Card>
              <Card className="p-5 md:col-span-2">
                <p className="text-sm text-muted mb-3">Active journeys</p>
                {active.length === 0 ? (
                  <p className="text-muted">No active journeys. <Link className="text-sage-700 underline" to="/journeys">Start one</Link> for a product in your routine.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {active.map((j) => {
                      const p = productById(j.productId)!;
                      const wk = Math.max(0, Math.floor(daysBetween(j.startDate, todayKey()) / 7));
                      const total = p.reviewWeek ?? 12;
                      return (
                        <li key={j.id} className="py-3 flex items-center gap-4">
                          <div className="min-w-0 flex-1">
                            <Link to={`/journeys/${j.id}`} className="font-medium hover:text-sage-700">{p.name}</Link>
                            <div className="mt-2 h-1.5 rounded-full bg-sage-50 overflow-hidden"><div className="h-full bg-sage-500" style={{ width: `${Math.min(100, (wk / total) * 100)}%` }} /></div>
                          </div>
                          <span className="text-sm text-muted tabular whitespace-nowrap">Week {wk}{p.reviewWeek ? ` of ${p.reviewWeek}` : ''}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>
          )}
        </Container>
      </section>

      {/* Explore products */}
      <Container className="py-14">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-[30px] leading-tight">Explore products</h2>
            <p className="text-muted mt-1">Seven products from the customer conversations behind this prototype.</p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            <Chip active={cat === 'all'} onClick={() => setCat('all')}>All</Chip>
            {CATEGORIES.map((c) => <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</Chip>)}
          </div>
        </div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => (
            <Link key={p.id} to={`/products/${p.id}`} className="group rounded-card border border-line bg-paper p-3 hover:border-sage-300 transition-colors">
              <ProductArt product={p} size="sm" />
              <p className="mt-3 font-medium leading-snug group-hover:text-sage-700">{p.name}</p>
              <div className="mt-2"><SourceBadge source={p.howToUse.source} /></div>
            </Link>
          ))}
        </div>
      </Container>

      {/* Utilities */}
      <Container className="pb-6">
        <div className="rounded-card border border-line bg-paper p-5 sm:p-6">
          <p className="font-medium mb-4">Handy tools</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: '/routine', Icon: ListChecks, t: 'Daily routine', d: 'Tick off today’s steps' },
              { to: '/answers', Icon: Search, t: 'Quick Answers', d: 'Search common questions' },
              { to: '/myths', Icon: Sparkles, t: 'Myth Buster', d: 'Eight myths, checked' },
              { to: '/reminders', Icon: BellRing, t: 'Reminders', d: 'Optional in-app nudges' },
            ].map((u) => (
              <Link key={u.to} to={u.to} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-ivory">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-sage-50 text-sage-700 shrink-0"><u.Icon size={17} /></span>
                <span><span className="block font-medium text-[15px]">{u.t}</span><span className="block text-sm text-muted">{u.d}</span></span>
              </Link>
            ))}
          </div>
        </div>
      </Container>

      {/* Closing */}
      <Container className="py-12">
        <div className="rounded-card bg-sage-800 text-white px-6 py-10 sm:px-10 grid gap-6 md:grid-cols-[1.5fr_1fr] items-center">
          <div>
            <h2 className="font-display text-[30px] sm:text-[36px] leading-tight">Most treatment products need weeks, not days.</h2>
            <p className="mt-2 text-white/80 max-w-xl">Use them as directed for the full course, note where you started, and check in along the way. Then you’ll know whether it’s working.</p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <LinkButton to="/routine" className="!bg-white !text-sage-800 hover:!bg-sage-50">Continue my routine</LinkButton>
            <LinkButton to="/products" variant="ghost" className="!text-white hover:!bg-white/10">Read a product guide</LinkButton>
          </div>
        </div>
      </Container>
    </>
  );
}

function Flagship({ to, Icon, title, text, cta, art }: { to: string; Icon: typeof Compass; title: string; text: string; cta: string; art: React.ReactNode }) {
  return (
    <Link to={to} className="group grid sm:grid-cols-[1fr_190px] gap-5 rounded-card border border-line bg-paper p-6 hover:border-sage-300 hover:shadow-soft transition">
      <div className="flex flex-col">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-sage-50 text-sage-700"><Icon size={19} /></span>
        <h3 className="mt-4 font-display text-[26px] leading-tight">{title}</h3>
        <p className="mt-2 text-muted leading-relaxed">{text}</p>
        <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sage-700 font-medium">{cta} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></span>
      </div>
      <div className="hidden sm:block self-stretch rounded-xl bg-ivory border border-line/70 p-4" aria-hidden>{art}</div>
    </Link>
  );
}

const FitArt = () => (
  <div className="flex h-full flex-col justify-center gap-2 text-[12.5px]">
    <p className="text-muted mb-1">What would you like help with?</p>
    {['Dark or uneven underarms', 'Hair thinning', 'Daily sun protection'].map((t, i) => (
      <span key={t} className={`rounded-full border px-3 py-1.5 ${i === 1 ? 'bg-ink text-white border-ink' : 'bg-paper border-line'}`}>{t}</span>
    ))}
  </div>
);
const DecodeArt = () => (
  <div className="flex h-full flex-col justify-center gap-2.5 text-[12.5px]">
    {[['How to use', 'brand'], ['How often', 'brand'], ['How much', 'unverified']].map(([t, s]) => (
      <div key={t} className="flex items-center justify-between gap-2 border-b border-line pb-2"><span>{t}</span><SourceBadge source={s as 'brand' | 'unverified'} /></div>
    ))}
  </div>
);
const JourneyArt = () => (
  <div className="flex h-full flex-col justify-center">
    <div className="relative h-2 rounded-full bg-sage-100"><div className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-sage-500" /></div>
    <div className="mt-2 flex justify-between text-[11px] text-muted tabular"><span>Wk 0</span><span>4</span><span>8</span><span>12</span></div>
    <div className="mt-4 rounded-lg bg-paper border border-line p-2.5 text-[12px]"><p className="font-medium">Week 6 check-in</p><p className="text-muted">Followed routine: mostly</p></div>
  </div>
);
const CoachArt = () => (
  <div className="flex h-full flex-col justify-center gap-2 text-[12.5px]">
    <span className="self-end rounded-2xl rounded-br-md bg-sage-700 text-white px-3 py-2 max-w-[85%]">I missed a day. Should I double up?</span>
    <span className="self-start rounded-2xl rounded-bl-md bg-paper border border-line px-3 py-2 max-w-[90%]">No need. Pick it up at your next usual time.</span>
  </div>
);

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-label="Example of a routine and journey view">
      <div className="absolute -inset-4 rounded-[28px] bg-blush-50" aria-hidden />
      <div className="relative rounded-[22px] border border-line bg-paper p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <p className="font-display text-xl">Today</p>
          <span className="text-[11.5px] rounded-full bg-ivory border border-line px-2 py-0.5 text-muted">Example</span>
        </div>
        <ul className="mt-4 space-y-2.5">
          {[
            { t: 'Hair Growth Serum, morning', d: true },
            { t: 'Underarm Roll-On', d: true },
            { t: 'Hair Growth Serum, evening', d: false },
          ].map((s) => (
            <li key={s.t} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
              <span className={`grid h-6 w-6 place-items-center rounded-full border ${s.d ? 'bg-sage-700 border-sage-700 text-white' : 'border-line'}`}>{s.d && <Check size={14} />}</span>
              <span className={`text-[15px] ${s.d ? 'text-muted line-through decoration-line' : ''}`}>{s.t}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 rounded-xl bg-ivory p-4">
          <div className="flex items-baseline justify-between"><p className="font-medium text-[15px]">Hair Growth Serum journey</p><p className="text-sm text-muted tabular">Week 6 of 12</p></div>
          <div className="relative mt-3 h-2 rounded-full bg-sage-100"><div className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-sage-500" /><span className="absolute -top-1 left-[66.6%] h-4 w-0.5 bg-blush-600" /></div>
          <p className="mt-2.5 text-[13px] text-muted">Next: week 8 check-in. The brand says to give it at least 3 months.</p>
        </div>
      </div>
    </div>
  );
}
