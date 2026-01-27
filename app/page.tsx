"use client";

import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Info, Play, Pause, Waves } from "lucide-react";
import { useHighVibe } from "@/hooks/useHighVibe";

const DAILY_RES_ONANCES = [
  "Your awareness is already whole; you are remembering, not becoming.",
  "Nothing essential about you is missing; you are here to reveal, not to earn.",
  "Clarity is not outside you; it appears where you choose to place gentle attention.",
  "You are not separate from life; you are life noticing itself.",
  "Every breath is a new negotiation with reality—choose the one that feels most true."
];

function getTodayResonance() {
  const index = new Date().getDate() % DAILY_RES_ONANCES.length;
  return DAILY_RES_ONANCES[index];
}

export default function Home() {
  const {
    isPlaying,
    baseFrequency,
    setBaseFrequency,
    volume,
    setVolume,
    presetId,
    presets,
    setPresetId,
    beatFrequency,
    togglePlay,
    setBreathIntensity,
    softLanding
  } = useHighVibe();

  const bgControls = useAnimation();
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [breathElapsedMs, setBreathElapsedMs] = useState(0);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "exhale">("inhale");

  const [timerMinutes, setTimerMinutes] = useState(10);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerEndTs, setTimerEndTs] = useState<number | null>(null);
  const [timerRemainingMs, setTimerRemainingMs] = useState<number | null>(null);
  const [hasTimerCompleted, setHasTimerCompleted] = useState(false);
  const [showMinutesOverlay, setShowMinutesOverlay] = useState(false);
  const [showCompletionBloom, setShowCompletionBloom] = useState(false);
  const [truthPresetId, setTruthPresetId] = useState<string | null>(null);

  const breathActive = isPlaying && breathElapsedMs < 60000;
  const isDeepFlow = isPlaying && !breathActive;

  const timerTotalMs = useMemo(
    () => (timerMinutes > 0 ? timerMinutes * 60 * 1000 : null),
    [timerMinutes]
  );

  const presetGlowClasses = useMemo(() => {
    switch (presetId) {
      case "focus":
        return "from-amber-400/70 via-amber-500/50 to-amber-900/20";
      case "relax":
        return "from-emerald-300/70 via-teal-400/50 to-sky-900/20";
      case "meditate":
        return "from-violet-300/70 via-purple-500/50 to-indigo-900/20";
      case "deepSleep":
        return "from-sky-400/70 via-blue-500/50 to-slate-900/20";
      case "insight":
        return "from-fuchsia-400/70 via-rose-500/50 to-slate-900/20";
      default:
        return "from-accent via-accent-soft to-slate-900/20";
    }
  }, [presetId]);

  const presetStrokeColor = useMemo(() => {
    switch (presetId) {
      case "focus":
        return "#fbbf24"; // amber-400
      case "relax":
        return "#34d399"; // emerald-400
      case "meditate":
        return "#a855f7"; // purple-500
      case "deepSleep":
        return "#38bdf8"; // sky-400
      case "insight":
        return "#f472b6"; // pink-400
      default:
        return "#a855f7";
    }
  }, [presetId]);

  const timerProgress = useMemo(() => {
    if (!isTimerRunning || !timerTotalMs || timerRemainingMs == null) return 1;
    return Math.max(0, Math.min(1, timerRemainingMs / timerTotalMs));
  }, [isTimerRunning, timerRemainingMs, timerTotalMs]);

  useEffect(() => {
    const visualRate = beatFrequency ? Math.max(0.6, 8 / beatFrequency) : 4;

    if (isPlaying) {
      bgControls.start({
        opacity: [0.3, 0.8],
        scale: [1, 1.04],
        transition: {
          duration: visualRate,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut"
        }
      });
    } else {
      bgControls.start({
        opacity: 0.25,
        scale: 1,
        transition: { duration: 0.6, ease: "easeOut" }
      });
    }
  }, [isPlaying, beatFrequency, bgControls]);

  // Track session start for 60s breath window
  useEffect(() => {
    if (isPlaying) {
      setSessionStart(Date.now());
      setBreathElapsedMs(0);
      setBreathPhase("inhale");
    } else {
      setSessionStart(null);
      setBreathElapsedMs(0);
      void setBreathIntensity(0.15);
    }
  }, [isPlaying, setBreathIntensity]);

  // Increment elapsed time while playing
  useEffect(() => {
    if (!isPlaying || sessionStart == null) return;

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - sessionStart;
      setBreathElapsedMs(elapsed);
      if (elapsed >= 60000) {
        window.clearInterval(interval);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [isPlaying, sessionStart]);

  // Inhale / exhale phase toggling every 5 seconds during breathActive
  useEffect(() => {
    if (!breathActive) return;

    const applyPhase = (phase: "inhale" | "exhale") => {
      void setBreathIntensity(phase === "inhale" ? 0.55 : 0.2);
    };

    applyPhase(breathPhase);

    const interval = window.setInterval(() => {
      setBreathPhase((prev) => {
        const next = prev === "inhale" ? "exhale" : "inhale";
        applyPhase(next);
        return next;
      });
    }, 5000);

    return () => window.clearInterval(interval);
  }, [breathActive, breathPhase, setBreathIntensity]);

  // After breath window, settle pink noise at a soft, steady level
  useEffect(() => {
    if (!isDeepFlow || !isPlaying) return;
    void setBreathIntensity(0.18);
  }, [isDeepFlow, isPlaying, setBreathIntensity]);

  // Ghost Timer countdown
  useEffect(() => {
    if (!isTimerRunning || timerEndTs == null) return;

    const interval = window.setInterval(() => {
      const remaining = timerEndTs - Date.now();
      if (remaining <= 0) {
        setTimerRemainingMs(0);
        setIsTimerRunning(false);
        window.clearInterval(interval);
      } else {
        setTimerRemainingMs(remaining);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [isTimerRunning, timerEndTs]);

  // Completion logic: soft landing + glow bloom
  useEffect(() => {
    if (isTimerRunning) return;
    if (timerRemainingMs !== 0) return;
    if (hasTimerCompleted) return;

    setHasTimerCompleted(true);
    setShowCompletionBloom(true);

    void softLanding(10);

    const timeout = window.setTimeout(() => {
      setShowCompletionBloom(false);
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [isTimerRunning, timerRemainingMs, hasTimerCompleted, softLanding]);

  // Reset completion flag when sessions end
  useEffect(() => {
    if (!isPlaying) {
      setHasTimerCompleted(false);
      setShowCompletionBloom(false);
    }
  }, [isPlaying]);

  const handlePlayToggle = async () => {
    if (!isPlaying) {
      // Starting a session
      if (timerMinutes > 0) {
        const end = Date.now() + timerMinutes * 60 * 1000;
        setTimerEndTs(end);
        setTimerRemainingMs(timerMinutes * 60 * 1000);
        setIsTimerRunning(true);
      } else {
        setIsTimerRunning(false);
        setTimerEndTs(null);
        setTimerRemainingMs(null);
      }
    } else {
      // Manual stop
      setIsTimerRunning(false);
      setTimerEndTs(null);
      setTimerRemainingMs(null);
    }

    await togglePlay();
  };

  const handleTapToShowMinutes = () => {
    if (!isPlaying || !isTimerRunning || timerRemainingMs == null) return;
    setShowMinutesOverlay(true);
    window.setTimeout(() => {
      setShowMinutesOverlay(false);
    }, 2000);
  };

  const resonance = getTodayResonance();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <motion.div
        className="pointer-events-none absolute -inset-40 -z-10 rounded-full bg-gradient-to-br from-accent via-accent-soft to-transparent blur-3xl"
        animate={bgControls}
      />

      <div
        className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-3xl border border-white/5 bg-black/50 p-6 shadow-[0_0_80px_rgba(15,23,42,0.9)] backdrop-blur-2xl sm:p-10"
        onClick={handleTapToShowMinutes}
      >
        {/* Luminous Breath Pacer Aura + Ghost Timer Ring */}
        <AnimatePresence>
          {breathActive && (
            <motion.div
              key="luminous-aura"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: breathPhase === "inhale" ? 0.9 : 0.4,
                scale: breathPhase === "inhale" ? 1.2 : 0.8
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 5, ease: "easeInOut" }}
              className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
            >
              <div className="relative flex items-center justify-center">
                <div
                  className={`h-64 w-64 rounded-full bg-gradient-to-br ${presetGlowClasses} blur-3xl`}
                />
                {timerTotalMs && (
                  <svg
                    className="pointer-events-none absolute h-72 w-72"
                    viewBox="0 0 120 120"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="transparent"
                      stroke="rgba(15,23,42,0.4)"
                      strokeWidth="2"
                    />
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="transparent"
                      stroke={presetStrokeColor}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={Math.PI * 2 * 52}
                      animate={{
                        strokeDashoffset:
                          (1 - timerProgress) * Math.PI * 2 * 52
                      }}
                      transition={{ ease: "linear", duration: 0.25 }}
                    />
                  </svg>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion Glow Bloom */}
        <AnimatePresence>
          {showCompletionBloom && (
            <motion.div
              key="completion-bloom"
              initial={{ opacity: 0.2, scale: 0.9 }}
              animate={{ opacity: 0, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3.2, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
            >
              <div className="h-80 w-80 rounded-full bg-gradient-to-br from-white/90 via-amber-300/80 to-transparent blur-3xl" />
            </motion.div>
          )}
        </AnimatePresence>

        <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
              <Waves className="h-3 w-3 text-accent-soft" />
              HighVibe Field
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
              Binaural Architect of Your State
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Dial in pure sine-wave binaural fields. No doctrine, just
              frequency, attention, and your innate capacity to tune.
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
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Presets
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Choose the binaural delta between left and right channels.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(presets).map(([id, preset]) => (
                <div
                  key={id}
                  className={`group flex flex-col items-start justify-between gap-1 rounded-2xl border bg-white/3 px-3.5 py-3 text-left text-xs transition hover:border-accent-soft/70 hover:bg-white/8 sm:px-4 sm:py-3.5 ${
                    presetId === id
                      ? "border-accent-soft/80 bg-white/10 shadow-aura/70"
                      : "border-white/10"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setPresetId(id as typeof presetId)}
                    className="flex w-full flex-col items-start gap-1 text-left"
                  >
                    <span className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-slate-200">
                      {preset.label}
                    </span>
                    <span className="text-[0.7rem] text-slate-400">
                      {preset.description}
                    </span>
                    <span className="mt-1 text-[0.68rem] text-accent-soft">
                      {preset.beatFrequency} Hz field
                    </span>
                    {"carrierHintHz" in preset && preset.carrierHintHz && (
                      <span className="text-[0.65rem] text-slate-500">
                        Suggested carrier: {preset.carrierHintHz} Hz
                      </span>
                    )}
                  </button>
                  {preset.truthTitle && preset.truthBody && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTruthPresetId(id);
                      }}
                      className="mt-1 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/40 px-2 py-1 text-[0.65rem] text-slate-200/80 hover:border-accent-soft/60 hover:text-slate-50"
                    >
                      <Info className="h-3 w-3" />
                      <span className="tracking-[0.18em] uppercase">
                        Truth
                      </span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Ghost Timer controls – visible only when not playing */}
            <AnimatePresence>
              {!isPlaying && (
                <motion.div
                  key="ghost-timer-controls"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="mt-1 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold uppercase tracking-[0.18em] text-slate-200">
                        Ghost Timer
                      </div>
                      <p className="mt-0.5 text-[0.7rem] text-slate-400">
                        Session length in minutes. Fades away on Play.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setTimerMinutes((m) => Math.max(1, m - 1))
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/40 text-sm text-slate-200 hover:border-accent-soft/60"
                      >
                        –
                      </button>
                      <div className="min-w-[3rem] text-center text-sm font-semibold text-slate-50">
                        {timerMinutes}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setTimerMinutes((m) => Math.min(90, m + 1))
                        }
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-black/40 text-sm text-slate-200 hover:border-accent-soft/60"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
                <div>
                  <div className="font-semibold tracking-[0.16em] uppercase text-slate-200">
                    Carrier Frequency
                  </div>
                  <p className="mt-0.5 text-[0.7rem] text-slate-400">
                    Shift the base pitch of both channels together.
                  </p>
                </div>
                <div className="text-right text-[0.7rem] text-slate-300">
                  <span className="font-semibold">
                    {baseFrequency.toFixed(1)}
                  </span>{" "}
                  Hz
                </div>
              </div>
              <input
                type="range"
                min={200}
                max={600}
                step={0.5}
                value={baseFrequency}
                onChange={(e) => setBaseFrequency(Number(e.target.value))}
                className="w-full accent-accent-soft"
              />
              <div className="flex justify-between text-[0.65rem] text-slate-500">
                <span>Low carrier</span>
                <span>432 Hz</span>
                <span>440 Hz</span>
                <span>Higher carrier</span>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
                <div>
                  <div className="font-semibold tracking-[0.16em] uppercase text-slate-200">
                    Volume
                  </div>
                  <p className="mt-0.5 text-[0.7rem] text-slate-400">
                    Keep it gentle. Subtle fields tend to integrate more deeply.
                  </p>
                </div>
                <div className="text-right text-[0.7rem] text-slate-300">
                  {volume.toFixed(0)}%
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-accent-soft"
              />
              <div className="flex justify-between text-[0.65rem] text-slate-500">
                <span>Whisper</span>
                <span>Balanced</span>
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
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.9)]" />
                <span>
                  {isPlaying
                    ? isDeepFlow
                      ? "Deep Flow"
                      : "Field active"
                    : "Field idle"}
                </span>
              </div>
              <span>
                Δ {beatFrequency.toFixed(2)} Hz · Carrier{" "}
                {baseFrequency.toFixed(1)} Hz
              </span>
            </div>
          </div>
        </section>

        {/* Breath guidance text overlay */}
        <AnimatePresence>
          {breathActive && (
            <motion.div
              key="breath-text"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.7, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2 text-[0.7rem] tracking-[0.24em] text-slate-300/80 sm:bottom-8"
            >
              Inhale ··· Exhale ···
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minutes remaining overlay – appears on tap */}
        <AnimatePresence>
          {showMinutesOverlay &&
            isPlaying &&
            isTimerRunning &&
            timerRemainingMs != null && (
              <motion.div
                key="minutes-overlay"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 0.85, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="pointer-events-none absolute bottom-16 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/70 px-4 py-1.5 text-[0.75rem] text-slate-100 shadow-lg backdrop-blur"
              >
                {Math.max(
                  0,
                  Math.ceil((timerRemainingMs ?? 0) / 60000)
                )}{" "}
                min remaining
              </motion.div>
            )}
        </AnimatePresence>

        {/* Truth modal */}
        <AnimatePresence>
          {truthPresetId && (
            <motion.div
              key="truth-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-md"
              onClick={() => setTruthPresetId(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 6 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="relative mx-4 max-w-md rounded-3xl border border-amber-100/15 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-amber-900/10 p-[1px] shadow-[0_0_60px_rgba(250,250,249,0.25)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="rounded-3xl bg-gradient-to-br from-slate-950/90 via-slate-900/85 to-slate-950/90 px-5 py-5 sm:px-6 sm:py-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/80">
                      <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.9)]" />
                      Field Truth
                    </div>
                    <button
                      type="button"
                      onClick={() => setTruthPresetId(null)}
                      className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.18em] text-slate-200 hover:border-amber-300/60 hover:text-amber-100"
                    >
                      Close
                    </button>
                  </div>
                  {truthPresetId && (() => {
                    const preset = (presets as any)[truthPresetId];
                    return (
                      <>
                        <h2 className="text-sm font-semibold text-slate-50">
                          {preset?.truthTitle ?? preset?.label}
                        </h2>
                        <p className="mt-3 text-[0.8rem] leading-relaxed text-slate-100/85">
                          {preset?.truthBody}
                        </p>
                        <p className="mt-4 text-[0.7rem] leading-relaxed text-slate-400">
                          This description is not a promise, but an invitation
                          to explore how coherent sound fields interact with
                          your own biology, experience, and attention.
                        </p>
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

