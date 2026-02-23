# Oscillo

> Interactive 3D music sandbox with AI composition, spatial rendering, and collaborative WebSocket sessions.
> Status: `Production` (actively maintained)

![CI](https://github.com/zachyzissou/Oscillo/actions/workflows/baseline-ts-ci.yml/badge.svg?branch=main)
![License](https://img.shields.io/github/license/zachyzissou/Oscillo)
![Security](https://img.shields.io/badge/security-SECURITY.md-green)

## Overview

Oscillo is a Next.js-based music + visual playground that merges AI-driven composition with real-time WebGL/WebGPU interaction.
Users can manipulate 3D entities, trigger synthesis/audio layers, and collaborate in shared jam sessions.
This repository also provides a release-oriented workflow (build/publish + deploy) for self-hosted Docker environments.

## Problem / value

- **Problem:** Creating expressive browser-based music visuals and collaborative sessions usually requires many disconnected tools and manual tuning paths.
- **Value:** Oscillo ships an integrated scene, control surface, and deployment pipeline with repeatable checks and documented operator flows.
- **Users:** Indie creators, contributors, maintainers, and self-host operators deploying to Unraid/home infra.

## Architecture

```text
Browser (App Router UI) --> Next.js server --> API routes/plugins --> audio engine
             |                                  |
             +--> 3D scene (R3F/three.js)         +--> Jam WebSocket server (Node)
             |                                  |
             +--> logs + analytics --> observability artifacts
```

## Features

- ✅ Three-dimensional scene controls with audio-reactive behavior.
- ✅ AI composition tools powered by Magenta.js.
- ✅ Jam session controls and tokenized collaboration endpoints.
- ✅ Playwright + Vitest validation for smoke/e2e/visual/security/perf tracks.
- ✅ Docker and GHCR publishing workflow.
- ⏳ Planned: stricter release gate matrix for long-tail regressions and baseline governance docs.

## Tech Stack

- Runtime: Node.js 20+, npm
- Framework: Next.js 15 (App Router), React 19, TypeScript
- Rendering: three.js, @react-three/fiber, @react-three/drei
- Audio: Tone.js, Magenta.js
- Tooling: Vitest, Playwright, ESLint, Prettier, Husky, GitHub Actions
- Deployment: Docker, GHCR

## Prerequisites

- Node.js 20.17+
- npm 10+
- Docker 24+ (for local deployment testing)
- Optional: Playwright browser dependencies if running E2E locally

## Installation

```bash
git clone https://github.com/zachyzissou/Oscillo.git
cd Oscillo
npm ci
npm run dev
```

Application defaults to `http://localhost:3000`.

## Configuration

| Key | Required | Default | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_ENABLE_PWA` | no | `false` | Service worker toggle |
| `NEXT_PUBLIC_WEB_VITALS_ENDPOINT` | no | (none) | Optional Web Vitals sink |
| `ANALYTICS_FORWARD_URL` | no | (none) | Optional telemetry endpoint |
| `JAM_SERVER_PORT` | no | `3030` | Jam websocket listener |
| `JAM_ALLOWED_ORIGINS` | no | `http://localhost:3000` | Allowed websocket origins |
| `LOG_LEVEL` | no | `info` | `info` / `debug` / `warn` |
| `LOG_TO_FILE` | no | `true` | Toggle file logging |

## Usage

```bash
# Standard dev loop
npm run dev
```

```bash
# Production run
npm run build && npm run start
```

```bash
# Release/pipeline smoke path
./scripts/pipeline-smoke.sh
```

```text
$ npm run test -- --run
✓  42 passed
$ npm run lint:check
✓  No warnings
```

## Testing & quality

```bash
npm run lint:check
npm run type-check
npm run test -- --run
npm run test:smoke
```

Recommended additional checks:
- `npm run test:e2e`
- `npm run test:visual`
- `npm run test:performance`
- `npm run test:a11y`


## Security

- Report vulnerabilities through [SECURITY.md](./SECURITY.md)
- Never commit secrets (`.env`, API keys, jam tokens)
- Keep branch protections and required checks active on `main`
- Prefer short-lived tokens for deployment and telemetry services

## Contributing

1. Open/verify an issue before major feature work.
2. Keep PRs scoped and docs + tests updated.
3. Run relevant checks and paste results in PR body.
4. Follow release checklist in `docs/release-checklist.md`.
5. Include deployment/rollback note for pipeline-impacting changes.

## Deployment / runbook

- Deploy flow includes build, test, publish, and container rollout.
- Rollback: redeploy previous container image tag and restart service.
- Emergency actions: pause publish job, keep previous `ghcr.io/...:latest` image in use.

## Troubleshooting

- **Startup warnings about missing env vars**: confirm `NEXT_PUBLIC_*` and `JAM_*` settings.
- **Playwright failures in CI**: re-run with `CI=true` and clear browser cache artifacts.
- **Audio crackle/lag**: reduce performance preset and check GPU throttling.
- **Jam connect failures**: verify origins/token and server port alignments.

## Observability

- Health status endpoints are available from API routes.
- Build/test artifacts are uploaded by workflows (`playwright-report`, `test-results`).
- Structured logs available via `LOG_TO_FILE` and stdout for container collection.

## Roadmap

- Baseline README and governance adoption across all delivery docs.
- Expand chaos/failure-mode testing for collaborative jam sessions.
- Improve accessibility and performance budgets by endpoint and route.
- Harden changelog/release hygiene in alignment with template-driven PR gates.

## Known risks

- Browser GPU variability can affect rendering consistency.
- Unusual device capabilities can alter audio/visual frame budgets.
- Complex deploy pipeline has multiple long-running jobs and higher transient noise.

## Release notes / changelog

- Current release notes are driven by changesets + release automation.
- This change adds governance baseline (README/issue/security/ci) with no runtime behavior change.

## License & contact

- License: repository license terms in `LICENSE` / `package.json`
- Maintainer: `@zachyzissou`
- Security reporting: see [SECURITY.md](./SECURITY.md)
