import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUp, Info, RotateCcw, ShieldAlert, AlertTriangle, ArrowRight } from 'lucide-react';
import { Container } from '../components/Layout';
import { SourceBadge } from '../components/ui';
import { PRODUCTS, productById } from '../data/products';
import { answer, type CoachReply } from '../lib/coachEngine';
import { useStore } from '../lib/store';

type Msg = { id: number; from: 'user'; text: string } | { id: number; from: 'coach'; reply: CoachReply };

const STARTERS = [
  'How do I use the hair growth serum?',
  'Can I apply the roll-on after shaving?',
  'I missed a day. Should I double up?',
  'How long until I see results?',
  'My skin is red and itchy after using it',
  'Are you a real AI?',
];

export default function Coach() {
  const { state } = useStore();
  const [params] = useSearchParams();
  const initial = productById(params.get('product'))?.id;
  const [focus, setFocus] = useState<string | undefined>(initial);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>(() => [{ id: 0, from: 'coach', reply: welcome(initial) }]);
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nextId = useRef(1);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs, typing]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || typing) return;
    const reply = answer(t, { focusProductId: focus, routineProductIds: state.routine.map((r) => r.productId) });
    setMsgs((m) => [...m, { id: nextId.current++, from: 'user', text: t }]);
    setInput('');
    setTyping(true);
    // brief pause so the reply reads as a response; the answer itself is computed instantly
    window.setTimeout(() => {
      setMsgs((m) => [...m, { id: nextId.current++, from: 'coach', reply }]);
      if (reply.productId) setFocus(reply.productId);
      setTyping(false);
      inputRef.current?.focus();
    }, 380);
  };

  const reset = () => { setMsgs([{ id: nextId.current++, from: 'coach', reply: welcome(focus) }]); setInput(''); };
  const lastCoach = [...msgs].reverse().find((m) => m.from === 'coach') as Extract<Msg, { from: 'coach' }> | undefined;
  const suggestions = msgs.length <= 1 ? STARTERS : lastCoach?.reply.suggestions ?? [];

  return (
    <Container className="pb-4">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px] pt-8 sm:pt-10">
        <div className="min-w-0 flex flex-col">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-sage-700 font-medium mb-1">Routine Coach</p>
              <h1 className="font-display text-[34px] sm:text-[40px] leading-tight">Ask about your routine</h1>
            </div>
            <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><RotateCcw size={14} /> New conversation</button>
          </div>

          <div className="mt-4 flex gap-2.5 rounded-xl border border-line bg-paper px-4 py-3 text-[13.5px] text-muted">
            <Info size={16} className="mt-0.5 shrink-0 text-sage-700" />
            <p>This coach answers from a built-in knowledge base of product information. <strong className="text-ink font-medium">It is not a live AI model</strong>, can’t diagnose anything, and says so when information isn’t verified. Conversations aren’t saved.</p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <label htmlFor="focus" className="text-muted">Asking about</label>
            <select id="focus" value={focus ?? ''} onChange={(e) => setFocus(e.target.value || undefined)} className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm max-w-full">
              <option value="">Any product</option>
              {PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="mt-4 flex-1 rounded-card border border-line bg-paper/70 p-3 sm:p-5 min-h-[420px]" role="log" aria-live="polite" aria-label="Conversation">
            <div className="grid gap-4">
              {msgs.map((m) => m.from === 'user' ? (
                <div key={m.id} className="flex justify-end fade-in">
                  <p className="max-w-[85%] rounded-2xl rounded-br-md bg-sage-700 text-white px-4 py-2.5 text-[15px] whitespace-pre-wrap">{m.text}</p>
                </div>
              ) : <Bubble key={m.id} r={m.reply} />)}
              {typing && (
                <div className="flex gap-1 px-4 py-3 rounded-2xl rounded-bl-md bg-paper border border-line w-fit" aria-label="Coach is replying">
                  {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-muted/60 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />)}
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Suggested questions">
              {suggestions.map((s) => (
                <button key={s} type="button" onClick={() => send(s)} disabled={typing} className="rounded-full border border-line bg-paper px-3 py-1.5 text-[13.5px] hover:border-sage-300 text-left">{s}</button>
              ))}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-3 flex items-end gap-2 rounded-2xl border border-line bg-paper p-2 focus-within:border-sage-500">
            <label htmlFor="coach-input" className="sr-only">Your question</label>
            <textarea id="coach-input" ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} rows={1} maxLength={400}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask a question, e.g. can I use it after waxing?" className="flex-1 resize-none bg-transparent px-2 py-2 text-[15px] outline-none max-h-32" />
            <button type="submit" disabled={!input.trim() || typing} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sage-700 text-white disabled:opacity-40" aria-label="Send"><ArrowUp size={18} /></button>
          </form>
          <p className="mt-2 text-[12px] text-muted">Please don’t share names, phone numbers or other personal details.</p>
        </div>

        <aside className="grid gap-4 content-start lg:pt-[88px]">
          <div className="rounded-card border border-line bg-paper p-5">
            <p className="font-medium">What it can help with</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted list-disc pl-4">
              <li>How to use a product, and how often</li>
              <li>How long until results, according to the source</li>
              <li>Missed days, and using more than directed</li>
              <li>Precautions such as shaving or pregnancy</li>
              <li>What to do about irritation</li>
            </ul>
          </div>
          <div className="rounded-card border border-blush-100 bg-blush-50 p-5 text-sm text-blush-700">
            <p className="font-medium flex items-center gap-1.5"><ShieldAlert size={15} /> Urgent symptoms</p>
            <p className="mt-1.5">For swelling of the face, lips or throat, or difficulty breathing, don’t wait for the coach. Call 112 or go to the nearest emergency department.</p>
          </div>
          <Link to="/answers" className="rounded-card border border-line bg-paper p-5 text-sm hover:border-sage-300 group">
            <p className="font-medium">Prefer to browse?</p>
            <p className="text-muted mt-1">Search all Quick Answers <ArrowRight size={13} className="inline transition-transform group-hover:translate-x-0.5" /></p>
          </Link>
        </aside>
      </div>
    </Container>
  );
}

function welcome(productId?: string): CoachReply {
  const p = productById(productId);
  return {
    intent: 'welcome', tone: 'normal', suggestions: [],
    paragraphs: [p ? `Hi. Ask me anything about the ${p.name}: how to use it, how often, or what to expect.` : 'Hi. Ask me how to use a product, how long it takes, or what to do if you missed a day or notice irritation.'],
  };
}

function Bubble({ r }: { r: CoachReply }) {
  const tone = r.tone === 'urgent' ? 'bg-[#FBE9E6] border-[#EBB5AC] text-alert' : r.tone === 'caution' ? 'bg-blush-50 border-blush-100' : 'bg-paper border-line';
  return (
    <div className="flex fade-in">
      <div className={`max-w-[92%] sm:max-w-[85%] rounded-2xl rounded-bl-md border px-4 py-3 text-[15px] leading-relaxed ${tone}`} role={r.tone === 'urgent' ? 'alert' : undefined}>
        {r.tone === 'urgent' && <p className="font-semibold flex items-center gap-1.5 mb-1"><ShieldAlert size={16} /> Get urgent help</p>}
        {r.tone === 'caution' && r.intent === 'reaction' && <p className="font-semibold text-blush-700 flex items-center gap-1.5 mb-1"><AlertTriangle size={15} /> Possible reaction</p>}
        {r.paragraphs.map((p, i) => <p key={i} className={i ? 'mt-2' : ''}>{p}</p>)}
        {r.bullets && r.bullets.length > 0 && <ul className="mt-2 space-y-1 list-disc pl-5">{r.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
        {r.sources && r.sources.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {dedupe(r.sources).map((s) => <SourceBadge key={s.label} source={s.source} className="!whitespace-normal" />)}
          </div>
        )}
        {r.actions && r.actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {r.actions.map((a) => <Link key={a.to + a.label} to={a.to} className="inline-flex items-center gap-1 text-sm font-medium text-sage-700 hover:underline">{a.label} <ArrowRight size={13} /></Link>)}
          </div>
        )}
      </div>
    </div>
  );
}

const dedupe = (s: NonNullable<CoachReply['sources']>) => s.filter((x, i) => s.findIndex((y) => y.source === x.source) === i);
