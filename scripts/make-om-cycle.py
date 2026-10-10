#!/usr/bin/env python3
"""Build the app's breath-cycle Om asset from the full chant recording.

Usage:
    python3 scripts/make-om-cycle.py assets/om-chant-full.wav assets/om-cycle.wav

Takes the full "OM AUM MANTRA MALE CHANT Bb" recording by CarlosCarty
(CC-BY 4.0 — https://freesound.org/people/CarlosCarty/sounds/522687/,
credit required, see the attribution note in the app's Progress settings)
and extracts one breath cycle: [soft inhale][Om chant on exhale].

The chant onset is auto-detected from the amplitude envelope. If it picks
the wrong spot, pass --chant-start explicitly (seconds):

    python3 scripts/make-om-cycle.py assets/om-chant-full.wav assets/om-cycle.wav --chant-start 2.1

Other tuning: --inhale-sec (default 2.4), --om-sec (default 3.6).
"""
import argparse
import math
import struct
import wave


def read_wav(path):
    with wave.open(path, 'rb') as w:
        n_channels = w.getnchannels()
        sampwidth = w.getsampwidth()
        framerate = w.getframerate()
        n_frames = w.getnframes()
        raw = w.readframes(n_frames)
    # Decode to mono float64.
    fmt = {1: 'b', 2: '<h', 3: '<i', 4: '<i'}[sampwidth]
    scale = {1: 128.0, 2: 32768.0, 3: 8388608.0, 4: 2147483648.0}[sampwidth]
    # 24-bit needs manual sign extension.
    if sampwidth == 3:
        samples = []
        for i in range(0, len(raw), 3):
            v = raw[i] | (raw[i + 1] << 8) | (raw[i + 2] << 16)
            if v & 0x800000:
                v -= 0x1000000
            samples.append(v / scale)
    else:
        count = len(raw) // sampwidth
        samples = [v / scale for v in struct.unpack('<' + fmt * count, raw)]
    if n_channels > 1:
        samples = [
            sum(samples[i * n_channels:(i + 1) * n_channels]) / n_channels
            for i in range(n_frames)
        ]
    return samples, framerate


def rms_envelope(samples, framerate, window_sec=0.05):
    w = max(1, int(framerate * window_sec))
    env = []
    for i in range(0, len(samples), w):
        chunk = samples[i:i + w]
        env.append(math.sqrt(sum(s * s for s in chunk) / max(1, len(chunk))))
    return env, w


def find_chant_onset(env, window_sec):
    peak = max(env)
    thresh = peak * 0.18
    need = int(0.6 / window_sec)  # sustained ~0.6 s
    run = 0
    for i, v in enumerate(env):
        if v >= thresh:
            run += 1
            if run >= need:
                return (i - need + 1) * window_sec
        else:
            run = 0
    return 1.0  # fallback: assume the chant starts ~1 s in


def synth_inhale(n, framerate):
    """Soft breath-in: lowpassed noise swelling up, for when the recording's
    own inhale is too quiet to use."""
    import random
    random.seed(7)
    out = []
    lp = 0.0
    alpha = 0.06
    for i in range(n):
        t = i / n
        lp += alpha * ((random.random() * 2 - 1) - lp)
        swell = math.sin(t * math.pi / 2) ** 1.5  # gentle rise
        out.append(lp * 2.2 * swell * 0.5)
    # Fade edges to avoid clicks.
    f = int(framerate * 0.15)
    for i in range(min(f, n)):
        out[i] *= i / f
        out[n - 1 - i] *= i / f
    return out


def raised_cosine_fade(samples, framerate, fade_sec=0.15):
    f = int(framerate * fade_sec)
    n = len(samples)
    for i in range(min(f, n)):
        g = 0.5 - 0.5 * math.cos(math.pi * i / f)
        samples[i] *= g
        samples[n - 1 - i] *= g
    return samples


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--chant-start', type=float, default=None,
                    help='chant onset in seconds (auto-detected if omitted)')
    ap.add_argument('--inhale-sec', type=float, default=2.4)
    ap.add_argument('--om-sec', type=float, default=3.6)
    args = ap.parse_args()

    samples, sr = read_wav(args.src)
    total_sec = len(samples) / sr
    print(f'source: {total_sec:.1f}s @ {sr} Hz')

    env, wlen = rms_envelope(samples, sr)
    onset = args.chant_start if args.chant_start is not None \
        else find_chant_onset(env, 0.05)
    print(f'chant onset: {onset:.2f}s')

    inhale_n = int(args.inhale_sec * sr)
    om_n = int(args.om_sec * sr)
    onset_i = int(onset * sr)

    inhale_start = max(0, onset_i - inhale_n)
    inhale = samples[inhale_start:onset_i]
    # Pad short inhale with silence at the front.
    if len(inhale) < inhale_n:
        inhale = [0.0] * (inhale_n - len(inhale)) + inhale

    # If the recording's own inhale is near-silent, synthesize a soft one.
    inhale_rms = math.sqrt(sum(s * s for s in inhale) / max(1, len(inhale)))
    chant_peak = max(abs(s) for s in samples[onset_i:onset_i + om_n]) or 1.0
    if inhale_rms < 0.03 * chant_peak:
        print('inhale too quiet in the recording; synthesizing a soft breath-in')
        inhale = synth_inhale(inhale_n, sr)

    om = samples[onset_i:onset_i + om_n]
    if len(om) < om_n:
        om = om + [0.0] * (om_n - len(om))

    out = raised_cosine_fade(inhale + om, sr)

    # Normalize to 0.85 peak.
    peak = max(abs(s) for s in out) or 1.0
    gain = 0.85 / peak
    pcm = [max(-1.0, min(1.0, s * gain)) for s in out]
    data = struct.pack('<' + 'h' * len(pcm),
                       *[int(round(s * 32767)) for s in pcm])

    with wave.open(args.dst, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(data)
    print(f'wrote {args.dst} ({len(out) / sr:.1f}s: '
          f'{args.inhale_sec:.1f}s inhale + {args.om_sec:.1f}s Om)')


if __name__ == '__main__':
    main()
