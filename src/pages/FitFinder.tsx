import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Pencil, RotateCcw, Plus, LineChart, MessageCircle, BookOpen, Search } from 'lucide-react';
import { Container } from '../components/Layout';
import { Button, Card, LinkButton, Notice, PageHeader } from '../components/ui';
import { ProductArt } from '../components/ProductArt';
import { visibleQuestions, type FitQuestion } from '../data/fitRules';
import { productById } from '../data/products';
import { recommend } from '../lib/recommend';
import { useStore } from '../lib/store';
import type { FitAnswers } from '../types';

type Phase = 'intro' | 'ask' | 'review' | 'result';

const EXCLUSIVE = new Set(['not-sure', 'none']);

export default function FitFinder() {
  const { state, saveFitAnswers } = useStore();
  const [answers, setAnswers] = useState<FitAnswers>(state.fitAnswers ?? {});
  const [phase, setPhase] = useState<Phase>(state.fitAnswers ? 'result' : 'intro');
  const [idx, setIdx] = useState(0);
  const [returnToReview, setReturnToReview] = useState(false);

  const qs = visibleQuestions(answers);
  const q = qs[Math.min(idx, qs.length - 1)];

  const isAnswered = (qq: FitQuestion) => {
    const v = answers[qq.id];
    return Array.isArray(v) ? v.length > 0 : !!v;
  };

  const clean = (a: FitAnswers): FitAnswers => {
    const vis = new Set(visibleQuestions(a).map((x) => x.id));
    return Object.fromEntries(Object.entries(a).filter(([k]) => vis.has(k)));
  };

  const choose = (qq: FitQuestion, value: string) => {
    setAnswers((prev) => {
      if (!qq.multi) return { ...prev, [qq.id]: value };
      const cur = Array.isArray(prev[qq.id]) ? (prev[qq.id] as string[]) : [];
      let next: string[];
      if (cur.includes(value)) next = cur.filter((v) => v !== value);
      else if (EXCLUSIVE.has(value)) next = [value];
      else {
        next = cur.filter((v) => !EXCLUSIVE.has(v));
        if (qq.max && next.length >= qq.max) return prev;
        next = [...next, value];
      }
      return { ...prev, [qq.id]: next };
    });
  };

  const next = () => {
    const visible = visibleQuestions(answers);
    if (returnToReview) {
      // if editing revealed a new unanswered question, ask it before going back
      const firstGap = visible.findIndex((x) => !isAnsweredIn(answers, x));
      if (firstGap >= 0) { setIdx(firstGap); return; }
      setReturnToReview(false); setPhase('review'); return;
    }
    if (idx + 1 < visible.length) setIdx(idx + 1);
    else setPhase('review');
  };
  const back = () => {
    if (idx === 0) setPhase('intro');
    else setIdx(idx - 1);
  };

  const finish = () => {
    const a = clean(answers);
    setAnswers(a);
    saveFitAnswers(a);
    setPhase('result');
    window.scrollTo(0, 0);
  };

  const restart = () => { setAnswers({}); saveFitAnswers(null); setIdx(0); setReturnToReview(false); setPhase('ask'); };

  const result = useMemo(() => (phase === 'result' ? recommend(answers) : null), [phase, answers]);

  return (
    <Container className="pb-8">
      {phase === 'intro' && (
        <div className="max-w-3xl">
          <PageHeader eyebrow="Fit Finder" title="Find products that fit what you want help with" intro="A few short questions, usually under a minute. Each answer only leads to questions that matter for it, and every suggestion comes with the reason behind it.">
            <Button size="lg" onClick={() => { setIdx(0); setPhase('ask'); }}>Start <ArrowRight size={18} /></Button>
          </PageHeader>
          <div className="grid gap-4 sm:grid-cols-3 mt-2">
            {[
              ['Rule-based, not a diagnosis', 'Your answers are matched to what each product is made for. Nothing is guessed or learned.'],
              ['Safety first', 'Some answers lead to a suggestion to see a doctor instead of, or before, a product.'],
              ['Stays on this device', 'Answers are saved only in this browser, so you can come back and change them.'],
            ].map(([t, d]) => (
              <Card key={t} className="p-5"><p className="font-medium">{t}</p><p className="mt-1.5 text-sm text-muted leading-relaxed">{d}</p></Card>
            ))}
          </div>
        </div>
      )}

      {phase === 'ask' && q && (
        <div className="max-w-2xl mx-auto pt-8 sm:pt-12 fade-in" key={q.id}>
          <div className="flex items-center justify-between text-sm text-muted mb-3">
            <span className="tabular">Question {Math.min(idx, qs.length - 1) + 1} of {qs.length}</span>
            {returnToReview && <button className="underline hover:text-ink" onClick={() => { setReturnToReview(false); setPhase('review'); }}>Back to review</button>}
          </div>
          <div className="h-1.5 rounded-full bg-sage-50 overflow-hidden mb-8" aria-hidden><div className="h-full bg-sage-500 transition-all" style={{ width: `${((Math.min(idx, qs.length - 1) + 1) / qs.length) * 100}%` }} /></div>
          <fieldset>
            <legend className="font-display text-[30px] sm:text-[36px] leading-tight">{q.prompt}</legend>
            {q.help && <p className="mt-2 text-muted">{q.help}</p>}
            <div className="mt-6 grid gap-2.5" role={q.multi ? 'group' : 'radiogroup'}>
              {q.options.map((o) => {
                const v = answers[q.id];
                const selected = Array.isArray(v) ? v.includes(o.value) : v === o.value;
                return (
                  <button key={o.value} type="button" onClick={() => choose(q, o.value)}
                    role={q.multi ? 'checkbox' : 'radio'} aria-checked={selected}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors ${selected ? 'border-sage-700 bg-sage-50' : 'border-line bg-paper hover:border-sage-300'}`}>
                    <span className={`grid h-5 w-5 shrink-0 place-items-center border ${q.multi ? 'rounded-md' : 'rounded-full'} ${selected ? 'bg-sage-700 border-sage-700 text-white' : 'border-line bg-paper'}`}>{selected && <Check size={13} />}</span>
                    <span><span className="block font-medium">{o.label}</span>{o.hint && <span className="block text-sm text-muted">{o.hint}</span>}</span>
                  </button>
                );
              })}
            </div>
            {q.multi && q.max && <p className="mt-3 text-sm text-muted tabular">{(Array.isArray(answers[q.id]) ? (answers[q.id] as string[]).length : 0)} of {q.max} selected</p>}
          </fieldset>
          <div className="mt-8 flex items-center justify-between">
            <Button variant="quiet" onClick={back}><ArrowLeft size={17} /> Back</Button>
            <Button onClick={next} disabled={!isAnswered(q)}>{idx + 1 >= qs.length && !returnToReview ? 'Review answers' : 'Next'} <ArrowRight size={17} /></Button>
          </div>
        </div>
      )}

      {phase === 'review' && (
        <div className="max-w-2xl mx-auto pt-8 sm:pt-12 fade-in">
          <h1 className="font-display text-[34px] leading-tight">Check your answers</h1>
          <p className="mt-2 text-muted">Change anything that doesn’t look right. Your suggestions will update.</p>
          <dl className="mt-6 divide-y divide-line rounded-card border border-line bg-paper">
            {qs.map((qq, i) => (
              <div key={qq.id} className="flex items-start gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <dt className="text-sm text-muted">{qq.prompt}</dt>
                  <dd className="mt-0.5 font-medium">{labelFor(qq, answers[qq.id]) || <span className="text-blush-700">Not answered</span>}</dd>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setIdx(i); setReturnToReview(true); setPhase('ask'); }} aria-label={`Edit: ${qq.prompt}`}><Pencil size={14} /> Edit</Button>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <Button variant="quiet" onClick={restart}><RotateCcw size={16} /> Start over</Button>
            <Button size="lg" onClick={finish} disabled={qs.some((x) => !isAnswered(x))}>See my suggestions <ArrowRight size={18} /></Button>
          </div>
        </div>
      )}

      {phase === 'result' && result && <Results answers={answers} result={result} onEdit={() => setPhase('review')} onRestart={restart} />}
    </Container>
  );
}

function isAnsweredIn(a: FitAnswers, q: FitQuestion) {
  const v = a[q.id];
  return Array.isArray(v) ? v.length > 0 : !!v;
}

function labelFor(q: FitQuestion, v: string | string[] | undefined) {
  if (!v) return '';
  const vals = Array.isArray(v) ? v : [v];
  return vals.map((x) => q.options.find((o) => o.value === x)?.label ?? x).join(', ');
}

const ROLE: Record<string, string> = { main: 'Suggested for you', pair: 'Could pair well', alternative: 'An alternative' };

function Results({ answers, result, onEdit, onRestart }: { answers: FitAnswers; result: ReturnType<typeof recommend>; onEdit: () => void; onRestart: () => void }) {
  const { addToRoutine, inRoutine, state } = useStore();
  const concerns = visibleQuestions(answers)[0];
  return (
    <div className="fade-in">
      <PageHeader eyebrow="Your Fit Finder results" title={result.insufficient && result.recommendations.length === 0 ? 'We need a little more to go on' : 'Here’s what fits, and why'}
        intro={<>Based on: <span className="text-ink">{labelFor(concerns, answers.concerns)}</span>. This is a rule-based match to each product’s stated purpose, not a skin or medical assessment.</>}>
        <Button variant="secondary" onClick={onEdit}><Pencil size={16} /> Edit answers</Button>
        <Button variant="quiet" onClick={onRestart}><RotateCcw size={16} /> Start over</Button>
      </PageHeader>

      {result.referrals.length > 0 && (
        <Notice tone="caution" title="Worth checking with a doctor" className="mb-6">
          <ul className="list-disc pl-5 space-y-1">{result.referrals.map((r) => <li key={r}>{r}</li>)}</ul>
        </Notice>
      )}

      {result.recommendations.length > 0 && (
        <div className="grid gap-5">
          {result.recommendations.map((r) => {
            const p = productById(r.productId)!;
            const added = inRoutine(p.id);
            const journey = state.journeys.find((j) => j.productId === p.id && j.status !== 'stopped');
            return (
              <Card key={p.id} className="p-5 sm:p-6 grid gap-6 md:grid-cols-[220px_1fr]">
                <div><ProductArt product={p} /></div>
                <div>
                  <p className={`text-sm font-medium ${r.role === 'main' ? 'text-sage-700' : 'text-blush-700'}`}>{ROLE[r.role]}</p>
                  <h2 className="font-display text-[28px] leading-tight mt-1">{p.name}</h2>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold mb-1.5">Why it’s suggested</p>
                      <ul className="space-y-1.5 text-[15px]">{r.reasons.map((x) => <li key={x} className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-sage-700" />{x}</li>)}</ul>
                    </div>
                    {r.cautions.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-1.5">Keep in mind</p>
                        <ul className="space-y-1.5 text-[15px] text-muted">{r.cautions.map((x) => <li key={x} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-blush-300 shrink-0" />{x}</li>)}</ul>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2.5">
                    <LinkButton to={`/products/${p.id}`} variant="secondary" size="sm"><BookOpen size={15} /> How to use it</LinkButton>
                    {added ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 text-sage-800 px-3.5 py-1.5 text-sm"><Check size={15} /> In your routine</span>
                    ) : (
                      <Button size="sm" onClick={() => addToRoutine(p.id)}><Plus size={15} /> Add to my routine</Button>
                    )}
                    {journey ? (
                      <LinkButton to={`/journeys/${journey.id}`} variant="ghost" size="sm"><LineChart size={15} /> View journey</LinkButton>
                    ) : (
                      <LinkButton to={`/journeys?start=${p.id}`} variant="ghost" size="sm"><LineChart size={15} /> Start a Results Journey</LinkButton>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {result.insufficient && (
        <Card className="p-6 mt-6">
          <p className="font-display text-2xl">Other ways to find the right fit</p>
          <p className="text-muted mt-1 max-w-2xl">{result.recommendations.length ? 'Part of what you asked about didn’t match a product in this prototype.' : 'Your answers didn’t point clearly to one product, and we would rather not guess.'} These might help instead:</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <AltLink to="/products" Icon={BookOpen} t="Browse all seven products" d="See what each one is made for." />
            <AltLink to="/coach" Icon={MessageCircle} t="Ask the Routine Coach" d="For example, “Which product is for dark underarms?”" />
            <AltLink to="/answers" Icon={Search} t="Search Quick Answers" d="Common questions, answered from product information." />
          </div>
        </Card>
      )}

      {result.notes.length > 0 && (
        <div className="mt-6 grid gap-3">{result.notes.map((n) => <Notice key={n} tone="calm">{n}</Notice>)}</div>
      )}
      <p className="mt-6 text-sm text-muted">Your answers are saved in this browser so you can edit them later. <Link to="/about" className="underline">How your data is stored</Link></p>
    </div>
  );
}

function AltLink({ to, Icon, t, d }: { to: string; Icon: typeof Search; t: string; d: string }) {
  return (
    <Link to={to} className="rounded-xl border border-line p-4 hover:border-sage-300 hover:bg-ivory">
      <Icon size={18} className="text-sage-700" />
      <p className="mt-2 font-medium">{t}</p>
      <p className="text-sm text-muted">{d}</p>
    </Link>
  );
}
