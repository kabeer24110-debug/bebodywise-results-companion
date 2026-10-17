// Core data models for the Results Companion prototype.

/** Where a piece of product information came from. */
export type Source = 'brand' | 'retailer' | 'general' | 'unverified';

export interface Fact {
  text: string;
  source: Source;
  /** Optional caveat shown next to the fact (e.g. conflicting statements). */
  note?: string;
}

export type CategoryId = 'body' | 'underarm' | 'hair' | 'sun';

export type ConcernId =
  | 'body-acne'
  | 'underarm-pigmentation'
  | 'underarm-odour'
  | 'dry-skin'
  | 'hair-thinning'
  | 'hair-strength'
  | 'sun-protection';

export interface Milestone {
  /** Weeks after the start date. */
  week: number;
  label: string;
  source: Source;
}

/** Only set when the usage rhythm is verified. Never invented to fill the UI. */
export interface VerifiedSchedule {
  timesPerDay: number;
  slots: ('morning' | 'evening' | 'any')[];
  source: Source;
  label: string;
}

export interface Product {
  id: string;
  name: string;
  shortName: string;
  category: CategoryId;
  format: 'wash' | 'lotion' | 'roll-on' | 'serum' | 'gummies' | 'sunscreen';
  size: Fact;
  intendedFor: Fact;
  concerns: ConcernId[];
  keyIngredients: Fact;
  howToUse: Fact & { steps?: string[] };
  frequency: Fact;
  quantity: Fact;
  timeline: Fact;
  milestones: Milestone[];
  /** Week by which the brand says results may be seen, if stated. */
  reviewWeek?: number;
  precautions: Fact[];
  compatibility: Fact;
  schedule?: VerifiedSchedule;
  sourceLabel: string;
  sourceUrl?: string;
  variantNote?: string;
}

export interface FaqItem {
  id: string;
  q: string;
  a: string;
  productId: string | null;
  topic: 'application' | 'frequency' | 'precautions' | 'ingredients' | 'expectations' | 'routine';
  source: Source;
}

export interface Myth {
  id: string;
  myth: string;
  fact: string;
  source: Source;
  productId?: string;
}

// ---------- user state ----------

export type Slot = 'morning' | 'evening' | 'any';

export interface RoutineItem {
  productId: string;
  addedAt: string; // ISO date
  /** User-chosen time of day; only pre-filled when the schedule is verified. */
  slot: Slot;
}

export type FollowedRoutine = 'yes' | 'mostly' | 'no';
export type Noticed = 'better' | 'same' | 'worse' | 'unsure';

export interface CheckIn {
  id: string;
  date: string; // ISO date
  followed: FollowedRoutine;
  noticed: Noticed;
  reaction: boolean;
  confused: boolean;
  note: string;
}

export interface Journey {
  id: string;
  productId: string;
  startDate: string; // yyyy-mm-dd
  baseline: { goal: string; rating: number | null; note: string };
  status: 'active' | 'paused' | 'stopped';
  checkIns: CheckIn[];
}

export interface ReminderPrefs {
  enabled: boolean;
  routine: boolean;
  checkIns: boolean;
  morningTime: string; // HH:MM
  eveningTime: string; // HH:MM
}

export type FitAnswers = Record<string, string | string[]>;

export interface AppState {
  routine: RoutineItem[];
  journeys: Journey[];
  /** checklist[date][stepKey] = true */
  checklist: Record<string, Record<string, boolean>>;
  reminders: ReminderPrefs;
  dismissedReminders: Record<string, boolean>;
  fitAnswers: FitAnswers | null;
  seenWelcome: boolean;
}
