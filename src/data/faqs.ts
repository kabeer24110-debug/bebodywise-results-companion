import type { FaqItem } from '../types';

// Short, single-answer questions for Quick Answers. Answers only restate sourced facts.
export const FAQS: FaqItem[] = [
  // Underarm roll-on
  { id: 'ro-how', productId: 'aha-bha-underarm-roll-on', topic: 'application', source: 'retailer', q: 'How do I apply the underarm roll-on?', a: 'Apply it directly to the underarm skin, roll evenly, and let it dry completely before dressing.' },
  { id: 'ro-often', productId: 'aha-bha-underarm-roll-on', topic: 'frequency', source: 'retailer', q: 'How often should I use the underarm roll-on?', a: 'The listing says to use it daily. The amount per use isn’t stated, so follow your label.' },
  { id: 'ro-shave', productId: 'aha-bha-underarm-roll-on', topic: 'precautions', source: 'retailer', q: 'Can I use the roll-on right after shaving or waxing?', a: 'No. Avoid freshly shaved or waxed skin, open wounds and cuts, to prevent irritation.' },
  { id: 'ro-time', productId: 'aha-bha-underarm-roll-on', topic: 'expectations', source: 'retailer', q: 'How long before I see a difference in underarm pigmentation?', a: 'The listing recommends daily use for 3 months for best results. It doesn’t promise a specific result by a set date.' },
  { id: 'ro-more', productId: 'aha-bha-underarm-roll-on', topic: 'frequency', source: 'general', q: 'Will applying more roll-on work faster?', a: 'No. Using more than directed won’t speed results, empties the bottle sooner and can irritate the skin.' },
  { id: 'ro-ing', productId: 'aha-bha-underarm-roll-on', topic: 'ingredients', source: 'retailer', q: 'What’s in the underarm roll-on?', a: 'The Flora variant lists 1% salicylic acid, 1% mandelic acid and alpha arbutin. Other variants differ, so check your pack.' },
  // Hair serum
  { id: 'hs-how', productId: 'hair-growth-serum-roll-on', topic: 'application', source: 'brand', q: 'How do I use the hair growth serum?', a: 'Roll the applicator over your whole scalp and massage for 2 minutes. It’s a leave-in, so don’t wash it off. Apply it to the scalp, not the hair lengths.' },
  { id: 'hs-often', productId: 'hair-growth-serum-roll-on', topic: 'frequency', source: 'brand', q: 'How often should I apply the hair serum?', a: 'The brand’s how-to-use section says twice daily. Its FAQ says once a day is the minimum. If unsure, follow your pack.' },
  { id: 'hs-when', productId: 'hair-growth-serum-roll-on', topic: 'application', source: 'brand', q: 'What time of day should I apply the hair serum?', a: 'The brand suggests the late evening or night, and not just before you wash your hair.' },
  { id: 'hs-time', productId: 'hair-growth-serum-roll-on', topic: 'expectations', source: 'brand', q: 'When will I see results from the hair serum?', a: 'The brand says to use it consistently for at least 3 months. It describes baby hair at month 2, less thinning at month 3 and more volume from month 4. Results vary.' },
  { id: 'hs-age', productId: 'hair-growth-serum-roll-on', topic: 'precautions', source: 'brand', q: 'Who is the hair serum for?', a: 'Women aged 18 and over. The brand doesn’t recommend it for under-18s.' },
  { id: 'hs-ing', productId: 'hair-growth-serum-roll-on', topic: 'ingredients', source: 'brand', q: 'What are the actives in the hair serum?', a: '3% rosemary, 3% Redensyl, 2% Anagain and 2% Aminexil, plus Procapil and Baicapil.' },
  // Gummies
  { id: 'hg-how', productId: 'hair-health-gummies', topic: 'application', source: 'brand', q: 'How do I take the hair gummies?', a: 'One gummy a day after any meal. Chew it; no water needed.' },
  { id: 'hg-two', productId: 'hair-health-gummies', topic: 'frequency', source: 'brand', q: 'Can I take two gummies to speed things up?', a: 'No. The brand says one gummy a day. Don’t take more than the label says.' },
  { id: 'hg-time', productId: 'hair-health-gummies', topic: 'expectations', source: 'brand', q: 'How long do the hair gummies take to work?', a: 'The brand recommends a 3-month routine and says you won’t see results in just one month.' },
  { id: 'hg-nurse', productId: 'hair-health-gummies', topic: 'precautions', source: 'brand', q: 'Can I take the gummies while breastfeeding?', a: 'The brand says to consult your healthcare professional first if you are nursing.' },
  { id: 'hg-ing', productId: 'hair-health-gummies', topic: 'ingredients', source: 'brand', q: 'What’s in the hair gummies?', a: 'Biotin, zinc, vitamins A, B12, C, D and E, and chicory root.' },
  // Body washes
  { id: 'bw-face', productId: 'salicylic-ceramide-body-wash', topic: 'precautions', source: 'brand', q: 'Can I use the salicylic body wash on my face?', a: 'No. The brand says it’s for the body and may be too potent for facial skin.' },
  { id: 'bw-irr', productId: 'salicylic-ceramide-body-wash', topic: 'precautions', source: 'brand', q: 'What if the body wash makes my skin red or dry?', a: 'Reduce how often you use it or stop. See a doctor if irritation is severe or doesn’t settle.' },
  { id: 'bw-ing', productId: 'salicylic-ceramide-body-wash', topic: 'ingredients', source: 'brand', q: 'What’s in the Salicylic Ceramide Body Wash?', a: '1% salicylic acid in encapsulated beads, a ceramide complex, chamomile and a glycerine–hyaluronic acid complex.' },
  { id: 'bw-time', productId: 'salicylic-ceramide-body-wash', topic: 'expectations', source: 'brand', q: 'How long does the body wash take to clear body acne?', a: 'The brand doesn’t state a timeline. Track it in My Results Journey and check with a doctor if acne is severe or painful.' },
  { id: 'sa-ver', productId: 'salicylic-acid-body-wash', topic: 'application', source: 'unverified', q: 'How do I use the 1% Salicylic Acid Body Wash?', a: 'We couldn’t confirm instructions for this exact version. Please follow your product label.' },
  // Urea lotion
  { id: 'ul-often', productId: 'urea-body-lotion', topic: 'frequency', source: 'retailer', q: 'Can I use the urea lotion every day?', a: 'The listing describes it as ideal for daily use. Follow the label for how much and where to apply.' },
  { id: 'ul-ing', productId: 'urea-body-lotion', topic: 'ingredients', source: 'retailer', q: 'What’s in the urea body lotion?', a: '10% urea and 18% emollients, including shea, mango and kokum butters.' },
  // Sunscreen
  { id: 'ss-how', productId: 'ultra-light-sunscreen', topic: 'application', source: 'brand', q: 'How do I apply the sunscreen?', a: 'On cleansed and toned skin, apply a generous amount to your face and neck.' },
  { id: 'ss-re', productId: 'ultra-light-sunscreen', topic: 'frequency', source: 'general', q: 'How often should I reapply sunscreen?', a: 'The brand doesn’t say. General sun-safety advice is about every two hours outdoors, and after swimming or sweating.' },
  { id: 'ss-patch', productId: 'ultra-light-sunscreen', topic: 'precautions', source: 'brand', q: 'Do I need to patch test the sunscreen?', a: 'The brand recommends it: apply to a small area on the arm or inner elbow and leave it for 12–24 hours.' },
  { id: 'ss-water', productId: 'ultra-light-sunscreen', topic: 'expectations', source: 'brand', q: 'Is the sunscreen water resistant?', a: 'The brand states sweat and water resistance of up to 80 minutes.' },
  // General
  { id: 'g-combine', productId: null, topic: 'routine', source: 'general', q: 'Can I use two of these products at the same time?', a: 'Only if the labels say so. We don’t have verified guidance on combining these products, so don’t layer acids or treatments without checking.' },
  { id: 'g-missed', productId: null, topic: 'routine', source: 'general', q: 'What if I miss a day?', a: 'Carry on with your next usual application. Don’t double up to make up for it unless your label says otherwise.' },
  { id: 'g-reaction', productId: null, topic: 'precautions', source: 'general', q: 'What should I do if a product irritates my skin?', a: 'Stop using it. If the reaction is severe or doesn’t settle, see a doctor. Get urgent help for swelling of the face or lips, or difficulty breathing.' },
  { id: 'g-stop', productId: null, topic: 'expectations', source: 'general', q: 'When should I decide whether a product is working?', a: 'After the full course the brand recommends, used as directed. For several of these products that’s about 3 months.' },
];
