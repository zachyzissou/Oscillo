# Overhaul Execution Plan

## Purpose
This document captures the agreed roadmap for the Interactive Music 3D overhaul. Each phase has scoped objectives, quality gates, owners (to be assigned), and success metrics. Update this file as deliverables evolve or dates shift.

## Quality Principles
- Track all phases in OpenProject: http://192.168.4.225:5683/projects/oscillo/ (see docs/integrations/openproject.md).
- Keep `npm run type-check`, `npm run lint:check`, `npm run build`, and targeted tests green before merging.
- Record baseline metrics (bundle size, FPS, memory, Lighthouse, test runtimes) before altering core systems.
- Add or update tests when refactoring: unit tests for stores/lib, Playwright coverage for critical flows, and performance sampling where relevant.
- Document new patterns and decisions in `docs/` and reference them from PR descriptions.

## Phase Breakdown

### Phase 1 – Baseline & Alignment
- Capture current metrics: bundle analyzer report, Lighthouse desktop/mobile, Playwright perf (avg/min FPS, memory), CI duration.
- Note environment assumptions: Node/npm versions, Playwright browser cache, Docker base image.
- Create shared tracking board with owners, due dates, risk/mitigation log, and feature flag inventory.

**Quality gates**: metrics recorded in `/docs/metrics/YYYY-MM-DD.md`; tracking board link added to README or docs index.

### Phase 2 – Environment & Dependencies
- Enforce Node >= 20 / npm >= 10 across dev, CI, Docker; regenerate `package-lock.json`.
- Run `npm outdated --long`, `depcheck`, `npm audit`; categorize upgrades vs. removals.
- Remove redundant stacks (duplicate Playwright packages, unused Jest tooling) and document third-party license review.

**Quality gates**: CI fails on unsupported Node version; dependency changelog committed; audit warnings triaged.

### Phase 3 – Config & Tooling Modernization
- Refactor `next.config.js` to drop legacy webpack loaders, rely on Next 15/Turbopack defaults, and isolate PWA config.
- Decide Tailwind strategy (complete v4 migration or revert to stable v3) and configure PostCSS/Tailwind accordingly.
- Harden lint and formatting rules; update `.eslintrc`, `prettier`, optional Stylelint.
- Normalize environment variable docs (`.env.example`, docs/SECURITY.md references).

**Quality gates**: `npm run lint:check` passes with new rules; dev server hot reload stable; config changes documented.

### Phase 4 – TypeScript Guardrails
- Simplify `tsconfig.json` includes/excludes, remove `allowJs`, reintroduce components/stores/hooks to type-check surface.
- Enable stricter compiler options incrementally (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`).
- Fix resulting type errors module by module; introduce `ts-prune` to detect unused exports.

**Quality gates**: `npm run type-check` clean; backlog of remaining type issues tracked; CI gate enforced.

### Phase 5 – Codebase Hygiene & Architecture
- Remove or implement zero-byte and deprecated components, update imports accordingly.
- Decompose large components (e.g., `ImmersiveMusicalUniverse`) into feature modules with documented boundaries.
- Standardize Zustand patterns (selectors, immutability helpers) and introduce shared types for audio/render interactions.
- Produce lightweight architecture diagrams placed in `docs/architecture/`.

**Quality gates**: No unused component stubs; diagrams reviewed; bundle size compared pre/post for regressions.

### Phase 6 – Audio & Plugin System Hardening
- Refactor audio engine into lifecycle-managed service with explicit init/dispose, effect modules, and error handling.
- Add schema validation for presets and plugin storage; sandbox plugin execution with lifecycle hooks.
- Expand unit and integration tests for audio initialization, plugin registration, and storage persistence.

**Quality gates**: Audio-related tests pass deterministically; new API documented in `docs/audio-init.md`; plugins fail gracefully.

### Phase 7 – Rendering & Performance Optimization
- Profile Three.js scene, implement instancing/LOD/adaptive DPR where beneficial.
- Modularize rendering subsystems (lighting, particles, geometry) with memoization and performance hooks.
- Enhance performance telemetry (structured logging, Playwright perf thresholds with `test.setTimeout`).

**Quality gates**: Performance metrics show maintained or improved avg/min FPS; Playwright perf test runs reliably with updated thresholds.

### Phase 8 – Testing & CI Overhaul
- Expand Vitest coverage for stores/lib/hooks; set coverage thresholds.
- Reorganize Playwright suites (smoke, full, perf, a11y) with fixtures and environment selectors.
- Optimize CI workflows: staged jobs, cached browser installs, artifact uploads (bundle analyzer, perf logs).

**Quality gates**: CI pipeline time reduced or stable; coverage reports published; flakes tracked and minimized.

### Phase 9 – Observability, Security, & Ops
- Introduce structured logging (Pino or equivalent) with environment-controlled transports.
- Add Web Vitals telemetry and optional analytics behind consent; update SECURITY.md with data handling notes.
- Harden security posture: headers audit, WebSocket auth, dependency vulnerability remediation, SW behavior review.
- Review deployment workflows and rollback plan.

**Quality gates**: Logging strategy documented; security checklist updated; deploy pipeline tested end-to-end.

### Phase 10 – Documentation, Design System, Release Readiness
- Refresh README, AGENTS, CLAUDE, CONTRIBUTING, and roadmap docs to reflect new practices.
- Establish design tokens/theme alignment, optionally Storybook docs for UI components.
- Final regression checklist executed (unit, e2e, visual, perf, a11y); release automation (changesets/semantic-release) configured.

**Quality gates**: Documentation PR merged; release checklist completed; semantic versioning workflow validated.

## Change Management
- Maintain a running changelog section summarizing progress per phase.
- Capture open questions and risks in the tracking board; escalate blockers quickly.
- Align with stakeholders at each phase boundary before moving forward.

## Next Steps
1. Assign owners and dates to Phase 1 tasks.
2. Create `/docs/metrics` directory and capture baseline snapshot.
3. Update CLAUDE.md and AGENTS.md to reflect this plan (see upcoming commits).
