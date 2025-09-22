# Repository Guidelines

## Overhaul Focus & Workflow
- Follow the 10-phase roadmap in `docs/overhaul-plan.md`; update it when scope or sequencing changes.
- Maintain a green baseline: run `npm run type-check`, `npm run lint:check`, and relevant tests before pushing.
- Capture before/after metrics (bundle size, FPS, memory) for performance-sensitive work and record them in `/docs/metrics/`.
- Use feature flags for in-progress refactors; document toggles and fallback paths in PR descriptions.

## Project Structure
- `app/` contains the Next.js App Router entry, layouts, and API routes.
- Core implementation lives in `src/`: components (UI + R3F), lib (audio, utilities, logging), store (Zustand), plugins, shaders, and types.
- Static assets and the service worker belong in `public/`; server helpers and WS services live in `server/`.
- Tests reside under `tests/` (unit, e2e, perf, visual, a11y). Additional docs are in `docs/`.

## Build, Test, and QA Commands
- `npm run dev` (Turbopack), `npm run build`, `npm start`.
- Linting: `npm run lint` (with fixes), `npm run lint:check` (verify only).
- Types: `npm run type-check`.
- Unit tests: `npm test` / `npm run test:unit`; watch via `npm run test:watch`.
- Playwright: `npm run test:smoke`, `npm run test:e2e`, `npm run test:performance`, `npm run test:visual`, `npm run test:a11y`.
- Diagnostics: `npm run build:analyze`, `npm run security:audit`, `npx playwright show-report`.

## Coding Standards
- TypeScript + React 19. Components/classes use PascalCase; hooks start with `use` and require `'use client'` for browser APIs.
- Store only primitives/serializable data in Zustand; manage complex objects via services.
- Prefer small, focused modules; refactor oversized files per Phase 5/7 objectives.
- Prettier + ESLint enforce formatting; configure additional rules before modifying repo-wide settings.

## Testing Expectations
- Write Vitest coverage for libraries, stores, and hooks touched by your changes.
- Extend Playwright suites when altering core flows (ModernStartOverlay, audio gating, performance overlays).
- Mark long-running Playwright tests `test.slow()` and align thresholds with perf metrics.
- CI requirements: `npm run type-check && npm run lint && npm run build && npm test` (plus targeted suites for branch protections).

## Collaboration & Delivery
- Track overhaul work in OpenProject: http://192.168.4.225:5683/projects/oscillo/ (credentials & API usage in docs/integrations/openproject.md).
- Branch naming: `feature/<task>`, `fix/<scope>`, `chore/<scope>`.
- Commits: concise present-tense messages (e.g., `feat(scene): add adaptive lights`).
- PRs: include scope summary, linked issues, screenshots/video for visual changes, performance comparison when applicable, and doc updates.
- Keep secrets/env config out of repo; use `.env.example` as source of truth.
- Coordinate with maintainers before modifying deployment, telemetry, or feature flags.
