"""Edits the recorded frames into the final demo videos.
- out/rec_clean.mp4: the raw screen recording (no audio, no overlays)
- out/Bodywise_Results_Companion_Demo.mp4: title card + recording + end card, narration, captions, chapter labels
- out/Bodywise_Results_Companion_Demo.srt: captions as a separate subtitle file"""
import json, os, subprocess
import numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
J = lambda *p: os.path.join(HERE, *p)
OUT = J('out'); os.makedirs(OUT, exist_ok=True)
FPS = 30

idx = json.load(open(J('frames', 'index.json')))
frames = idx['frames']
marks = json.load(open(J('marks.json')))
DUR = json.load(open(J('narration', 'durations.json')))
CAPS = json.load(open(J('cards', 'captions.json')))
beats = json.load(open(J('narration.json')))

off = sorted(f['wall'] - f['ts'] for f in frames)[len(frames) // 2]
ts0 = frames[0]['ts']
vt = lambda wall: wall - off - ts0
REC = vt(idx['t_end'])

# ---------- 1. frames -> clean recording ----------
lst = J('frames', 'list.txt')
# snap to an exact 30 fps grid: each output frame shows the latest captured frame at that moment (no drift)
n_out = int(REC * FPS)
j = 0
with open(lst, 'w') as fh:
    for k in range(n_out):
        t = k / FPS
        while j + 1 < len(frames) and frames[j + 1]['ts'] - ts0 <= t:
            j += 1
        fh.write(f"file '{frames[j]['file']}'\nduration {1 / FPS:.6f}\n")
    fh.write(f"file '{frames[j]['file']}'\n")
rec = J('out', 'rec_clean.mp4')
if not os.path.exists(rec) or os.environ.get('REENCODE'):
  subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst,
                '-vf', f'fps={FPS},format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
                '-movflags', '+faststart', rec], check=True)
REC = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', rec], capture_output=True, text=True).stdout)
print(f'clean recording: {REC:.1f}s')

# ---------- 2. timeline ----------
B01_AT = 0.7
TI = B01_AT + DUR['b01'] + 0.8     # title card length
X1, X2, TE = 0.6, 0.7, 4.6         # crossfades and end card length
R0 = TI - X1                       # where the recording starts in the final timeline
TOTAL = TI + REC + TE - X1 - X2
start = {'b01': B01_AT}
for m in marks:
    start[m['id']] = R0 + vt(m['t'])
order = [b['id'] for b in beats]

# ---------- 3. narration track ----------
sr = sf.info(J('narration', 'b01.wav')).samplerate
track = np.zeros(int((TOTAL + 1) * sr), dtype=np.float32)
for bid in order:
    a, _ = sf.read(J('narration', f'{bid}.wav'), dtype='float32')
    i = int(start[bid] * sr)
    track[i:i + len(a)] += a[: len(track) - i]
peak = float(np.abs(track).max()) or 1.0
sf.write(J('out', 'narration_full.wav'), track * (0.89 / peak), sr)

# ---------- 4. captions + chapter labels ----------
overlays = []   # (png, x, y, t_in, t_out)
srt = []
for k, bid in enumerate(order):
    s, d = start[bid], DUR[bid]
    nxt = start[order[k + 1]] if k + 1 < len(order) else TOTAL
    pieces = CAPS[bid]
    weights = [len(p['text']) + 8 for p in pieces]
    t = s
    for j, (p, w) in enumerate(zip(pieces, weights)):
        seg = d * w / sum(weights)
        t_out = t + seg + (min(0.6, max(0.0, nxt - (s + d) - 0.1)) if j == len(pieces) - 1 else 0)
        overlays.append((p['file'], None, None, t, t_out))
        srt.append((t, t_out, p['text']))
        t += seg

chap_order = ['fit', 'decode', 'journey', 'coach', 'support']
chap_start = {}
for m in marks:
    if m.get('chapter'):
        chap_start[m['chapter']] = R0 + vt(m['t'])
for k in chap_order:
    later = sorted(v for c, v in chap_start.items() if v > chap_start[k])
    overlays.append((f'chap_{k}.png', 'chap', None, chap_start[k] + 0.15, (later[0] if later else TOTAL) - 0.2))

from PIL import Image
inputs = ['-loop', '1', '-framerate', str(FPS), '-t', f'{TI:.3f}', '-i', J('cards', 'title.png'),
          '-i', rec,
          '-loop', '1', '-framerate', str(FPS), '-t', f'{TE:.3f}', '-i', J('cards', 'end.png'),
          '-i', J('out', 'narration_full.wav')]
fg = [f'[0:v]fps={FPS},format=yuv420p,setsar=1[t]', f'[1:v]fps={FPS},format=yuv420p,setsar=1[r]', f'[2:v]fps={FPS},format=yuv420p,setsar=1[e]',
      f'[t][r]xfade=transition=fade:duration={X1}:offset={TI - X1:.3f}[tr]',
      f'[tr][e]xfade=transition=fade:duration={X2}:offset={TI - X1 + REC - X2:.3f},format=yuv420p[v0]']
cur = 'v0'
for n, (png, kind, _, a, b) in enumerate(overlays):
    w, h = Image.open(J('cards', png)).size
    if kind == 'chap':
        x, y = 44, 1080 - 44 - h
    else:
        x, y = max((1920 - w) // 2, 430), 1080 - 52 - h
    ii = 4 + n
    span = b - a
    inputs += ['-loop', '1', '-framerate', str(FPS), '-t', f'{span:.3f}', '-i', J('cards', png)]
    fd = 0.22
    fg.append(f'[{ii}:v]format=rgba,fade=t=in:st=0:d={fd}:alpha=1,fade=t=out:st={span - fd:.3f}:d={fd}:alpha=1,setpts=PTS+{a:.3f}/TB[o{n}]')
    fg.append(f"[{cur}][o{n}]overlay=x={x}:y={y}:eof_action=pass:repeatlast=0[v{n + 1}]")
    cur = f'v{n + 1}'
fg.append(f'[3:a]loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,apad[aout]')
script = J('out', 'filter.txt')
open(script, 'w').write(';\n'.join(fg))
final = J('out', 'Bodywise_Results_Companion_Demo.mp4')
cmd = ['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex_script', script,
       '-map', f'[{cur}]', '-map', '[aout]', '-t', f'{TOTAL:.3f}', '-r', str(FPS),
       '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
       '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final]
subprocess.run(cmd, check=True)

def ts(x):
    ms = int(round(x * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02}:{m:02}:{s:02},{ms:03}'
with open(J('out', 'Bodywise_Results_Companion_Demo.srt'), 'w') as fh:
    for i, (a, b, t) in enumerate(srt, 1):
        fh.write(f'{i}\n{ts(a)} --> {ts(b)}\n{t}\n\n')
json.dump({'TI': TI, 'R0': R0, 'REC': REC, 'TOTAL': TOTAL, 'start': start, 'chapters': chap_start}, open(J('out', 'timeline.json'), 'w'), indent=1)
print(f'final: {TOTAL:.1f}s ({int(TOTAL // 60)}:{TOTAL % 60:04.1f})')
