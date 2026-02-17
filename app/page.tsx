"use client";

import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Info, Play, Pause, Waves, Music2, Sparkles, ScanLine } from "lucide-react";
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
    ambientId,
    setAmbientId,
    ambients,
    ambientVolume,
    setAmbientVolume,
    togglePlay,
    setBreathIntensity,
    softLanding,
    runAwakeningSweep
  } = useHighVibe();

  const bgControls = useAnimation();
  const breatheControls = useAnimation();
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

  type InsightEntry = {
    id: string;
    timestamp: string;
    carrierHz: number;
    beatHz: number;
    note: string;
  };

  const [hasSessionContext, setHasSessionContext] = useState(false);
  const [insightInput, setInsightInput] = useState("");
  const [insightLedger, setInsightLedger] = useState<InsightEntry[]>([]);

  const [isBioScanning, setIsBioScanning] = useState(false);
  const [bioCoherence, setBioCoherence] = useState<number | null>(null);
  const [bioStress, setBioStress] = useState<number | null>(null);
  const [bioStatus, setBioStatus] = useState<string | null>(null);
  const [bioWaveform, setBioWaveform] = useState<number[]>([]);
  const [bioScanRemaining, setBioScanRemaining] = useState<number | null>(null);
  const [bioScanResult, setBioScanResult] = useState<string | null>(null);
  const [bioSignalQuality, setBioSignalQuality] = useState<"good" | "low" | null>(null);
  const [bioIsWarmup, setBioIsWarmup] = useState(false);
  const [bioSignalStrength, setBioSignalStrength] = useState<number>(0); // 0-100
  const [bioSignalToNoise, setBioSignalToNoise] = useState<number | null>(null);
  const [bioLowLightWarning, setBioLowLightWarning] = useState(false);
  const [bioCameraMode, setBioCameraMode] = useState<"front" | "back">("front");
  const [bioScanMode, setBioScanMode] = useState<"face" | "finger">("face");
  const [bioFlashEnabled, setBioFlashEnabled] = useState(false);
  const [bioAvailableCameras, setBioAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [bioFingerLocked, setBioFingerLocked] = useState(false);
  const [bioFingerLockDuration, setBioFingerLockDuration] = useState(0);
  const [bioTimerPaused, setBioTimerPaused] = useState(false);
  const [bioFocusQuality, setBioFocusQuality] = useState<number>(0); // 0-100, based on contrast
  const [bioMotionOffset, setBioMotionOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [bioVibrationLevel, setBioVibrationLevel] = useState<number>(0); // 0-100, motion intensity

  const [portalActive, setPortalActive] = useState(false);
  const [portalFrequency, setPortalFrequency] = useState<285 | 417>(285);
  const [portalVolumeFrequency, setPortalVolumeFrequency] = useState(60);
  const [portalVolumeBass, setPortalVolumeBass] = useState(40);
  const [portalVolumeAtmosphere, setPortalVolumeAtmosphere] = useState(50);

  type TabId = "beats" | "elevation" | "scan";
  const [activeTab, setActiveTab] = useState<TabId>("beats");

  const portalAudioRef = useRef<{
    ctx: AudioContext;
    oscFrequency: OscillatorNode;
    gainFrequency: GainNode;
    oscBass40: OscillatorNode;
    oscBass80: OscillatorNode;
    oscBass120: OscillatorNode;
    gainBass: GainNode;
  } | null>(null);

  const backgroundHumAudioRef = useRef<HTMLAudioElement | null>(null);
  const bioVideoRef = useRef<HTMLVideoElement | null>(null);
  const bioCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bioAnimFrameRef = useRef<number | null>(null);
  const bioSamplesRef = useRef<{ t: number; v: number }[]>([]);
  const bioScanTimerRef = useRef<number | null>(null);
  const bioScanStartTimeRef = useRef<number | null>(null);
  const bioFilteredSignalRef = useRef<number[]>([]);
  const bioROIRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const bioLowLightRef = useRef<boolean>(false);
  const bioRGBHistoryRef = useRef<{ r: number; g: number; b: number; t: number }[]>([]);
  const bioVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const bioStreamRef = useRef<MediaStream | null>(null);
  const bioLockStartTimeRef = useRef<number | null>(null);
  const bioLastHapticTimeRef = useRef<number>(0);
  const bioPauseStartTimeRef = useRef<number | null>(null);
  const bioTotalPausedTimeRef = useRef<number>(0);
  const bioAnchorPointsRef = useRef<{ x: number; y: number }[]>([]); // 5 anchor points for motion tracking
  const bioPrevImageDataRef = useRef<ImageData | null>(null); // Previous frame for optical flow
  const bioMotionOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 }); // Cumulative motion offset

  // Advanced signal processing functions
  const applyMovingAverage = useCallback((signal: number[], windowSize: number): number[] => {
    const result: number[] = [];
    for (let i = 0; i < signal.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(signal.length, i + Math.ceil(windowSize / 2));
      const window = signal.slice(start, end);
      result.push(window.reduce((a, b) => a + b, 0) / window.length);
    }
    return result;
  }, []);

  const detrendSignal = useCallback((signal: number[]): number[] => {
    // Remove slow linear trend
    const n = signal.length;
    const mean = signal.reduce((a, b) => a + b, 0) / n;
    const xMean = (n - 1) / 2;
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (signal[i] - mean);
      denominator += Math.pow(i - xMean, 2);
    }
    const slope = denominator !== 0 ? numerator / denominator : 0;
    return signal.map((v, i) => v - (mean + slope * (i - xMean)));
  }, []);

  const butterworthBandpass = useCallback((signal: number[], sampleRate: number, lowFreq: number, highFreq: number): number[] => {
    // Simplified 2nd-order Butterworth bandpass filter
    // Using a simple IIR filter approximation
    const nyquist = sampleRate / 2;
    const lowNorm = lowFreq / nyquist;
    const highNorm = highFreq / nyquist;
    
    // Simplified bandpass using moving average and high-pass
    const filtered: number[] = [];
    const alpha = 0.1; // Filter coefficient
    
    for (let i = 0; i < signal.length; i++) {
      if (i === 0) {
        filtered.push(signal[i]);
      } else {
        // High-pass component
        const highPass = signal[i] - signal[i - 1];
        // Low-pass component (moving average)
        const lowPass = filtered[i - 1] + alpha * (signal[i] - filtered[i - 1]);
        // Combine for bandpass
        filtered.push(lowPass + highPass * 0.5);
      }
    }
    return filtered;
  }, []);

  const extractCHROM = useCallback((rgbHistory: { r: number; g: number; b: number; t: number }[]): number[] => {
    // CHROM algorithm: Xs = 3*R - 2*G, Ys = 1.5*R + G - 1.5*B
    if (rgbHistory.length < 2) return [];
    
    const chromSignal: number[] = [];
    for (let i = 1; i < rgbHistory.length; i++) {
      const prev = rgbHistory[i - 1];
      const curr = rgbHistory[i];
      
      const Xs = 3 * curr.r - 2 * curr.g;
      const Ys = 1.5 * curr.r + curr.g - 1.5 * curr.b;
      const XsPrev = 3 * prev.r - 2 * prev.g;
      const YsPrev = 1.5 * prev.r + prev.g - 1.5 * prev.b;
      
      // Pulse signal from CHROM
      const pulse = Xs - (XsPrev / YsPrev) * Ys;
      chromSignal.push(pulse);
    }
    return chromSignal;
  }, []);

  const detectFaceROI = useCallback((imageData: ImageData, width: number, height: number): { x: number; y: number; width: number; height: number } | null => {
    // Simplified ROI detection: assume face is centered, define forehead and cheek regions
    // Forehead: top 20% of center region
    // Cheeks: middle 40% of left and right regions
    const centerX = width / 2;
    const centerY = height / 2;
    const roiWidth = width * 0.6;
    const roiHeight = height * 0.5;
    
    return {
      x: centerX - roiWidth / 2,
      y: centerY - roiHeight * 0.3, // Slightly above center for forehead
      width: roiWidth,
      height: roiHeight
    };
  }, []);

  // Detect 5 high-contrast anchor points in center region for motion tracking
  const detectAnchorPoints = useCallback((imageData: ImageData, width: number, height: number): { x: number; y: number }[] => {
    const data = imageData.data;
    const centerX = width / 2;
    const centerY = height / 2;
    const searchRadius = Math.min(width, height) * 0.2; // Search in center 40% region
    
    // Calculate contrast (gradient magnitude) for each pixel
    const contrastMap: { x: number; y: number; contrast: number }[] = [];
    
    for (let y = Math.max(1, centerY - searchRadius); y < Math.min(height - 1, centerY + searchRadius); y += 2) {
      for (let x = Math.max(1, centerX - searchRadius); x < Math.min(width - 1, centerX + searchRadius); x += 2) {
        const idx = (y * width + x) * 4;
        const g = data[idx + 1]; // Green channel
        
        // Calculate gradient magnitude (Sobel-like)
        const gx = Math.abs(
          -data[((y - 1) * width + (x - 1)) * 4 + 1] +
          data[((y - 1) * width + (x + 1)) * 4 + 1] +
          -2 * data[(y * width + (x - 1)) * 4 + 1] +
          2 * data[(y * width + (x + 1)) * 4 + 1] +
          -data[((y + 1) * width + (x - 1)) * 4 + 1] +
          data[((y + 1) * width + (x + 1)) * 4 + 1]
        );
        
        const gy = Math.abs(
          -data[((y - 1) * width + (x - 1)) * 4 + 1] +
          -2 * data[((y - 1) * width + x) * 4 + 1] +
          -data[((y - 1) * width + (x + 1)) * 4 + 1] +
          data[((y + 1) * width + (x - 1)) * 4 + 1] +
          2 * data[((y + 1) * width + x) * 4 + 1] +
          data[((y + 1) * width + (x + 1)) * 4 + 1]
        );
        
        const contrast = Math.sqrt(gx * gx + gy * gy);
        contrastMap.push({ x, y, contrast });
      }
    }
    
    // Sort by contrast and pick top 5, ensuring they're spread out
    contrastMap.sort((a, b) => b.contrast - a.contrast);
    
    const anchors: { x: number; y: number }[] = [];
    const minDistance = searchRadius * 0.3; // Minimum distance between anchors
    
    for (const point of contrastMap) {
      if (anchors.length >= 5) break;
      
      // Check if this point is far enough from existing anchors
      const tooClose = anchors.some(anchor => {
        const dx = point.x - anchor.x;
        const dy = point.y - anchor.y;
        return Math.sqrt(dx * dx + dy * dy) < minDistance;
      });
      
      if (!tooClose) {
        anchors.push({ x: point.x, y: point.y });
      }
    }
    
    // If we don't have 5 points, fill with evenly spaced points
    while (anchors.length < 5) {
      const angle = (anchors.length * 2 * Math.PI) / 5;
      const radius = searchRadius * 0.5;
      anchors.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
    }
    
    return anchors.slice(0, 5);
  }, []);

  // Calculate optical flow (motion vector) for anchor points
  const calculateOpticalFlow = useCallback((
    prevImageData: ImageData,
    currImageData: ImageData,
    prevAnchors: { x: number; y: number }[]
  ): { x: number; y: number; confidence: number } => {
    const prevData = prevImageData.data;
    const currData = currImageData.data;
    const width = prevImageData.width;
    const height = prevImageData.height;
    
    const searchRadius = 5; // Search radius for matching
    const blockSize = 3; // Block size for template matching
    
    let totalDx = 0;
    let totalDy = 0;
    let validMatches = 0;
    
    for (const anchor of prevAnchors) {
      const px = Math.floor(anchor.x);
      const py = Math.floor(anchor.y);
      
      if (px < blockSize || px >= width - blockSize || py < blockSize || py >= height - blockSize) {
        continue;
      }
      
      // Extract template from previous frame (Green channel)
      const template: number[] = [];
      for (let dy = -blockSize; dy <= blockSize; dy++) {
        for (let dx = -blockSize; dx <= blockSize; dx++) {
          const idx = ((py + dy) * width + (px + dx)) * 4 + 1;
          template.push(prevData[idx]);
        }
      }
      
      // Search for best match in current frame
      let bestMatch = { dx: 0, dy: 0, score: Infinity };
      
      for (let dy = -searchRadius; dy <= searchRadius; dy++) {
        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
          const nx = px + dx;
          const ny = py + dy;
          
          if (nx < blockSize || nx >= width - blockSize || ny < blockSize || ny >= height - blockSize) {
            continue;
          }
          
          // Calculate sum of squared differences (SSD)
          let ssd = 0;
          let idx = 0;
          for (let ty = -blockSize; ty <= blockSize; ty++) {
            for (let tx = -blockSize; tx <= blockSize; tx++) {
              const currIdx = ((ny + ty) * width + (nx + tx)) * 4 + 1;
              const diff = currData[currIdx] - template[idx];
              ssd += diff * diff;
              idx++;
            }
          }
          
          if (ssd < bestMatch.score) {
            bestMatch = { dx, dy, score: ssd };
          }
        }
      }
      
      // Only use matches with reasonable confidence (low SSD)
          if (bestMatch.score < 10000) { // Threshold for valid match
            totalDx += bestMatch.dx;
            totalDy += bestMatch.dy;
            validMatches++;
          }
        }
        
        if (validMatches === 0) {
          return { x: 0, y: 0, confidence: 0 };
        }
        
        // Average motion across all anchor points
        const avgDx = totalDx / validMatches;
        const avgDy = totalDy / validMatches;
        const confidence = validMatches / prevAnchors.length;
        
        return { x: avgDx, y: avgDy, confidence };
      }, []);

  const calculateROIAverage = useCallback((
    imageData: ImageData,
    roi: { x: number; y: number; width: number; height: number },
    motionOffset?: { x: number; y: number }
  ): { r: number; g: number; b: number; brightness: number } => {
    const data = imageData.data;
    const width = imageData.width;
    let rSum = 0, gSum = 0, bSum = 0;
    let pixelCount = 0;
    
    // Apply motion compensation to ROI position
    const compensatedX = roi.x + (motionOffset?.x || 0);
    const compensatedY = roi.y + (motionOffset?.y || 0);
    
    const startX = Math.max(0, Math.floor(compensatedX));
    const endX = Math.min(width, Math.floor(compensatedX + roi.width));
    const startY = Math.max(0, Math.floor(compensatedY));
    const endY = Math.min(imageData.height, Math.floor(compensatedY + roi.height));
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const idx = (y * width + x) * 4;
        rSum += data[idx];
        gSum += data[idx + 1];
        bSum += data[idx + 2];
        pixelCount++;
      }
    }
    
    if (pixelCount === 0) return { r: 0, g: 0, b: 0, brightness: 0 };
    
    const r = rSum / pixelCount / 255;
    const g = gSum / pixelCount / 255;
    const b = bSum / pixelCount / 255;
    const brightness = (r + g + b) / 3;
    
    return { r, g, b, brightness };
  }, []);

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
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("highvibe_insight_ledger");
      if (!raw) return;
      const parsed = JSON.parse(raw) as InsightEntry[];
      if (Array.isArray(parsed)) {
        setInsightLedger(parsed);
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "highvibe_insight_ledger",
        JSON.stringify(insightLedger)
      );
    } catch {
      // storage may be unavailable; fail softly
    }
  }, [insightLedger]);

  const stopBioScan = useCallback(() => {
    setIsBioScanning(false);
    setBioScanRemaining(null);
    setBioScanResult(null);
    setBioSignalQuality(null);
    setBioIsWarmup(false);
    setBioSignalStrength(0);
    setBioSignalToNoise(null);
    setBioLowLightWarning(false);
    setBioFlashEnabled(false);
    setBioFingerLocked(false);
    setBioFingerLockDuration(0);
    setBioTimerPaused(false);
    bioRGBHistoryRef.current = [];
    bioFilteredSignalRef.current = [];
    bioROIRef.current = null;
    bioAnchorPointsRef.current = [];
    bioPrevImageDataRef.current = null;
    bioMotionOffsetRef.current = { x: 0, y: 0 };
    setBioMotionOffset({ x: 0, y: 0 });
    setBioVibrationLevel(0);
    bioLockStartTimeRef.current = null;
    if (bioAnimFrameRef.current != null) {
      cancelAnimationFrame(bioAnimFrameRef.current);
      bioAnimFrameRef.current = null;
    }
    if (bioScanTimerRef.current != null) {
      window.clearInterval(bioScanTimerRef.current);
      bioScanTimerRef.current = null;
    }
    
    // Turn off flash if enabled
    if (bioVideoTrackRef.current) {
      try {
        (bioVideoTrackRef.current as any).applyConstraints({ advanced: [{ torch: false }] } as any).catch(() => {});
      } catch {}
    }
    
    const video = bioVideoRef.current;
    if (video && video.srcObject) {
      (video.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
      video.srcObject = null;
    }
    
    if (bioStreamRef.current) {
      bioStreamRef.current.getTracks().forEach((track) => track.stop());
      bioStreamRef.current = null;
    }
    
    bioVideoTrackRef.current = null;
    bioSamplesRef.current = [];
    bioScanStartTimeRef.current = null;
  }, []);

  // Enumerate available cameras
  const enumerateCameras = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      setBioAvailableCameras(videoDevices);
      return videoDevices;
    } catch {
      return [];
    }
  }, []);

  // Toggle flash/torch
  const toggleFlash = useCallback(async () => {
    if (!bioVideoTrackRef.current || bioScanMode !== "finger") return;
    
    const newFlashState = !bioFlashEnabled;
    try {
      await (bioVideoTrackRef.current as any).applyConstraints({
        advanced: [{ torch: newFlashState }]
      } as any);
      setBioFlashEnabled(newFlashState);
    } catch {
      // Flash not supported on this device
      setBioFlashEnabled(false);
    }
  }, [bioFlashEnabled, bioScanMode]);

  // Switch scan mode (Face/Finger)
  const switchScanMode = useCallback(async (newMode: "face" | "finger") => {
    const wasScanning = isBioScanning;
    
    // If scanning, stop the scan first for smooth transition
    if (wasScanning) {
      stopBioScan();
    }
    
    setBioScanMode(newMode);
    setBioCameraMode(newMode === "finger" ? "back" : "front");
    
    // If not scanning, just update the mode (camera will be initialized on next scan start)
    if (!wasScanning) {
      return;
    }
    
    // If was scanning, restart camera stream with new mode settings
    // Stop current stream
    if (bioStreamRef.current) {
      bioStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    
    // Turn off flash if switching away from finger mode
    if (bioScanMode === "finger" && bioFlashEnabled) {
      setBioFlashEnabled(false);
    }
    
    try {
      const isFingerMode = newMode === "finger";
      // Get new stream with appropriate camera and settings
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isFingerMode ? { ideal: "environment" } : "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
          // Frame rate stabilization: Lock to 30fps
          frameRate: { ideal: 30, min: 30, max: 30 },
          advanced: [
            { exposureMode: "manual" },
            { focusMode: "continuous" }, // Continuous focus for Bio-Scan
            { whiteBalanceMode: "auto" }, // Will be set to manual after lock
            // Macro Zoom: 2.0x zoom for Finger Scan
            ...(isFingerMode ? [{ zoom: 2.0 }] : [])
          ] as any
        },
        audio: false
      } as any);
      
      bioStreamRef.current = stream;
      const videoTrack = stream.getVideoTracks()[0];
      bioVideoTrackRef.current = videoTrack;
      
      const video = bioVideoRef.current;
      if (video) {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          void video.play().catch(() => {});
        };
      }
      
      // Auto-enable flash for Finger Scan mode
      if (isFingerMode) {
        try {
          // Apply continuous focus and flash for Finger Scan
          await (videoTrack as any).applyConstraints({
            advanced: [
              { torch: true },
              { focusMode: "continuous" } // Continuous focus for sharp image
            ]
          } as any);
          
          // Try to apply zoom
          try {
            await (videoTrack as any).applyConstraints({
              zoom: 2.0
            } as any);
          } catch {
            // Zoom not supported, CSS transform will handle it
          }
          
          setBioFlashEnabled(true);
        } catch {
          // Flash not supported
        }
      }
      
      // Disable beauty filters and AI enhancements
      try {
        const trackSettings = videoTrack.getSettings() as any;
        await (videoTrack as any).applyConstraints({
          advanced: [
            { colorTemperature: trackSettings.colorTemperature || 5500 },
            { saturation: 1.0 },
            { contrast: 1.0 },
            { brightness: 0 }
          ]
        } as any);
      } catch {
        // Not all devices support these settings
      }
    } catch {
      setBioStatus("Unable to switch camera. Check permissions.");
    }
  }, [isBioScanning, bioScanMode, bioFlashEnabled, stopBioScan]);

  // Flip camera (legacy function - now uses scan mode)
  const flipCamera = useCallback(async () => {
    const newMode = bioScanMode === "face" ? "finger" : "face";
    await switchScanMode(newMode);
  }, [bioScanMode, switchScanMode]);

  const startBioScan = useCallback(async () => {
    if (typeof navigator === "undefined" || typeof window === "undefined") return;
    if (!navigator.mediaDevices?.getUserMedia) return;

    // Enumerate cameras first
    await enumerateCameras();

    try {
      // Enhanced camera configuration based on scan mode
      const isFingerMode = bioScanMode === "finger";
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isFingerMode ? { ideal: "environment" } : "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
          // Frame rate stabilization: Lock to 30fps to prevent time-drift
          frameRate: { ideal: 30, min: 30, max: 30 },
          // Request exposure and focus lock to prevent hunting
          advanced: [
            { exposureMode: "manual" },
            // Focus mode: continuous for Bio-Scan to keep image sharp
            { focusMode: "continuous" },
            { whiteBalanceMode: "auto" }, // Will be set to manual after lock
            // Macro Zoom: 2.0x zoom for Finger Scan to focus on fingertip
            ...(isFingerMode ? [{ zoom: 2.0 }] : [])
          ] as any
        },
        audio: false
      } as any);
      
      bioStreamRef.current = stream;
      const videoTrack = stream.getVideoTracks()[0];
      bioVideoTrackRef.current = videoTrack;

      // Apply camera settings optimized for Xiaomi 15t Pro
      if (videoTrack && "getCapabilities" in videoTrack) {
        const capabilities = videoTrack.getCapabilities();
        const settings = videoTrack.getSettings();
        
        // Try to lock exposure and apply continuous focus for Bio-Scan
        if (videoTrack && "applyConstraints" in videoTrack) {
          try {
            const isFingerMode = bioScanMode === "finger";
            // Apply continuous focus to keep image sharp during scan
            await (videoTrack as any).applyConstraints({
              advanced: [
                { exposureMode: "manual", exposureCompensation: 0 },
                { focusMode: "continuous" } // Continuous focus for sharp image
              ]
            } as any);
            
            // Try to apply zoom for Finger Scan mode
            if (isFingerMode) {
              try {
                await (videoTrack as any).applyConstraints({
                  zoom: 2.0
                } as any);
              } catch {
                // Zoom not supported, will use CSS transform fallback
              }
            }
          } catch {
            // Some devices don't support manual controls; continue anyway
          }
        }
        
        // Auto-enable flash for Finger Scan mode
        if (bioScanMode === "finger") {
          try {
            await (videoTrack as any).applyConstraints({
              advanced: [{ torch: true }]
            } as any);
            setBioFlashEnabled(true);
          } catch {
            // Flash not supported on this device
          }
        }
        
        // Disable beauty filters and AI enhancements (Xiaomi-specific)
        try {
          const trackSettings = settings as any;
          await (videoTrack as any).applyConstraints({
            advanced: [
              { colorTemperature: trackSettings.colorTemperature || 5500 },
              { saturation: 1.0 },
              { contrast: 1.0 },
              { brightness: 0 }
            ]
          } as any);
        } catch {
          // Not all devices support these settings
        }
      }

      const video = bioVideoRef.current;
      if (!video) {
        setIsBioScanning(false);
        setBioStatus("Video element not available.");
        return;
      }
      
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        void video.play().catch(() => {
          setIsBioScanning(false);
          setBioStatus("Unable to play video stream.");
        });
      };

      setIsBioScanning(true);
      setBioScanResult(null);
      setBioSignalQuality(null);
      setBioIsWarmup(true);
      setBioSignalStrength(0);
      setBioSignalToNoise(null);
      setBioLowLightWarning(false);
      setBioFingerLocked(false);
      setBioFingerLockDuration(0);
      setBioTimerPaused(false);
      setBioStatus(bioScanMode === "finger" ? "Place finger over lens..." : "Signal Acquisition: Stabilizing...");
      bioRGBHistoryRef.current = [];
      bioFilteredSignalRef.current = [];
      bioROIRef.current = null;
      bioLockStartTimeRef.current = null;
      bioPauseStartTimeRef.current = null;
      bioTotalPausedTimeRef.current = 0;
      bioAnchorPointsRef.current = [];
      bioPrevImageDataRef.current = null;
      bioMotionOffsetRef.current = { x: 0, y: 0 };
      setBioMotionOffset({ x: 0, y: 0 });
      setBioVibrationLevel(0);
      
      const SIGNAL_ACQUISITION_MS = 15000; // 15 seconds as requested
      const SCAN_DURATION_MS = 60000;
      bioScanStartTimeRef.current = Date.now();
      setBioScanRemaining(SCAN_DURATION_MS);

      // Countdown timer
      bioScanTimerRef.current = window.setInterval(() => {
        if (!bioScanStartTimeRef.current) return;
        const elapsed = Date.now() - bioScanStartTimeRef.current;
        const remaining = Math.max(0, SCAN_DURATION_MS - elapsed);
        const acquisitionRemaining = Math.max(0, SIGNAL_ACQUISITION_MS - elapsed);
        
        // For Finger Scan mode, check finger lock before starting timer
        if (bioScanMode === "finger") {
          if (!bioFingerLocked || bioTimerPaused) {
            // Don't start timer until finger is locked for 2 seconds
            setBioScanRemaining(SCAN_DURATION_MS);
            setBioIsWarmup(true);
            if (!bioFingerLocked) {
              setBioStatus("Place finger over lens completely...");
            } else {
              setBioStatus(`Locking... ${(bioFingerLockDuration / 1000).toFixed(1)}s`);
            }
          } else if (bioFingerLockDuration >= 2000) {
            // Finger locked for 2+ seconds, start timer (account for paused time)
            const currentPausedTime = bioPauseStartTimeRef.current ? Date.now() - bioPauseStartTimeRef.current : 0;
            const totalPaused = bioTotalPausedTimeRef.current + currentPausedTime;
            const adjustedElapsed = elapsed - totalPaused;
            const adjustedRemaining = Math.max(0, SCAN_DURATION_MS - adjustedElapsed);
            const adjustedAcquisition = Math.max(0, SIGNAL_ACQUISITION_MS - adjustedElapsed);
            
            if (adjustedAcquisition > 0) {
              setBioIsWarmup(true);
              setBioScanRemaining(SCAN_DURATION_MS);
              setBioStatus(`Signal Acquisition: ${(adjustedAcquisition / 1000).toFixed(1)}s...`);
            } else {
              setBioIsWarmup(false);
              setBioScanRemaining(adjustedRemaining);
              setBioStatus("Capturing Resonance.");
            }
          }
        } else {
          // Front camera: normal flow
          if (acquisitionRemaining > 0) {
            setBioIsWarmup(true);
            setBioScanRemaining(SCAN_DURATION_MS);
            setBioStatus(`Signal Acquisition: ${(acquisitionRemaining / 1000).toFixed(1)}s...`);
          } else {
            setBioIsWarmup(false);
            setBioScanRemaining(remaining);
            if (bioSignalQuality === "low" || bioSignalStrength < 30) {
              setBioStatus("Stabilize finger & increase light.");
            } else if (bioSignalStrength >= 70) {
              setBioStatus("Capturing Resonance.");
            } else {
              setBioStatus("Scanning in progress...");
            }
          }
        }
        
        if (remaining <= 0) {
          if (bioScanTimerRef.current != null) {
            window.clearInterval(bioScanTimerRef.current);
            bioScanTimerRef.current = null;
          }
          setIsBioScanning(false);
          
          // Calculate final coherence and show result
          const samples = bioSamplesRef.current;
          // Filter samples collected after signal acquisition (first 5 seconds)
          const recordingStartTime = bioScanStartTimeRef.current + SIGNAL_ACQUISITION_MS;
          const validSamples = samples.filter((s) => {
            const sampleTime = bioScanStartTimeRef.current ? s.t - (performance.now() - (Date.now() - bioScanStartTimeRef.current)) : s.t;
            return sampleTime >= recordingStartTime;
          });
          
          // Calculate Signal-to-Noise Ratio
          if (validSamples.length > 10) {
            const values = validSamples.map((s) => s.v);
            const mean = values.reduce((acc, v) => acc + v, 0) / values.length;
            const signalPower = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
            
            // Estimate noise from high-frequency variations
            const diffs = [];
            for (let i = 1; i < values.length; i++) {
              diffs.push(Math.abs(values[i] - values[i - 1]));
            }
            const noisePower = diffs.reduce((acc, v) => acc + v * v, 0) / (diffs.length || 1);
            const snr = noisePower > 0 ? signalPower / noisePower : 0;
            setBioSignalToNoise(snr);
          }
          
          if (validSamples.length > 30 && (bioSignalToNoise === null || bioSignalToNoise > 0.5)) {
            const values = validSamples.map((s) => s.v);
            const mean = values.reduce((acc, v) => acc + v, 0) / values.length;
            const centered = values.map((v) => v - mean);
            
            let max = -Infinity;
            let min = Infinity;
            for (const v of centered) {
              if (v > max) max = v;
              if (v < min) min = v;
            }
            const amplitude = max - min;
            
            const diffs: number[] = [];
            for (let i = 1; i < centered.length; i++) {
              diffs.push(centered[i] - centered[i - 1]);
            }
            const diffVar = diffs.reduce((acc, v) => acc + v * v, 0) / (diffs.length || 1);
            const smoothness = 1 / Math.sqrt(diffVar + 1e-6);
            const raw = amplitude * smoothness * 100;
            const finalCoherence = Math.max(0, Math.min(100, raw));
            
            setBioCoherence(finalCoherence);
            setBioStress(Math.max(0, Math.min(100, 100 - finalCoherence)));
            
            // Categorize result
            if (finalCoherence <= 30) {
              setBioScanResult("STAGNANT (0-30%)");
              setBioStatus("The river is blocked. Use 432Hz to clear.");
            } else if (finalCoherence <= 70) {
              setBioScanResult("FLOWING (31-70%)");
              setBioStatus("The river is moving. Ready for daily tasks.");
            } else {
              setBioScanResult("SOVEREIGN (71-100%)");
              setBioStatus("The river is clear. Proceed to Direct Knowing / Awakening Sweep.");
            }
          } else if (validSamples.length <= 30) {
            setBioScanResult("INSUFFICIENT DATA");
            setBioStatus("Please try again. Keep your face or fingertip steady for the full 60 seconds.");
          } else {
            setBioScanResult("SIGNAL FRAGMENTED");
            setBioStatus("Signal Fragmented. Please rest your hand on a flat surface and try again.");
          }
        }
      }, 50);

      const canvas = bioCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const loop = () => {
        const v = bioVideoRef.current;
        const c = bioCanvasRef.current;
        if (!v || !c || !isBioScanning || v.readyState < 2 || bioScanRemaining === null || bioScanRemaining <= 0) {
          if (bioScanRemaining === null || bioScanRemaining <= 0) {
            bioAnimFrameRef.current = null;
            return;
          }
          bioAnimFrameRef.current = requestAnimationFrame(loop);
          return;
        }

        // Use higher resolution for better rPPG
        const w = 320;
        const h = 240;
        c.width = w;
        c.height = h;
        ctx.drawImage(v, 0, 0, w, h);

        const fullImageData = ctx.getImageData(0, 0, w, h);
        
        // Motion compensation for Finger Scan mode
        let motionOffset = { x: 0, y: 0 };
        let vibrationLevel = 0;
        
        if (bioScanMode === "finger" && bioFingerLocked) {
          // Detect anchor points on first lock or if not yet detected
          if (bioAnchorPointsRef.current.length === 0) {
            bioAnchorPointsRef.current = detectAnchorPoints(fullImageData, w, h);
            bioPrevImageDataRef.current = fullImageData;
            bioMotionOffsetRef.current = { x: 0, y: 0 };
          } else if (bioPrevImageDataRef.current) {
            // Calculate optical flow
            const flow = calculateOpticalFlow(
              bioPrevImageDataRef.current,
              fullImageData,
              bioAnchorPointsRef.current
            );
            
            // Update cumulative motion offset
            bioMotionOffsetRef.current.x += flow.x;
            bioMotionOffsetRef.current.y += flow.y;
            motionOffset = { ...bioMotionOffsetRef.current };
            
            // Calculate vibration level (magnitude of motion)
            const motionMagnitude = Math.sqrt(flow.x * flow.x + flow.y * flow.y);
            vibrationLevel = Math.min(100, (motionMagnitude / 5) * 100); // Normalize: 5px = 100%
            setBioVibrationLevel(vibrationLevel);
            
            // Update anchor points position for next frame
            bioAnchorPointsRef.current = bioAnchorPointsRef.current.map(anchor => ({
              x: anchor.x + flow.x,
              y: anchor.y + flow.y
            }));
            
            // If motion is too high, show warning
            if (motionMagnitude > 3) { // Threshold: 3 pixels per frame
              setBioStatus("Vibration too high. Please keep steady for deep scan.");
            }
          }
          
          // Store current frame for next iteration
          bioPrevImageDataRef.current = fullImageData;
        }
        
        // Different ROI detection based on camera mode
        let roi = bioROIRef.current;
        if (!roi) {
          if (bioScanMode === "finger") {
            // For Finger Scan mode (finger PPG), use center region
            const centerX = w / 2;
            const centerY = h / 2;
            const roiSize = Math.min(w, h) * 0.4;
            roi = {
              x: centerX - roiSize / 2,
              y: centerY - roiSize / 2,
              width: roiSize,
              height: roiSize
            };
          } else {
            // For Face Scan mode (face rPPG), use face ROI
            roi = detectFaceROI(fullImageData, w, h);
          }
          bioROIRef.current = roi;
        }
        
        if (!roi) {
          bioAnimFrameRef.current = requestAnimationFrame(loop);
          return;
        }

        // Extract RGB values from ROI with motion compensation
        const rgb = calculateROIAverage(fullImageData, roi, bioScanMode === "finger" ? motionOffset : undefined);
        
        // Calculate focus quality based on image contrast (Laplacian variance)
        const focusROI = {
          x: Math.floor(roi.x),
          y: Math.floor(roi.y),
          width: Math.floor(roi.width),
          height: Math.floor(roi.height)
        };
        const focusImageData = ctx.getImageData(focusROI.x, focusROI.y, focusROI.width, focusROI.height);
        const focusData = focusImageData.data;
        
        // Calculate Laplacian variance (measure of sharpness)
        let laplacianSum = 0;
        let laplacianCount = 0;
        for (let y = 1; y < focusROI.height - 1; y++) {
          for (let x = 1; x < focusROI.width - 1; x++) {
            const idx = (y * focusROI.width + x) * 4;
            const center = focusData[idx + 1]; // Green channel
            const top = focusData[((y - 1) * focusROI.width + x) * 4 + 1];
            const bottom = focusData[((y + 1) * focusROI.width + x) * 4 + 1];
            const left = focusData[(y * focusROI.width + (x - 1)) * 4 + 1];
            const right = focusData[(y * focusROI.width + (x + 1)) * 4 + 1];
            
            const laplacian = Math.abs(4 * center - top - bottom - left - right);
            laplacianSum += laplacian * laplacian;
            laplacianCount++;
          }
        }
        const laplacianVariance = laplacianCount > 0 ? laplacianSum / laplacianCount : 0;
        // Normalize to 0-100 scale (threshold ~500 for good focus)
        const focusQuality = Math.min(100, (laplacianVariance / 500) * 100);
        setBioFocusQuality(focusQuality);
        
        // For Finger Scan mode, check finger alignment and lock state
        if (bioScanMode === "finger") {
          // Calculate red channel intensity (0-1)
          const redIntensity = rgb.r;
          const redSaturation = rgb.r / (rgb.r + rgb.g + rgb.b + 0.001);
          
          // Check for high-frequency leakage (ambient light)
          const recentRedValues = bioRGBHistoryRef.current.slice(-10).map((s) => s.r);
          let hasLeakage = false;
          if (recentRedValues.length > 5) {
            const redMean = recentRedValues.reduce((a, b) => a + b, 0) / recentRedValues.length;
            const redVariance = recentRedValues.reduce((acc, v) => acc + Math.pow(v - redMean, 2), 0) / recentRedValues.length;
            const redStdDev = Math.sqrt(redVariance);
            // High variance indicates light leakage
            hasLeakage = redStdDev > 0.05;
          }
          
          // LOCKED state: Red intensity > 90% and no leakage
          const isLocked = redIntensity > 0.9 && !hasLeakage && redSaturation > 0.6;
          
          if (isLocked) {
            // Track lock duration
            const wasJustLocked = !bioLockStartTimeRef.current;
            if (wasJustLocked) {
              bioLockStartTimeRef.current = Date.now();
              // Haptic feedback when first locked
              if (typeof navigator !== "undefined" && "vibrate" in navigator && Date.now() - bioLastHapticTimeRef.current > 1000) {
                navigator.vibrate(50);
                bioLastHapticTimeRef.current = Date.now();
              }
              
              // Lock white balance once finger is locked (Xiaomi 15t Pro optimization)
              if (bioVideoTrackRef.current) {
                try {
                  const trackSettings = bioVideoTrackRef.current.getSettings() as any;
                  (bioVideoTrackRef.current as any).applyConstraints({
                    advanced: [
                      { whiteBalanceMode: "manual", colorTemperature: trackSettings.colorTemperature || 5500 }
                    ]
                  } as any).catch(() => {
                    // White balance lock not supported
                  });
                } catch {
                  // White balance lock not supported
                }
              }
            }
            if (bioLockStartTimeRef.current) {
              const lockDuration = Date.now() - bioLockStartTimeRef.current;
              setBioFingerLocked(true);
              setBioFingerLockDuration(lockDuration);
              setBioTimerPaused(false);
            }
          } else {
            // Not locked - reset and pause timer
            bioLockStartTimeRef.current = null;
            setBioFingerLocked(false);
            setBioFingerLockDuration(0);
            // Reset motion tracking when finger is unlocked
            bioAnchorPointsRef.current = [];
            bioPrevImageDataRef.current = null;
            bioMotionOffsetRef.current = { x: 0, y: 0 };
            setBioMotionOffset({ x: 0, y: 0 });
            setBioVibrationLevel(0);
            if (bioScanStartTimeRef.current && !bioPauseStartTimeRef.current) {
              // Start pause timer
              bioPauseStartTimeRef.current = Date.now();
              setBioTimerPaused(true);
            }
            if (!bioIsWarmup) {
              setBioStatus("Cover lens completely.");
            }
          }
          
          // Resume timer if locked again after pause
          if (isLocked && bioPauseStartTimeRef.current) {
            bioTotalPausedTimeRef.current += Date.now() - bioPauseStartTimeRef.current;
            bioPauseStartTimeRef.current = null;
            setBioTimerPaused(false);
          }
        }
        
        // Check for low light (only for Face Scan mode)
        if (bioScanMode === "face") {
          const isLowLight = rgb.brightness < 0.15;
          bioLowLightRef.current = isLowLight;
          setBioLowLightWarning(isLowLight);
          
          if (isLowLight && !bioIsWarmup) {
            setBioStatus("Move closer to a soft light source or use the 'Glow UI' to illuminate your face.");
          }
        }

        // Store RGB history
        const now = performance.now();
        bioRGBHistoryRef.current.push({ r: rgb.r, g: rgb.g, b: rgb.b, t: now });
        
        // Keep only last 60 seconds of data
        const rgbWindowMs = 60000;
        while (bioRGBHistoryRef.current.length > 0 && now - bioRGBHistoryRef.current[0].t > rgbWindowMs) {
          bioRGBHistoryRef.current.shift();
        }

        // Different signal extraction based on scan mode
        let processedSignal: number[] = [];
        
        if (bioScanMode === "finger") {
          // Motion-Compensated Contact-PPG Mode: Use GREEN channel (most sensitive to blood volume)
          const greenValues = bioRGBHistoryRef.current.map((s) => s.g);
          if (greenValues.length > 1) {
            // Detrend GREEN channel
            processedSignal = detrendSignal(greenValues);
            
            // Estimate sample rate
            const sampleRate = bioRGBHistoryRef.current.length > 1 
              ? 1000 / ((now - bioRGBHistoryRef.current[0].t) / (bioRGBHistoryRef.current.length - 1))
              : 30;
            
            // Bandpass filter
            processedSignal = butterworthBandpass(processedSignal, sampleRate, 0.7, 3.5);
            
            // Moving average smoothing to remove noise from motion blur
            processedSignal = applyMovingAverage(processedSignal, 5);
          }
        } else {
          // Face Scan mode: Use CHROM algorithm
          const chromSignal = extractCHROM(bioRGBHistoryRef.current);
          
          if (chromSignal.length === 0) {
            bioAnimFrameRef.current = requestAnimationFrame(loop);
            return;
          }

          // Apply signal processing pipeline
          processedSignal = chromSignal;
          
          // 1. Detrending
          processedSignal = detrendSignal(processedSignal);
          
          // 2. Butterworth bandpass filter (0.7Hz - 3.5Hz, 42-210 BPM)
          const sampleRate = bioRGBHistoryRef.current.length > 1 
            ? 1000 / ((now - bioRGBHistoryRef.current[0].t) / (bioRGBHistoryRef.current.length - 1))
            : 30;
          processedSignal = butterworthBandpass(processedSignal, sampleRate, 0.7, 3.5);
          
          // 3. Moving average smoothing
          processedSignal = applyMovingAverage(processedSignal, 5);
        }
        
        // Store filtered signal
        bioFilteredSignalRef.current = processedSignal.slice(-1000);
        
        // Use the latest processed value as the pulse signal
        const avg = processedSignal.length > 0 
          ? processedSignal[processedSignal.length - 1] 
          : (bioScanMode === "finger" ? rgb.g : rgb.g); // Green channel for both modes
        const elapsed = bioScanStartTimeRef.current ? Date.now() - bioScanStartTimeRef.current : 0;
        const SIGNAL_ACQUISITION_MS = 5000;
        const isAcquisitionPhase = elapsed < SIGNAL_ACQUISITION_MS;
        
        // Always collect samples, but mark acquisition phase
        const samples = bioSamplesRef.current;
        samples.push({ t: now, v: avg });

        const windowMs = 60000; // Use full 60-second window for HRV
        while (samples.length && now - samples[0].t > windowMs) {
          samples.shift();
        }

        // Calculate signal strength and quality in real-time
        if (samples.length > 5) {
          const recentValues = samples.slice(-20).map((s) => s.v);
          const mean = recentValues.reduce((acc, v) => acc + v, 0) / recentValues.length;
          const variance = recentValues.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / recentValues.length;
          const stdDev = Math.sqrt(variance);
          
          // Calculate amplitude (peak-to-peak)
          const range = Math.max(...recentValues) - Math.min(...recentValues);
          
          // Detect rhythmic peaks (heartbeat pattern)
          let peakConsistency = 0;
          if (recentValues.length > 10) {
            const centered = recentValues.map((v) => v - mean);
            let peakCount = 0;
            let peakIntervals: number[] = [];
            let lastPeakIdx = -1;
            
            for (let i = 1; i < centered.length - 1; i++) {
              if (centered[i] > centered[i - 1] && centered[i] > centered[i + 1] && centered[i] > stdDev * 0.5) {
                if (lastPeakIdx >= 0) {
                  peakIntervals.push(i - lastPeakIdx);
                }
                lastPeakIdx = i;
                peakCount++;
              }
            }
            
            if (peakIntervals.length > 2) {
              const avgInterval = peakIntervals.reduce((a, b) => a + b, 0) / peakIntervals.length;
              const intervalVariance = peakIntervals.reduce((acc, v) => acc + Math.pow(v - avgInterval, 2), 0) / peakIntervals.length;
              peakConsistency = Math.max(0, 100 - (Math.sqrt(intervalVariance) / avgInterval) * 100);
            }
          }
          
          // Signal strength: combination of amplitude, variance, and peak consistency
          const amplitudeScore = Math.min(100, (range / 0.1) * 100);
          const varianceScore = Math.min(100, (stdDev / 0.05) * 100);
          const strength = (amplitudeScore * 0.4 + varianceScore * 0.3 + peakConsistency * 0.3);
          setBioSignalStrength(Math.max(0, Math.min(100, strength)));
          
          // Signal quality: good if strength > 50 and peaks are consistent
          const quality = strength > 50 && peakConsistency > 40 ? "good" : "low";
          setBioSignalQuality(quality);
          
          // Update waveform for visualization using filtered signal
          const filtered = bioFilteredSignalRef.current;
          if (filtered.length > 0) {
            const filteredMean = filtered.reduce((a, b) => a + b, 0) / filtered.length;
            const filteredStd = Math.sqrt(
              filtered.reduce((acc, v) => acc + Math.pow(v - filteredMean, 2), 0) / filtered.length
            );
            const shaped = filtered.slice(-60).map((v) =>
              Math.max(0, Math.min(1, 0.5 + ((v - filteredMean) / (filteredStd + 0.01)) * 0.3))
            );
            setBioWaveform(shaped);
          } else {
            // Fallback to recent values if filtered signal not ready
            const shaped = recentValues.slice(-60).map((v) =>
              Math.max(0, Math.min(1, 0.5 + (v - mean) * 10))
            );
            setBioWaveform(shaped);
          }
        }

        if (samples.length > 10 && !isAcquisitionPhase) {
          const values = samples.map((s) => s.v);
          const mean =
            values.reduce((acc, v) => acc + v, 0) / values.length;
          const centered = values.map((v) => v - mean);

          let max = -Infinity;
          let min = Infinity;
          for (const v of centered) {
            if (v > max) max = v;
            if (v < min) min = v;
          }
          const amplitude = max - min;

          const diffs: number[] = [];
          for (let i = 1; i < centered.length; i++) {
            diffs.push(centered[i] - centered[i - 1]);
          }
          const diffVar =
            diffs.reduce((acc, v) => acc + v * v, 0) /
            (diffs.length || 1);

          const smoothness = 1 / Math.sqrt(diffVar + 1e-6);
          const raw = amplitude * smoothness * 100;
          const coherence = Math.max(0, Math.min(100, raw));

          const stress = Math.max(0, Math.min(100, 100 - coherence));

          setBioCoherence(coherence);
          setBioStress(stress);
          setHasSessionContext(true);

          if (coherence > 70) {
            setBioStatus("Flow State · Ready for Gnosis");
          } else if (coherence > 40) {
            setBioStatus("Transition State · Softening friction");
          } else {
            setBioStatus("Friction State · High load on the system");
          }

          const shaped = centered.map((v) =>
            Math.max(0, Math.min(1, 0.5 + v * 4))
          );
          setBioWaveform(shaped.slice(-120));
        }

        bioAnimFrameRef.current = requestAnimationFrame(loop);
      };

      bioAnimFrameRef.current = requestAnimationFrame(loop);
    } catch {
      setIsBioScanning(false);
      setBioStatus("Unable to access camera. Check permissions.");
    }
  }, [isBioScanning]);

  const ensurePortalAudio = useCallback(async () => {
    if (typeof window === "undefined") return null;
    if (portalAudioRef.current) return portalAudioRef.current;

    const AudioCtx =
      (window.AudioContext ||
        // Fallback for older Safari
        (window as any).webkitAudioContext) ?? window.AudioContext;

    const ctx = new AudioCtx();

    // Main frequency oscillator (285Hz or 417Hz)
    const gainFrequency = ctx.createGain();
    gainFrequency.gain.value = 0;
    gainFrequency.connect(ctx.destination);

    const oscFrequency = ctx.createOscillator();
    oscFrequency.type = "sine";
    oscFrequency.frequency.value = portalFrequency;
    oscFrequency.connect(gainFrequency);

    // Harmonic saturation bass: 40Hz, 80Hz, 120Hz
    const gainBass = ctx.createGain();
    gainBass.gain.value = 0;
    gainBass.connect(ctx.destination);

    const oscBass40 = ctx.createOscillator();
    oscBass40.type = "sine";
    oscBass40.frequency.value = 40;
    oscBass40.connect(gainBass);

    const oscBass80 = ctx.createOscillator();
    oscBass80.type = "sine";
    oscBass80.frequency.value = 80;
    oscBass80.connect(gainBass);

    const oscBass120 = ctx.createOscillator();
    oscBass120.type = "sine";
    oscBass120.frequency.value = 120;
    oscBass120.connect(gainBass);

    oscFrequency.start();
    oscBass40.start();
    oscBass80.start();
    oscBass120.start();

    const audio = {
      ctx,
      oscFrequency,
      gainFrequency,
      oscBass40,
      oscBass80,
      oscBass120,
      gainBass
    };
    portalAudioRef.current = audio;
    return audio;
  }, [portalFrequency]);

  const updatePortalGains = useCallback(
    (volFrequency: number, volBass: number) => {
      const audio = portalAudioRef.current;
      if (!audio) return;
      const ctx = audio.ctx;
      const vFreq = Math.max(0, Math.min(1, volFrequency / 100));
      const vBass = Math.max(0, Math.min(1, volBass / 100));

      audio.gainFrequency.gain.setTargetAtTime(vFreq, ctx.currentTime, 0.2);
      audio.gainBass.gain.setTargetAtTime(vBass, ctx.currentTime, 0.2);
    },
    []
  );


  const updateAtmosphereVolume = useCallback((vol: number) => {
    const audio = backgroundHumAudioRef.current;
    if (!audio) return;
    const v = Math.max(0, Math.min(1, vol / 100));
    audio.volume = v;
  }, []);

  const togglePortal = useCallback(async () => {
    if (portalActive) {
      const audio = portalAudioRef.current;
      if (audio) {
        const { ctx, oscFrequency, oscBass40, oscBass80, oscBass120, gainFrequency, gainBass } = audio;
        gainFrequency.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
        gainBass.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
        window.setTimeout(() => {
          try {
            oscFrequency.stop();
            oscBass40.stop();
            oscBass80.stop();
            oscBass120.stop();
          } catch {
            // already stopped
          }
          ctx.close();
          portalAudioRef.current = null;
        }, 220);
      }
      const bgAudio = backgroundHumAudioRef.current;
      if (bgAudio) {
        bgAudio.pause();
        bgAudio.currentTime = 0;
      }
      setPortalActive(false);
    } else {
      const audio = await ensurePortalAudio();
      if (audio) {
        updatePortalGains(portalVolumeFrequency, portalVolumeBass);
        updateAtmosphereVolume(portalVolumeAtmosphere);
        
        // Start nature hum audio
        if (!backgroundHumAudioRef.current) {
          const bgAudio = new Audio("/nature-hum.mp3");
          bgAudio.loop = true;
          bgAudio.volume = portalVolumeAtmosphere / 100;
          backgroundHumAudioRef.current = bgAudio;
        }
        try {
          await backgroundHumAudioRef.current.play();
        } catch (err) {
          console.warn("Could not play nature hum:", err);
        }
        
        setPortalActive(true);
      }
    }
  }, [portalActive, ensurePortalAudio, updatePortalGains, updateAtmosphereVolume, portalVolumeFrequency, portalVolumeBass, portalVolumeAtmosphere]);

  useEffect(() => {
    const visualRate = beatFrequency ? Math.max(0.6, 8 / beatFrequency) : 4;

    if (isPlaying) {
      bgControls.start({
        opacity: [0.5, 0.95],
        scale: [1, 1.06],
        transition: {
          duration: visualRate,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut"
        }
      });
    } else {
      bgControls.start({
        opacity: 0.4,
        scale: 1,
        transition: { duration: 0.6, ease: "easeOut" }
      });
    }
  }, [isPlaying, beatFrequency, bgControls]);

  // Animate 4-4-8 breathing circle when Manifestation Portal is active
  useEffect(() => {
    if (!portalActive) {
      breatheControls.stop();
      return;
    }

    breatheControls.start({
      scale: [0.9, 1.08, 1.08, 0.9],
      opacity: [0.5, 0.95, 0.95, 0.5],
      transition: {
        duration: 16, // 4s in, 4s hold, 8s exhale
        repeat: Infinity,
        ease: "easeInOut",
        times: [0, 0.25, 0.5, 1]
      }
    });
  }, [portalActive, breatheControls]);

  useEffect(() => {
    if (!portalActive) return;
    updatePortalGains(portalVolumeFrequency, portalVolumeBass);
    updateAtmosphereVolume(portalVolumeAtmosphere);
  }, [portalActive, portalVolumeFrequency, portalVolumeBass, portalVolumeAtmosphere, updatePortalGains, updateAtmosphereVolume]);

  // Update frequency when toggle changes
  useEffect(() => {
    if (!portalActive) return;
    const audio = portalAudioRef.current;
    if (audio) {
      audio.oscFrequency.frequency.setTargetAtTime(portalFrequency, audio.ctx.currentTime, 0.3);
    }
  }, [portalFrequency, portalActive]);

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
      setHasSessionContext(true);
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

  const handleSaveInsight = () => {
    const note = insightInput.trim();
    if (!note) return;

    const entry: InsightEntry = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      carrierHz: baseFrequency,
      beatHz: beatFrequency,
      note
    };

    setInsightLedger((prev) => [entry, ...prev].slice(0, 200));
    setInsightInput("");
  };

  const resonance = getTodayResonance();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 pt-20 pb-10">
      <motion.div
        className="pointer-events-none absolute -inset-40 -z-10 rounded-full bg-gradient-to-br from-accent/90 via-accent-soft/80 to-accent/20 blur-3xl"
        animate={bgControls}
      />

      <div
        className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-3xl border border-white/5 bg-black/50 p-6 shadow-[0_0_80px_rgba(15,23,42,0.9)] backdrop-blur-2xl pt-24 sm:p-10 sm:pt-24"
        onClick={handleTapToShowMinutes}
      >
        <div className="min-h-[50vh]">
          <AnimatePresence mode="wait">
            {activeTab === "beats" && (
              <motion.div
                key="tab-beats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex flex-col gap-8"
              >
        {/* Luminous Breath Pacer Aura + Ghost Timer Ring — at top of screen */}
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
              className="pointer-events-none fixed left-1/2 top-12 z-0 -translate-x-1/2 sm:top-16"
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
              <div>
                <div className="font-semibold tracking-[0.16em] uppercase text-slate-200">
                  Sacred Carrier
                </div>
                <p className="mt-0.5 text-[0.7rem] text-slate-400">
                  Choose the center frequency that anchors your binaural field.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setBaseFrequency(432)}
                  className={`group flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition ${
                    baseFrequency === 432
                      ? "border-accent-soft/70 bg-white/10 shadow-aura/70"
                      : "border-white/10 bg-white/3 hover:border-accent-soft/50 hover:bg-white/6"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-semibold text-slate-100">432 Hz</span>
                    {baseFrequency === 432 && (
                      <span className="h-2 w-2 rounded-full bg-accent-soft shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                    )}
                  </div>
                  <span className="text-[0.7rem] text-slate-400">Nature</span>
                  <span className="text-[0.65rem] text-slate-500">Grounded & Natural</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBaseFrequency(528)}
                  className={`group flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition ${
                    baseFrequency === 528
                      ? "border-accent-soft/70 bg-white/10 shadow-aura/70"
                      : "border-white/10 bg-white/3 hover:border-accent-soft/50 hover:bg-white/6"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-semibold text-slate-100">528 Hz</span>
                    {baseFrequency === 528 && (
                      <span className="h-2 w-2 rounded-full bg-accent-soft shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                    )}
                  </div>
                  <span className="text-[0.7rem] text-slate-400">Miracle</span>
                  <span className="text-[0.65rem] text-slate-500">Transformation & Love</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBaseFrequency(963)}
                  className={`group flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition ${
                    baseFrequency === 963
                      ? "border-accent-soft/70 bg-white/10 shadow-aura/70"
                      : "border-white/10 bg-white/3 hover:border-accent-soft/50 hover:bg-white/6"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-sm font-semibold text-slate-100">963 Hz</span>
                    {baseFrequency === 963 && (
                      <span className="h-2 w-2 rounded-full bg-accent-soft shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                    )}
                  </div>
                  <span className="text-[0.7rem] text-slate-400">Divine</span>
                  <span className="text-[0.65rem] text-slate-500">Higher Consciousness</span>
                </button>
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

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div>
                <div className="font-semibold tracking-[0.16em] uppercase text-slate-200">
                  Background sound
                </div>
                <p className="mt-0.5 text-[0.7rem] text-slate-400">
                  Layer a sound under the binaural field. Mix with the breath texture.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ambients.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAmbientId(a.id)}
                    className={`rounded-xl border px-2.5 py-1.5 text-left text-[0.7rem] transition ${
                      ambientId === a.id
                        ? "border-accent-soft/70 bg-white/10 text-slate-100"
                        : "border-white/10 bg-white/3 text-slate-300 hover:border-accent-soft/50 hover:bg-white/6"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              {ambientId !== "none" && (
                <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                  <div className="flex items-center justify-between text-[0.7rem] text-slate-400">
                    <span>Background level</span>
                    <span>{ambientVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={ambientVolume}
                    onChange={(e) => setAmbientVolume(Number(e.target.value))}
                    className="w-full accent-accent-soft"
                  />
                </div>
              )}
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

        {hasSessionContext && (
          <section className="mt-3 rounded-2xl border border-white/10 bg-white/5/70 p-[1px]">
            <div className="space-y-3 rounded-2xl bg-slate-950/60 p-4 backdrop-blur-xl sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                    Insight Ledger
                  </h2>
                  <p className="mt-1 text-[0.7rem] text-slate-400">
                    Capture direct knowing that arises as the field settles.
                  </p>
                </div>
                <div className="mt-1 text-right text-[0.7rem] text-slate-400/80">
                  <div>Carrier {baseFrequency.toFixed(1)} Hz</div>
                  <div>Δ {beatFrequency.toFixed(2)} Hz</div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10/60 p-3 shadow-[0_0_30px_rgba(148,163,184,0.35)] backdrop-blur-xl">
                <textarea
                  rows={3}
                  placeholder="Write the exact phrasing of what you now know to be true..."
                  value={insightInput}
                  onChange={(e) => setInsightInput(e.target.value)}
                  className="w-full resize-none border-0 bg-transparent text-[0.8rem] font-light text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-0"
                />
                <div className="mt-2 flex items-center justify-between text-[0.7rem]">
                  <span className="text-slate-400">
                    Direct Knowing
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveInsight}
                    className="rounded-full border border-accent-soft/70 bg-accent-soft/20 px-3 py-1 text-[0.7rem] font-semibold tracking-[0.16em] text-slate-50 shadow-[0_0_20px_rgba(139,92,246,0.7)] transition hover:border-accent-soft hover:bg-accent-soft/30"
                  >
                    Save to Ledger
                  </button>
                </div>
              </div>

              {insightLedger.length > 0 && (
                <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {insightLedger.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-white/10 bg-gradient-to-r from-white/10 via-white/0 to-white/10 px-3 py-2 text-[0.7rem] font-light text-slate-100 shadow-[0_0_22px_rgba(148,163,184,0.45)]"
                    >
                      <div className="flex items-center justify-between text-[0.65rem] text-slate-400/90">
                        <span>
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                        <span>
                          {entry.carrierHz.toFixed(1)} Hz · Δ{" "}
                          {entry.beatHz.toFixed(2)} Hz
                        </span>
                      </div>
                      <p className="mt-1 text-[0.75rem] font-extralight leading-relaxed text-slate-100/95">
                        {entry.note}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <footer className="mt-6 border-t border-white/5 pt-4 text-center text-[0.7rem] tracking-[0.2em] text-slate-500">
          Created by Ojoma Abamu
        </footer>

              </motion.div>
            )}

            {activeTab === "elevation" && (
              <motion.div
                key="tab-elevation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex flex-col gap-8"
              >
        {/* Instant Elevation */}
        <section className={`rounded-2xl border p-4 sm:p-5 ${
          portalFrequency === 285
            ? "border-emerald-500/30 bg-emerald-950/20"
            : "border-purple-500/30 bg-purple-950/20"
        }`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h2 className={`text-xs font-semibold uppercase tracking-[0.22em] ${
                portalFrequency === 285 ? "text-emerald-300" : "text-purple-300"
              }`}>
                Instant Elevation
              </h2>
              <p className={`max-w-md text-[0.75rem] ${
                portalFrequency === 285 ? "text-emerald-100/80" : "text-purple-100/80"
              }`}>
                {portalFrequency === 285
                  ? "285 Hz · Instant Motivation. Close your eyes. Breathe into the vibration. Feel your energy rise."
                  : "417 Hz · Clearing Negative Energy. Close your eyes. Breathe into the vibration. Release what no longer serves."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setHasSessionContext(true);
                void runAwakeningSweep();
                togglePortal();
              }}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                portalActive
                  ? portalFrequency === 285
                    ? "border-emerald-400 bg-emerald-500/20 text-emerald-100 shadow-[0_0_25px_rgba(34,197,94,0.5)]"
                    : "border-purple-400 bg-purple-500/20 text-purple-100 shadow-[0_0_25px_rgba(168,85,247,0.5)]"
                  : portalFrequency === 285
                    ? "border-emerald-500/40 bg-black/40 text-emerald-200 hover:border-emerald-400 hover:bg-emerald-500/10"
                    : "border-purple-500/40 bg-black/40 text-purple-200 hover:border-purple-400 hover:bg-purple-500/10"
              }`}
            >
              <span className={`h-2 w-2 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.9)] ${
                portalFrequency === 285 ? "bg-emerald-400" : "bg-purple-400"
              }`} />
              7-Second Awakening Sweep
            </button>
          </div>

          {/* Frequency Toggle */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPortalFrequency(285)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                portalFrequency === 285
                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-100 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                  : "border-emerald-500/30 bg-black/40 text-emerald-200/60 hover:border-emerald-400/50"
              }`}
            >
              285 Hz · Instant Motivation
            </button>
            <button
              type="button"
              onClick={() => setPortalFrequency(417)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                portalFrequency === 417
                  ? "border-purple-400 bg-purple-500/20 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  : "border-purple-500/30 bg-black/40 text-purple-200/60 hover:border-purple-400/50"
              }`}
            >
              417 Hz · Clearing Energy
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:items-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <motion.div
                className={`flex h-32 w-32 items-center justify-center rounded-full border shadow-[0_0_40px_rgba(34,197,94,0.4)] ${
                  portalFrequency === 285
                    ? "border-emerald-400/60 bg-emerald-500/10"
                    : "border-purple-400/60 bg-purple-500/10 shadow-[0_0_40px_rgba(168,85,247,0.4)]"
                }`}
                animate={portalActive ? breatheControls : { scale: 1, opacity: 0.5 }}
              >
                <div className={`h-20 w-20 rounded-full bg-gradient-to-br ${
                  portalFrequency === 285
                    ? "from-emerald-400/70 via-teal-300/70 to-sky-400/60"
                    : "from-purple-400/70 via-violet-300/70 to-indigo-400/60"
                }`} />
              </motion.div>
              <p className={`text-[0.7rem] ${
                portalFrequency === 285 ? "text-emerald-200/80" : "text-purple-200/80"
              }`}>
                4s In · 4s Hold · 8s Exhale
              </p>
              <p className={`mt-2 max-w-xs text-center text-[0.7rem] italic ${
                portalFrequency === 285 ? "text-emerald-100/90" : "text-purple-100/90"
              }`}>
                {portalFrequency === 285
                  ? "Close your eyes. Breathe into the 285Hz vibration. Feel your energy rise."
                  : "Close your eyes. Breathe into the 417Hz vibration. Release what no longer serves."}
              </p>
            </div>

            <div className="space-y-4 text-[0.75rem] text-slate-200">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${
                    portalFrequency === 285 ? "text-emerald-100" : "text-purple-100"
                  }`}>
                    {portalFrequency} Hz · Frequency Power
                  </span>
                  <span className="text-slate-300">{portalVolumeFrequency}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={portalVolumeFrequency}
                  onChange={(e) => setPortalVolumeFrequency(Number(e.target.value))}
                  className={`w-full ${
                    portalFrequency === 285 ? "accent-emerald-400" : "accent-purple-400"
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${
                    portalFrequency === 285 ? "text-emerald-100" : "text-purple-100"
                  }`}>
                    Earth Vibration
                  </span>
                  <span className="text-slate-300">{portalVolumeBass}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={portalVolumeBass}
                  onChange={(e) => setPortalVolumeBass(Number(e.target.value))}
                  className={`w-full ${
                    portalFrequency === 285 ? "accent-emerald-400" : "accent-purple-400"
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${
                    portalFrequency === 285 ? "text-emerald-100" : "text-purple-100"
                  }`}>
                    Nature Atmosphere
                  </span>
                  <span className="text-slate-300">{portalVolumeAtmosphere}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={portalVolumeAtmosphere}
                  onChange={(e) => setPortalVolumeAtmosphere(Number(e.target.value))}
                  className={`w-full ${
                    portalFrequency === 285 ? "accent-emerald-400" : "accent-purple-400"
                  }`}
                />
              </div>
            </div>
          </div>
        </section>

              </motion.div>
            )}

            {activeTab === "scan" && (
              <motion.div
                key="tab-scan"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex flex-col gap-8"
              >
        {/* Bio-Scan – HRV & Stress */}
        <section className="rounded-2xl border border-cyan-400/30 bg-cyan-950/10 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
                Bio-Scan · HRV & Stress
              </h2>
              <p className="max-w-md text-[0.7rem] text-cyan-100/80">
                {bioScanMode === "face"
                  ? "Uses subtle color shifts (rPPG) to estimate nervous-system coherence from facial blood flow."
                  : "Place fingertip over camera lens for contact-PPG measurement with enhanced signal quality."}
              </p>
              {bioScanMode === "finger" && (
                <p className="max-w-md text-[0.65rem] italic text-amber-200/70">
                  Optimal scan achieved via light touch; avoid pressing hard to keep the sensor cool.
                </p>
              )}
              <p className="max-w-md text-[0.65rem] italic text-cyan-200/70">
                Privacy: Your image is temporary; your frequency is eternal. Video is processed locally and
                never stored or transmitted.
              </p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => void switchScanMode("face")}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                bioScanMode === "face"
                  ? "border-cyan-400 bg-cyan-500/20 text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                  : "border-cyan-500/30 bg-black/40 text-cyan-200/60 hover:border-cyan-400/50"
              }`}
            >
              Face Scan
            </button>
            <button
              type="button"
              onClick={() => void switchScanMode("finger")}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                bioScanMode === "finger"
                  ? "border-cyan-400 bg-cyan-500/20 text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                  : "border-cyan-500/30 bg-black/40 text-cyan-200/60 hover:border-cyan-400/50"
              }`}
            >
              Finger Scan
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
            <div className="flex flex-col items-center gap-3">
              {/* Camera Controls */}
              {isBioScanning && bioScanMode === "finger" && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleFlash()}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border shadow-[0_0_10px_rgba(251,191,36,0.3)] transition ${
                      bioFlashEnabled
                        ? "border-amber-400/60 bg-amber-500/20 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.6)]"
                        : "border-amber-400/30 bg-amber-500/10 text-amber-200/60 hover:bg-amber-500/20"
                    }`}
                    title="Toggle Flash"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="relative flex h-20 w-20 items-center justify-center">
                {/* Finger Alignment Aura Circle (Finger Scan Only) */}
                {isBioScanning && bioScanMode === "finger" && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: bioFingerLocked ? 1 : 0.4,
                      scale: bioFingerLocked ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`h-24 w-24 rounded-full border-2 ${
                        bioFingerLocked
                          ? "border-red-400/80 bg-red-500/20 shadow-[0_0_40px_rgba(248,113,113,0.8)]"
                          : "border-red-400/30 bg-red-500/10 shadow-[0_0_20px_rgba(248,113,113,0.4)]"
                      }`}
                      style={{
                        filter: "blur(8px) brightness(1.2)",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {!bioFingerLocked && (
                        <motion.div
                          className="h-full w-full rounded-full bg-red-400/20"
                          animate={{
                            opacity: [0.3, 0.6, 0.3],
                            scale: [1, 1.05, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                      )}
                    </div>
                    {!bioFingerLocked && (
                      <div className="absolute -bottom-6 text-[0.6rem] text-red-300/80">
                        Cover lens completely.
                      </div>
                    )}
                  </motion.div>
                )}
                
                {/* Countdown ring */}
                {bioScanRemaining !== null && bioScanRemaining > 0 && (
                  <svg className="absolute h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgba(34,211,238,0.2)"
                      strokeWidth="3"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgba(34,211,238,0.8)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={Math.PI * 2 * 45}
                      initial={{ strokeDashoffset: 0 }}
                      animate={{
                        strokeDashoffset: (bioScanRemaining / 60000) * Math.PI * 2 * 45
                      }}
                      transition={{ duration: 0.05, ease: "linear" }}
                    />
                  </svg>
                )}
                <motion.button
                  type="button"
                  onClick={() => {
                    if (isBioScanning) {
                      stopBioScan();
                    } else {
                      void startBioScan();
                    }
                  }}
                  className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border border-cyan-400/30 bg-white/5 backdrop-blur-xl text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-cyan-50 shadow-[0_0_20px_rgba(34,211,238,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  animate={
                    isBioScanning && bioScanRemaining !== null && bioScanRemaining > 0
                      ? {
                          boxShadow: [
                            "0 0 20px rgba(34,211,238,0.4)",
                            "0 0 55px rgba(34,211,238,0.9)",
                            "0 0 20px rgba(34,211,238,0.4)"
                          ],
                          scale: [1, 1.12, 1],
                          opacity: [1, 0.9, 1]
                        }
                      : {
                          boxShadow: "0 0 15px rgba(34,211,238,0.2)",
                          scale: 1,
                          opacity: 1
                        }
                  }
                  transition={
                    isBioScanning && bioScanRemaining !== null && bioScanRemaining > 0
                      ? {
                          duration: 5,
                          repeat: Infinity,
                          repeatType: "loop",
                          ease: "easeInOut"
                        }
                      : { duration: 0.3, ease: "easeOut" }
                  }
                >
                  {isBioScanning && bioScanRemaining !== null && bioScanRemaining > 0 && (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.6, 0.9, 0.6]
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        repeatType: "loop",
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  <span className="relative z-10 text-center leading-tight">
                    {isBioScanning && bioScanRemaining !== null && bioScanRemaining > 0 && !bioIsWarmup
                      ? `${(bioScanRemaining / 1000).toFixed(0)}s`
                      : isBioScanning && bioIsWarmup
                      ? "Acquiring..."
                      : "Bio-Scan"}
                  </span>
                </motion.button>
              </div>
              {/* Signal Strength Indicator */}
              {isBioScanning && (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[0.65rem] text-cyan-100/70">Signal Strength</span>
                    <div className="flex items-end gap-1">
                      {[1, 2, 3].map((bar) => {
                        const barHeight = bioSignalStrength > (bar - 1) * 33 ? Math.min(100, (bioSignalStrength - (bar - 1) * 33) / 33 * 100) : 0;
                        const isActive = bioSignalStrength > (bar - 1) * 33;
                        const color = isActive 
                          ? (bioSignalStrength >= 70 ? "bg-emerald-400" : bioSignalStrength >= 30 ? "bg-amber-400" : "bg-red-400")
                          : "bg-slate-600";
                        return (
                          <div
                            key={bar}
                            className={`w-2 rounded-t transition-all duration-300 ${color} ${
                              isActive ? "shadow-[0_0_8px_currentColor]" : ""
                            }`}
                            style={{ 
                              height: `${4 + barHeight * 0.12}px`,
                              color: isActive ? (bioSignalStrength >= 70 ? "rgba(74,222,128,0.8)" : bioSignalStrength >= 30 ? "rgba(251,191,36,0.8)" : "rgba(248,113,113,0.8)") : "transparent"
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                  {bioSignalStrength < 30 && !bioIsWarmup && (
                    <div className="text-[0.6rem] text-red-300/90 italic">
                      Stabilize finger & increase light.
                    </div>
                  )}
                  {bioSignalStrength >= 70 && !bioIsWarmup && (
                    <div className="text-[0.6rem] text-emerald-300/90 italic">
                      Capturing Resonance.
                    </div>
                  )}
                </div>
              )}
              
              <div className="text-[0.65rem] text-cyan-100/80 text-center">
                {bioStatus ?? "Tap Bio-Scan to begin a short check-in."}
                {isBioScanning && (
                  <div className="mt-2 rounded-lg border border-cyan-400/50 bg-cyan-500/10 px-3 py-2 text-[0.65rem] text-cyan-200/90">
                    Hold phone 6 inches away. Use the zoom circle to align.
                  </div>
                )}
                {bioLowLightWarning && (
                  <div className="mt-2 rounded-lg border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-[0.65rem] text-amber-200/90">
                    Move closer to a soft light source or use the 'Glow UI' to illuminate your face.
                  </div>
                )}
                {bioScanMode === "finger" && bioVibrationLevel > 60 && isBioScanning && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="mt-2 rounded-lg border border-red-400/50 bg-red-500/10 px-3 py-2 text-[0.65rem] text-red-200/90"
                  >
                    Vibration too high. Please keep steady for deep scan.
                  </motion.div>
                )}
              </div>
              
              {/* Results display */}
              <AnimatePresence>
                {bioScanResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="mt-2 max-w-xs space-y-1 rounded-xl border border-cyan-400/40 bg-gradient-to-br from-white/10 via-white/5 to-white/0 p-3 backdrop-blur-xl shadow-[0_0_30px_rgba(34,211,238,0.4)]"
                  >
                    <div className="text-center text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-cyan-100">
                      {bioScanResult}
                    </div>
                    <div className="text-center text-[0.7rem] font-light italic text-cyan-100/90">
                      {bioStatus}
                    </div>
                    {bioCoherence != null && bioCoherence <= 30 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPresetId("relax");
                          setBaseFrequency(432);
                          setTimerMinutes(3);
                        }}
                        className="mt-2 w-full rounded-full border border-emerald-400/70 bg-emerald-500/20 px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-emerald-50 shadow-[0_0_20px_rgba(34,197,94,0.6)] transition hover:bg-emerald-500/30"
                      >
                        Start 432Hz Clear
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="relative">
                {/* Focus Ring Indicator */}
                {isBioScanning && (
                  <div className={`absolute -inset-1 rounded-xl border-2 transition-all duration-300 ${
                    bioFocusQuality > 60
                      ? "border-emerald-400/80 shadow-[0_0_20px_rgba(34,197,94,0.6)]"
                      : "border-amber-400/40 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                  }`}>
                    {bioFocusQuality > 60 && (
                      <motion.div
                        className="absolute -inset-0.5 rounded-xl border border-emerald-400/60"
                        animate={{
                          opacity: [0.6, 1, 0.6],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}
                  </div>
                )}
                <video
                  ref={bioVideoRef}
                  className={`h-32 w-32 rounded-xl border border-cyan-400/50 object-cover shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-opacity ${
                    isBioScanning ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                  style={{
                    transform: bioScanMode === "finger" ? "scale(2.0)" : "scale(1.0)",
                    transformOrigin: "center center"
                  }}
                  playsInline
                  muted
                  autoPlay
                />
              </div>
              <canvas ref={bioCanvasRef} className="hidden" />
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[0.7rem] text-cyan-100/80">
                  <span>The Ojoma Factor · Resilience Meter</span>
                  <span>
                    {bioCoherence != null ? `${bioCoherence.toFixed(0)}%` : "--%"}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400 shadow-[0_0_18px_rgba(34,211,238,0.8)]"
                    style={{ width: `${Math.max(0, Math.min(100, bioCoherence ?? 0))}%` }}
                  />
                </div>
                {bioStress != null && (
                  <div className="flex justify-between text-[0.65rem] text-cyan-100/70">
                    <span>Stress load: {bioStress.toFixed(0)}%</span>
                    <span>
                      {bioCoherence != null && bioCoherence > 70
                        ? "Flow State · Ready for Gnosis"
                        : bioCoherence != null && bioCoherence < 40
                        ? "Friction State · Calm the River"
                        : "Settling…"}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[0.7rem] text-cyan-100/80">
                  <span>Pulse Waveform</span>
                </div>
                <div className="h-24 overflow-hidden rounded-xl border border-cyan-400/30 bg-black/60 p-2 shadow-[0_0_28px_rgba(34,211,238,0.55)]">
                  {bioWaveform.length > 0 ? (
                    <svg viewBox="0 0 200 40" className="h-full w-full text-cyan-300/90" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="waveformGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="rgba(34,211,238,0.3)" />
                          <stop offset="100%" stopColor="rgba(34,211,238,0.9)" />
                        </linearGradient>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      <polyline
                        fill="none"
                        stroke="url(#waveformGradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                        points={bioWaveform
                          .map((v, i) => {
                            const x = (i / Math.max(1, bioWaveform.length - 1)) * 200;
                            const y = 40 - v * 36 - 2;
                            return `${x},${y}`;
                          })
                          .join(" ")}
                      />
                    </svg>
                  ) : (
                    <div className="flex h-full items-center justify-center text-[0.65rem] text-cyan-200/60">
                      Waveform will appear during signal acquisition...
                    </div>
                  )}
                </div>
              </div>

              {bioCoherence != null && (
                <div className="space-y-1.5 text-[0.7rem] text-cyan-100/85">
                  {bioCoherence < 40 && (
                    <div className="flex flex-col gap-1 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3">
                      <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                        Friction State · Calm the River
                      </div>
                      <p className="text-[0.7rem] text-emerald-100/85">
                        Your system is carrying a higher load. A 3-minute 10 Hz Alpha field at 432 Hz can help wash the
                        banks of the river.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPresetId("relax");
                          setBaseFrequency(432);
                          setTimerMinutes(3);
                        }}
                        className="mt-1 inline-flex w-fit items-center rounded-full border border-emerald-400/70 bg-emerald-500/20 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-emerald-50 shadow-[0_0_20px_rgba(34,197,94,0.6)]"
                      >
                        Start Calm the River
                      </button>
                    </div>
                  )}
                  {bioCoherence >= 70 && (
                    <div className="flex flex-col gap-1 rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/10 p-3">
                      <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-fuchsia-100">
                        Flow State · Ready for Gnosis
                      </div>
                      <p className="text-[0.7rem] text-fuchsia-100/85">
                        Coherence is high. The Awakening Sweep and Insight Ledger are primed for clear Direct Knowing.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fixed top navigation */}
        <nav className="fixed top-0 left-0 right-0 z-30 flex items-center justify-center border-b border-white/10 bg-slate-950/95 backdrop-blur-xl">
          <div className="flex w-full max-w-4xl items-center justify-around px-2 py-2">
            <button
              type="button"
              onClick={() => setActiveTab("beats")}
              className={`relative flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition ${
                activeTab === "beats"
                  ? "text-emerald-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <Music2 className="h-5 w-5" />
              <span className="text-[0.65rem] font-medium uppercase tracking-wider">
                Beats
              </span>
              {activeTab === "beats" && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-emerald-400" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("elevation")}
              className={`relative flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition ${
                activeTab === "elevation"
                  ? "text-emerald-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-[0.65rem] font-medium uppercase tracking-wider">
                Elevate
              </span>
              {activeTab === "elevation" && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-emerald-400" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("scan")}
              className={`relative flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition ${
                activeTab === "scan"
                  ? "text-emerald-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <ScanLine className="h-5 w-5" />
              <span className="text-[0.65rem] font-medium uppercase tracking-wider">
                Scan
              </span>
              {activeTab === "scan" && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-emerald-400" />
              )}
            </button>
          </div>
        </nav>

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

