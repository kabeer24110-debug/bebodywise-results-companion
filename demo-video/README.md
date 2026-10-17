# Demo video production (Be Bodywise Results Companion)

Recorded from the real, running app (vite preview build) with Playwright + Chrome DevTools screencast at 1920x1080.
Narration: offline Kokoro TTS (voice af_heart). No music (none licensed/available).

1. From the repo root: `npm run build && npx vite preview --port 4173`
2. `pip install kokoro-onnx soundfile playwright` and download `kokoro-v1.0.int8.onnx` + `voices-v1.0.bin`
   from github.com/thewh1teagle/kokoro-onnx releases (model-files-v1.0) into `tts/`
3. `npm i @fontsource/figtree @fontsource/gloock` (brand fonts for the recording and cards)
4. `python3 tts.py` — renders narration.json beat by beat
5. `python3 cards.py` — title/end cards, chapter labels, caption images
6. `python3 record.py` — drives the app, paced to each narration beat; logs beat start times
7. `python3 assemble.py` — 30 fps edit, crossfades, narration placed at logged times, captions, chapters

All demo data is synthetic and typed live during the recording. The coach answers shown are the app's real
local knowledge-base replies; the narration states it is not a live AI model.
