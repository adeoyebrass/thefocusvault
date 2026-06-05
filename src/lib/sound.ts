// Loud notification sounds synthesized via WebAudio — no asset needed.
// Safe to call from event handlers (must be a user gesture for first play).

type Ctx = AudioContext & { webkitAudioContext?: typeof AudioContext };
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

function blip(freq: number, start: number, duration: number, gain = 0.6, type: OscillatorType = "square") {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === "suspended") ac.resume().catch(() => {});
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** Bright two-tone chime for a successful ping. */
export function playPingSound() {
  blip(880, 0, 0.12, 0.7, "triangle");
  blip(1318, 0.1, 0.18, 0.7, "triangle");
  blip(1760, 0.22, 0.22, 0.5, "triangle");
}

/** Heavy alarm-style hit for entering lock. */
export function playLockSound() {
  blip(196, 0, 0.18, 0.8, "square");
  blip(147, 0.18, 0.22, 0.8, "square");
  blip(98, 0.4, 0.45, 0.9, "sawtooth");
}
