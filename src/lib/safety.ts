// Shared safety detection used by the coach and by journey check-ins.

const URGENT = [
  /can'?t breathe|cannot breathe|difficulty breathing|trouble breathing|short(ness)? of breath|wheez/i,
  /swell(ing|en)? (of )?(my )?(face|lips?|tongue|throat|eyes?)|face (is )?swell|lips? (are )?swell|throat (is )?(closing|tight)/i,
  /anaphyla|faint|collapse|chest pain/i,
];
const REACTION = [
  /irritat|rash|burn(ing|s)?\b|sting|itch|red(ness)?\b|hives|blister|peel(ing)?|swell|allerg|reaction|sore|raw skin|bump(s)? (got|getting) worse|dark(er|ening) after/i,
];

export type SafetyLevel = 'urgent' | 'reaction' | null;

export function detectSafety(text: string): SafetyLevel {
  if (URGENT.some((r) => r.test(text))) return 'urgent';
  if (REACTION.some((r) => r.test(text))) return 'reaction';
  return null;
}

export const URGENT_COPY =
  'This could be a serious allergic reaction. Stop using the product and get emergency medical help now. In India, call 112 or go to the nearest emergency department.';

export const REACTION_STEPS = [
  'Stop using the product for now. Don’t try to push through it.',
  'Gently rinse the area with lukewarm water and avoid applying other actives on it.',
  'Read the warnings on your product label.',
  'If it is severe, spreading, or hasn’t settled in a few days, see a doctor or pharmacist.',
  'Get urgent help straight away for swelling of the face, lips or throat, or difficulty breathing.',
];
