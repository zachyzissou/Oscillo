
## [Unreleased] - 2025-09-22

### Added

- Structured logging via Pino with environment-controlled transports (server runtime + jam server).
- Web Vitals telemetry endpoint and consent-driven toggle (`app/api/metrics/web-vitals`, `useTelemetryConsent`).
- Deployment pipeline smoke script (`scripts/pipeline-smoke.sh`) and logging/comment automation helper (`scripts/gitlab-comment.mjs`).
- Security and ops checklists (`docs/security-checklist.md`, `docs/metrics/README.md`).

### Changed

- Hardened WebSocket auth, service-worker gating, and CSP headers (`next.config.js`, `server/jam-server.js`, `src/lib/jamSession.ts`, `src/lib/registerServiceWorker.ts`).
- Refreshed README, CLAUDE.md, CONTRIBUTING.md, AGENTS.md with new operational guidance.
- Updated deployment runbook, logging strategy, overhaul plan, and security docs to reflect the new workflow.
- Removed unused Radix UI/audio helper dependencies (see `docs/dependencies/2025-09-24-stack-cleanup.md`).

## [Unreleased] - 2025-07-01

### Added

* Modernized BottomDrawer UI with glass-panel and neon controls
* Plugin runtime restored under `src/plugins/` with context-aware loader
* Shared Playwright helper `startExperience` to drive overlay dismissal

### Changed

* Audio engine initialization now retries with exponential backoff and reports status through `useAudioEngine`
* Legacy canvas scenes consume QUALITY_PROFILES and surface the active tier HUD
* Performance monitor highlights budget violations inside `PerformanceOverlay`

### Fixed

* Playwright specs interact with the ModernStartOverlay reliably across desktop/mobile runs

## [Unreleased] – 2025-06-24

### Added

* Full-screen `<Canvas>` wrapper with animated gradient backdrop
* Corner FAB component for spawning shapes
* `BottomDrawer` component with Motion One slide animations
* `useSelectedShape` and `useEffectSettings` Zustand stores
* Tailwind CSS, Motion One and `@react-three/drei` dependencies documented
* Revised README with new architecture tree
* GitHub Actions caching and BuildKit-based Docker layer cache

### Changed

* Removed legacy `SpawnMenu`, `SoundPortals`, and fixed `EffectsPanel`
* Refactored `app/page.tsx` for drawer integration and responsive styling

### Removed

* Outdated README sections on web workers and performance tables

### Fixed

* AudioContext now starts on first user gesture

## [Unreleased] – 2025-06-25

### Added

* 3D spawn button with GLSL warp
* Audio-reactive shader deformation
* Performance presets (Low/Medium/High)
* Simple vs. Advanced drawer modes
* Responsive canvas resizing

### Changed

* Unified BottomDrawer as sole control surface

## [Unreleased] – 2025-06-26

### Added

* WebGPU renderer with auto detection and WebGL fallback (MetalFX Canvas)
* AR & VR support via WebXR buttons (SpaceCanvas XR)
* Real-time multiplayer through WebRTC signaling (AirJam Sessions)
* Magenta.js integration for AI generated melodies (Magic Melody)
* Hydration safety guide and `InteractionGate` component template
