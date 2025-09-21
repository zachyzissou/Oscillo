
# Hydration Safety Guide

A prior bug caused React hydration errors because Tone.js and Three.js
initialized during server-side render. The DOM generated on the server did not
match what the client produced, triggering the infamous React error #185.

## Prevention Checklist

1. Wrap any browser-dependent logic (WebGLRenderer, AudioContext, media playback) behind a user gesture. The `ModernStartOverlay` component (`src/components/ui/ModernStartOverlay.tsx`) is the reference implementation.
2. Use dynamic imports with `{ ssr: false }` for client-only components.
3. Keep procedural randomness and DOM modifications out of initial render on the server.
4. Ensure all components with hooks include the `"use client"` directive.
5. Delay creation of AudioContexts until `startAudio()` is invoked by a click or tap.

Following these steps keeps the server-rendered HTML in sync with the client and
prevents hydration mismatches.
