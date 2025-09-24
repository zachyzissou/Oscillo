# Repository Guidelines

## Project Structure & Module Organization
- `app/` contains Next.js App Router layouts, routes, and API handlers that bootstrap the experience.
- `src/` holds feature code: `components/` (UI + React Three Fiber), `lib/` (audio, utilities), `store/` (Zustand), `plugins/`, and `shaders/`.
- `server/` keeps Node-side helpers like `jam-server.js`; static assets and the service worker live in `public/`.
- Tests sit under `tests/` (unit, e2e, performance, visual, accessibility); supplemental docs and decision logs stay in `docs/`.

## Build, Test, and Development Commands
- `npm run dev` launches the dev server on port 3000.
- `npm run build && npm start` mirrors production; run `npm run build:analyze` before merging shader-heavy changes.
- Quality gate: `npm run lint:check && npm run type-check && npm test` must stay green prior to pushes.
- Full smoke: `./scripts/pipeline-smoke.sh` runs lint → type-check → tests → build and stores logs in `artifacts/pipeline/`.
- Playwright flows: `npm run test:smoke` for CI quick checks, `npm run test:e2e` for full coverage, `npm run test:a11y` for WCAG validation.
- Security sweep with `npm run security:audit`; rerun after dependency upgrades.

## Coding Style & Naming Conventions
- TypeScript + React 19 use 2-space indentation; ESLint and Prettier auto-fix via `lint-staged`.
- Components and classes adopt PascalCase; hooks begin with `use` and include `'use client'` when touching browser APIs.
- Keep Zustand stores serializable; move complex audio or WebGPU state into `src/lib/` services.
- Favor Tailwind utilities for layout and share design tokens through `src/lib/theme.ts`.

## Testing Guidelines
- Vitest specs live beside code (`SceneComposer.test.tsx`) or under `tests/unit/`; cover audio engines, stores, and shader utilities.
- Playwright suites reside in `tests/e2e/` and `tests/visual/`; mark long scenarios `test.slow()` and capture FPS deltas when visuals change.
- Minimum pre-PR run: `npm run type-check`, `npm run lint:check`, `npm test`, `npm run test:smoke`; provide screenshots or clips for UI updates.

## Commit & Pull Request Guidelines
- Branch naming: `feature/<topic>`, `fix/<scope>`, `chore/<area>` (e.g., `feature/audio-reactive-grid`).
- Commits stay focused with present-tense subjects (`feat(scene): add glb instancing`) and descriptive bodies.
- PRs reference related issues, list verification commands, supply performance comparisons, and document feature flags or env updates.
- Update `docs/feature-flags.md` and `.env.example` when adding toggles or configuration keys.

## Security & Configuration Tips
- Review `docs/environment-assumptions.md` before new setup or CI changes; it lists the supported Node/npm versions, Playwright cache behavior, and Docker base image.
- Keep secrets out of version control; derive new `.env` entries from `.env.example` and store real values locally.
- Self-hosted integrations require entries in `NO_PROXY`; log adjustments in `docs/integrations/`.
- Prefer `npm run gitlab:automation` over manual token edits and record outcomes in the linked tracking task.
- Jam collaboration currently runs without token authentication; keep the service behind trusted networks until UI-based auth is added.
- Web Vitals telemetry stays disabled until users opt in; configure endpoints with `NEXT_PUBLIC_WEB_VITALS_ENDPOINT` (client) and `ANALYTICS_FORWARD_URL`/`ANALYTICS_FORWARD_TOKEN` (server) when needed.
- Structured logging defaults to JSON Pino output; tune with `LOG_LEVEL`, `LOG_PRETTY`, and `LOG_TO_FILE` per environment. File sinks write to `${LOG_DIR}/${LOG_FILE}` (defaults to `./logs/app.log` locally, `/app/logs/app.log` in containers).
- Jam collaboration now supports token + origin enforcement; set `JAM_SERVER_TOKEN`, `JAM_ALLOWED_ORIGINS`, and mirror `NEXT_PUBLIC_JAM_TOKEN` when running outside localhost. Do not expose the WebSocket endpoint without one of those controls.
- Always run `./scripts/pipeline-smoke.sh` before tagging a release and attach the generated logs under `artifacts/pipeline/` to the release issue.
