# Final Regression Checklist & Release Automation

Use this checklist before publishing a new Oscillo release. Attach the completed list (with links and screenshots/logs) to the release issue and announce the results in the team channel.

## 1. Pre-flight
- [ ] `./scripts/pipeline-smoke.sh` (lint → type-check → unit tests → build); archive logs under `artifacts/pipeline/` and link in the issue.
- [ ] `npm run security:audit` (record output).
- [ ] Verify `.env.example` matches production env keys (telemetry, jam tokens, logging).
- [ ] Update `CHANGELOG.md` with the release tag (`vX.Y.Z`).

## 2. Test Matrix

### 2.1 Unit / Integration
- [ ] `npm run test -- --run` (Vitest). Note any warnings (logger fallbacks acceptable).

### 2.2 Playwright E2E
- [ ] `npm run test:smoke` (chromium smoke flows).
- [ ] `npm run test:e2e` (full desktop suite).
- [ ] `npm run test:a11y` (axe accessibility checks) – capture screenshots of issues if failing.
- [ ] `npm run test:visual` (if baselines are updated) – attach comparison report.

### 2.3 Performance
- [ ] `npm run test:performance` (collect FPS report). Add Playwright trace/metrics to `docs/metrics/YYYY-MM-DD-performance.md`.
- [ ] Lighthouse (desktop + mobile). Store HTML reports in `docs/metrics/` and summarize deltas.

### 2.4 Manual QA
- [ ] Verify telemetry consent flow (first load banner, opt-in/out network traffic).
- [ ] Jam session connectivity with/without `JAM_SERVER_TOKEN` (ensure unauthorized attempts are rejected).
- [ ] Service worker behavior (PWA disabled by default; if enabling, confirm offline cache doesn’t regress audio start).

## 3. Release Automation
- [ ] Ensure `npm run release:prepare` (see below) completes without errors.
- [ ] Tag repo (`git tag -a vX.Y.Z -m "release: vX.Y.Z"`).
- [ ] Push tag and monitor CI/CD.

### 3.1 Changesets / Semantic Release
We use [Changesets](https://github.com/changesets/changesets) to manage version bumps and changelog aggregation.

1. Document changes (if not already):
   ```bash
   npx changeset
   ```
2. Review `.changeset/` and merge into main.
3. When ready to cut a release:
   ```bash
   npm run release:prepare  # runs changeset version + rebuilds lockfile
   git commit -am "chore(release): version X.Y.Z"
   git tag vX.Y.Z
   git push && git push --tags
   ```
4. Run `npm publish` (if shipping to npm) or build/push Docker images as documented in `docs/DEPLOYMENT.md`.

If using `semantic-release`, configure `.releaserc` with the GitLab plugin and ensure the CI job has the necessary tokens; update this doc with the current workflow.

## 4. Post-Release
- [ ] Update `docs/metrics/` with final Playwright/Lighthouse stats.
- [ ] Update `README.md` → “Release History” (if applicable).
- [ ] Verify production telemetry/jam logs for anomalies in the first hour post-deploy.
- [ ] Close the release issue and reference all attached artifacts.

Keep this document evergreen. When a new regression suite is added (e.g., Storybook visual diff), append it here.
