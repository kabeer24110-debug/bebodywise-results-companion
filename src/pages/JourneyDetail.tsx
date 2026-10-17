import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Pause, Play, Square, Trash2, ShieldAlert, BookOpen, MessageCircle, ListChecks, BellRing, Flag, CircleDot } from 'lucide-react';
import { Container } from '../components/Layout';
import { Button, Card, EmptyState, LinkButton, Notice, SourceBadge } from '../components/ui';
import { productById } from '../data/products';
import { buildStages, nextCheckInWeek } from '../data/milestones';
import { useStore } from '../lib/store';
import { detectSafety, REACTION_STEPS, URGENT_COPY } from '../lib/safety';
import { addDays, daysBetween, fmtDate, fmtShort, todayKey } from '../lib/dates';
import type { CheckIn, FollowedRoutine, Journey, Noticed, Product } from '../types';
import { STATUS_CLS, STATUS_LABEL } from './Journeys';

const FOLLOWED: { v: FollowedRoutine; l: string }[] = [{ v: 'yes', l: 'Yes, as directed' }, { v: 'mostly', l: 'Mostly' }, { v: 'no', l: 'Not really' }];
const NOTICED: { v: Noticed; l: string }[] = [{ v: 'better', l: 'Seems better' }, { v: 'same', l: 'About the same' }, { v: 'worse', l: 'Seems worse' }, { v: 'unsure', l: 'Not sure' }];
const RATING_LABEL = ['', 'Very unhappy', 'Unhappy', 'Neutral', 'Fairly happy', 'Happy'];

export default function JourneyDetail() {
  const { id } = useParams();
  const { state, setJourneyStatus, deleteJourney } = useStore();
  const nav = useNavigate();
  const j = state.journeys.find((x) => x.id === id);
  const [confirm, setConfirm] = useState<null | 'stop' | 'delete'>(null);
  const [showForm, setShowForm] = useState(false);

  if (!j) {
    return (
      <Container className="py-16">
        <EmptyState icon={<CircleDot size={22} />} title="Journey not found" action={<LinkButton to="/journeys">My journeys</LinkButton>}>
          It may have been deleted, or it was saved in a different browser.
        </EmptyState>
      </Container>
    );
  }
  const p = productById(j.productId)!;
  const days = Math.max(0, daysBetween(j.startDate, todayKey()));
  const notStarted = daysBetween(j.startDate, todayKey()) < 0;
  const wk = Math.floor(days / 7);
  const stages = buildStages(p);
  const last = j.checkIns[j.checkIns.length - 1];
  const lastWeek = last ? daysBetween(j.startDate, last.date) / 7 : 0;
  const nextW = nextCheckInWeek(lastWeek);
  const nextDate = nextW !== null ? addDays(j.startDate, nextW * 7) : null;
  const checkInDue = j.status === 'active' && nextDate !== null && nextDate <= todayKey() && (!last || daysBetween(last.date, todayKey()) >= 7);

  return (
    <Container className="pb-6">
      <Link to="/journeys" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mt-6"><ArrowLeft size={15} /> All journeys</Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className={`rounded-full border px-2.5 py-0.5 text-[12.5px] font-medium ${STATUS_CLS[j.status]}`}>{STATUS_LABEL[j.status]}</span>
            {j.baseline.note === 'Example journey' && <span className="text-[12.5px] text-muted">Example data</span>}
          </div>
          <h1 className="font-display text-[34px] sm:text-[42px] leading-[1.08] mt-2">{p.name}</h1>
          <p className="text-muted mt-1">Started {fmtDate(j.startDate)} · <span className="tabular">{notStarted ? 'Not started yet' : `Week ${wk}, day ${days + 1}`}</span></p>
        </div>
        <div className="flex flex-wrap gap-2">
          {j.status === 'active' && <Button variant="secondary" size="sm" onClick={() => setJourneyStatus(j.id, 'paused')}><Pause size={15} /> Pause</Button>}
          {j.status !== 'active' && <Button variant="secondary" size="sm" onClick={() => setJourneyStatus(j.id, 'active')}><Play size={15} /> {j.status === 'stopped' ? 'Restart tracking' : 'Resume'}</Button>}
          {j.status !== 'stopped' && <Button variant="quiet" size="sm" onClick={() => setConfirm('stop')}><Square size={14} /> Stop</Button>}
          <Button variant="quiet" size="sm" onClick={() => setConfirm('delete')}><Trash2 size={15} /> Delete</Button>
        </div>
      </header>

      {confirm && (
        <div className="mt-5 rounded-xl border border-line bg-paper p-4 flex flex-wrap items-center justify-between gap-3" role="alertdialog" aria-label="Confirm">
          <p className="text-[15px]">{confirm === 'stop' ? 'Stop this journey? Your check-ins are kept, and you can restart tracking later.' : 'Delete this journey and all its check-ins from this browser? This can’t be undone.'}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button size="sm" className={confirm === 'delete' ? '!bg-alert hover:!bg-alert/90' : ''} onClick={() => {
              if (confirm === 'stop') { setJourneyStatus(j.id, 'stopped'); setConfirm(null); }
              else { deleteJourney(j.id); nav('/journeys'); }
            }}>{confirm === 'stop' ? 'Stop journey' : 'Delete'}</Button>
          </div>
        </div>
      )}

      {j.status === 'paused' && <Notice tone="calm" className="mt-5">This journey is paused. Check-in reminders are off for it. If you paused because of irritation, follow the advice in your last check-in before starting again.</Notice>}
      {j.status === 'stopped' && <Notice tone="calm" className="mt-5">You stopped this journey. That’s a reasonable decision if a product isn’t right for you. Your notes are kept here for reference.</Notice>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 grid gap-6 content-start">
          <StatusPanel j={j} p={p} wk={wk} notStarted={notStarted} />
          <Timeline stages={stages} wk={wk} j={j} />
          {last && <NextSteps j={j} p={p} c={last} wk={wk} />}
          <History j={j} />
        </div>

        <aside className="grid gap-5 content-start">
          <Card className="p-5">
            <p className="font-display text-xl">Check in</p>
            {j.status !== 'active' ? (
              <p className="text-sm text-muted mt-1">Resume the journey to add check-ins.</p>
            ) : showForm ? (
              <CheckInForm j={j} onDone={() => setShowForm(false)} />
            ) : (
              <>
                <p className="text-sm text-muted mt-1">
                  {checkInDue ? <>Your <strong className="text-ink">week {nextW}</strong> check-in is due.</> : nextDate ? <>Next suggested check-in: <strong className="text-ink tabular">week {nextW}</strong> ({fmtShort(nextDate)}). You can check in any time.</> : 'Check in any time.'}
                </p>
                <Button className="mt-4 w-full" variant={checkInDue ? 'primary' : 'secondary'} onClick={() => setShowForm(true)}>Add a check-in</Button>
              </>
            )}
          </Card>
          <Card className="p-5">
            <p className="font-medium">Your starting point</p>
            <dl className="mt-3 grid gap-3 text-[14.5px]">
              <div><dt className="text-muted text-sm">Hoping for</dt><dd>{j.baseline.goal || <span className="text-muted">Not recorded</span>}</dd></div>
              <div><dt className="text-muted text-sm">How you felt about it</dt><dd>{j.baseline.rating ? RATING_LABEL[j.baseline.rating] : <span className="text-muted">Not recorded</span>}</dd></div>
              {j.baseline.note && j.baseline.note !== 'Example journey' && <div><dt className="text-muted text-sm">Notes</dt><dd>{j.baseline.note}</dd></div>}
            </dl>
            <p className="mt-3 text-[12.5px] text-muted">Tip: a photo in the same light every few weeks, kept on your phone, makes changes easier to judge. This app doesn’t store photos.</p>
          </Card>
          <Card className="p-5 grid gap-2">
            <LinkButton to={`/products/${p.id}`} variant="secondary" size="sm"><BookOpen size={15} /> Product guide</LinkButton>
            <LinkButton to={`/coach?product=${p.id}`} variant="ghost" size="sm"><MessageCircle size={15} /> Ask the coach</LinkButton>
          </Card>
        </aside>
      </div>
    </Container>
  );
}

function StatusPanel({ j, p, wk, notStarted }: { j: Journey; p: Product; wk: number; notStarted: boolean }) {
  const review = p.reviewWeek;
  const n = j.checkIns.length;
  const consistent = j.checkIns.filter((c) => c.followed === 'yes').length;
  const mostly = j.checkIns.filter((c) => c.followed === 'mostly').length;
  const last = j.checkIns[j.checkIns.length - 1];

  let headline: string, detail: string;
  if (notStarted) { headline = 'Not started yet'; detail = 'Your journey begins on the start date you chose.'; }
  else if (!review) { headline = `Week ${wk}`; detail = 'The source doesn’t give a results timeline for this product, so there is no set review point. Follow the label and check in when you like.'; }
  else if (wk < review) {
    headline = wk < review / 2 ? 'Early days' : 'Building up';
    detail = `It’s too early to judge. The source suggests about ${review} weeks of consistent use. ${review - wk} week${review - wk === 1 ? '' : 's'} to the review point.`;
  } else { headline = 'At the review point'; detail = 'You’ve reached the point the source suggests for judging results. Look back at your starting point and check-ins below.'; }

  return (
    <Card className="p-5 sm:p-6">
      <p className="text-sm text-muted">Where you are</p>
      <p className="font-display text-[30px] leading-tight mt-0.5">{headline}</p>
      <p className="mt-1.5 text-muted max-w-2xl">{detail}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Metric label="Consistency you reported" value={n ? `${consistent} of ${n}` : '–'} hint={n ? `check-ins “as directed”${mostly ? `, ${mostly} “mostly”` : ''}` : 'No check-ins yet'} />
        <Metric label="How it seems to you" value={last ? NOTICED.find((x) => x.v === last.noticed)!.l : '–'} hint={last ? `Your view at ${fmtShort(last.date)}` : 'No check-ins yet'} />
        <Metric label="Measured results" value="Not tracked" hint="This app doesn’t measure skin or hair." />
      </div>
      <p className="mt-4 text-[12.5px] text-muted">These are your own answers. They aren’t a clinical assessment, and this app doesn’t judge whether a product is working.</p>
    </Card>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl bg-ivory p-4">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-1 font-medium text-lg tabular">{value}</p>
      <p className="text-[12.5px] text-muted">{hint}</p>
    </div>
  );
}

function Timeline({ stages, wk, j }: { stages: ReturnType<typeof buildStages>; wk: number; j: Journey }) {
  const maxW = Math.max(...stages.map((s) => s.week), wk, 12);
  const checkWeeks = new Set(j.checkIns.map((c) => Math.round(daysBetween(j.startDate, c.date) / 7)));
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="font-display text-[24px]">Timeline</h2>
      {/* bar */}
      <div className="relative mt-8 mb-10 mx-1" aria-hidden>
        <div className="h-2 rounded-full bg-sage-50" />
        <div className="absolute inset-y-0 left-0 h-2 rounded-full bg-sage-500" style={{ width: `${Math.min(100, (wk / maxW) * 100)}%` }} />
        {stages.filter((s) => s.kind !== 'checkin').map((s) => (
          <span key={s.kind + s.week} className={`absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-paper ${s.kind === 'review' ? 'bg-blush-600' : s.kind === 'brand' ? 'bg-sand-300' : 'bg-sage-700'}`} style={{ left: `${(s.week / maxW) * 100}%` }} />
        ))}
        <span className="absolute -top-7 -translate-x-1/2 rounded-full bg-ink text-white text-[11px] px-2 py-0.5 tabular whitespace-nowrap" style={{ left: `${Math.min(100, (wk / maxW) * 100)}%` }}>You · wk {wk}</span>
        <div className="absolute top-4 left-0 right-0 flex justify-between text-[11.5px] text-muted tabular"><span>Week 0</span><span>Week {maxW}</span></div>
      </div>
      <ol className="grid gap-0">
        {stages.map((s, i) => {
          const done = s.week <= wk;
          const isCheck = s.kind === 'checkin';
          const checked = isCheck && [...checkWeeks].some((w) => Math.abs(w - s.week) <= 1);
          return (
            <li key={i} className="grid grid-cols-[56px_20px_1fr] gap-3">
              <span className={`text-sm tabular pt-0.5 ${done ? 'text-ink' : 'text-muted'}`}>Wk {s.week}</span>
              <span className="relative flex justify-center">
                <span className={`mt-1 z-10 h-3.5 w-3.5 rounded-full border-2 ${s.kind === 'review' ? 'border-blush-600' : 'border-sage-500'} ${done ? (s.kind === 'review' ? 'bg-blush-600' : 'bg-sage-500') : 'bg-paper'}`} />
                {i < stages.length - 1 && <span className="absolute top-4 bottom-0 w-px bg-line" />}
              </span>
              <div className="pb-5">
                <p className="font-medium flex flex-wrap items-center gap-2">
                  {s.kind === 'review' && <Flag size={14} className="text-blush-600" />}{s.title}
                  {checked && <span className="inline-flex items-center gap-1 text-[12px] text-sage-700"><Check size={13} /> Checked in</span>}
                </p>
                <p className="text-sm text-muted">{s.detail}</p>
                {s.source && <div className="mt-1.5"><SourceBadge source={s.source} /></div>}
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function NextSteps({ j, p, c, wk }: { j: Journey; p: Product; c: CheckIn; wk: number }) {
  const safety = c.reaction ? 'reaction' : detectSafety(c.note);
  if (safety === 'urgent') {
    return <Notice tone="urgent" title="Get urgent help">{URGENT_COPY}</Notice>;
  }
  if (safety === 'reaction') {
    return (
      <Card className="p-5 sm:p-6 border-blush-100">
        <div className="flex items-center gap-2 text-blush-700"><ShieldAlert size={19} /><h2 className="font-display text-[24px]">You reported a reaction</h2></div>
        <ol className="mt-3 space-y-2 list-decimal pl-5">{REACTION_STEPS.map((s) => <li key={s}>{s}</li>)}</ol>
        <p className="mt-3 text-sm text-muted">This is general guidance, not a diagnosis. Pausing this journey turns off its check-in reminders.</p>
        {j.status === 'active' && <PauseButton id={j.id} />}
      </Card>
    );
  }
  const items: { Icon: typeof BookOpen; t: string; d: string; to?: string; cta?: string }[] = [];
  if (c.confused) items.push({ Icon: BookOpen, t: 'Re-read how to use it', d: 'You said something was unclear. The guide labels which details are verified, and the coach can answer specific questions.', to: `/products/${p.id}`, cta: 'Open the guide' });
  if (c.followed !== 'yes') items.push({ Icon: ListChecks, t: 'Make it easier to stay consistent', d: 'Missing days happens. Tick it off in the daily checklist, or turn on in-app reminders. There’s no need to make up for missed doses.', to: '/routine', cta: 'Open my checklist' });
  if (c.followed !== 'yes') items.push({ Icon: BellRing, t: 'Optional reminders', d: 'Shown inside this app when you open it.', to: '/reminders', cta: 'Reminder settings' });
  if (c.noticed === 'worse') items.push({ Icon: ShieldAlert, t: 'If it seems worse', d: 'Check you’re using it as directed and not more often. If it keeps getting worse, pause and speak to a dermatologist or pharmacist.', to: `/coach?product=${p.id}`, cta: 'Ask the coach' });
  if ((c.noticed === 'same' || c.noticed === 'unsure') && p.reviewWeek && wk < p.reviewWeek) items.push({ Icon: CircleDot, t: 'No change yet is normal', d: `You’re at week ${wk}. The source suggests about ${p.reviewWeek} weeks of consistent use before judging.` });
  if ((c.noticed === 'same' || c.noticed === 'unsure') && p.reviewWeek && wk >= p.reviewWeek) items.push({ Icon: Flag, t: 'Time to decide', d: c.followed === 'yes' ? 'You’ve used it consistently up to the review point. If you’re not seeing what you hoped for, it’s reasonable to stop, or to ask a dermatologist about other options.' : 'You’re past the review point, but use hasn’t been consistent. You could restart a fresh journey with steadier use, or decide it isn’t for you.' });
  if (c.noticed === 'better') items.push({ Icon: Check, t: 'Keep going as directed', d: 'Keep using it as the label says. More product or more frequent use won’t speed things up.' });
  if (items.length === 0) return null;
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="font-display text-[24px]">Suggested next steps</h2>
      <p className="text-sm text-muted">Based on your check-in on {fmtDate(c.date)}.</p>
      <ul className="mt-4 grid gap-3">
        {items.map((it) => (
          <li key={it.t} className="flex gap-3 rounded-xl bg-ivory p-4">
            <it.Icon size={18} className="mt-0.5 shrink-0 text-sage-700" />
            <div>
              <p className="font-medium">{it.t}</p>
              <p className="text-sm text-muted mt-0.5">{it.d}</p>
              {it.to && <Link to={it.to} className="mt-1.5 inline-block text-sm text-sage-700 underline">{it.cta}</Link>}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function PauseButton({ id }: { id: string }) {
  const { setJourneyStatus } = useStore();
  return <Button className="mt-4" variant="secondary" size="sm" onClick={() => setJourneyStatus(id, 'paused')}><Pause size={15} /> Pause this journey</Button>;
}

function History({ j }: { j: Journey }) {
  if (!j.checkIns.length) return null;
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="font-display text-[24px]">Check-ins</h2>
      <ul className="mt-3 divide-y divide-line">
        {[...j.checkIns].reverse().map((c) => (
          <li key={c.id} className="py-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">{fmtDate(c.date)} <span className="text-muted font-normal text-sm tabular">· week {Math.floor(Math.max(0, daysBetween(j.startDate, c.date)) / 7)}</span></p>
              <div className="flex flex-wrap gap-1.5 text-[12.5px]">
                <Tag>Used: {FOLLOWED.find((x) => x.v === c.followed)!.l.toLowerCase()}</Tag>
                <Tag>{NOTICED.find((x) => x.v === c.noticed)!.l}</Tag>
                {c.reaction && <Tag warn>Reaction</Tag>}
                {c.confused && <Tag>Had questions</Tag>}
              </div>
            </div>
            {c.note && <p className="mt-1.5 text-[14.5px] text-muted">{c.note}</p>}
          </li>
        ))}
      </ul>
    </Card>
  );
}
const Tag = ({ children, warn }: { children: React.ReactNode; warn?: boolean }) => (
  <span className={`rounded-full border px-2 py-0.5 ${warn ? 'bg-blush-50 border-blush-100 text-blush-700' : 'bg-ivory border-line text-muted'}`}>{children}</span>
);

function CheckInForm({ j, onDone }: { j: Journey; onDone: () => void }) {
  const { addCheckIn } = useStore();
  const [followed, setFollowed] = useState<FollowedRoutine | null>(null);
  const [noticed, setNoticed] = useState<Noticed | null>(null);
  const [reaction, setReaction] = useState<boolean | null>(null);
  const [confused, setConfused] = useState(false);
  const [note, setNote] = useState('');
  const [urgentCheck, setUrgentCheck] = useState<null | 'ask' | 'urgent'>(null);
  const noteSafety = detectSafety(note);

  const save = () => {
    if (!followed || !noticed || reaction === null) return;
    addCheckIn(j.id, { date: todayKey(), followed, noticed, reaction: reaction || noteSafety === 'reaction', confused, note: note.trim() });
    onDone();
  };

  return (
    <div className="mt-3 grid gap-4">
      <Group label="Have you been using it as directed?">
        {FOLLOWED.map((o) => <Pick key={o.v} on={followed === o.v} onClick={() => setFollowed(o.v)}>{o.l}</Pick>)}
      </Group>
      <Group label="Compared with when you started, it…">
        {NOTICED.map((o) => <Pick key={o.v} on={noticed === o.v} onClick={() => setNoticed(o.v)}>{o.l}</Pick>)}
      </Group>
      <Group label="Any redness, burning, itching or other irritation?">
        <Pick on={reaction === false} onClick={() => { setReaction(false); setUrgentCheck(null); }}>No</Pick>
        <Pick on={reaction === true} onClick={() => { setReaction(true); setUrgentCheck('ask'); }}>Yes</Pick>
      </Group>
      {reaction && urgentCheck === 'ask' && (
        <div className="rounded-xl border border-blush-100 bg-blush-50 p-3 text-[14px]">
          <p className="font-medium text-blush-700">Is there any swelling of your face, lips or throat, or difficulty breathing?</p>
          <div className="mt-2 flex gap-2">
            <Pick on={false} onClick={() => setUrgentCheck('urgent')}>Yes</Pick>
            <Pick on={false} onClick={() => setUrgentCheck(null)}>No</Pick>
          </div>
        </div>
      )}
      {(urgentCheck === 'urgent' || noteSafety === 'urgent') && <Notice tone="urgent" title="Get urgent help now">{URGENT_COPY}</Notice>}
      {reaction && urgentCheck === null && (
        <Notice tone="caution" title="Stop using it for now">Rinse the area gently and read your label. Save this check-in to see the full guidance.</Notice>
      )}
      <label className="flex items-center gap-2.5 text-[14.5px]">
        <input type="checkbox" checked={confused} onChange={(e) => setConfused(e.target.checked)} className="h-4 w-4 accent-sage-700" />
        Something about using it is unclear
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-medium">Note <span className="text-muted font-normal">(optional)</span></span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={300} className="rounded-xl border border-line bg-paper px-3 py-2 text-[14.5px]" placeholder="Anything you noticed" />
      </label>
      {noteSafety === 'reaction' && !reaction && <p className="text-[13px] text-blush-700">Your note mentions irritation, so this check-in will be marked as a reaction.</p>}
      <div className="flex gap-2">
        <Button onClick={save} disabled={!followed || !noticed || reaction === null || urgentCheck === 'ask'}>Save check-in</Button>
        <Button variant="quiet" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium mb-1.5">{label}</legend>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </fieldset>
  );
}
function Pick({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} aria-pressed={on} className={`rounded-full border px-3 py-1.5 text-[13.5px] ${on ? 'bg-ink text-white border-ink' : 'bg-paper border-line hover:border-sage-300'}`}>{children}</button>;
}
