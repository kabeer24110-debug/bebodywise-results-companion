import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Database, FlaskConical, ShieldCheck, Trash2, Sparkles } from 'lucide-react';
import { Container } from '../components/Layout';
import { Button, Card, Notice, PageHeader, SourceBadge } from '../components/ui';
import { PRODUCTS } from '../data/products';
import { useStore } from '../lib/store';
import type { Fact, Product } from '../types';

const FIELD_LABEL: [keyof Product, string][] = [
  ['size', 'Size'], ['intendedFor', 'What it’s for'], ['keyIngredients', 'Ingredients'], ['howToUse', 'How to use'],
  ['frequency', 'How often'], ['quantity', 'How much'], ['timeline', 'Results timeline'], ['compatibility', 'Use with other products'],
];

export default function About() {
  const { state, loadDemo, resetAll, storageOk } = useStore();
  const [confirm, setConfirm] = useState<null | 'reset' | 'demo'>(null);
  const [done, setDone] = useState('');
  const hasData = state.routine.length > 0 || state.journeys.length > 0 || !!state.fitAnswers;

  const unverified = PRODUCTS.map((p) => ({
    p,
    fields: FIELD_LABEL.filter(([k]) => (p[k] as Fact | undefined)?.source === 'unverified').map(([, l]) => l),
  })).filter((x) => x.fields.length);

  return (
    <Container>
      <PageHeader eyebrow="About this prototype" title="How this works, and what it doesn’t do"
        intro="A working prototype made for a Mosaic Fellowship assignment. It is not an official Be Bodywise product, and nothing here is medical advice." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <p className="flex items-center gap-2 font-display text-[23px]"><Database size={19} className="text-sage-700" /> Your data</p>
          <ul className="mt-3 space-y-2 text-[15px] leading-relaxed list-disc pl-5">
            <li>Your routine, journeys, check-ins, Fit Finder answers and reminder settings are saved in this browser’s local storage on this device.</li>
            <li>There is no account, no server, no cloud sync and no encryption. Anyone using this browser profile can see it, and clearing site data deletes it.</li>
            <li>It is not a secure or medical record. Please don’t enter names, phone numbers or health records.</li>
            <li>Coach conversations aren’t saved, and nothing is sent anywhere.</li>
          </ul>
          {!storageOk && <Notice tone="caution" className="mt-4">Storage is blocked in this browser right now, so changes won’t survive a reload.</Notice>}
        </Card>

        <Card className="p-5 sm:p-6">
          <p className="flex items-center gap-2 font-display text-[23px]"><FlaskConical size={19} className="text-sage-700" /> Working vs. simulated</p>
          <dl className="mt-3 grid gap-3 text-[14.5px]">
            <Row k="Fit Finder" v="Working. Fixed, readable rules; no learning and no diagnosis." />
            <Row k="Product guides" v="Working. Content from brand pages and retailer listings, labelled by source." />
            <Row k="Results Journey" v="Working, saved locally. It records what you report; it doesn’t measure skin or hair." />
            <Row k="Routine Coach" v="Working local knowledge base with intent matching. Not a live AI model." />
            <Row k="Reminders" v="Simulated in-app only. No push, SMS or email." />
            <Row k="Product images" v="Simple illustrations, not official product photos." />
          </dl>
        </Card>
      </div>

      <Card className="p-5 sm:p-6 mt-5">
        <p className="flex items-center gap-2 font-display text-[23px]"><ShieldCheck size={19} className="text-sage-700" /> Where the product information comes from</p>
        <p className="mt-2 text-muted max-w-3xl">Facts were read from Be Bodywise product pages and authorised retailer listings in October 2026. Every fact carries one of these labels, and the app never fills a gap with a guess:</p>
        <div className="mt-3 flex flex-wrap gap-2"><SourceBadge source="brand" /><SourceBadge source="retailer" /><SourceBadge source="general" /><SourceBadge source="unverified" /></div>
        <p className="mt-5 font-medium">Not yet verified</p>
        <ul className="mt-2 grid gap-2 text-[14.5px]">
          {unverified.map(({ p, fields }) => (
            <li key={p.id} className="flex flex-wrap gap-x-2"><Link to={`/products/${p.id}`} className="font-medium underline decoration-line hover:text-sage-700">{p.name}</Link><span className="text-muted">{fields.join(', ')}</span></li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">Product pages change, and variants differ. The pack in your hand is always the final word.</p>
      </Card>

      <Card className="p-5 sm:p-6 mt-5">
        <p className="font-display text-[23px]">Try it with example data</p>
        <p className="mt-1 text-muted max-w-2xl">Loads a made-up routine and two example journeys so you can see what a returning user sees. The example data is synthetic and doesn’t belong to any real person.</p>
        {confirm ? (
          <div className="mt-4 rounded-xl border border-line bg-ivory p-4 flex flex-wrap items-center justify-between gap-3" role="alertdialog" aria-label="Confirm">
            <p className="text-[15px]">{confirm === 'demo' ? 'This replaces everything currently saved in this browser with example data.' : 'This deletes your routine, journeys, check-ins and settings from this browser. It can’t be undone.'}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>
              <Button size="sm" className={confirm === 'reset' ? '!bg-alert hover:!bg-alert/90' : ''} onClick={() => {
                if (confirm === 'demo') { loadDemo(); setDone('Example data loaded.'); } else { resetAll(); setDone('Everything was cleared from this browser.'); }
                setConfirm(null);
              }}>{confirm === 'demo' ? 'Load example data' : 'Delete my data'}</Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => (hasData ? setConfirm('demo') : (loadDemo(), setDone('Example data loaded.')))}><Sparkles size={16} /> Load example data</Button>
            <Button variant="quiet" onClick={() => setConfirm('reset')}><Trash2 size={16} /> Delete all my data</Button>
          </div>
        )}
        {done && <p className="mt-3 text-sm text-sage-700" role="status">{done} <Link to="/" className="underline">Go to home</Link></p>}
      </Card>
    </Container>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="grid grid-cols-[120px_1fr] gap-3"><dt className="font-medium">{k}</dt><dd className="text-muted">{v}</dd></div>;
}
