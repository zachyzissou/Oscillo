# Repository Guidelines

## Project Structure & Module Organization

- App entry in `app/` (Next.js). Core code in `src/`:
  - `src/components/` UI, R3F objects, HUD.
  - `src/lib/` audio (Tone.js), physics (Rapier), utils.
  - `src/config/` constants, types, feature flags.
  - `src/shaders/` GLSL/TSL assets.
  - `public/` static files, `public/sw.js` service worker.
  - Tests in `tests/` (unit, e2e, visual, a11y). Server helpers in `server/`.

## Build, Test, and Development Commands

- `npm run dev` Start local dev server at `http://localhost:3000`.
- `npm run build` Create production build (Next.js).
- `npm start` Serve production build.
- `npm run type-check` TypeScript check (`tsc --noEmit`).
- `npm run lint` ESLint with autofix; `npm run lint:check` without fixes.
- `npm test` Unit tests (Vitest). `npm run test:watch` watch mode.
- `npm run test:e2e` Playwright e2e; `npm run test:a11y` accessibility; `npm run test:visual` visual.

## Coding Style & Naming Conventions

- TypeScript, React 19, Next.js 15. Prettier + ESLint (see `eslint.config.js`, `.prettierrc.js`).
- Components/Classes: PascalCase (`ProceduralButton.tsx`). Files: kebab-case or PascalCase for components.
- Hooks start with `use`. Client components using hooks must begin with `"use client"`.
- Co-locate styles and small helpers with components; shaders in `src/shaders/`.

## Testing Guidelines

- Unit: Vitest + Testing Library. E2E/visual/a11y: Playwright.
- Name tests `*.test.ts(x)` or `*.spec.ts(x)` under `tests/` (e.g., `tests/unit/foo.test.ts`).
- Prioritize core flows: load, ModernStartOverlay, audio init, interaction, mobile.
- CI expectation: `npm run type-check && npm run lint && npm run build && npm test` must pass.

## Commit & Pull Request Guidelines

- Branch: `feature/<task>`, `fix/<scope>`, or `chore/<scope>`.
- Commit messages: present tense, concise subject; include scope when useful.
- PRs: clear description, linked issues, before/after screenshots or short video for UI/3D changes, notes on perf/mobile impact.
- Ensure no paid/licensed assets; include docs for new flags/config.

## Security & Configuration Tips

- Initialize Tone.js/audio only after user gesture; avoid SSR `AudioContext` usage.
- Guard browser-only code with dynamic import or `"use client"` and run effects after ModernStartOverlay dismissal.
- Store secrets via env vars; never commit keys. Validate mobile perf (use AdaptiveDpr/LOD where appropriate).

## Development Checklist

- Type-check, lint, build, and unit tests pass locally
- Client-only code guarded; audio init gated by user gesture
- No paid/licensed assets; shaders and assets live under `src/shaders/` or `public/`
- Include screenshots/video for UI/3D changes; note performance/mobile impact

## SSR/Hydration Safety

- Do not create `AudioContext` or import Tone at module scope in runtime code.
- Use `dynamic(..., { ssr: false })` for client-only scenes and include `"use client"` in components with hooks.
- Browser APIs (window/document) belong in effects, not during SSR.
