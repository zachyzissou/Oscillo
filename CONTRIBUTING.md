# Contributing

Thank you for your interest in contributing to Interactive Music 3D!
This guide summarizes how to develop, test, and propose changes. For a concise repo-specific reference, see AGENTS.md (Repository Guidelines).

## Getting Started

- Prereqs: Node 20+, npm 10+.
- Install: `npm ci --legacy-peer-deps`
- Develop: `npm run dev` → http://localhost:3000
- Validate: `npm run type-check && npm run lint && npm run build && npm test`

## Branching & Commits

- Branch names: `feature/<task>`, `fix/<scope>`, `chore/<scope>`
- Commits: short imperative subject, include scope when useful
  - Example: `feat(hud): add performance preset selector`

## Pull Requests

- Keep PRs focused and small; link issues.
- Include: clear description, before/after screenshots or a short video for UI/3D changes, notes on performance/mobile impact.
- CI must pass: types, lint, build, unit/e2e (where applicable).

## Code Style

- TypeScript + React 19 + Next.js 15.
- ESLint + Prettier (respect `eslint.config.js`, `.prettierrc.js`).
- Components/Classes in PascalCase; hooks start with `use`; client components that use hooks must begin with `"use client"`.
- Place shaders in `src/shaders/`; co-locate small helpers with components.

## Testing

- Unit: Vitest + Testing Library (`npm run test:unit`).
- E2E/visual/a11y: Playwright (`npm run test:e2e`, `npm run test:visual`, `npm run test:a11y`).
- Name tests `*.test.ts(x)` or `*.spec.ts(x)` under `tests/`.

## Platform-Specific Notes

- Audio init: Initialize Tone.js only after a user gesture; avoid SSR `AudioContext` usage.
- Hydration safety: Guard browser-only code with dynamic import or `"use client"`; delay renderer/effects until `ModernStartOverlay` dismisses the audio gate.
- Performance: Prefer AdaptiveDpr/LOD, avoid heavy allocations in render loops.

For full repository structure, commands, and conventions, read AGENTS.md.
