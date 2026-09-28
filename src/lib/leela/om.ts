type HeardListener = () => void;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let wanted = false;
let heard = false;
const listeners = new Set<HeardListener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function omHeard() {
  return heard;
}

export function subscribeOm(listener: HeardListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function audioContext() {
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

function markHeard() {
  const running = ctx?.state === "running";
  if (heard === running) return;
  heard = running;
  emit();
}

function ensureGraph(audio: AudioContext) {
  if (master) return;
  master = audio.createGain();
  master.gain.value = 0;

  const mix = audio.createGain();
  mix.gain.value = 1;

  const tone = (freq: number, level: number, detune = 0) => {
    const osc = audio.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.detune.value = detune;
    const gain = audio.createGain();
    gain.gain.value = level;
    osc.connect(gain);
    gain.connect(mix);
    osc.start();
  };

  tone(174.6, 0.16);
  tone(349.2, 0.045, 5);
  tone(261.6, 0.03, -4);

  const body = audio.createBiquadFilter();
  body.type = "lowpass";
  body.frequency.value = 900;
  body.Q.value = 0.4;

  const air = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
  const data = air.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
  const noise = audio.createBufferSource();
  noise.buffer = air;
  noise.loop = true;
  const airFilter = audio.createBiquadFilter();
  airFilter.type = "bandpass";
  airFilter.frequency.value = 680;
  airFilter.Q.value = 0.45;
  const airGain = audio.createGain();
  airGain.gain.value = 0.02;
  const breath = audio.createOscillator();
  breath.frequency.value = 1 / 10;
  const breathDepth = audio.createGain();
  breathDepth.gain.value = 0.016;
  breath.connect(breathDepth);
  breathDepth.connect(airGain.gain);
  breath.start();
  noise.connect(airFilter);
  airFilter.connect(airGain);
  airGain.connect(mix);
  noise.start();

  mix.connect(body);
  body.connect(master);
  master.connect(audio.destination);
}

function apply() {
  if (!ctx || !master) return;
  const now = ctx.currentTime;
  const target = wanted && ctx.state === "running" ? 0.016 : 0;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(Math.max(0, master.gain.value), now);
  master.gain.linearRampToValueAtTime(target, now + (target > 0 ? 3.2 : 1.4));
  markHeard();
}

export function primeOm() {
  const audio = audioContext();
  if (!audio) return;
  ensureGraph(audio);
  wanted = true;
  void audio.resume().then(() => {
    apply();
    markHeard();
  });
  apply();
}

export function setOmActive(on: boolean) {
  wanted = on;
  if (!ctx || !master) return;
  if (on && ctx.state !== "running") return;
  apply();
}
