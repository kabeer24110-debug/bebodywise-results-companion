import type { Fact, Product, Source } from '../types';
import { PRODUCTS, productById } from '../data/products';
import { detectSafety, REACTION_STEPS, URGENT_COPY } from './safety';

/*
 * Routine Coach engine.
 * A local knowledge base with intent matching. No live AI model is called.
 * The interface (CoachContext in, CoachReply out) is deliberately small so a real
 * model can replace `answer()` later without changing the chat UI.
 */

export interface CoachAction { label: string; to: string }
export interface CoachReply {
  paragraphs: string[];
  bullets?: string[];
  sources?: { label: string; source: Source }[];
  actions?: CoachAction[];
  suggestions: string[];
  tone: 'normal' | 'caution' | 'urgent';
  productId?: string;
  intent: string;
}
export interface CoachContext {
  /** Product the user is looking at, or the last one discussed. */
  focusProductId?: string;
  routineProductIds: string[];
}

const ALIASES: [string, RegExp][] = [
  ['hair-growth-serum-roll-on', /serum|hair growth|redensyl|scalp/i],
  ['hair-health-gummies', /gumm|biotin|supplement|vitamin/i],
  ['aha-bha-underarm-roll-on', /underarm|under-arm|armpit|roll[- ]?on|aha|bha|pigment|dark(er)? (under)?arms?|odou?r|sweat smell/i],
  ['salicylic-ceramide-body-wash', /ceramide/i],
  ['salicylic-acid-body-wash', /salicylic acid body wash|1% salicylic acid/i],
  ['urea-body-lotion', /urea|lotion|moisturi[sz]er|dry skin/i],
  ['ultra-light-sunscreen', /sunscreen|spf|sun ?(screen|block|protect|cream)|tan\b/i],
];
const BODY_WASH = /body ?wash|shower gel|body acne|back acne|bacne/i;

export function detectProduct(text: string): string | undefined {
  for (const [id, re] of ALIASES) if (re.test(text)) return id;
  if (BODY_WASH.test(text)) return 'salicylic-ceramide-body-wash';
  return undefined;
}

export const sourceText = (s: Source) =>
  ({ brand: 'Be Bodywise product page', retailer: 'Retailer listing', general: 'General guidance, not product-specific', unverified: 'Not verified: check your label' })[s];

const factSrc = (p: Product, f: Fact) => ({ label: f.source === 'unverified' ? sourceText('unverified') : `${p.shortName}: ${sourceText(f.source)}`, source: f.source });

const guide = (p: Product): CoachAction => ({ label: `Open the ${p.shortName} guide`, to: `/products/${p.id}` });
const JOURNEY: CoachAction = { label: 'Go to My Results Journey', to: '/journeys' };
const QUICK: CoachAction = { label: 'Search Quick Answers', to: '/answers' };
const FIT: CoachAction = { label: 'Try the Fit Finder', to: '/fit-finder' };
const ROUTINE: CoachAction = { label: 'Open my routine checklist', to: '/routine' };

const productSuggestions = (p?: Product): string[] =>
  p
    ? [`How often should I use the ${p.shortName.toLowerCase()}?`, `How long until I see results?`, `Can I use it with other products?`]
    : ['How do I use the hair growth serum?', 'Can I apply the roll-on after shaving?', 'I missed a day. What now?'];

const rx = {
  greeting: /^\s*(hi|hey|hello|namaste|good (morning|evening|afternoon))\b/i,
  thanks: /\b(thanks|thank you|thx|great|perfect|ok(ay)?|got it)\b\s*[.!]*\s*$/i,
  about: /who are you|are you (an? )?(ai|bot|robot|human|real)|chat ?gpt|what can you do|how do you work|live (ai|model)/i,
  overuse: /\b((use|apply|take|put) (more|extra|double)|more (product|often|than)|extra (layer|swipes?|dose|gumm\w*)|double (dose|the amount)|faster|speed (it )?up|quicker|thicker layer|lots of|two gumm\w*|2 gumm\w*|twice as much)\b/i,
  missed: /\b(miss(ed)?|forgot|forget|skip(ped)?|didn'?t (use|apply|take))\b/i,
  combine: /\b(together|combine|combining|layer|layering|mix|same time|along ?with|with (the|my) |both)\b/i,
  timeline: /how long|when (will|do|should|can) i (see|notice)|results?|working|not work|no (change|difference|result)|see (a |any )?(difference|change)|weeks?|months?|take to work/i,
  howto: /how (do|to|should|can) (i )?(use|apply|take|put)|apply(ing)?\b|application|steps?|directions|instructions|massage|rub/i,
  frequency: /how often|how many times|times a day|every day|daily|frequency|twice|once a day|per day|morning or night|what time|night|evening/i,
  quantity: /how much|amount|quantity|pea[- ]?size|swipes?|dose|dosage|how many gumm/i,
  ingredients: /ingredient|contain|what'?s in|actives?|formula|percentage|%/i,
  precautions: /pregnan|breastfeed|nursing|safe|age|under ?18|teen|shav|wax|face|sensitive|patch|side effect|allerg|warning/i,
  which: /which (product|one)|recommend|what should i (use|buy|try)|suit(s|able)? (me|my)|right for me|best for/i,
  tracking: /track|progress|journey|check[- ]?in|photo|log|record/i,
  routine: /remind|routine|checklist|schedule|plan/i,
  stop: /\b(stop(ping)? using|pause|quit|give up|discontinue)\b/i,
  label: /label|pack|box|instructions say/i,
};

export function answer(input: string, ctx: CoachContext): CoachReply {
  const text = input.trim();
  const mentioned = detectProduct(text);
  const productId = mentioned ?? ctx.focusProductId ?? (ctx.routineProductIds.length === 1 ? ctx.routineProductIds[0] : undefined);
  const p = productById(productId);

  // 1. Safety first, always.
  const safety = detectSafety(text);
  if (safety === 'urgent') {
    return { intent: 'urgent', tone: 'urgent', productId, paragraphs: [URGENT_COPY, 'Take the product or its pack with you so the medical team can see the ingredients.'], suggestions: [], actions: [] };
  }
  if (safety === 'reaction') {
    return {
      intent: 'reaction', tone: 'caution', productId,
      paragraphs: ['I can’t diagnose what’s happening, but here is what’s sensible for a possible reaction:'],
      bullets: [...REACTION_STEPS, ...(p ? p.precautions.filter((f) => f.source !== 'general').map((f) => `${p.shortName}: ${f.text}`) : [])],
      sources: p ? p.precautions.filter((f) => f.source !== 'general').map((f) => factSrc(p, f)) : undefined,
      actions: [...(p ? [guide(p)] : []), JOURNEY],
      suggestions: ['How do I log this in my journey?', 'What should I do if a product irritates my skin?'],
    };
  }

  if (rx.about.test(text))
    return {
      intent: 'about', tone: 'normal',
      paragraphs: ['I’m the Routine Coach in this prototype. I answer from a built-in knowledge base of Be Bodywise product information. I’m not connected to a live AI model.', 'When something isn’t verified, I’ll say so and point you to your product label rather than guess. I can’t diagnose skin or hair conditions.'],
      suggestions: productSuggestions(p),
    };
  if (rx.greeting.test(text) && text.split(/\s+/).length <= 4)
    return { intent: 'greeting', tone: 'normal', paragraphs: [p ? `Hi! I can help with your ${p.shortName.toLowerCase()} or anything else in your routine.` : 'Hi! Ask me how to use a product, how long it takes, or what to do if you missed a day.'], suggestions: productSuggestions(p) };
  if (rx.thanks.test(text) && text.split(/\s+/).length <= 4)
    return { intent: 'thanks', tone: 'normal', paragraphs: ['Happy to help. Anything else about your routine?'], suggestions: productSuggestions(p) };

  if (rx.which.test(text) && !mentioned)
    return { intent: 'which', tone: 'normal', paragraphs: ['The Fit Finder is the best place for that. It asks a few short questions and explains why each product might suit you. It’s a simple rules-based guide, not a skin assessment.'], actions: [FIT], suggestions: ['What is the underarm roll-on for?', 'What is the urea lotion for?'] };

  // Product-specific intents need a product.
  const needsProduct = [rx.overuse, rx.missed, rx.combine, rx.timeline, rx.howto, rx.frequency, rx.quantity, rx.ingredients, rx.precautions].some((r) => r.test(text));
  if (needsProduct && !p && !rx.missed.test(text) && !rx.combine.test(text)) {
    return {
      intent: 'need-product', tone: 'normal',
      paragraphs: ['Which product do you mean? The answer is different for each one.'],
      suggestions: PRODUCTS.filter((x) => x.id !== 'salicylic-acid-body-wash').slice(0, 6).map((x) => `${capFirst(lastWords(text))} (${x.shortName})`),
    };
  }

  if (rx.missed.test(text)) {
    const extra = p?.schedule ? `Your ${p.shortName.toLowerCase()} schedule is "${p.schedule.label.toLowerCase()}". Pick it up again at your next usual time.` : 'Pick it up again at your next usual time.';
    return {
      intent: 'missed', tone: 'normal', productId: p?.id,
      paragraphs: ['Missing a day happens. Don’t double up to make up for it unless your label says otherwise.', extra, 'If you’re missing days often, a gentle in-app reminder might help.'],
      sources: [{ label: sourceText('general'), source: 'general' }],
      actions: [ROUTINE, { label: 'Set up reminders', to: '/reminders' }], suggestions: ['How long until I see results?', 'Can I use two products together?'],
    };
  }

  if (rx.overuse.test(text) && p) {
    return {
      intent: 'overuse', tone: 'caution', productId: p.id,
      paragraphs: ['Using more than the label says won’t make it work faster. It can irritate the skin, and with leave-on products you’ll run out partway through the course.', `For the ${p.shortName.toLowerCase()}: ${p.frequency.text}`],
      sources: [factSrc(p, p.frequency)], actions: [guide(p)], suggestions: ['How long until I see results?', 'I missed a day. What now?'],
    };
  }

  if (rx.combine.test(text)) {
    const c = p?.compatibility;
    return {
      intent: 'combine', tone: 'caution', productId: p?.id,
      paragraphs: [c ? c.text : 'I don’t have verified guidance on combining these products.', 'Until you’ve checked both labels, don’t layer two acid or treatment products at the same time. Starting one new product at a time also makes it easier to tell what’s working.'],
      sources: p && c ? [factSrc(p, c)] : [{ label: sourceText('unverified'), source: 'unverified' }],
      actions: [...(p ? [guide(p)] : []), QUICK], suggestions: productSuggestions(p),
    };
  }

  if (p && rx.ingredients.test(text))
    return { intent: 'ingredients', tone: 'normal', productId: p.id, paragraphs: [p.keyIngredients.text], sources: [factSrc(p, p.keyIngredients)], actions: [guide(p)], suggestions: productSuggestions(p) };

  if (p && rx.precautions.test(text))
    return {
      intent: 'precautions', tone: 'caution', productId: p.id,
      paragraphs: [`Here’s what I have on precautions for the ${p.shortName.toLowerCase()}:`],
      bullets: p.precautions.map((f) => f.text), sources: p.precautions.map((f) => factSrc(p, f)),
      actions: [guide(p)], suggestions: productSuggestions(p),
    };

  if (p && rx.quantity.test(text))
    return { intent: 'quantity', tone: 'normal', productId: p.id, paragraphs: [p.quantity.text], sources: [factSrc(p, p.quantity)], actions: [guide(p)], suggestions: productSuggestions(p) };

  if (p && rx.frequency.test(text) && !rx.timeline.test(text))
    return { intent: 'frequency', tone: 'normal', productId: p.id, paragraphs: [p.frequency.text, ...(p.frequency.note ? [p.frequency.note + '.'] : [])], sources: [factSrc(p, p.frequency)], actions: [guide(p), ROUTINE], suggestions: productSuggestions(p) };

  if (p && rx.timeline.test(text)) {
    const ms = p.milestones.filter((m) => m.source !== 'unverified');
    return {
      intent: 'timeline', tone: 'normal', productId: p.id,
      paragraphs: [p.timeline.text, 'Judge it after the full course, used as directed. Slow change is hard to see day to day, which is why a starting note and regular check-ins help.'],
      bullets: ms.length ? ms.map((m) => `Week ${m.week}: ${m.label}`) : undefined,
      sources: [factSrc(p, p.timeline)], actions: [JOURNEY, guide(p)], suggestions: ['I missed a day. What now?', 'How do I track my progress?'],
    };
  }

  if (p && rx.howto.test(text))
    return {
      intent: 'howto', tone: 'normal', productId: p.id,
      paragraphs: [p.howToUse.text], bullets: p.howToUse.steps, sources: [factSrc(p, p.howToUse)],
      actions: [guide(p), ROUTINE], suggestions: productSuggestions(p),
    };

  if (rx.tracking.test(text))
    return { intent: 'tracking', tone: 'normal', paragraphs: ['Start a Results Journey for the product. You’ll note your starting point, then answer two quick questions at each check-in: did you follow the routine, and have you noticed anything.', 'The app shows your consistency and what the source says to expect. It can’t measure results itself.'], actions: [JOURNEY], suggestions: productSuggestions(p) };

  if (rx.stop.test(text))
    return { intent: 'stop', tone: 'normal', paragraphs: ['You can pause or stop a journey any time from My Results Journey. If you’re stopping because of irritation, that’s the right call. Tell me what happened and I’ll share sensible next steps.'], actions: [JOURNEY], suggestions: ['My skin is itchy after using it', 'How long until I see results?'] };

  if (rx.routine.test(text))
    return { intent: 'routine', tone: 'normal', paragraphs: ['Your routine checklist lists the products you’ve added. Steps with a verified schedule (like the hair serum’s twice daily) show at set times. Others say "as directed on the label".'], actions: [ROUTINE, { label: 'Reminder settings', to: '/reminders' }], suggestions: productSuggestions(p) };

  if (p && (mentioned || rx.label.test(text)))
    return {
      intent: 'product-overview', tone: 'normal', productId: p.id,
      paragraphs: [`${p.name}: ${p.intendedFor.text}`, `How to use: ${p.howToUse.text}`],
      sources: [factSrc(p, p.intendedFor), factSrc(p, p.howToUse)], actions: [guide(p)], suggestions: productSuggestions(p),
    };

  return {
    intent: 'fallback', tone: 'normal', productId: p?.id,
    paragraphs: ['I don’t have a verified answer for that, and I’d rather not guess. Your product label is the most reliable source. You can also search Quick Answers or contact Be Bodywise support.'],
    actions: [QUICK, ...(p ? [guide(p)] : [])], suggestions: productSuggestions(p),
  };
}

const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const lastWords = (s: string) => s.replace(/[?.!]+$/, '').slice(0, 60);
