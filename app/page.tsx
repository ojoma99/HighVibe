"use client";

import { motion } from "framer-motion";
import { Pause, Play, Waves } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DAILY_RESONANCES = [
  "Your awareness is already whole; you are remembering, not becoming.",
  "Nothing essential about you is missing; you are here to reveal, not to earn.",
  "Clarity is not outside you; it appears where you choose to place gentle attention.",
  "You are not separate from life; you are life noticing itself.",
  "Every breath is a new negotiation with reality—choose the one that feels most true."
];

const BASS_FREQUENCIES = [40, 80, 120] as const;
const BASS_WEIGHTS = [0.8, 0.55, 0.35] as const;

type FrequencyMode = "motivation" | "clearing";

function getTodayResonance() {
  const index = new Date().getDate() % DAILY_RESONANCES.length;
  return DAILY_RESONANCES[index];
}

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequencyMode, setFrequencyMode] =
    useState<FrequencyMode>("motivation");
  const [frequencyPower, setFrequencyPower] = useState(60);
  const [earthVibration, setEarthVibration] = useState(45);
  const [natureAtmosphere, setNatureAtmosphere] = useState(40);

  const frequencyHz = frequencyMode === "motivation" ? 285 : 417;
  const resonance = useMemo(() => getTodayResonance(), []);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mainOscillatorRef = useRef<OscillatorNode | null>(null);
  const mainGainRef = useRef<GainNode | null>(null);
  const bassGainRef = useRef<GainNode | null>(null);
  const bassStackRef = useRef<Array<{ osc: OscillatorNode; gain: GainNode }>>(
    []
  );
  const natureAudioRef = useRef<HTMLAudioElement | null>(null);

  const breatheGradient =
    frequencyMode === "motivation"
      ? "from-emerald-400/70 via-emerald-500/50 to-emerald-900/20"
      : "from-purple-500/80 via-purple-700/60 to-indigo-950/30";
  const breatheRing =
    frequencyMode === "motivation"
      ? "border-emerald-300/60"
      : "border-purple-300/60";
  const breatheGlow =
    frequencyMode === "motivation"
      ? "shadow-[0_0_45px_rgba(16,185,129,0.55)]"
      : "shadow-[0_0_60px_rgba(76,29,149,0.6)]";
  const breatheText =
    frequencyMode === "motivation" ? "text-emerald-50" : "text-purple-50";
  const accentDot =
    frequencyMode === "motivation"
      ? "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]"
      : "bg-purple-400 shadow-[0_0_12px_rgba(147,51,234,0.85)]";

  const ensureAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioContextRef.current) {
      const AudioContextCtor =
        window.AudioContext ||
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;
      if (!AudioContextCtor) return null;
      audioContextRef.current = new AudioContextCtor();
    }
    return audioContextRef.current;
  }, []);

  const stopOscillators = useCallback(() => {
    mainOscillatorRef.current?.stop();
    mainOscillatorRef.current?.disconnect();
    mainGainRef.current?.disconnect();
    mainOscillatorRef.current = null;
    mainGainRef.current = null;

    bassStackRef.current.forEach(({ osc, gain }) => {
      osc.stop();
      osc.disconnect();
      gain.disconnect();
    });
    bassStackRef.current = [];
    bassGainRef.current?.disconnect();
    bassGainRef.current = null;
  }, []);

  const startSoundfield = useCallback(async () => {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const now = ctx.currentTime;

    if (!mainOscillatorRef.current || !mainGainRef.current) {
      const mainOscillator = ctx.createOscillator();
      mainOscillator.type = "sine";
      mainOscillator.frequency.setValueAtTime(frequencyHz, now);

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0, now);

      mainOscillator.connect(mainGain).connect(ctx.destination);
      mainOscillator.start();

      mainOscillatorRef.current = mainOscillator;
      mainGainRef.current = mainGain;

      mainGain.gain.linearRampToValueAtTime(
        frequencyPower / 100,
        now + 0.2
      );
    }

    if (!bassGainRef.current) {
      const bassGain = ctx.createGain();
      bassGain.gain.setValueAtTime(0, now);
      bassGain.connect(ctx.destination);
      bassGainRef.current = bassGain;

      bassStackRef.current = BASS_FREQUENCIES.map((frequency, index) => {
        const oscillator = ctx.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(BASS_WEIGHTS[index] ?? 0.3, now);

        oscillator.connect(gain).connect(bassGain);
        oscillator.start();

        return { osc: oscillator, gain };
      });

      bassGain.gain.linearRampToValueAtTime(
        earthVibration / 100,
        now + 0.2
      );
    }

    if (natureAudioRef.current) {
      natureAudioRef.current.volume = natureAtmosphere / 100;
      try {
        await natureAudioRef.current.play();
      } catch {
        // Ignore autoplay errors; user can retry with Play.
      }
    }

    setIsPlaying(true);
  }, [
    earthVibration,
    ensureAudioContext,
    frequencyHz,
    frequencyPower,
    natureAtmosphere
  ]);

  const stopSoundfield = useCallback(async () => {
    stopOscillators();
    if (natureAudioRef.current) {
      natureAudioRef.current.pause();
      natureAudioRef.current.currentTime = 0;
    }
    if (audioContextRef.current?.state === "running") {
      try {
        await audioContextRef.current.suspend();
      } catch {
        // Best effort only.
      }
    }
    setIsPlaying(false);
  }, [stopOscillators]);

  const handlePlayToggle = useCallback(async () => {
    if (isPlaying) {
      await stopSoundfield();
    } else {
      await startSoundfield();
    }
  }, [isPlaying, startSoundfield, stopSoundfield]);

  useEffect(() => {
    const ctx = audioContextRef.current;
    if (!ctx || !mainOscillatorRef.current) return;
    const now = ctx.currentTime;
    mainOscillatorRef.current.frequency.cancelScheduledValues(now);
    mainOscillatorRef.current.frequency.setTargetAtTime(frequencyHz, now, 0.2);
  }, [frequencyHz]);

  useEffect(() => {
    const ctx = audioContextRef.current;
    if (!ctx || !mainGainRef.current) return;
    const now = ctx.currentTime;
    mainGainRef.current.gain.cancelScheduledValues(now);
    mainGainRef.current.gain.setTargetAtTime(
      frequencyPower / 100,
      now,
      0.2
    );
  }, [frequencyPower]);

  useEffect(() => {
    const ctx = audioContextRef.current;
    if (!ctx || !bassGainRef.current) return;
    const now = ctx.currentTime;
    bassGainRef.current.gain.cancelScheduledValues(now);
    bassGainRef.current.gain.setTargetAtTime(
      earthVibration / 100,
      now,
      0.2
    );
  }, [earthVibration]);

  useEffect(() => {
    if (!natureAudioRef.current) return;
    natureAudioRef.current.volume = natureAtmosphere / 100;
  }, [natureAtmosphere]);

  useEffect(() => {
    return () => {
      stopOscillators();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [stopOscillators]);

  const backgroundAnimation = isPlaying
    ? { opacity: [0.25, 0.75], scale: [1, 1.05] }
    : { opacity: 0.2, scale: 1 };
  const backgroundTransition = isPlaying
    ? {
        duration: 6,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut"
      }
    : { duration: 0.6, ease: "easeOut" };
  const breatheAnimation = isPlaying
    ? { opacity: [0.65, 1, 0.65], scale: [1, 1.08, 1] }
    : { opacity: 0.75, scale: 1 };
  const breatheTransition = isPlaying
    ? { duration: 4, repeat: Infinity, ease: "easeInOut" }
    : { duration: 0.4, ease: "easeOut" };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <motion.div
        className="pointer-events-none absolute -inset-40 -z-10 rounded-full bg-gradient-to-br from-accent via-accent-soft to-transparent blur-3xl"
        animate={backgroundAnimation}
        transition={backgroundTransition}
      />

      <audio
        ref={natureAudioRef}
        src="/nature-hum.mp3"
        loop
        preload="auto"
        playsInline
        className="hidden"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-3xl border border-white/5 bg-black/50 p-6 shadow-[0_0_80px_rgba(15,23,42,0.9)] backdrop-blur-2xl sm:p-10">
        <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
              <Waves className="h-3 w-3 text-accent-soft" />
              HighVibe Field
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
              Dual-Frequency Breath Field
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Switch between 285 Hz (Motivation) and 417 Hz (Clearing), layer
              harmonic bass, and blend a nature hum atmosphere.
            </p>
          </div>
          <button
            onClick={handlePlayToggle}
            className={`highvibe-glow relative flex h-16 w-16 items-center justify-center rounded-full border border-accent/70 bg-gradient-to-br from-accent to-accent-soft text-slate-50 shadow-aura transition hover:scale-105 hover:shadow-aura/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-20 sm:w-20 ${
              !isPlaying ? "opacity-100" : "opacity-95"
            }`}
          >
            <span className="absolute inset-0 -z-10 rounded-full bg-accent/40 blur-xl" />
            {isPlaying ? (
              <Pause className="h-7 w-7" />
            ) : (
              <Play className="ml-1 h-7 w-7" />
            )}
          </button>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
                <div>
                  <div className="font-semibold tracking-[0.16em] uppercase text-slate-200">
                    Dual-Frequency Mode
                  </div>
                  <p className="mt-0.5 text-[0.7rem] text-slate-400">
                    Choose the tone that anchors your session.
                  </p>
                </div>
                <div className="text-right text-[0.7rem] text-slate-300">
                  <span className="font-semibold">{frequencyHz}</span> Hz
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFrequencyMode("motivation")}
                  className={`rounded-xl border px-3 py-2 text-left text-[0.7rem] uppercase tracking-[0.18em] transition ${
                    frequencyMode === "motivation"
                      ? "border-emerald-400/70 bg-emerald-500/10 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                      : "border-white/10 bg-black/30 text-slate-400 hover:border-emerald-400/40 hover:text-slate-200"
                  }`}
                  aria-pressed={frequencyMode === "motivation"}
                >
                  285 Hz
                  <span className="mt-1 block text-[0.62rem] tracking-[0.22em] text-emerald-200/70">
                    Motivation
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFrequencyMode("clearing")}
                  className={`rounded-xl border px-3 py-2 text-left text-[0.7rem] uppercase tracking-[0.18em] transition ${
                    frequencyMode === "clearing"
                      ? "border-purple-400/70 bg-purple-600/10 text-purple-100 shadow-[0_0_20px_rgba(147,51,234,0.35)]"
                      : "border-white/10 bg-black/30 text-slate-400 hover:border-purple-400/40 hover:text-slate-200"
                  }`}
                  aria-pressed={frequencyMode === "clearing"}
                >
                  417 Hz
                  <span className="mt-1 block text-[0.62rem] tracking-[0.22em] text-purple-200/70">
                    Clearing
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-6">
              <motion.div
                className={`relative flex h-56 w-56 items-center justify-center rounded-full bg-gradient-to-br ${breatheGradient} ${breatheGlow}`}
                animate={breatheAnimation}
                transition={breatheTransition}
              >
                <div
                  className={`absolute inset-4 rounded-full border ${breatheRing} bg-black/40`}
                />
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <span className="text-[0.7rem] uppercase tracking-[0.32em] text-slate-200">
                    Breathe
                  </span>
                  <span className={`text-3xl font-semibold ${breatheText}`}>
                    {frequencyHz}Hz
                  </span>
                  <span className="text-[0.65rem] uppercase tracking-[0.24em] text-slate-300">
                    {frequencyMode === "motivation" ? "Motivation" : "Clearing"}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
                <div>
                  <div className="font-semibold tracking-[0.16em] uppercase text-slate-200">
                    Frequency Power
                  </div>
                  <p className="mt-0.5 text-[0.7rem] text-slate-400">
                    Controls the 285/417 Hz carrier intensity.
                  </p>
                </div>
                <div className="text-right text-[0.7rem] text-slate-300">
                  {frequencyPower}%
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={frequencyPower}
                onChange={(e) => setFrequencyPower(Number(e.target.value))}
                className="w-full accent-accent-soft"
              />
              <div className="flex justify-between text-[0.65rem] text-slate-500">
                <span>Soft</span>
                <span>Balanced</span>
                <span>Focused</span>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
                <div>
                  <div className="font-semibold tracking-[0.16em] uppercase text-slate-200">
                    Earth Vibration
                  </div>
                  <p className="mt-0.5 text-[0.7rem] text-slate-400">
                    Harmonic Saturation at 40 / 80 / 120 Hz for earphones.
                  </p>
                </div>
                <div className="text-right text-[0.7rem] text-slate-300">
                  {earthVibration}%
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={earthVibration}
                onChange={(e) => setEarthVibration(Number(e.target.value))}
                className="w-full accent-accent-soft"
              />
              <div className="flex justify-between text-[0.65rem] text-slate-500">
                <span>Subtle</span>
                <span>Grounded</span>
                <span>Deep</span>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
                <div>
                  <div className="font-semibold tracking-[0.16em] uppercase text-slate-200">
                    Nature Atmosphere
                  </div>
                  <p className="mt-0.5 text-[0.7rem] text-slate-400">
                    Controls the background nature hum loop.
                  </p>
                </div>
                <div className="text-right text-[0.7rem] text-slate-300">
                  {natureAtmosphere}%
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={natureAtmosphere}
                onChange={(e) => setNatureAtmosphere(Number(e.target.value))}
                className="w-full accent-accent-soft"
              />
              <div className="flex justify-between text-[0.65rem] text-slate-500">
                <span>Whisper</span>
                <span>Ambient</span>
                <span>Immersive</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-2 rounded-2xl border border-white/5 bg-gradient-to-r from-white/5 via-white/0 to-white/5 p-[1px]">
          <div className="flex flex-col gap-4 rounded-2xl bg-black/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="max-w-xl space-y-1.5">
              <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Daily Resonance
              </h2>
              <p className="text-sm text-slate-200">{resonance}</p>
            </div>
            <div className="flex flex-col items-end gap-1 text-right text-[0.7rem] text-slate-400">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${accentDot}`} />
                <span>{isPlaying ? "Field active" : "Field idle"}</span>
              </div>
              <span>
                {frequencyHz} Hz · Power {frequencyPower}% · Earth{" "}
                {earthVibration}% · Nature {natureAtmosphere}%
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

