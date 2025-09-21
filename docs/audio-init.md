
# Audio Initialization Guide

This project defers loading and starting Tone.js until the user interacts with
the page.

1. `ModernStartOverlay` (`src/components/ui/ModernStartOverlay.tsx`) calls `startAudio()` from `src/lib/audio/startAudio.ts` once the user clicks **Start Creating**.
2. The `startAudio()` facade lazily starts Tone.js, updates `useAudioEngine`, and plays the spawn cue after the gesture completes.
3. `initAudioEngine()` sets up synths and effects only once, guarded by a flag to avoid duplicate AudioContexts.
4. Components must avoid touching Tone.js or `AudioContext` at module scope. Import audio helpers dynamically or inside callbacks.
5. Any additional user-triggered audio features should delegate to `startAudio()` (or other helpers within `src/lib/audio/`) to stay hydration-safe.
