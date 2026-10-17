import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppState, CheckIn, FitAnswers, Journey, ReminderPrefs, RoutineItem, Slot } from '../types';
import { productById } from '../data/products';
import { todayKey, uid } from './dates';

const KEY = 'bodywise-companion-v1';

const DEFAULT_REMINDERS: ReminderPrefs = { enabled: false, routine: true, checkIns: true, morningTime: '08:00', eveningTime: '21:00' };
export const EMPTY_STATE: AppState = { routine: [], journeys: [], checklist: {}, reminders: DEFAULT_REMINDERS, dismissedReminders: {}, fitAnswers: null, seenWelcome: false };

function load(): AppState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...EMPTY_STATE,
      ...parsed,
      reminders: { ...DEFAULT_REMINDERS, ...(parsed.reminders || {}) },
      // drop anything referring to products that no longer exist
      routine: (parsed.routine || []).filter((r) => productById(r.productId)),
      journeys: (parsed.journeys || []).filter((j) => productById(j.productId)),
    };
  } catch {
    return EMPTY_STATE;
  }
}

/** Checklist steps for one routine item. Only verified schedules create timed steps. */
export interface Step { key: string; productId: string; label: string; slot: Slot; verified: boolean }
export function stepsFor(item: RoutineItem): Step[] {
  const p = productById(item.productId);
  if (!p) return [];
  if (p.schedule && p.schedule.timesPerDay === 2) {
    return [
      { key: `${p.id}:am`, productId: p.id, label: `${p.shortName} (morning)`, slot: 'morning', verified: true },
      { key: `${p.id}:pm`, productId: p.id, label: `${p.shortName} (evening)`, slot: 'evening', verified: true },
    ];
  }
  if (p.schedule) return [{ key: `${p.id}:1`, productId: p.id, label: p.shortName, slot: item.slot, verified: true }];
  return [{ key: `${p.id}:label`, productId: p.id, label: p.shortName, slot: item.slot, verified: false }];
}

interface Ctx {
  state: AppState;
  storageOk: boolean;
  addToRoutine: (productId: string) => void;
  removeFromRoutine: (productId: string) => void;
  setRoutineSlot: (productId: string, slot: Slot) => void;
  inRoutine: (productId: string) => boolean;
  toggleStep: (key: string, date?: string) => void;
  startJourney: (j: Omit<Journey, 'id' | 'status' | 'checkIns'>) => string;
  addCheckIn: (journeyId: string, c: Omit<CheckIn, 'id'>) => void;
  setJourneyStatus: (journeyId: string, status: Journey['status']) => void;
  deleteJourney: (journeyId: string) => void;
  setReminders: (p: Partial<ReminderPrefs>) => void;
  dismissReminder: (id: string) => void;
  clearDismissed: () => void;
  saveFitAnswers: (a: FitAnswers | null) => void;
  markWelcomeSeen: () => void;
  resetAll: () => void;
  loadDemo: () => void;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);
  const [storageOk, setStorageOk] = useState(true);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
      setStorageOk(true);
    } catch {
      setStorageOk(false);
    }
  }, [state]);

  const update = useCallback((fn: (s: AppState) => AppState) => setState((s) => fn(s)), []);

  const api = useMemo<Ctx>(() => ({
    state,
    storageOk,
    inRoutine: (id) => state.routine.some((r) => r.productId === id),
    addToRoutine: (id) => update((s) => {
      if (s.routine.some((r) => r.productId === id)) return s;
      const p = productById(id);
      const slot: Slot = p?.schedule?.slots[0] ?? 'any';
      return { ...s, routine: [...s.routine, { productId: id, addedAt: todayKey(), slot }] };
    }),
    removeFromRoutine: (id) => update((s) => ({ ...s, routine: s.routine.filter((r) => r.productId !== id) })),
    setRoutineSlot: (id, slot) => update((s) => ({ ...s, routine: s.routine.map((r) => (r.productId === id ? { ...r, slot } : r)) })),
    toggleStep: (key, date = todayKey()) => update((s) => {
      const day = { ...(s.checklist[date] || {}) };
      day[key] = !day[key];
      return { ...s, checklist: { ...s.checklist, [date]: day } };
    }),
    startJourney: (j) => {
      const id = uid();
      update((s) => ({ ...s, journeys: [...s.journeys, { ...j, id, status: 'active', checkIns: [] }] }));
      return id;
    },
    addCheckIn: (jid, c) => update((s) => ({ ...s, journeys: s.journeys.map((j) => (j.id === jid ? { ...j, checkIns: [...j.checkIns, { ...c, id: uid() }] } : j)) })),
    setJourneyStatus: (jid, status) => update((s) => ({ ...s, journeys: s.journeys.map((j) => (j.id === jid ? { ...j, status } : j)) })),
    deleteJourney: (jid) => update((s) => ({ ...s, journeys: s.journeys.filter((j) => j.id !== jid) })),
    setReminders: (p) => update((s) => ({ ...s, reminders: { ...s.reminders, ...p } })),
    dismissReminder: (id) => update((s) => ({ ...s, dismissedReminders: { ...s.dismissedReminders, [id]: true } })),
    clearDismissed: () => update((s) => ({ ...s, dismissedReminders: {} })),
    saveFitAnswers: (a) => update((s) => ({ ...s, fitAnswers: a })),
    markWelcomeSeen: () => update((s) => ({ ...s, seenWelcome: true })),
    resetAll: () => setState({ ...EMPTY_STATE, seenWelcome: true }),
    loadDemo: () => setState(demoState()),
  }), [state, storageOk, update]);

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore must be used inside StoreProvider');
  return c;
}

/** Synthetic example data so a reviewer can see a returning customer's view. Not real customer data. */
export function demoState(): AppState {
  const t = todayKey();
  const d = (n: number) => { const x = new Date(); x.setDate(x.getDate() - n); return todayKey(x); };
  return {
    ...EMPTY_STATE,
    seenWelcome: true,
    routine: [
      { productId: 'hair-growth-serum-roll-on', addedAt: d(40), slot: 'morning' },
      { productId: 'aha-bha-underarm-roll-on', addedAt: d(40), slot: 'morning' },
      { productId: 'ultra-light-sunscreen', addedAt: d(10), slot: 'morning' },
    ],
    journeys: [
      {
        id: 'demo-serum', productId: 'hair-growth-serum-roll-on', startDate: d(40), status: 'active',
        baseline: { goal: 'Less thinning near my parting', rating: 2, note: 'Example journey' },
        checkIns: [
          { id: 'c1', date: d(26), followed: 'mostly', noticed: 'unsure', reaction: false, confused: true, note: 'Not sure if twice a day is needed.' },
          { id: 'c2', date: d(12), followed: 'yes', noticed: 'same', reaction: false, confused: false, note: '' },
        ],
      },
      {
        id: 'demo-rollon', productId: 'aha-bha-underarm-roll-on', startDate: d(40), status: 'active',
        baseline: { goal: 'More even underarm tone', rating: 2, note: 'Example journey' },
        checkIns: [{ id: 'c3', date: d(20), followed: 'no', noticed: 'same', reaction: false, confused: false, note: 'Missed a week while travelling.' }],
      },
    ],
    checklist: { [t]: { 'hair-growth-serum-roll-on:am': true } },
    reminders: { ...DEFAULT_REMINDERS, enabled: true },
  };
}
