import type { ConcernId, FitAnswers } from '../types';

export interface FitOption { value: string; label: string; hint?: string }
export interface FitQuestion {
  id: string;
  prompt: string;
  help?: string;
  multi?: boolean;
  max?: number;
  options: FitOption[];
  showIf?: (a: FitAnswers) => boolean;
}

const has = (a: FitAnswers, c: ConcernId) => Array.isArray(a.concerns) && a.concerns.includes(c);

export const CONCERN_OPTIONS: FitOption[] = [
  { value: 'body-acne', label: 'Body acne or bumps', hint: 'Back, chest, arms' },
  { value: 'underarm-pigmentation', label: 'Dark or uneven underarms' },
  { value: 'underarm-odour', label: 'Underarm odour' },
  { value: 'dry-skin', label: 'Very dry or rough body skin' },
  { value: 'hair-thinning', label: 'Hair thinning or hair fall' },
  { value: 'hair-strength', label: 'Stronger hair from within', hint: 'A daily supplement' },
  { value: 'sun-protection', label: 'Daily sun protection' },
  { value: 'not-sure', label: 'I’m not sure yet' },
];

/** Branching questionnaire. Each question only appears when it is relevant. */
export const QUESTIONS: FitQuestion[] = [
  { id: 'concerns', prompt: 'What would you like help with?', help: 'Pick up to three.', multi: true, max: 3, options: CONCERN_OPTIONS },
  {
    id: 'acne-skin', prompt: 'How does the skin on your body usually feel?', showIf: (a) => has(a, 'body-acne'),
    options: [{ value: 'dry', label: 'Dry or tight' }, { value: 'oily', label: 'Oily' }, { value: 'balanced', label: 'Balanced' }, { value: 'sensitive', label: 'Easily irritated' }],
  },
  {
    id: 'acne-severity', prompt: 'How would you describe the breakouts?', showIf: (a) => has(a, 'body-acne'),
    options: [{ value: 'mild', label: 'A few spots or bumps' }, { value: 'frequent', label: 'Frequent breakouts' }, { value: 'severe', label: 'Painful, deep or widespread' }],
  },
  {
    id: 'ua-hair', prompt: 'How do you usually remove underarm hair?', help: 'This affects when it’s safe to apply acid-based products.', showIf: (a) => has(a, 'underarm-pigmentation') || has(a, 'underarm-odour'),
    options: [{ value: 'shave', label: 'Shaving' }, { value: 'wax', label: 'Waxing' }, { value: 'cream', label: 'Hair-removal cream' }, { value: 'laser', label: 'Laser' }, { value: 'none', label: 'I don’t remove it' }],
  },
  {
    id: 'ua-flag', prompt: 'Does the darker skin feel thick or velvety, or is there similar darkening on your neck or groin?', help: 'This kind of darkening can have a medical cause that a doctor should look at.', showIf: (a) => has(a, 'underarm-pigmentation'),
    options: [{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }, { value: 'unsure', label: 'Not sure' }],
  },
  {
    id: 'dry-severity', prompt: 'Is the dry skin cracked, bleeding or very itchy?', showIf: (a) => has(a, 'dry-skin'),
    options: [{ value: 'no', label: 'No, just dry or rough' }, { value: 'yes', label: 'Yes' }],
  },
  {
    id: 'hair-format', prompt: 'What kind of product would you prefer?', showIf: (a) => has(a, 'hair-thinning') || has(a, 'hair-strength'),
    options: [{ value: 'topical', label: 'Something I apply to my scalp' }, { value: 'oral', label: 'Something I take daily' }, { value: 'either', label: 'Either is fine' }, { value: 'both', label: 'I’d consider both' }],
  },
  {
    id: 'hair-sudden', prompt: 'Is the hair fall sudden, in patches, or very heavy?', showIf: (a) => has(a, 'hair-thinning'),
    options: [{ value: 'no', label: 'No, it’s gradual' }, { value: 'yes', label: 'Yes' }],
  },
  {
    id: 'sun-skin', prompt: 'How would you describe the skin on your face?', showIf: (a) => has(a, 'sun-protection'),
    options: [{ value: 'acne', label: 'Acne-prone' }, { value: 'sensitive', label: 'Sensitive' }, { value: 'normal', label: 'No particular concerns' }],
  },
  {
    id: 'age', prompt: 'Are you 18 or over?', help: 'Some products are only for adults.', showIf: (a) => Array.isArray(a.concerns) && a.concerns.length > 0 && !a.concerns.includes('not-sure'),
    options: [{ value: 'adult', label: 'Yes, 18 or over' }, { value: 'minor', label: 'No, under 18' }],
  },
  {
    id: 'status', prompt: 'Does any of this apply to you?', help: 'Select all that apply. We only use this to add the right cautions.', multi: true, showIf: (a) => Array.isArray(a.concerns) && a.concerns.length > 0 && !a.concerns.includes('not-sure'),
    options: [{ value: 'pregnant', label: 'Pregnant or trying to conceive' }, { value: 'nursing', label: 'Breastfeeding' }, { value: 'allergies', label: 'Known allergies or very sensitive skin' }, { value: 'none', label: 'None of these' }],
  },
];

export const visibleQuestions = (a: FitAnswers) => QUESTIONS.filter((q) => !q.showIf || q.showIf(a));
