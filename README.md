# Be Bodywise Results Companion (prototype)

A working web-app prototype for the Mosaic Fellowship challenge (Part 2), submitted by Kabeer Vinayak.
It helps Be Bodywise customers choose a product, understand how to use it, and judge results fairly over time.
It is **not** an official Be Bodywise product and not medical advice.

## Run locally

Requires Node 18+.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build -> dist/
npm run preview      # serve dist/ at http://localhost:4173
npm run build:single # one self-contained HTML file -> dist-single/index.html
```

## Deploy

The app is fully static (no server, no environment variables) and uses hash routing, so no rewrite rules are needed.

- **Vercel:** import the folder or repo, framework preset "Vite", build command `npm run build`, output directory `dist`.
- **Netlify:** build command `npm run build`, publish directory `dist`. Or drag the `dist/` folder onto app.netlify.com/drop.
- **Any static host / GitHub Pages:** upload the contents of `dist/` (the build uses relative paths, `base: './'`).

## Stack

React 18, TypeScript (strict), Vite 5, Tailwind CSS 3, Lucide icons, react-router (HashRouter), localStorage.

## Features

Flagship
1. **Fit Finder** (`/fit-finder`): branching questionnaire (only relevant questions appear), review screen with per-answer editing, deterministic rule-based results with reasons and cautions for each product, doctor referrals for red-flag answers, an "insufficient information" path with alternatives, add to routine / start journey, answers saved.
2. **Decode My Product** (`/products`, `/products/:id`): search, category filter, "in my routine" filter; each guide shows purpose, how to use, how often, how much, timeline and milestones, ingredients, precautions and compatibility, every field tagged *Brand page / Retailer listing / General guidance / Check the label*.
3. **My Results Journey** (`/journeys`, `/journeys/:id`): start date and baseline (goal, how you feel, note), timeline with check-ins at weeks 2/4/8/12 plus the source's milestones and review point, check-in form, neutral status ("Early days", "Building up", "At the review point"), separate readouts for reported consistency, your own impression and measured results ("Not tracked"), next steps for confusion, inconsistency, no change, worsening and reactions, pause / resume / stop / delete with in-page confirmation.
4. **Routine Coach** (`/coach`): chat UI over a local knowledge base with intent matching (how to use, frequency, quantity, timeline, missed days, overuse, combining, precautions, ingredients, tracking, stopping, product overview, fallback). Safety detection runs first: irritation gives step-by-step guidance, urgent symptoms escalate to emergency care (112 in India). It states that it is not a live AI model. `answer(input, context) -> CoachReply` in `src/lib/coachEngine.ts` is the single seam for a future model integration.

Supporting
- **Daily Routine Checklist** (`/routine`): today's steps grouped by time of day, persisted per date, last-7-days view, neutral copy about missed days, no streaks. Timed steps appear only when a schedule is verified; otherwise "Use as directed on the label".
- **Quick Answers** (`/answers`): local keyword search with product and topic filters, source labels, fallback when nothing matches.
- **Myth Buster** (`/myths`): eight reveal cards with sources.
- **Milestone Reminders** (`/reminders`): opt-in, shown in-app under the bell only.
- **About** (`/about`): data disclosure, working vs simulated, list of unverified facts, load example data, delete all data.

## Functional vs simulated

| Area | Status |
| --- | --- |
| Fit Finder, guides, journeys, checklist, Quick Answers, Myth Buster | Fully functional in the browser |
| Persistence | localStorage in the current browser only. No account, server, cloud sync or encryption. Not a secure or medical record. |
| Routine Coach | Local knowledge base with regex intent matching. **Not a live AI / LLM.** |
| Reminders | Simulated in-app only. No push notifications, SMS, WhatsApp, email or background jobs. |
| Product images | Simple SVG illustrations, not official product photography. No brand logos are reproduced. |
| Example data | Synthetic, loaded on request from About or the home page. No customer-interview data is used anywhere. |

## Product information sources

Facts were read in October 2026 from Be Bodywise product pages and authorised retailer listings (Apollo Pharmacy, Swadesii). Every fact in `src/data/products.ts` carries a `source`. To add a product, append an object to that file.

Not verified (the app shows "Check the label" / "Product information needs verification"):
- **1% Salicylic Acid Body Wash:** everything (may be an earlier version of the Ceramide wash).
- **1% Salicylic Ceramide Body Wash:** how to use (shown only as an image on the brand page), how much, compatibility. No results timeline stated.
- **10% Urea Body Lotion:** how to use, how much, compatibility (retailer listing only).
- **4% AHA BHA Underarm Roll-On:** amount per use, compatibility; ingredients are for the Flora variant only.
- **Hair Growth Serum, Hair Health Gummies, Ultra Light Sunscreen:** compatibility with other products.

Known conflicts, shown in the app:
- Serum frequency: how-to says twice daily, FAQ says once a day minimum.
- Sunscreen rating: older listing PA+++, current brand page SPF50+ PA++++.
- Sunscreen reapplication interval is general guidance, not a brand statement.

## Tested

Automated Playwright run at 1366x900 and 390x844 (mobile emulation), all passing with no console errors:
- A: Fit Finder branching, edit from review, explained results, add to routine; insufficient-information path.
- B: library search, empty search, category filter, unverified product warning, verified steps, add to routine.
- C: start a journey with baseline, check-in with confusion and no change, neutral next steps, pause and resume.
- D: coach how-to, missed day, shaving precaution, "are you a real AI" disclosure, unknown-question fallback.
- E: reaction and urgent-care flow in both the journey check-in and the coach.
- F: checklist toggle persisting after reload, journeys persisting, reminders opt-in, Quick Answers and fallback, Myth Buster, delete all data, load example data, mobile menu, no horizontal overflow on any route.

## Demo video

`demo-video/` holds the scripts that recorded the narrated walkthrough from the running app
(Playwright screencast at 1080p, offline text-to-speech narration, ffmpeg edit). See `demo-video/README.md`.

## Limitations

- Data lives in one browser; clearing site data or switching device loses it.
- The coach only understands phrasing its rules cover; anything else gets a safe fallback.
- Fit Finder rules are a transparent mapping to stated product purpose, not a clinical assessment.
- Only seven products; stronger underarm options (6% roll-on, pigmentation repair cream) are mentioned but not catalogued because their details weren't verified.
- Reminders only appear when the app is open.
