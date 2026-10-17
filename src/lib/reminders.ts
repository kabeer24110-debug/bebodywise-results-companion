import type { AppState } from '../types';
import { productById } from '../data/products';
import { daysBetween, todayKey } from './dates';
import { stepsFor } from './store';
import { nextCheckInWeek } from '../data/milestones';

export interface InAppReminder { id: string; title: string; detail: string; to: string; kind: 'routine' | 'checkin' }

const minutes = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return (h || 0) * 60 + (m || 0); };

/**
 * Simulated, in-app reminders only. Nothing is sent outside this browser tab.
 * They are computed from your routine, today's checklist and journey dates.
 */
export function dueReminders(state: AppState, now = new Date()): InAppReminder[] {
  const r = state.reminders;
  if (!r.enabled) return [];
  const out: InAppReminder[] = [];
  const today = todayKey(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  if (r.routine) {
    const done = state.checklist[today] || {};
    for (const item of state.routine) {
      for (const step of stepsFor(item)) {
        if (done[step.key]) continue;
        const due = step.slot === 'evening' ? minutes(r.eveningTime) : minutes(r.morningTime);
        if (nowMin < due) continue;
        out.push({
          id: `routine:${today}:${step.key}`,
          kind: 'routine',
          title: step.verified ? `Time for your ${step.label.toLowerCase()}` : `${step.label}: use as directed on the label`,
          detail: step.verified ? 'Tick it off in your checklist once done.' : 'We don’t have a verified schedule for this product, so follow your pack.',
          to: '/routine',
        });
      }
    }
  }

  if (r.checkIns) {
    for (const j of state.journeys) {
      if (j.status !== 'active') continue;
      const p = productById(j.productId);
      if (!p) continue;
      const daysIn = daysBetween(j.startDate, today);
      const last = j.checkIns.length ? j.checkIns[j.checkIns.length - 1].date : j.startDate;
      const sinceLast = daysBetween(last, today);
      const weekOfLast = daysBetween(j.startDate, last) / 7;
      const nextWeek = nextCheckInWeek(weekOfLast);
      if (nextWeek !== null && daysIn >= nextWeek * 7 && sinceLast >= 7) {
        out.push({ id: `checkin:${j.id}:w${nextWeek}`, kind: 'checkin', title: `Week ${nextWeek} check-in: ${p.shortName}`, detail: 'Two quick questions about how it’s going.', to: `/journeys/${j.id}` });
      }
    }
  }
  return out.filter((x) => !state.dismissedReminders[x.id]);
}
