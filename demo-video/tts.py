import json, soundfile as sf
from kokoro_onnx import Kokoro
k=Kokoro('tts/kokoro-v1.0.int8.onnx','tts/voices-v1.0.bin')
beats=json.load(open('narration.json')); out={}
for b in beats:
    a,sr=k.create(b['text'],voice='af_heart',speed=1.07,lang='en-us')
    sf.write(f"narration/{b['id']}.wav",a,sr); out[b['id']]=round(len(a)/sr,3); print(b['id'],out[b['id']],flush=True)
json.dump(out,open('narration/durations.json','w'),indent=1)
print('TOTAL',round(sum(out.values()),1))
