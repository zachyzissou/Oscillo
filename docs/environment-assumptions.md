# Environment Assumptions

These are the baseline expectations for local development, CI, and production environments. Keep this document in sync with `.nvmrc`, `Dockerfile`, and runtime guards (`scripts/check-node.js`).

## Runtime Versions
- **Node.js:** 20.17.0 LTS (matches `.nvmrc` and Docker base image)
- **npm:** 10.8.0 or newer
- Run `node scripts/check-node.js` to enforce the minimum versions before installing dependencies or running the smoke script.

## Package Management
- Install dependencies with `npm ci`/`npm install`; avoid mixing package managers.
- Regenerate `package-lock.json` only with Node 20.17.0 to prevent engine drift.

## Playwright Browser Cache
- Install Playwright browsers after dependency installs: `npx playwright install` (CI images should cache the resulting `.cache/ms-playwright`).
- Linux runners that lack system dependencies should use `npx playwright install --with-deps`.

## Docker & Containers
- Base image: `node:20.17.0-alpine` as defined in the Dockerfile.
- Containers expect `/app/logs` and `/app/uploads` bind mounts; ensure volumes exist in Unraid/Docker Compose.

## Tooling & Scripts
- `./scripts/pipeline-smoke.sh` assumes the version guard has already run and writes outputs to `artifacts/pipeline/`.
- Scripts under `scripts/gitlab-*.mjs` read GitLab connection details from `.env.local` (`GITLAB_URL`, `GITLAB_PROJECT_ID`, `GITLAB_TOKEN`).

## Optional Services
- Jam WebSocket server tokens (`JAM_SERVER_TOKEN`, `NEXT_PUBLIC_JAM_TOKEN`, `NEXT_PUBLIC_JAM_SERVER_URL`) must be configured for collaborative sessions; defaults are blank.
- Web Vitals forwarding (`NEXT_PUBLIC_WEB_VITALS_ENDPOINT`, `ANALYTICS_FORWARD_URL`, `ANALYTICS_FORWARD_TOKEN`) remains disabled unless explicitly set.

Keep this file updated whenever runtime versions or tooling expectations change.
