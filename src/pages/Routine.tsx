import { Link } from 'react-router-dom';
import { Check, ListChecks, Sun, Moon, Clock, Trash2, CircleHelp } from 'lucide-react';
import { Container } from '../components/Layout';
import { Card, EmptyState, LinkButton, Notice, PageHeader, SourceBadge } from '../components/ui';
import { productById } from '../data/products';
import { useStore, stepsFor, type Step } from '../lib/store';
import { addDays, fmtDate, parseDay, todayKey } from '../lib/dates';
import type { Slot } from '../types';

const GROUPS: { slot: Slot; label: string; Icon: typeof Sun }[] = [
  { slot: 'morning', label: 'Morning', Icon: Sun },
  { slot: 'evening', label: 'Evening', Icon: Moon },
  { slot: 'any', label: 'Any time of day', Icon: Clock },
];

export default function Routine() {
  const { state, toggleStep, setRoutineSlot, removeFromRoutine } = useStore();
  const today = todayKey();
  const done = state.checklist[today] || {};
  const steps = state.routine.flatMap(stepsFor);
  const count = steps.filter((s) => done[s.key]).length;
  const yesterday = addDays(today, -1);
  const yDone = state.checklist[yesterday] || {};
  const missedYesterday = steps.length > 0 && state.routine.every((r) => r.addedAt <= yesterday) && steps.some((s) => !yDone[s.key]);

  if (state.routine.length === 0) {
    return (
      <Container>
        <PageHeader eyebrow="Daily routine" title="Today’s checklist" />
        <EmptyState icon={<ListChecks size={22} />} title="Your routine is empty" action={<><LinkButton to="/products">Browse products</LinkButton><LinkButton to="/fit-finder" variant="secondary">Use the Fit Finder</LinkButton></>}>
          Add products from their guides. Products with a verified schedule get timed steps; others are listed as “use as directed on the label”.
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader eyebrow="Daily routine" title="Today’s checklist" intro={<>{fmtDate(today)}. Tick off each step as you go. This is for your own reference; nothing is scored.</>} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-5 content-start">
          <Card className="p-5 flex items-center gap-5">
            <Ring value={steps.length ? count / steps.length : 0} />
            <div>
              <p className="font-display text-2xl tabular">{count} of {steps.length} done</p>
              <p className="text-sm text-muted">{count === steps.length ? 'All done for today.' : 'Saved in this browser as you tick.'}</p>
            </div>
          </Card>

          {missedYesterday && (
            <Notice tone="calm">Some steps weren’t ticked yesterday. That’s fine. Carry on at your usual time today, and don’t double up to make up for it.</Notice>
          )}

          {GROUPS.map((g) => {
            const list = steps.filter((s) => s.slot === g.slot);
            if (!list.length) return null;
            return (
              <section key={g.slot}>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-muted mb-2"><g.Icon size={16} /> {g.label}</h2>
                <ul className="grid gap-2">{list.map((s) => <StepRow key={s.key} s={s} on={!!done[s.key]} onToggle={() => toggleStep(s.key)} />)}</ul>
              </section>
            );
          })}
          <WeekStrip />
        </div>

        <aside className="grid gap-4 content-start">
          <Card className="p-5">
            <p className="font-medium">Products in your routine</p>
            <ul className="mt-3 divide-y divide-line">
              {state.routine.map((r) => {
                const p = productById(r.productId)!;
                const twice = p.schedule?.timesPerDay === 2;
                return (
                  <li key={r.productId} className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/products/${p.id}`} className="font-medium text-[15px] hover:text-sage-700 leading-snug">{p.name}</Link>
                      <button type="button" onClick={() => removeFromRoutine(p.id)} className="text-muted hover:text-alert p-1" aria-label={`Remove ${p.name} from routine`}><Trash2 size={15} /></button>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px]">
                      {p.schedule ? <span className="text-muted">{p.schedule.label}</span> : <span className="text-muted">Schedule: check the label</span>}
                      <SourceBadge source={p.schedule?.source ?? 'unverified'} />
                    </div>
                    {!twice && (
                      <label className="mt-2 flex items-center gap-2 text-[13px] text-muted">
                        Show it in
                        <select value={r.slot} onChange={(e) => setRoutineSlot(p.id, e.target.value as Slot)} className="rounded-lg border border-line bg-paper px-2 py-1 text-ink">
                          <option value="morning">Morning</option><option value="evening">Evening</option><option value="any">Any time</option>
                        </select>
                      </label>
                    )}
                  </li>
                );
              })}
            </ul>
            <LinkButton to="/products" variant="ghost" size="sm" className="mt-2">Add another product</LinkButton>
          </Card>
          <Card className="p-5 text-sm text-muted">
            <p className="font-medium text-ink mb-1">Why some steps say “as directed”</p>
            We only show a set time or frequency when the brand or a retailer listing states it. For other products, follow your pack. Where a product is shown once, the time of day is your choice.
          </Card>
        </aside>
      </div>
    </Container>
  );
}

function StepRow({ s, on, onToggle }: { s: Step; on: boolean; onToggle: () => void }) {
  return (
    <li>
      <button type="button" onClick={onToggle} role="checkbox" aria-checked={on}
        className={`w-full flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-colors ${on ? 'bg-sage-50 border-sage-100' : 'bg-paper border-line hover:border-sage-300'}`}>
        <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${on ? 'bg-sage-700 border-sage-700 text-white' : 'border-line'}`}>{on && <Check size={14} strokeWidth={3} />}</span>
        <span className="flex-1 min-w-0">
          <span className={`block font-medium ${on ? 'text-muted line-through decoration-sage-300' : ''}`}>{s.label}</span>
          {!s.verified && <span className="mt-0.5 flex items-center gap-1 text-[13px] text-blush-700"><CircleHelp size={13} /> Use as directed on the label</span>}
        </span>
      </button>
    </li>
  );
}

function Ring({ value }: { value: number }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden className="shrink-0">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#EEF3EF" strokeWidth="7" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="#7A9783" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value)} transform="rotate(-90 32 32)" style={{ transition: 'stroke-dashoffset .4s' }} />
    </svg>
  );
}

function WeekStrip() {
  const { state } = useStore();
  const today = todayKey();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  return (
    <Card className="p-5">
      <p className="font-medium">Last 7 days</p>
      <p className="text-sm text-muted">Steps ticked each day. Gaps are normal; this isn’t a streak.</p>
      <div className="mt-4 grid grid-cols-7 gap-2 text-center">
        {days.map((d) => {
          const items = state.routine.filter((r) => r.addedAt <= d).flatMap(stepsFor);
          const n = items.filter((s) => state.checklist[d]?.[s.key]).length;
          const frac = items.length ? n / items.length : 0;
          return (
            <div key={d}>
              <div className="mx-auto h-12 w-full max-w-[44px] rounded-lg bg-sage-50 relative overflow-hidden" title={`${n} of ${items.length}`}>
                <div className="absolute bottom-0 inset-x-0 bg-sage-300" style={{ height: `${frac * 100}%` }} />
              </div>
              <p className={`mt-1 text-[11.5px] ${d === today ? 'text-ink font-semibold' : 'text-muted'}`}>{parseDay(d).toLocaleDateString('en-IN', { weekday: 'short' })}</p>
              <p className="text-[11px] text-muted tabular">{items.length ? `${n}/${items.length}` : '–'}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
