
## [Unreleased] - 2025-09-22

### Changed

- Converted Tailwind configuration to TypeScript (`tailwind.config.ts`) and formalized the neon/glass design system utilities for Tailwind v4.
- Upgraded the Vite/Vitest toolchain (`vite@7.1.7`, `vitest@3.2.4`, `@vitejs/plugin-react@5.0.3`) with updated CI flags to replace the deprecated `--runInBand`.

### Documentation

- Recorded the Tailwind v4 decision and config modernization in `docs/overhaul-plan.md` and `docs/ROADMAP.md`.
- Logged the Vite/Vitest upgrade and CLI changes in `docs/dependencies/2025-09-22-vite-vitest-upgrade.md` and GitLab integration docs.

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
