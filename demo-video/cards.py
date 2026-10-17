"""Renders title/end cards, chapter labels and caption images (brand fonts) with Playwright."""
import asyncio, base64, json, os, re
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'cards'); os.makedirs(OUT, exist_ok=True)
F = os.path.join(HERE, 'node_modules', '@fontsource')
def _f(d, f):
    return 'data:font/woff2;base64,' + base64.b64encode(open(os.path.join(F, d, 'files', f), 'rb').read()).decode()
FONTCSS = f"""
@font-face{{font-family:Figtree;font-weight:400;src:url({_f('figtree','figtree-latin-400-normal.woff2')})}}
@font-face{{font-family:Figtree;font-weight:500;src:url({_f('figtree','figtree-latin-500-normal.woff2')})}}
@font-face{{font-family:Figtree;font-weight:600;src:url({_f('figtree','figtree-latin-600-normal.woff2')})}}
@font-face{{font-family:Gloock;font-weight:400;src:url({_f('gloock','gloock-latin-400-normal.woff2')})}}
:root{{--ivory:#FAF7F2;--ink:#2A2826;--muted:#6E6862;--line:#E7E0D6;--sage:#4E6956;--sage5:#7A9783;--sage1:#DCE7DF;--blush:#F4DED7}}
*{{margin:0;box-sizing:border-box}} body{{font-family:Figtree,sans-serif;color:var(--ink)}}
"""

CHAPTERS = {
    'fit': ('1', 'Fit Finder'),
    'decode': ('2', 'Decode My Product'),
    'journey': ('3', 'My Results Journey'),
    'coach': ('4', 'Routine Coach'),
    'support': ('5', 'Everyday tools'),
}


def chunks(text, limit=78):
    """Split narration into caption-sized pieces at sentence, then clause, boundaries."""
    sents = re.split(r'(?<=[.!?])\s+', text.strip())
    out = []
    for s in sents:
        if len(s) <= limit:
            out.append(s); continue
        parts = re.split(r'(?<=[,:])\s+', s)
        cur = ''
        for part in parts:
            if cur and len(cur) + 1 + len(part) > limit:
                out.append(cur); cur = part
            else:
                cur = (cur + ' ' + part).strip()
        if cur: out.append(cur)
    # merge very short tails into the previous caption
    merged = []
    for c in out:
        if merged and len(c) < 22 and len(merged[-1]) + len(c) < limit + 12:
            merged[-1] += ' ' + c
        else:
            merged.append(c)
    return merged


TITLE = """<div style="width:1920px;height:1080px;background:var(--ivory);position:relative;overflow:hidden">
  <div style="position:absolute;right:-160px;top:-160px;width:720px;height:720px;border-radius:50%;background:#FBF0EC"></div>
  <div style="position:absolute;right:210px;top:300px;width:420px;height:470px;border-radius:30px;background:#fff;border:1.5px solid var(--line);box-shadow:0 30px 60px -30px rgba(42,40,38,.25);padding:36px">
    <div style="font-family:Gloock;font-size:34px">Today</div>
    {{ROWS}}
    <div style="margin-top:26px;background:var(--ivory);border-radius:16px;padding:20px">
      <div style="display:flex;justify-content:space-between;font-size:19px"><b style="font-weight:600">Results Journey</b><span style="color:var(--muted)">Week 5 of 12</span></div>
      <div style="margin-top:14px;height:10px;border-radius:9px;background:var(--sage1)"><div style="width:42%;height:100%;border-radius:9px;background:var(--sage5)"></div></div>
    </div>
  </div>
  <div style="position:absolute;left:150px;top:310px;width:1100px">
    <div style="font-size:24px;font-weight:600;color:var(--sage);letter-spacing:.04em">MOSAIC FELLOWSHIP · PRODUCT DEMO</div>
    <div style="font-family:Gloock;font-size:104px;line-height:1.02;margin-top:26px">Be Bodywise<br>Results Companion</div>
    <div style="font-size:31px;color:var(--muted);margin-top:30px;line-height:1.4">Choose, understand, follow and judge<br>a body-care routine with more confidence.</div>
    <div style="font-size:21px;color:var(--muted);margin-top:56px">Kabeer Vinayak &nbsp;·&nbsp; Independent prototype, not an official Be Bodywise product</div>
  </div>
</div>"""
CHECK = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
def ROW(done, label):
    dot = f'<span style="flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;{"background:var(--sage)" if done else "border:2px solid var(--line)"}">{CHECK if done else ""}</span>'
    txt = f'<span style="color:var(--muted);text-decoration:line-through">{label}</span>' if done else f'<span>{label}</span>'
    return f'<div style="margin-top:16px;display:flex;align-items:center;gap:14px;border:1.5px solid var(--line);border-radius:14px;padding:14px 16px;font-size:20px;white-space:nowrap">{dot}{txt}</div>'
ROWS = ROW(True, 'Hair Growth Serum, morning') + ROW(True, 'Underarm Roll-On') + ROW(False, 'Hair Growth Serum, evening')

END = """<div style="width:1920px;height:1080px;background:#3C5243;color:#fff;position:relative;overflow:hidden;display:flex;align-items:center">
  <div style="position:absolute;left:-200px;bottom:-260px;width:760px;height:760px;border-radius:50%;background:rgba(255,255,255,.05)"></div>
  <div style="margin-left:150px;width:1500px">
    <div style="font-family:Gloock;font-size:92px;line-height:1.08">Choose with reasons.<br>Use with clarity.<br>Judge results at the right time.</div>
    <div style="margin-top:60px;display:flex;gap:44px;font-size:23px;color:rgba(255,255,255,.82)">
      <span>Fit Finder</span><span>Decode My Product</span><span>My Results Journey</span><span>Routine Coach</span>
    </div>
    <div style="margin-top:60px;padding-top:30px;border-top:1px solid rgba(255,255,255,.22);font-size:21px;line-height:1.6;color:rgba(255,255,255,.72)">
      Kabeer Vinayak · Mosaic Fellowship · Working prototype recorded from the live app with synthetic demo data<br>
      Coach answers come from a built-in knowledge base, not a live AI model · Data stays in the user’s browser · Not medical advice
    </div>
  </div>
</div>"""

CHAP = """<div id="c" style="display:inline-flex;align-items:center;gap:18px;padding:16px 26px 16px 18px;border-radius:18px;background:rgba(255,255,255,.96);border:1.5px solid var(--line);box-shadow:0 14px 34px -18px rgba(42,40,38,.45)">
  <span style="width:46px;height:46px;border-radius:50%%;background:var(--sage1);color:var(--sage);display:grid;place-items:center;font-weight:600;font-size:21px">%s</span>
  <span><span style="display:block;font-size:15px;font-weight:600;letter-spacing:.08em;color:var(--muted)">FEATURE %s OF 5</span><span style="display:block;font-family:Gloock;font-size:30px;line-height:1.15;margin-top:2px">%s</span></span>
</div>"""

CAP = """<div id="c" style="display:inline-block;max-width:1180px;padding:14px 26px;border-radius:14px;background:rgba(42,40,38,.86);color:#fff;font-weight:500;font-size:33px;line-height:1.35;text-align:center">%s</div>"""


async def main():
    beats = json.load(open(os.path.join(HERE, 'narration.json')))
    caps = {}
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        pg = await b.new_page(viewport={'width': 1920, 'height': 1080})
        async def shot(html, name, transparent=False):
            bg = 'transparent' if transparent else '#fff'
            await pg.set_content(f'<style>{FONTCSS} html,body{{background:{bg}}}</style><body>{html}</body>')
            await pg.evaluate('document.fonts.ready')
            await pg.wait_for_timeout(120)
            el = pg.locator('#c') if transparent else pg.locator('body > div').first
            await el.screenshot(path=os.path.join(OUT, name), omit_background=transparent)
        await shot(TITLE.replace('{{ROWS}}', ROWS), 'title.png')
        await shot(END, 'end.png')
        for k, (n, label) in CHAPTERS.items():
            await shot(CHAP % (n, n, label), f'chap_{k}.png', True)
        for bt in beats:
            caps[bt['id']] = []
            for i, c in enumerate(chunks(bt['text'])):
                name = f"cap_{bt['id']}_{i}.png"
                await shot(CAP % c, name, True)
                caps[bt['id']].append({'file': name, 'text': c})
        await b.close()
    json.dump(caps, open(os.path.join(OUT, 'captions.json'), 'w'), indent=1)
    print('cards done;', sum(len(v) for v in caps.values()), 'captions')

asyncio.run(main())
