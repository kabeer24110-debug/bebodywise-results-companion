import { Link } from 'react-router-dom';
import { BellRing, BellOff } from 'lucide-react';
import { Container } from '../components/Layout';
import { Button, Card, Notice, PageHeader } from '../components/ui';
import { useStore } from '../lib/store';
import { dueReminders } from '../lib/reminders';

export default function Reminders() {
  const { state, setReminders, dismissReminder } = useStore();
  const r = state.reminders;
  const due = dueReminders(state);
  const dismissedCount = Object.keys(state.dismissedReminders).length;

  return (
    <Container>
      <PageHeader eyebrow="Milestone reminders" title="Gentle nudges, only if you want them"
        intro="Reminders appear inside this app, under the bell at the top of the page, when you open it. Nothing is sent to your phone or inbox." />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-5 content-start">
          <Notice tone="info" title="What this prototype does and doesn’t do">
            It doesn’t send push notifications, SMS, WhatsApp messages or email, and it doesn’t run in the background. Reminders are worked out from your routine and journey dates each time the page is open.
          </Notice>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-display text-[24px]">In-app reminders</p>
                <p className="text-sm text-muted">{r.enabled ? 'On. Check the bell when you open the app.' : 'Off. Nothing will be shown.'}</p>
              </div>
              <Toggle on={r.enabled} onChange={(v) => setReminders({ enabled: v })} label="In-app reminders" />
            </div>

            <div className={`mt-6 grid gap-5 ${r.enabled ? '' : 'opacity-50 pointer-events-none'}`} aria-disabled={!r.enabled}>
              <div className="flex items-start justify-between gap-4 border-t border-line pt-5">
                <div>
                  <p className="font-medium">Routine steps</p>
                  <p className="text-sm text-muted">Shows today’s unticked steps after the times below. Products without a verified schedule say “use as directed on the label”.</p>
                </div>
                <Toggle on={r.routine} onChange={(v) => setReminders({ routine: v })} label="Routine step reminders" />
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-sm">
                <label className="grid gap-1 text-sm"><span className="text-muted">Morning steps after</span><input type="time" value={r.morningTime} onChange={(e) => setReminders({ morningTime: e.target.value })} className="rounded-xl border border-line bg-paper px-3 py-2" /></label>
                <label className="grid gap-1 text-sm"><span className="text-muted">Evening steps after</span><input type="time" value={r.eveningTime} onChange={(e) => setReminders({ eveningTime: e.target.value })} className="rounded-xl border border-line bg-paper px-3 py-2" /></label>
              </div>
              <div className="flex items-start justify-between gap-4 border-t border-line pt-5">
                <div>
                  <p className="font-medium">Journey check-ins</p>
                  <p className="text-sm text-muted">At weeks 2, 4, 8 and 12 of each active journey, then every four weeks. Paused journeys are skipped.</p>
                </div>
                <Toggle on={r.checkIns} onChange={(v) => setReminders({ checkIns: v })} label="Journey check-in reminders" />
              </div>
            </div>
          </Card>
        </div>

        <aside className="grid gap-4 content-start">
          <Card className="p-5">
            <p className="font-medium flex items-center gap-2">{r.enabled ? <BellRing size={17} className="text-sage-700" /> : <BellOff size={17} className="text-muted" />} Showing now</p>
            {!r.enabled ? <p className="mt-2 text-sm text-muted">Turn reminders on to see them here.</p>
              : due.length === 0 ? <p className="mt-2 text-sm text-muted">Nothing due right now.{state.routine.length === 0 && <> Add a product to <Link to="/products" className="underline">your routine</Link> first.</>}</p>
              : (
                <ul className="mt-3 grid gap-2">
                  {due.map((d) => (
                    <li key={d.id} className="rounded-xl bg-ivory p-3 text-sm">
                      <Link to={d.to} className="font-medium hover:text-sage-700">{d.title}</Link>
                      <p className="text-muted text-[13px]">{d.detail}</p>
                      <button type="button" onClick={() => dismissReminder(d.id)} className="mt-1 text-[12.5px] text-muted underline">Dismiss</button>
                    </li>
                  ))}
                </ul>
              )}
          </Card>
          {dismissedCount > 0 && (
            <Card className="p-5 text-sm">
              <p className="text-muted">{dismissedCount} reminder{dismissedCount === 1 ? '' : 's'} dismissed.</p>
              <ResetDismissed />
            </Card>
          )}
        </aside>
      </div>
    </Container>
  );
}

function ResetDismissed() {
  const { clearDismissed } = useStore();
  return <Button variant="ghost" size="sm" className="mt-2 -ml-3" onClick={clearDismissed}>Show dismissed reminders again</Button>;
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? 'bg-sage-700' : 'bg-line'}`}>
      <span className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  );
}
