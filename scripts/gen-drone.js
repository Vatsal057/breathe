// Generates a seamless-looping Om-like drone as a 16-bit PCM WAV.
// Replaces the old per-phase chime tones: the session now follows ONE
// continuous guiding hum whose pitch rises and falls with the breath.
//
// Recipe: 136.1 Hz fundamental (a frequency commonly used in meditation music) +
// soft harmonics + a very slow 0.1 Hz amplitude LFO for a living feel.
// Duration is exactly 10 s = 1361 fundamental cycles = 1 LFO cycle,
// so the loop is seamless with no fades needed.
// No external assets: pure synthesis.
const fs = require('fs');
const path = require('path');

const outDir = process.argv[2] || 'assets';
const sampleRate = 44100;
const FUNDAMENTAL = 136.1;
const DURATION_SEC = 10; // 1361 cycles of 136.1 Hz, 1 cycle of the 0.1 Hz LFO

// Harmonic recipe: [frequency ratio, amplitude].
const partials = [
  { ratio: 1, amp: 0.5 },
  { ratio: 2, amp: 0.26 },
  { ratio: 3, amp: 0.13 },
  { ratio: 4, amp: 0.06 },
];

const numSamples = Math.floor(sampleRate * DURATION_SEC);
const data = Buffer.alloc(numSamples * 2);
let peak = 0;
const raw = new Float64Array(numSamples);

for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  let s = 0;
  for (const p of partials) {
    s += p.amp * Math.sin(2 * Math.PI * FUNDAMENTAL * p.ratio * t);
  }
  // Slow living swell: exactly one 0.1 Hz cycle over the 10 s loop,
  // starting and ending at full amplitude so the loop is seamless.
  const lfo = 1 - 0.18 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 0.1 * t));
  s *= lfo;
  raw[i] = s;
  const a = Math.abs(s);
  if (a > peak) peak = a;
}

// Normalize to 0.85 peak headroom to avoid clipping.
const gain = 0.85 / peak;
for (let i = 0; i < numSamples; i++) {
  const v = Math.max(-1, Math.min(1, raw[i] * gain));
  data.writeInt16LE(Math.round(v * 32767), i * 2);
}

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16); // PCM chunk size
header.writeUInt16LE(1, 20); // PCM format
header.writeUInt16LE(1, 22); // mono
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * 2, 28); // byte rate
header.writeUInt16LE(2, 32); // block align
header.writeUInt16LE(16, 34); // bits per sample
header.write('data', 36);
header.writeUInt32LE(data.length, 40);

const outPath = path.join(outDir, 'drone-om.wav');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, Buffer.concat([header, data]));
console.log(
  `Wrote ${outPath} (${(data.length / 1024).toFixed(1)} KB, ${DURATION_SEC}s @ ${sampleRate}Hz, ` +
    `${FUNDAMENTAL}Hz fundamental, seamless loop)`,
);
