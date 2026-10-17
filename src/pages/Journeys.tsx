import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LineChart, Plus, ArrowRight, X } from 'lucide-react';
import { Container } from '../components/Layout';
import { Button, Card, EmptyState, Notice, PageHeader } from '../components/ui';
import { PRODUCTS, productById } from '../data/products';
import { useStore } from '../lib/store';
import { daysBetween, fmtDate, todayKey } from '../lib/dates';
import type { Journey } from '../types';

export const STATUS_LABEL: Record<Journey['status'], string> = { active: 'Active', paused: 'Paused', stopped: 'Stopped' };
export const STATUS_CLS: Record<Journey['status'], string> = {
  active: 'bg-sage-50 text-sage-800 border-sage-100',
  paused: 'bg-sand-100 text-[#6B5532] border-[#E9DCC4]',
  stopped: 'bg-ivory text-muted border-line',
};

export default function Journeys() {
  const { state } = useStore();
  const [params, setParams] = useSearchParams();
  const startId = params.get('start');
  const [formOpen, setFormOpen] = useState(!!startId);
  useEffect(() => { if (startId) setFormOpen(true); }, [startId]);

  const close = () => { setFormOpen(false); if (startId) setParams({}, { replace: true }); };
  const sorted = [...state.journeys].sort((a, b) => order(a.status) - order(b.status) || b.startDate.localeCompare(a.startDate));

  return (
    <Container>
      <PageHeader eyebrow="My Results Journey" title="Know whether it’s working"
        intro="Most treatment products take weeks before you can fairly judge them. A journey records where you started, prompts short check-ins, and shows the timeline the source gives, so you don’t give up too early or keep going without a plan.">
        {!formOpen && <Button onClick={() => setFormOpen(true)}><Plus size={17} /> Start a journey</Button>}
      </PageHeader>

      {formOpen && <StartForm initialProduct={startId ?? undefined} onClose={close} />}

      {sorted.length === 0 && !formOpen ? (
        <EmptyState icon={<LineChart size={22} />} title="No journeys yet" action={<Button onClick={() => setFormOpen(true)}><Plus size={17} /> Start your first journey</Button>}>
          Start one when you begin using a product. It takes about a minute.
        </EmptyState>
      ) : sorted.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 mt-2">
          {sorted.map((j) => <JourneyCard key={j.id} j={j} />)}
        </div>
      )}
    </Container>
  );
}

const order = (s: Journey['status']) => ({ active: 0, paused: 1, stopped: 2 })[s];

function JourneyCard({ j }: { j: Journey }) {
  const p = productById(j.productId)!;
  const days = Math.max(0, daysBetween(j.startDate, todayKey()));
  const wk = Math.floor(days / 7);
  const total = p.reviewWeek ?? 12;
  const last = j.checkIns[j.checkIns.length - 1];
  return (
    <Link to={`/journeys/${j.id}`} className="group rounded-card border border-line bg-paper p-5 hover:border-sage-300 hover:shadow-soft transition">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-[23px] leading-snug group-hover:text-sage-700">{p.name}</h2>
          <p className="text-sm text-muted mt-0.5">Started {fmtDate(j.startDate)}{j.baseline.note === 'Example journey' ? ' · Example' : ''}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[12.5px] font-medium ${STATUS_CLS[j.status]}`}>{STATUS_LABEL[j.status]}</span>
      </div>
      <div className="mt-5 flex items-center justify-between text-sm"><span className="tabular">Week {wk}</span><span className="text-muted tabular">{p.reviewWeek ? `Review point: week ${p.reviewWeek}` : 'No timeline stated'}</span></div>
      <div className="mt-2 h-2 rounded-full bg-sage-50 overflow-hidden"><div className={`h-full rounded-full ${j.status === 'active' ? 'bg-sage-500' : 'bg-sand-300'}`} style={{ width: `${Math.min(100, (wk / total) * 100)}%` }} /></div>
      <div className="mt-4 flex items-center justify-between text-sm text-muted">
        <span>{j.checkIns.length} check-in{j.checkIns.length === 1 ? '' : 's'}{last ? `, last ${fmtDate(last.date)}` : ''}</span>
        <ArrowRight size={16} className="text-sage-700 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

const RATINGS = [
  { v: 1, l: 'Very unhappy' }, { v: 2, l: 'Unhappy' }, { v: 3, l: 'Neutral' }, { v: 4, l: 'Fairly happy' }, { v: 5, l: 'Happy' },
];

function StartForm({ initialProduct, onClose }: { initialProduct?: string; onClose: () => void }) {
  const { state, startJourney, inRoutine, addToRoutine } = useStore();
  const nav = useNavigate();
  const [productId, setProductId] = useState(productById(initialProduct) ? initialProduct! : state.routine[0]?.productId ?? '');
  const [startDate, setStartDate] = useState(todayKey());
  const [goal, setGoal] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [alsoRoutine, setAlsoRoutine] = useState(true);
  const [error, setError] = useState('');

  const existing = state.journeys.find((j) => j.productId === productId && j.status !== 'stopped');
  const p = productById(productId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p) { setError('Choose a product to track.'); return; }
    if (startDate > todayKey()) { setError('The start date can’t be in the future.'); return; }
    const id = startJourney({ productId, startDate, baseline: { goal: goal.trim(), rating, note: note.trim() } });
    if (alsoRoutine && !inRoutine(productId)) addToRoutine(productId);
    nav(`/journeys/${id}`);
  };

  const routineIds = new Set(state.routine.map((r) => r.productId));
  const options = [...PRODUCTS].sort((a, b) => Number(routineIds.has(b.id)) - Number(routineIds.has(a.id)));

  return (
    <Card className="p-5 sm:p-7 mb-8 fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[28px] leading-tight">Start a Results Journey</h2>
          <p className="text-muted mt-1">Write down where you are starting from. In a few weeks this is what you’ll compare against.</p>
        </div>
        <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-ivory text-muted" aria-label="Close form"><X size={18} /></button>
      </div>
      <form onSubmit={submit} className="mt-6 grid gap-5 md:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Product</span>
          <select value={productId} onChange={(e) => { setProductId(e.target.value); setError(''); }} className="rounded-xl border border-line bg-paper px-3 py-2.5">
            <option value="">Choose a product</option>
            {options.map((o) => <option key={o.id} value={o.id}>{o.name}{routineIds.has(o.id) ? ' (in your routine)' : ''}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">When did you start (or will you start) using it?</span>
          <input type="date" value={startDate} max={todayKey()} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl border border-line bg-paper px-3 py-2" />
        </label>
        {existing && (
          <div className="md:col-span-2"><Notice tone="calm">You already have a {existing.status} journey for this product. <Link to={`/journeys/${existing.id}`} className="underline">Open it</Link>, or start a new one if you are beginning a fresh course.</Notice></div>
        )}
        {p && (
          <div className="md:col-span-2 rounded-xl bg-ivory px-4 py-3 text-[14.5px]">
            {p.reviewWeek ? <>The source suggests judging this product at around <strong>week {p.reviewWeek}</strong>, with consistent use as directed.</> : <>We don’t have a verified results timeline for this product. You can still track it; check the label for guidance.</>}
          </div>
        )}
        <label className="grid gap-1.5 md:col-span-2">
          <span className="text-sm font-medium">What do you hope will change? <span className="text-muted font-normal">(optional)</span></span>
          <input value={goal} onChange={(e) => setGoal(e.target.value)} maxLength={120} placeholder="For example: less thinning near my parting" className="rounded-xl border border-line bg-paper px-3 py-2.5" />
        </label>
        <fieldset className="md:col-span-2">
          <legend className="text-sm font-medium mb-2">How do you feel about it today? <span className="text-muted font-normal">(optional)</span></legend>
          <div className="flex flex-wrap gap-2">
            {RATINGS.map((r) => (
              <button type="button" key={r.v} onClick={() => setRating(rating === r.v ? null : r.v)} aria-pressed={rating === r.v}
                className={`rounded-full border px-3.5 py-1.5 text-sm ${rating === r.v ? 'bg-ink text-white border-ink' : 'bg-paper border-line hover:border-sage-300'}`}>{r.l}</button>
            ))}
          </div>
        </fieldset>
        <label className="grid gap-1.5 md:col-span-2">
          <span className="text-sm font-medium">Anything else to remember about the starting point? <span className="text-muted font-normal">(optional)</span></span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={300} placeholder="For example: noticeable on the left side more than the right" className="rounded-xl border border-line bg-paper px-3 py-2.5" />
          <span className="text-[12.5px] text-muted">Saved only in this browser. Please don’t enter names, contact details or medical records.</span>
        </label>
        {p && !inRoutine(p.id) && (
          <label className="md:col-span-2 flex items-center gap-2.5 text-[15px]">
            <input type="checkbox" checked={alsoRoutine} onChange={(e) => setAlsoRoutine(e.target.checked)} className="h-4 w-4 accent-sage-700" />
            Also add {p.shortName} to my daily routine
          </label>
        )}
        {error && <p className="md:col-span-2 text-alert text-sm" role="alert">{error}</p>}
        <div className="md:col-span-2 flex flex-wrap gap-3">
          <Button type="submit" size="lg">Start journey</Button>
          <Button variant="quiet" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
