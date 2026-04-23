"use client";

/**
 * Lightweight UI sound engine using Web Audio API.
 * No external assets needed; safe-guarded for unsupported browsers.
 */

type WaveType = OscillatorType;

let ctx: AudioContext | null = null;
let enabled = true;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const W = window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctor = W.AudioContext ?? W.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

function tone(
  frequency: number,
  durationMs: number,
  {
    at = 0,
    type = "sine",
    gain = 0.03,
  }: { at?: number; type?: WaveType; gain?: number } = {},
): void {
  const audio = getCtx();
  if (!audio || !enabled) return;

  const t0 = audio.currentTime + at;
  const t1 = t0 + durationMs / 1000;

  const osc = audio.createOscillator();
  const amp = audio.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, t0);

  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, t1);

  osc.connect(amp);
  amp.connect(audio.destination);

  osc.start(t0);
  osc.stop(t1 + 0.01);
}

export function primeSound(): void {
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === "suspended") {
    void audio.resume();
  }
}

export function setSoundEnabled(value: boolean): void {
  enabled = value;
}

export function playMicOn(): void {
  primeSound();
  tone(660, 55, { type: "triangle", gain: 0.025 });
  tone(880, 85, { at: 0.05, type: "triangle", gain: 0.03 });
}

export function playMicOff(): void {
  primeSound();
  tone(820, 55, { type: "triangle", gain: 0.025 });
  tone(560, 90, { at: 0.04, type: "triangle", gain: 0.03 });
}

export function playSend(): void {
  primeSound();
  tone(740, 40, { type: "sine", gain: 0.02 });
}

export function playMessageIn(): void {
  primeSound();
  tone(620, 45, { type: "sine", gain: 0.02 });
  tone(930, 80, { at: 0.045, type: "sine", gain: 0.024 });
}

export function playSuccess(): void {
  primeSound();
  tone(520, 70, { type: "triangle", gain: 0.026 });
  tone(660, 80, { at: 0.07, type: "triangle", gain: 0.028 });
  tone(840, 110, { at: 0.14, type: "triangle", gain: 0.03 });
}

export function playError(): void {
  primeSound();
  tone(440, 90, { type: "sawtooth", gain: 0.02 });
  tone(320, 130, { at: 0.08, type: "sawtooth", gain: 0.02 });
}
