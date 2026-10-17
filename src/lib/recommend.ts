import type { FitAnswers } from '../types';

export interface Recommendation {
  productId: string;
  reasons: string[];
  cautions: string[];
  role: 'main' | 'pair' | 'alternative';
}
export interface FitResult {
  recommendations: Recommendation[];
  referrals: string[];
  notes: string[];
  insufficient: boolean;
}

const arr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : v ? [String(v)] : []);

/**
 * Transparent, rule-based matching. It is not a clinical assessment and it does not learn.
 * Every rule below is readable and maps a stated need to a product's stated purpose.
 */
export function recommend(a: FitAnswers): FitResult {
  const concerns = arr(a.concerns);
  const status = arr(a.status);
  const minor = a.age === 'minor';
  const out: FitResult = { recommendations: [], referrals: [], notes: [], insufficient: false };
  const push = (r: Recommendation) => {
    const existing = out.recommendations.find((x) => x.productId === r.productId);
    if (existing) {
      existing.reasons.push(...r.reasons.filter((x) => !existing.reasons.includes(x)));
      existing.cautions.push(...r.cautions.filter((x) => !existing.cautions.includes(x)));
      if (r.role === 'main') existing.role = 'main';
    } else out.recommendations.push(r);
  };

  if (concerns.length === 0 || concerns.includes('not-sure')) {
    out.insufficient = true;
    out.notes.push('We need a bit more to suggest something responsibly. Browse the product library, or ask the coach what each product is for.');
    return out;
  }

  const sharedCautions: string[] = [];
  if (status.includes('allergies')) sharedCautions.push('You mentioned allergies or sensitive skin. Read the full ingredient list and patch test first.');
  if (status.includes('pregnant')) sharedCautions.push('You mentioned pregnancy. Check with your doctor before starting any new treatment product.');

  if (concerns.includes('body-acne')) {
    const reasons = ['Made for body acne, according to the brand.'];
    const cautions = ['For the body only. The brand says it may be too potent for the face.'];
    if (a['acne-skin'] === 'dry' || a['acne-skin'] === 'sensitive') {
      reasons.push('It also contains a ceramide complex and a glycerine–hyaluronic acid complex, which the brand says help moisturise.');
      cautions.push('Salicylic acid can be drying. The brand says to reduce use or stop if your skin gets red or dry.');
    }
    push({ productId: 'salicylic-ceramide-body-wash', role: 'main', reasons, cautions: [...cautions, ...sharedCautions] });
    if (a['acne-skin'] === 'dry') {
      push({ productId: 'urea-body-lotion', role: 'pair', reasons: ['You said your skin feels dry. One customer we spoke to needed a moisturiser after a salicylic wash.'], cautions: ['We have no verified guidance on using these together, so check both labels.'] });
    }
    if (a['acne-severity'] === 'severe') out.referrals.push('Painful, deep or widespread acne is worth seeing a dermatologist about before relying on a body wash.');
  }

  if (concerns.includes('underarm-pigmentation') || concerns.includes('underarm-odour')) {
    const reasons: string[] = [];
    if (concerns.includes('underarm-odour')) reasons.push('Listed for underarm odour.');
    if (concerns.includes('underarm-pigmentation')) reasons.push('Listed for underarm pigmentation. The listing recommends daily use for 3 months.');
    const cautions = ['Don’t use more than directed. It won’t work faster and can irritate the skin.'];
    if (a['ua-hair'] === 'shave' || a['ua-hair'] === 'wax' || a['ua-hair'] === 'cream') cautions.push('Avoid freshly shaved or waxed skin, cuts and open wounds.');
    push({ productId: 'aha-bha-underarm-roll-on', role: 'main', reasons, cautions: [...cautions, ...sharedCautions] });
    if (a['ua-flag'] === 'yes' || a['ua-flag'] === 'unsure')
      out.referrals.push('Thick or velvety darkening, or darkening on the neck or groin, can have a medical cause. Please see a doctor before starting a cosmetic product for it.');
    out.notes.push('Be Bodywise also sells stronger underarm options (such as a 6% roll-on and a pigmentation repair cream). They aren’t in this prototype’s verified catalogue yet.');
  }

  if (concerns.includes('dry-skin')) {
    push({ productId: 'urea-body-lotion', role: 'main', reasons: ['Made for very dry, flaky skin. It contains 10% urea and 18% emollients.'], cautions: sharedCautions });
    if (a['dry-severity'] === 'yes') out.referrals.push('Cracked, bleeding or very itchy skin should be checked by a doctor.');
  }

  const hairConcern = concerns.includes('hair-thinning') || concerns.includes('hair-strength');
  if (hairConcern) {
    if (minor) {
      out.referrals.push('Both Be Bodywise hair products are for women aged 18 and over. Please talk to a doctor about hair concerns before using them.');
    } else {
      const fmt = a['hair-format'];
      const wantsTopical = concerns.includes('hair-thinning') && (fmt === 'topical' || fmt === 'either' || fmt === 'both' || !fmt);
      const wantsOral = fmt === 'oral' || fmt === 'both' || (fmt === 'either' && concerns.includes('hair-strength')) || (concerns.includes('hair-strength') && !fmt);
      const serumCautions = ['The brand recommends at least 3 months of consistent use.'];
      const gummyCautions = ['One gummy a day. Don’t take more than the label says.'];
      if (status.includes('pregnant') || status.includes('nursing')) {
        serumCautions.push('Check with your doctor first while pregnant or breastfeeding.');
        gummyCautions.push('The brand says to consult a healthcare professional if you are nursing.');
      }
      if (wantsTopical) push({ productId: 'hair-growth-serum-roll-on', role: 'main', reasons: ['Made for hair growth and density, for women 18+.', 'A leave-in you massage into the scalp.'], cautions: [...serumCautions, ...sharedCautions] });
      if (wantsOral || (fmt === 'either' && !wantsTopical)) push({ productId: 'hair-health-gummies', role: wantsTopical ? 'pair' : 'main', reasons: ['A daily supplement for hair strength, for women 18+.'], cautions: [...gummyCautions, ...sharedCautions] });
      if (!wantsTopical && !wantsOral) out.insufficient = true;
    }
    if (a['hair-sudden'] === 'yes') out.referrals.push('Sudden, patchy or very heavy hair fall should be checked by a doctor first.');
  }

  if (concerns.includes('sun-protection')) {
    const reasons = ['Broad-spectrum protection for the face and neck.'];
    if (a['sun-skin'] === 'acne') reasons.push('The brand says it is acne-safe, including for active acne.');
    const cautions = ['The brand recommends a patch test first: inner elbow, 12–24 hours.'];
    if (a['sun-skin'] === 'sensitive') cautions.push('With sensitive skin, the patch test matters even more.');
    push({ productId: 'ultra-light-sunscreen', role: 'main', reasons, cautions: [...cautions, ...sharedCautions] });
  }

  if (minor && !hairConcern) out.notes.push('Age guidance isn’t stated for every product. Check the label, and ask a parent or doctor if you’re unsure.');
  if (out.recommendations.length === 0 && out.referrals.length === 0) out.insufficient = true;
  if (out.recommendations.length > 1)
    out.notes.push('We have no verified guidance on using these products together. Check each label, and start one new product at a time so you can tell what’s working.');
  return out;
}
