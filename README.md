# Interactive Music 3D (Oscillo)

Next-generation audio-reactive 3D music playground with AI composition, WebGPU rendering, and collaborative jam sessions.

---

## 🛠️ Prerequisites

- Node.js 20.17+
- npm 10.8+
- Optional: Docker 24+, Playwright browsers (`npx playwright install`)

### **Initial Setup**

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Install Playwright browsers** (optional when not touching E2E)
   ```bash
   npx playwright install
   ```

3. **Security audit**
   ```bash
   npm audit fix
   # Review and apply security patches
   ```

### **Development**

1. **Local development server**
   ```bash
   npm run dev
   # → http://localhost:3000
   # Hot reload enabled with TypeScript checking
   ```

2. **Production build & test**
   ```bash
   npm run build
   npm run start
   # → http://localhost:3000 (production mode)
   ```

3. **Testing & validation**
   ```bash
   npm run lint:check   # ESLint (no warnings allowed)
   npm run type-check   # TypeScript (tsc --noEmit)
   npm run test -- --run   # Vitest test suites
   ```

4. **Full smoke script**
   ```bash
   ./scripts/pipeline-smoke.sh   # runs lint → type-check → tests → build and stores logs in artifacts/pipeline/
   ```

5. **Release automation**
   ```bash
   npx changeset           # document version changes
   npm run release:prepare  # version bump + build sanity check
   ```
   See `docs/release-checklist.md` for the regression matrix and final steps.

### **PWA Installation**

- Desktop: Look for "Install" button in address bar
- Mobile: Use "Add to Home Screen" from browser menu
- Offline mode: Basic caching via service worker
  Service worker files (`public/sw.js`, `public/workbox-*.js`) are generated during `next build` and are ignored in version control.

### **Environment Configuration**

Environment defaults live in **`.env.example`**. Copy it to `.env.local` (or the deployment secret store) and adjust as needed.

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_ENABLE_PWA` | `false` | Toggle service worker registration; keep disabled until PWA is vetted |
| `NEXT_PUBLIC_WEB_VITALS_ENDPOINT` | _(blank)_ | Optional client override for Web Vitals ingestion route |
| `ANALYTICS_FORWARD_URL` | _(blank)_ | Optional server-to-server forwarding target for Web Vitals metrics |
| `ANALYTICS_FORWARD_TOKEN` | _(blank)_ | Bearer token paired with `ANALYTICS_FORWARD_URL` when required |
| `LOG_DIR` | `./logs` | Directory where server-side log files are written (containers should override to `/app/logs`) |
| `LOG_FILE` | `app.log` | Log filename when `LOG_TO_FILE=true` |
| `LOG_LEVEL` | `info` | Structured logging level (`info`, `debug`, `error`, etc.) |
| `LOG_TO_FILE` | `true` | Persist logs to disk; set `false` when shipping logs via stdout collectors |
| `LOG_PRETTY` | `false` | Pretty-print logs locally; leave `false` in production for JSON ingestion |
| `JAM_SERVER_PORT` | `3030` | Jam WebSocket server port (Node service) |
| `JAM_ALLOWED_ORIGINS` | `http://localhost:3000,https://localhost:3000` | Comma-separated list of allowed WebSocket origins |
| `JAM_SERVER_TOKEN` | _(blank)_ | Optional shared secret required for Jam WebSocket joins |
| `NEXT_PUBLIC_JAM_SERVER_URL` | _(blank)_ | Override WebSocket URL in the browser (defaults to same host + `JAM_SERVER_PORT`) |
| `NEXT_PUBLIC_JAM_SERVER_PORT` | _(blank)_ | Override only the port portion of the WebSocket URL |
| `NEXT_PUBLIC_JAM_TOKEN` | _(blank)_ | Client-side copy of `JAM_SERVER_TOKEN` when token auth is enabled |
| `GITLAB_URL` / `GITLAB_PROJECT_ID` | `http://192.168.4.225:9080` / `2` | Used by automation scripts to interact with the self-hosted GitLab |
| `GITLAB_TOKEN` | _(blank)_ | Personal access token (`read_api`/`write_api`) for GitLab automation scripts |

See `docs/SECURITY.md`, `docs/logging-strategy.md`, and `docs/DEPLOYMENT.md` for per-environment guidance and hardening steps. For a complete list of tooling expectations, refer to `docs/environment-assumptions.md`.

### **Operational Checklists**
- `docs/security-checklist.md` — release security runbook and WS auth verification
- `docs/DEPLOYMENT.md` — build/publish/rollback workflow
- `docs/release-checklist.md` — final regression matrix + release automation steps
- `docs/metrics/README.md` — template for capturing performance/bundle deltas per phase
- `docs/design-system.md` — canonical design tokens and theming guidelines
- `unraid/oscillo.xml` — Unraid Docker template referencing `ghcr.io/zachgonser/oscillo:latest`
- Docker: See `docker-compose.yml` for container deployment

---

## 🎮 User Interface & Controls

### **3D Scene Interaction**
- **Spawn Button** — 3D "+" mesh in bottom-left corner for creating new musical objects
- **Shape Selection** — Left-click any shape to select and trigger its audio
- **3D Manipulation** — Drag shapes around the scene with physics-based movement
- **Camera Controls** — Mouse/touch to orbit, zoom, and pan the 3D view

### **Bottom Drawer UI**
- **Collapsed State** — Shows only the spawn control when no shape is selected
- **Expanded State** — Slides up when a shape is selected, revealing:
  - **Mode Tabs**: Note | Chord | Beat | Loop
  - **Playback Controls**: Play/Pause, volume, tempo
  - **Effect Controls**: Simple vs. Advanced effect chain
  - **Performance Presets**: Eco | Balanced | Pro quality modes
  - **Settings Tab**: Performance level chooser, haptic/FPS toggles, telemetry consent, and jam connection status
  - **AI Generation**: Magenta.js composition controls

### **Audio Controls Panel**
- **Master Volume** — Global audio output level
- **Audio Analyzer** — Real-time frequency spectrum visualization
- **Effect Chain** — Reverb, delay, chorus, distortion, bitcrusher controls
- **Recording** — Capture and export your musical creations
- **Bass Sensitivity** — Adjust shader response to low frequencies

---

## 🏛️ Architecture & Tech Stack
- Next.js 15 (App Router), React 19 concurrent features
- Three.js 0.178, @react-three/fiber/drei/postprocessing
- Tone.js 15, Magenta.js for music generation
- Zustand 5 (stateless selectors, persisted stores)
- Tailwind CSS + custom utilities for neon/glass aesthetics
- Pino logging (JSON stdout + optional file sink)
- Playwright + Vitest for regression suites

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

## Testing Philosophy
- Unit/integration: Vitest in `src/__tests__` and alongside modules
- E2E: Playwright suites (`npm run test:smoke`, `npm run test:e2e`, `npm run test:visual`, `npm run test:a11y`, `npm run test:performance`)
- Release gating: run the final regression checklist (`docs/release-checklist.md`) before tagging/publishing

---

## 📦 Deployment
- Multi-stage Dockerfile produces standalone Next build
- Health endpoint: `/api/health`
- Logs written to stdout + `${LOG_DIR}/${LOG_FILE}` (default `./logs/app.log`)
- Jam WebSocket service (`server/jam-server.js`) defaults to `ws://localhost:3030`; secure via VPN/token when exposed

Refer to `docs/DEPLOYMENT.md` for full rollout/rollback procedures.

---

## 🤝 Contributing
- Guidelines: `CONTRIBUTING.md`, `AGENTS.md`, `CLAUDE.md`
- Always run `./scripts/pipeline-smoke.sh` before pushing
- Document changesets (`npx changeset`) and keep docs in sync with behavior

---

## 📚 Additional Docs
- `docs/architecture.md` — high-level diagram and decisions
- `docs/audio-init.md` — audio engine lifecycle
- `docs/performance.md` — rendering budgets, profiling guidance
- `docs/security-checklist.md` — release security steps
- `docs/testing.md` — testing strategy and environment setup

Stay aligned with the overhaul roadmap in `docs/overhaul-plan.md`. All GitLab issues should cite the relevant phase/task label (`[OSCILLO]` prefix).
