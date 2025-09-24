# Metrics Archive

Use this folder to store dated references (e.g., `2025-09-24-performance.md`, `2025-09-24-lighthouse.md`) when capturing QA evidence for releases.

## Telemetry & Consent
- Web Vitals originate from `app/reportWebVitals.ts` and arrive at `/api/metrics/web-vitals` once the user opts in via the in-app toggle.
- Configure `ANALYTICS_FORWARD_URL` / `ANALYTICS_FORWARD_TOKEN` to forward metrics externally; otherwise data stays local.
- Consent state persists under `localStorage` key `oscillo.analytics-consent` and can be changed in the Bottom Drawer → Settings tab.

## Collecting Artifacts
1. Enable telemetry in the UI if you’re gathering production metrics.
2. Run `./scripts/pipeline-smoke.sh` to generate lint/type/test/build logs (`artifacts/pipeline/`).
3. For regression evidence attach:
   - Playwright performance traces (`npm run test:performance`).
   - Lighthouse HTML reports (desktop & mobile).
   - Vitest coverage summaries (if relevant).
4. Save a summary markdown file in this directory with links to the artifacts and notes about pass/fail criteria.

Refer to `docs/release-checklist.md` for the full release QA process.
