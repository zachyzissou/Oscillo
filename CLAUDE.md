# CLAUDE.md

Guidance for Claude Code when collaborating on Interactive Music 3D. Follow the overhaul plan documented in `docs/overhaul-plan.md` and keep quality gates in mind for every change.

## Working Agreements
- Sync task tracking with OpenProject (http://192.168.4.225:5683/projects/oscillo/); see docs/integrations/openproject.md for API usage.
- Stay aligned with the 10-phase overhaul roadmap; reference it in planning and PR descriptions.
- Preserve a green baseline: always run `npm run type-check`, `npm run lint:check`, and scoped tests for touched areas. For full release validation use `./scripts/pipeline-smoke.sh` (lint → type-check → tests → build).
- Prefer incremental, feature-flagged changes. Document assumptions and metrics before/after significant refactors.
- Defer to documentation in `docs/` (audio, performance, architecture) and update it when behavior changes.

## Environment & Tooling
- Required runtime: Node 20.17.0 (LTS) with npm 10.8+. CI enforces these versions via `scripts/check-node.js`.
- Install dependencies with `npm install`; avoid legacy flags unless noted.
- Playwright browsers must be installed via `npx playwright install` before running E2E tests locally.

## Development Commands
- `npm run dev` – start Next.js dev server at `http://localhost:3000` (Turbopack).
- `npm run build` – production build.
- `npm start` – serve production output.
- `npm run lint` – ESLint with autofix.
- `npm run lint:check` – ESLint without fixes.
- `npm run type-check` – TypeScript check (`tsc --noEmit`).
- `./scripts/pipeline-smoke.sh` – Runs lint → type-check → tests → build and captures logs.

## Testing Commands
- `npm test` / `npm run test:unit` – Vitest unit suites.
- `npm run test:watch` – Vitest watch mode.
- `npm run test:e2e` – Playwright suite (chromium + mobile profile by default).
- `npm run test:smoke` – targeted Playwright smoke flow.
- `npm run test:performance` – desktop FPS performance test (long-running; ensure extended timeout).
- `npm run test:visual` – Playwright visual regression (requires reference snapshots).
- `npm run test:a11y` – Accessibility sweeps via Playwright + axe.

## Debug & Diagnostics
- `npx playwright show-report` – open last Playwright report.
- `npm run build:analyze` – bundle analyzer (Next.js analyzer plugin).
- `npm run security:audit` – `npm audit --audit-level moderate`.

## Architecture Snapshot
- **Next.js 15 (App Router)** for hybrid server/client rendering.
- **React 19** concurrent features.
- **Three.js 0.178**, **@react-three/fiber/drei/postprocessing** for 3D scene.
- **Tone.js 15**, **Magenta.js** for audio synthesis/AI composition.
- **Zustand 5** for state (selector-based patterns, no heavy objects in stores).
- **Tailwind CSS** for styling (migration path defined in overhaul plan).

```
app/                    # App Router entrypoints, layouts, API routes
src/
  components/          # UI, R3F objects, HUD layers
  lib/                 # Audio engine, utilities, events, logging
  plugins/             # Runtime plugin framework and loader
  store/               # Zustand stores (primitives + derived selectors)
  shaders/             # GLSL/WGSL assets
  types/               # Shared TypeScript definitions
```

## State Management Principles
- Stores expose `getState` selectors and action methods only; never store Three.js meshes, Tone nodes, DOM refs, or React components.
- Use IDs to reference runtime objects kept in service layers (audio, scene managers).
- Keep state mutations immutable (immer middleware preferred) and type actions explicitly.

## Audio & Plugin Guidance
- Audio initialization must flow through the centralized facade (`startAudioContext`, `initAudioEngine`).
- Do not instantiate `AudioContext` or load Tone at module scope. Gate on user gesture and ModernStartOverlay dismissal.
- Plugin API must be accessed via `PluginManager`; ensure errors are caught and surfaced.
- When modifying presets/effects, update schema definitions and persistence rules in `docs/audio-init.md`.

## Rendering & Performance
- Major scene work happens in `ImmersiveMusicalUniverse` and visual submodules—plan to decompose per Phase 5/7 tasks.
- Maintain adaptive quality controls (AdaptiveDpr, detect-gpu) and monitor `performanceMonitor` output.
- Benchmark changes using Playwright performance suite; adjust thresholds, not relax, unless approved.

## Testing Expectations
- Augment unit tests when touching lib/store modules; aim for deterministic tests (mock Web Audio / R3F where necessary).
- For Playwright, use provided fixtures (`tests/e2e/utils`) and mark long tests `test.slow()` to respect CI limits.
- Visual tests require updated baselines reviewed by design owners.

## Common Issues & Mitigations
- **Audio gated**: ensure `startExperience` helper or overlay triggers `startAudioContext`.
- **Context loss**: use error boundaries and effect cleanup; see `docs/performance.md`.
- **Build failures**: clear `.next`, ensure Node 20, rerun `npm install`; check `tsconfig` excludes before disabling checks.
- **Mobile perf**: rely on adaptive DPR, limit post-processing effects, and validate touch targets.

## Documentation & Communication
- Update `docs/overhaul-plan.md` when scope or sequencing changes.
- Log significant decisions as ADRs or in existing docs (`docs/architecture.md`).
- Coordinate with maintainers before changing global config, deployment, telemetry, or logging behavior. Reference `docs/logging-strategy.md`, `docs/security-checklist.md`, and `docs/DEPLOYMENT.md` when adjusting ops workflows.

## Deployment Reminders
- Production deploy uses Next.js standalone output; Dockerfile expects Node 20 image.
- Service worker (next-pwa) is opt-in—confirm behavior in staging before enabling in prod.
- `/api/health` should remain fast and dependency-free.
