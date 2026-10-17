"""Records the real Results Companion app (vite preview build) as high-quality JPEG frames
via the Chrome DevTools screencast, pacing each scene to the narration beat durations.
Outputs: frames/*.jpg, frames/index.json (frame timestamps), marks.json (beat/chapter start times)."""
import asyncio, base64, json, os, shutil, time, datetime
from playwright.async_api import async_playwright

BASE = os.environ.get('BASE', 'http://localhost:4173/')
HERE = os.path.dirname(os.path.abspath(__file__))
FR = os.path.join(HERE, 'frames')
DUR = json.load(open(os.path.join(HERE, 'narration', 'durations.json')))
GAP = 0.4            # breathing room after each narration beat
W, H = 1920, 1080    # real 1080p viewport; the page is zoomed 1.333x so it lays out like a 1440px laptop screen

FONT_DIR = os.path.join(HERE, 'node_modules', '@fontsource')
FONTS = {
    'figtree-400.woff2': ('figtree', 'figtree-latin-400-normal.woff2', 'Figtree', 400, 'normal'),
    'figtree-400i.woff2': ('figtree', 'figtree-latin-400-italic.woff2', 'Figtree', 400, 'italic'),
    'figtree-500.woff2': ('figtree', 'figtree-latin-500-normal.woff2', 'Figtree', 500, 'normal'),
    'figtree-600.woff2': ('figtree', 'figtree-latin-600-normal.woff2', 'Figtree', 600, 'normal'),
    'figtree-700.woff2': ('figtree', 'figtree-latin-700-normal.woff2', 'Figtree', 700, 'normal'),
    'gloock-400.woff2': ('gloock', 'gloock-latin-400-normal.woff2', 'Gloock', 400, 'normal'),
}
FONT_CSS = '\n'.join(
    f"@font-face{{font-family:'{fam}';font-style:{st};font-weight:{wt};font-display:block;src:url(https://fonts.gstatic.com/local/{k}) format('woff2');}}"
    for k, (_, _, fam, wt, st) in FONTS.items())

CURSOR_JS = r"""
(() => {
  const install = () => {
    if (document.getElementById('__cur')) return;
    document.documentElement.style.zoom = '1.3333';
    const st = document.createElement('style');
    st.textContent = `::-webkit-scrollbar{display:none} html{scrollbar-width:none}
      #__cur{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;will-change:transform;filter:drop-shadow(0 2px 3px rgba(0,0,0,.18))}
      .__rip{position:fixed;z-index:2147483646;pointer-events:none;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;
        border:2px solid rgba(78,105,86,.55);background:rgba(122,151,131,.18);animation:__r .55s ease-out forwards}
      @keyframes __r{from{transform:scale(.25);opacity:1}to{transform:scale(1.25);opacity:0}}`;
    document.head.appendChild(st);
    const c = document.createElement('div'); c.id = '__cur';
    c.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M5 2.5l14 10.2-6.3 1.2 3.7 7-2.7 1.4-3.7-7L5 19.6z" fill="#2A2826" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    c.style.transform = 'translate(-60px,-60px)';
    document.body.appendChild(c);
    addEventListener('mousemove', e => { c.style.transform = `translate(${e.clientX - 5}px,${e.clientY - 3}px)`; }, true);
    addEventListener('mousedown', e => { const r = document.createElement('div'); r.className = '__rip'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; document.body.appendChild(r); setTimeout(() => r.remove(), 600); }, true);
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', install); else install();
})();
"""

SCROLL_JS = """([dy, ms]) => new Promise(res => {
  const y0 = scrollY, t0 = performance.now();
  const max = document.documentElement.scrollHeight - innerHeight;
  const target = Math.max(0, Math.min(max, y0 + dy));
  const ease = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
  const step = now => { const t = Math.min(1, (now - t0) / ms); scrollTo(0, y0 + (target - y0) * ease(t)); t < 1 ? requestAnimationFrame(step) : res(); };
  requestAnimationFrame(step);
})"""


class Rec:
    def __init__(self, page):
        self.p = page
        self.x, self.y = W * 0.62, H * 0.55
        self.marks = []

    async def wait(self, s):
        await self.p.wait_for_timeout(int(s * 1000))

    async def glide(self, x, y, ms=650):
        steps = max(8, int(ms / 28))
        x0, y0 = self.x, self.y
        for i in range(1, steps + 1):
            t = i / steps
            e = 4 * t ** 3 if t < .5 else 1 - (-2 * t + 2) ** 3 / 2
            await self.p.mouse.move(x0 + (x - x0) * e, y0 + (y - y0) * e)
            await self.p.wait_for_timeout(8)
        self.x, self.y = x, y

    async def scroll(self, dy, ms=900):
        await self.p.evaluate(SCROLL_JS, [dy, ms])
        await self.p.wait_for_timeout(60)

    async def scroll_top(self, ms=900):
        y = await self.p.evaluate('scrollY')
        if y > 0:
            await self.scroll(-y, ms)

    async def reveal(self, loc, top=150, bottom=110, ms=850, anchor=None):
        """Smooth-scroll so the element sits comfortably in view (anchor: fraction of viewport for its top)."""
        await loc.wait_for(state='visible')
        box = await loc.bounding_box()
        if anchor is not None:
            await self.scroll(box['y'] - H * anchor, ms)
        elif box['y'] < top:
            await self.scroll(box['y'] - top - 40, ms)
        elif box['y'] + box['height'] > H - bottom:
            await self.scroll(min(box['y'] - top - 40, box['y'] + box['height'] - (H - bottom) + 60), ms)

    async def point(self, loc, ms=600, dx=0.5, dy=0.5):
        await self.reveal(loc)
        box = await loc.bounding_box()
        await self.glide(box['x'] + box['width'] * dx, box['y'] + box['height'] * dy, ms)

    async def click(self, loc, ms=480, pause=0.12, after=0.3):
        await self.point(loc, ms)
        await self.wait(pause)
        await self.p.mouse.down(); await self.wait(0.07); await self.p.mouse.up()
        await self.wait(after)

    async def type(self, loc, text, delay=55):
        await self.click(loc, after=0.15)
        await self.p.keyboard.type(text, delay=delay)

    async def hash(self, path):
        await self.p.evaluate(f"location.hash = '#{path}'")
        await self.p.wait_for_timeout(450)

    async def beat(self, bid, fn=None, chapter=None):
        t = time.time()
        self.marks.append({'id': bid, 't': t, 'chapter': chapter})
        if fn:
            await fn()
        remain = DUR[bid] + GAP - (time.time() - t)
        if remain > 0:
            await self.wait(remain)
        else:
            print(f'  beat {bid} actions overran narration by {-remain:.1f}s')


async def scenes(r: Rec):
    p = r.p
    role = p.get_by_role

    # ---------- Opening: home ----------
    async def b02():
        await r.wait(2.0)
        await r.glide(W * 0.30, H * 0.47, 800)
        await r.wait(0.8)
        await r.scroll(H * 0.95, 1400)
        await r.wait(2.6)
        await r.glide(W * 0.55, H * 0.45, 700)
        await r.wait(1.4)
        await r.scroll(H * 0.75, 1300)
        await r.wait(1.5)
        await r.scroll_top(1300)
    await r.beat('b02', b02, chapter='open')

    # ---------- Fit Finder ----------
    async def b03():
        await r.click(role('link', name='Find My Products').first)
        await r.wait(1.3)
        await r.click(role('button', name='Start', exact=True))
        await r.wait(0.6)
        await r.click(role('checkbox', name='Dark or uneven underarms'))
        await r.click(role('checkbox', name='Hair thinning or hair fall'), ms=450)
    await r.beat('b03', b03, chapter='fit')

    async def b04():
        nxt = lambda: role('button', name='Next')
        for opt in ['Shaving', ('No', True), 'Something I apply to my scalp', 'No, it’s gradual', 'Yes, 18 or over']:
            await r.click(nxt(), ms=300, pause=0.05, after=0.05)
            await p.evaluate('scrollTo(0, 0)')
            await r.wait(0.3)
            name, exact = (opt if isinstance(opt, tuple) else (opt, False))
            await r.click(role('radio', name=name, exact=exact), ms=300, pause=0.05, after=0.2)
        await r.click(nxt(), ms=300, pause=0.05, after=0.05)
        await p.evaluate('scrollTo(0, 0)')
        await r.wait(0.3)
        await r.click(role('checkbox', name='None of these'), ms=300, pause=0.05, after=0.2)
        await r.click(role('button', name='Review answers'), ms=300, pause=0.05, after=0.4)
    await r.beat('b04', b04)

    async def b05():
        await r.point(role('button', name='Edit: How do you usually remove underarm hair?'), ms=700)
        await r.wait(0.9)
        await r.point(role('button', name='Edit: Are you 18 or over?'), ms=700)
    await r.beat('b05', b05)

    async def b06():
        await r.click(role('button', name='See my suggestions'))
        await r.wait(1.3)
        await r.scroll(H * 0.42, 1000)
        await r.wait(1.3)
        await r.click(role('button', name='Add to my routine').first)
        await r.wait(0.6)
        await r.scroll(H * 0.55, 1100)
        await r.wait(0.8)
    await r.beat('b06', b06)

    # ---------- Decode My Product ----------
    async def b07():
        await r.scroll_top(700)
        await r.click(p.get_by_role('navigation', name='Main').get_by_role('link', name='Products'))
        await r.wait(0.6)
        await r.click(role('button', name='Hair care', exact=True))
        await r.wait(0.3)
        await r.point(p.locator('a[href="#/products/hair-growth-serum-roll-on"]'), ms=600)
    await r.beat('b07', b07, chapter='decode')

    async def b08():
        await r.click(p.locator('a[href="#/products/hair-growth-serum-roll-on"]'), after=0.6)
        await r.wait(1.4)
        await r.reveal(p.get_by_role('heading', name='How to use it'), anchor=0.13, ms=1300)
        await r.wait(2.2)
        await r.point(p.get_by_text('Massage for 2 minutes.', exact=True), ms=700)
        await r.wait(1.6)
        await r.reveal(p.get_by_role('heading', name='How often'), anchor=0.22, ms=1100)
        await r.point(p.get_by_text('The brand FAQ says once a day is the minimum', exact=False), ms=800, dx=0.3)
    await r.beat('b08', b08)

    async def b09():
        await r.reveal(p.get_by_role('heading', name='What to expect, and when'), anchor=0.12, ms=1200)
        await r.wait(1.8)
        await r.reveal(p.get_by_role('heading', name='Precautions'), anchor=0.14, ms=1200)
    await r.beat('b09', b09)

    async def b10():
        await r.hash('/products/salicylic-acid-body-wash')
        await r.glide(W * 0.36, H * 0.72, 700)
    await r.beat('b10', b10)

    # ---------- My Results Journey ----------
    async def b11():
        await r.click(p.get_by_role('navigation', name='Main').get_by_role('link', name='My Journey'))
        await r.wait(0.5)
        await r.click(role('button', name='Start a journey'))
        await r.wait(0.2)
        sel = p.locator('select').first
        await r.click(sel, after=0.1)
        await sel.select_option('hair-growth-serum-roll-on')
        await r.wait(0.2)
        start = (datetime.date.today() - datetime.timedelta(days=36)).isoformat()
        date = p.locator('input[type=date]')
        await r.point(date, ms=500)
        await date.fill(start)
        await r.wait(0.2)
        await r.type(p.get_by_placeholder('For example: less thinning near my parting'), 'Less thinning near my parting', delay=26)
        await r.click(role('button', name='Unhappy', exact=True), ms=400)
    await r.beat('b11', b11, chapter='journey')

    async def b12():
        await r.click(role('button', name='Start journey'), after=0.6)
        await r.wait(1.2)
        await r.reveal(p.get_by_role('heading', name='Timeline'), anchor=0.1, ms=1200)
        await r.wait(1.6)
        await r.scroll(H * 0.5, 1500)
        await r.wait(1.0)
    await r.beat('b12', b12)

    async def b13():
        await r.scroll_top(1100)
        await r.click(role('button', name='Add a check-in'))
        await r.click(role('button', name='Mostly', exact=True), ms=380, after=0.25)
        await r.click(role('button', name='About the same'), ms=380, after=0.25)
        await r.click(role('button', name='No', exact=True), ms=380, after=0.25)
        await r.click(p.get_by_label('Something about using it is unclear'), ms=380, after=0.25)
        await r.click(role('button', name='Save check-in'), ms=420, after=0.5)
        await r.point(p.get_by_text('Consistency you reported'), ms=700)
    await r.beat('b13', b13)

    async def b14():
        await r.reveal(p.get_by_role('heading', name='Suggested next steps'), anchor=0.1, ms=1500)
        await r.point(p.get_by_text('Re-read how to use it'), ms=700, dx=0.2)
        await r.wait(1.4)
        await r.point(p.get_by_text('No change yet is normal'), ms=800, dx=0.2)
    await r.beat('b14', b14)

    # ---------- Routine Coach ----------
    box = lambda: p.get_by_label('Your question')

    async def ask(q):
        await r.type(box(), q, delay=24)
        await r.wait(0.15)
        await p.keyboard.press('Enter')
        await r.wait(0.8)

    async def b15():
        await r.scroll_top(600)
        await r.click(p.get_by_role('navigation', name='Main').get_by_role('link', name='Routine Coach'))
        await r.wait(0.8)
        await r.point(p.get_by_text('It is not a live AI model'), ms=800)
    await r.beat('b15', b15, chapter='coach')

    async def b16():
        await ask('How often should I use the hair growth serum?')
    await r.beat('b16', b16)

    async def b17():
        await ask('I missed a day. Should I double up?')
    await r.beat('b17', b17)

    async def b18():
        await ask('My underarm is red and burning after the roll-on')
        await r.wait(0.8)
        await r.glide(W * 0.45, H * 0.5, 700)
    await r.beat('b18', b18)

    # ---------- Supporting features ----------
    async def b19():
        await r.scroll_top(600)
        await r.click(p.get_by_role('navigation', name='Main').get_by_role('link', name='Routine', exact=True))
        await r.wait(0.8)
        steps = role('checkbox')
        await r.click(steps.nth(0), ms=500, after=0.35)
        await r.click(steps.nth(1), ms=380, after=0.35)
        await r.reveal(p.get_by_text('Last 7 days'), anchor=0.35, ms=1000)
    await r.beat('b19', b19, chapter='support')

    async def b20():
        await r.hash('/answers')
        await r.type(p.get_by_placeholder('Search, e.g. shaving, missed, how long'), 'shaving', delay=60)
        await r.wait(0.3)
        await r.click(p.get_by_text('Can I use the roll-on right after shaving or waxing?'), ms=600)
    await r.beat('b20', b20)

    async def b21():
        await r.hash('/myths')
        await r.click(role('button', name='Reveal the facts').first, ms=650, after=0.6)
    await r.beat('b21', b21)

    async def b22():
        await r.hash('/reminders')
        await r.click(role('switch', name='In-app reminders'), ms=650, after=0.6)
        await r.click(p.locator('header button[aria-label^="In-app reminders"]'), ms=700, after=0.4)
    await r.beat('b22', b22)

    # ---------- Closing ----------
    async def b23():
        await p.keyboard.press('Escape')
        await r.hash('/')
        await r.wait(0.6)
        await r.reveal(p.get_by_role('heading', name='Continue your journey'), anchor=0.12, ms=1600)
        await r.wait(2.4)
        await r.reveal(p.get_by_role('heading', name='Most treatment products need weeks, not days.'), anchor=0.3, ms=1800)
        await r.wait(1.0)
    await r.beat('b23', b23, chapter='close')
    await r.wait(1.2)


async def main():
    shutil.rmtree(FR, ignore_errors=True); os.makedirs(FR)
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        ctx = await b.new_context(viewport={'width': W, 'height': H})
        await ctx.route('**/fonts.googleapis.com/**', lambda rt: rt.fulfill(status=200, content_type='text/css', body=FONT_CSS))
        async def font(rt):
            k = rt.request.url.rsplit('/', 1)[-1]
            d, f = FONTS[k][0], FONTS[k][1]
            await rt.fulfill(path=os.path.join(FONT_DIR, d, 'files', f), content_type='font/woff2', headers={'Access-Control-Allow-Origin': '*'})
        await ctx.route('**/fonts.gstatic.com/local/**', font)
        await ctx.add_init_script(CURSOR_JS)
        page = await ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        await page.goto(BASE + '#/')
        await page.evaluate('document.fonts.ready')
        await page.evaluate("document.fonts.load('400 40px Gloock')")
        await page.wait_for_timeout(600)
        r = Rec(page)
        await page.mouse.move(r.x, r.y)

        cdp = await ctx.new_cdp_session(page)
        frames = []
        def on_frame(ev):
            data = base64.b64decode(ev['data'])
            fn = os.path.join(FR, f'{len(frames):06d}.jpg')
            with open(fn, 'wb') as fh:
                fh.write(data)
            frames.append({'ts': ev['metadata']['timestamp'], 'file': os.path.basename(fn), 'wall': time.time()})
            asyncio.ensure_future(cdp.send('Page.screencastFrameAck', {'sessionId': ev['sessionId']}))
        cdp.on('Page.screencastFrame', on_frame)
        t_start = time.time()
        await cdp.send('Page.startScreencast', {'format': 'jpeg', 'quality': 93, 'maxWidth': 1920, 'maxHeight': 1080, 'everyNthFrame': 1})
        await page.wait_for_timeout(500)
        await scenes(r)
        t_end = time.time()
        await cdp.send('Page.stopScreencast')
        await page.wait_for_timeout(300)
        json.dump({'frames': frames, 't_start': t_start, 't_end': t_end}, open(os.path.join(FR, 'index.json'), 'w'))
        json.dump(r.marks, open(os.path.join(HERE, 'marks.json'), 'w'), indent=1)
        print('frames', len(frames), 'duration', round(t_end - t_start, 1), 's; errors:', errors or 'none')
        await b.close()

asyncio.run(main())
