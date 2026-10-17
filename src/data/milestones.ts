import type { Milestone, Product } from '../types';

export interface JourneyStage {
  week: number;
  title: string;
  detail: string;
  kind: 'start' | 'checkin' | 'brand' | 'review';
  source?: Milestone['source'];
}

/** Check-ins are a habit prompt, not a promise of results. */
const CHECKIN_WEEKS = [2, 4, 8, 12];

export function buildStages(product: Product): JourneyStage[] {
  const stages: JourneyStage[] = [
    { week: 0, title: 'Start and baseline', detail: 'Note what you want to change and how it looks or feels today.', kind: 'start' },
  ];
  for (const w of CHECKIN_WEEKS) {
    stages.push({
      week: w,
      title: `Week ${w} check-in`,
      detail: w <= 4 ? 'Are you using it as directed? Any irritation or questions?' : 'How consistent have you been, and have you noticed anything?',
      kind: 'checkin',
    });
  }
  for (const m of product.milestones) {
    stages.push({ week: m.week, title: m.label, detail: 'This is what the source says may happen. Individual results vary.', kind: 'brand', source: m.source });
  }
  if (product.reviewWeek) {
    stages.push({ week: product.reviewWeek, title: 'Review point', detail: 'A fair moment to judge, if you have used it as directed.', kind: 'review' });
  }
  return stages.sort((a, b) => a.week - b.week || order(a.kind) - order(b.kind));
}
const order = (k: JourneyStage['kind']) => ({ start: 0, checkin: 1, brand: 2, review: 3 })[k];

export function nextCheckInWeek(weeksIn: number): number | null {
  const n = CHECKIN_WEEKS.find((w) => w > weeksIn);
  if (n) return n;
  // after week 12, suggest a monthly check-in
  return Math.ceil((weeksIn + 0.01) / 4) * 4;
}
