"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ToneModule = typeof import("tone");

type PresetId =
  | "focus"
  | "relax"
  | "meditate"
  | "deepSleep"
  | "insight"
  | "cellularRepair"
  | "physicalRelief";

export interface HighVibePreset {
  id: PresetId;
  label: string;
  beatFrequency: number; // Hz difference between left and right
  description: string;
  carrierHintHz?: number;
  truthTitle?: string;
  truthBody?: string;
}

const PRESETS: Record<PresetId, HighVibePreset> = {
  focus: {
    id: "focus",
    label: "Focus · 14 Hz Beta",
    beatFrequency: 14,
    description: "Crisp, awake, task-oriented clarity.",
    truthTitle: "Focus · 14 Hz Beta",
    truthBody:
      "Around 14 Hz, cortical networks organize toward task engagement, sustaining attention without pushing into stress-driven over-activation."
  },
  relax: {
    id: "relax",
    label: "Relax · 10 Hz Alpha",
    beatFrequency: 10,
    description: "Soft, open presence without sleepiness.",
    truthTitle: "Relax · 10 Hz Alpha",
    truthBody:
      "Alpha rhythms near 10 Hz are associated with calm, wakeful rest, allowing sensory input without constant problem-solving."
  },
  meditate: {
    id: "meditate",
    label: "Mediate · 6 Hz Theta",
    beatFrequency: 6,
    description: "Deep inward focus, imaginal and spacious.",
    truthTitle: "Meditate · 6 Hz Theta",
    truthBody:
      "Theta-range activity is often seen in deep meditative and imaginal states, where the mind is both relaxed and highly receptive."
  },
  deepSleep: {
    id: "deepSleep",
    label: "Deep Sleep · 2.5 Hz Delta",
    beatFrequency: 2.5,
    description: "Slow, restorative descent into deep rest.",
    truthTitle: "Deep Sleep · 2.5 Hz Delta",
    truthBody:
      "Delta activity at very low frequencies is linked with deep, restorative stages of sleep where tissue repair and memory consolidation intensify."
  },
  insight: {
    id: "insight",
    label: "Insight · 40 Hz Gamma",
    beatFrequency: 40,
    description: "High-frequency coherence for pattern recognition.",
    truthTitle: "Insight · 40 Hz Gamma",
    truthBody:
      "40 Hz band activity has been correlated with feature binding and moments of insight, when separate pieces of information click into a single pattern."
  },
  cellularRepair: {
    id: "cellularRepair",
    label: "Cellular Repair · 40 Hz / 528 Hz",
    beatFrequency: 40,
    description: "Coherent gamma field over a 528 Hz carrier.",
    carrierHintHz: 528,
    truthTitle: "Cellular Repair",
    truthBody:
      "40Hz stimulates mitochondrial clearance and cognitive clarity. 528Hz is mathematically aligned with organic resonance and cortisol reduction."
  },
  physicalRelief: {
    id: "physicalRelief",
    label: "Physical Relief · 0.5 Hz / 174 Hz",
    beatFrequency: 0.5,
    description: "Very slow delta field resting on a 174 Hz base.",
    carrierHintHz: 174,
    truthTitle: "Physical Relief",
    truthBody:
      "Sub-delta ranges around 0.5 Hz mirror slow restorative waves, while 174 Hz has been explored as a low, grounding tone for easing tension perception."
  }
};

class HighVibeEngine {
  private tone: ToneModule;
  private leftOscillator: import("tone").Oscillator | null = null;
  private rightOscillator: import("tone").Oscillator | null = null;
  private leftPanner: import("tone").Panner | null = null;
  private rightPanner: import("tone").Panner | null = null;
  private volumeNode: import("tone").Volume | null = null;
  private pinkNoise: import("tone").Noise | null = null;
  private pinkGain: import("tone").Gain | null = null;
  private currentBaseFrequency = 432;
  private currentBeatFrequency = 14;
  private currentVolume = 0.6;
  private currentPinkLevel = 0.15;

  constructor(tone: ToneModule) {
    this.tone = tone;
  }

  private ensureNodes() {
    if (this.leftOscillator && this.rightOscillator) return;

    const { Oscillator, Panner, Volume, Noise, Gain, getDestination } = this.tone;

    this.volumeNode = new Volume(0).toDestination();

    this.leftPanner = new Panner(-1).connect(this.volumeNode);
    this.rightPanner = new Panner(1).connect(this.volumeNode);

    this.leftOscillator = new Oscillator({
      type: "sine",
      frequency: this.currentBaseFrequency - this.currentBeatFrequency / 2
    }).connect(this.leftPanner);

    this.rightOscillator = new Oscillator({
      type: "sine",
      frequency: this.currentBaseFrequency + this.currentBeatFrequency / 2
    }).connect(this.rightPanner);

    // Pink noise layer for breathing ocean texture
    this.pinkGain = new Gain(0).connect(this.volumeNode);
    this.pinkNoise = new Noise("pink").connect(this.pinkGain);
    this.pinkNoise.start();

    // Ensure master routing
    this.volumeNode.connect(getDestination());
    this.applyVolume();
    this.applyPinkLevel();
  }

  private applyFrequencies() {
    if (!this.leftOscillator || !this.rightOscillator) return;

    const halfDelta = this.currentBeatFrequency / 2;
    const leftFreq = Math.max(1, this.currentBaseFrequency - halfDelta);
    const rightFreq = Math.max(1, this.currentBaseFrequency + halfDelta);

    this.leftOscillator.frequency.rampTo(leftFreq, 0.3);
    this.rightOscillator.frequency.rampTo(rightFreq, 0.3);
  }

  private applyVolume() {
    if (!this.volumeNode) return;
    // Map 0–1 to a gentle dB curve (-36 dB to 0 dB)
    const minDb = -36;
    const maxDb = 0;
    const db = minDb + (maxDb - minDb) * this.currentVolume;
    this.volumeNode.volume.rampTo(db, 0.3);
  }

  private applyPinkLevel() {
    if (!this.pinkGain) return;
    const level = Math.max(0, Math.min(1, this.currentPinkLevel));
    this.pinkGain.gain.rampTo(level, 0.5);
  }

  async start() {
    await this.tone.start();
    this.ensureNodes();
    this.applyFrequencies();

    if (!this.leftOscillator || !this.rightOscillator) return;

    if (this.leftOscillator.state !== "started") {
      this.leftOscillator.start();
    }
    if (this.rightOscillator.state !== "started") {
      this.rightOscillator.start();
    }

    if (this.pinkNoise && this.pinkNoise.state !== "started") {
      this.pinkNoise.start();
    }
  }

  stop() {
    this.leftOscillator?.stop();
    this.rightOscillator?.stop();
    this.pinkNoise?.stop();
  }

  setFrequencies(baseFrequency: number, beatFrequency: number) {
    this.currentBaseFrequency = baseFrequency;
    this.currentBeatFrequency = beatFrequency;
    this.applyFrequencies();
  }

  setVolume(volume: number) {
    this.currentVolume = volume;
    this.applyVolume();
  }

  setPinkLevel(level: number) {
    this.currentPinkLevel = level;
    this.applyPinkLevel();
  }

  async softLanding(durationSeconds: number) {
    if (!this.volumeNode) return;
    const targetDb = -60;
    this.volumeNode.volume.rampTo(targetDb, durationSeconds);
    if (this.pinkGain) {
      this.pinkGain.gain.rampTo(0, durationSeconds);
    }

    await new Promise<void>((resolve) =>
      setTimeout(resolve, durationSeconds * 1000)
    );

    this.stop();
  }

  dispose() {
    this.leftOscillator?.dispose();
    this.rightOscillator?.dispose();
    this.leftPanner?.dispose();
    this.rightPanner?.dispose();
    this.volumeNode?.dispose();
    this.pinkNoise?.dispose();
    this.pinkGain?.dispose();
  }
}

export function useHighVibe() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [baseFrequency, setBaseFrequency] = useState(432);
  const [volume, setVolume] = useState(60); // 0–100 UI, mapped to 0–1 internally
  const [presetId, setPresetId] = useState<PresetId>("focus");

  const toneRef = useRef<ToneModule | null>(null);
  const engineRef = useRef<HighVibeEngine | null>(null);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);

  const beatFrequency = PRESETS[presetId].beatFrequency;

  const ensureEngine = useCallback(async (): Promise<HighVibeEngine | null> => {
    if (typeof window === "undefined") return null;

    if (!toneRef.current) {
      const tone = await import("tone");
      toneRef.current = tone;

       // Bias engine toward stable playback (helpful for background / lock-screen)
       try {
         const anyTone = tone as any;
         const ctx = anyTone.getContext ? anyTone.getContext() : null;
         if (ctx && "latencyHint" in ctx) {
           ctx.latencyHint = "playback";
         }
       } catch {
         // Best-effort only; ignore if not supported.
       }
    }

    if (!engineRef.current && toneRef.current) {
      engineRef.current = new HighVibeEngine(toneRef.current);
    }

    return engineRef.current;
  }, []);

  const syncEngineParams = useCallback(async () => {
    const engine = await ensureEngine();
    if (!engine) return;

    engine.setFrequencies(baseFrequency, beatFrequency);
    engine.setVolume(volume / 100);
  }, [baseFrequency, beatFrequency, volume, ensureEngine]);

  const togglePlay = useCallback(async () => {
    const engine = await ensureEngine();
    if (!engine) return;

    if (isPlaying) {
      engine.stop();
      setIsPlaying(false);

       // Stop silence anchor
       if (silentAudioRef.current) {
         silentAudioRef.current.pause();
         silentAudioRef.current.currentTime = 0;
       }
    } else {
      // Start silence anchor to keep audio pipeline alive in background
      if (silentAudioRef.current) {
        try {
          await silentAudioRef.current.play();
        } catch {
          // Some platforms require an extra gesture; ignore failure.
        }
      }

      await engine.start();
      engine.setFrequencies(baseFrequency, beatFrequency);
      engine.setVolume(volume / 100);
      engine.setPinkLevel(0.15);
      setIsPlaying(true);

      // MediaSession metadata
      if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
        const preset = PRESETS[presetId];
        try {
          // @ts-expect-error - MediaSession is not in all TS lib targets
          navigator.mediaSession.metadata = new MediaMetadata({
            title: `HighVibe - ${preset.label}`,
            artist: "Binaural Field",
            album: "HighVibe"
          });
        } catch {
          // Safe fallback if MediaSession is not available
        }
      }
    }
  }, [isPlaying, baseFrequency, beatFrequency, volume, ensureEngine, presetId]);

  const setBreathIntensity = useCallback(
    async (intensity: number) => {
      const engine = await ensureEngine();
      if (!engine) return;
      const clamped = Math.max(0, Math.min(1, intensity));
      engine.setPinkLevel(clamped);
    },
    [ensureEngine]
  );

  const softLanding = useCallback(
    async (durationSeconds: number) => {
      const engine = await ensureEngine();
      if (!engine || !isPlaying) return;
      await engine.softLanding(durationSeconds);
      setIsPlaying(false);
    },
    [ensureEngine, isPlaying]
  );

  useEffect(() => {
    // Prepare the 1-second silence anchor audio element on the client
    if (typeof window === "undefined") return;
    if (!silentAudioRef.current) {
      const el = new Audio("/silence.mp3");
      el.loop = true;
      el.preload = "auto";
      el.muted = false;
      silentAudioRef.current = el;
    }
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    void syncEngineParams();
  }, [isPlaying, syncEngineParams]);

  useEffect(() => {
    return () => {
      engineRef.current?.stop();
      engineRef.current?.dispose();
    };
  }, []);

  return {
    isPlaying,
    baseFrequency,
    setBaseFrequency,
    volume,
    setVolume,
    presetId,
    setPresetId,
    presets: PRESETS,
    beatFrequency,
    togglePlay,
    setBreathIntensity,
    softLanding
  };
}

