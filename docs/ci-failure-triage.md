# CI Failure Triage Drill (gh-fix-ci)

Date: 2026-02-23
Owner: Engineering

## Goal
Provide a reusable, command-first workflow to triage failing GitHub PR checks and document the fix path.

## Prerequisites
- GitHub CLI authenticated with `repo` + `workflow` scopes.
- Run from repo root.

## Standard Triage Commands
```bash
# 1) Auth sanity
gh auth status

# 2) Inspect failing checks on a PR (preferred helper)
python3 /Users/zachgonser/.codex/skills/gh-fix-ci/scripts/inspect_pr_checks.py --repo . --pr <PR_NUMBER_OR_URL>

# 3) If helper reports failures, inspect checks
gh pr checks <PR_NUMBER> --json name,state,bucket,link,workflow

# 4) Inspect failing run and failed log lines
gh run view <RUN_ID>
gh run view <RUN_ID> --log-failed

# 5) If needed, inspect a specific failed job
gh run view <RUN_ID> --job <JOB_ID>
```

## Drill Walkthrough

### A) Current PR check triage (PR #302)
```bash
python3 /Users/zachgonser/.codex/skills/gh-fix-ci/scripts/inspect_pr_checks.py --repo . --pr 302 --json
```
Result: `PR #302: no failing checks detected.`

### B) Historical failing-run triage (GitHub Actions)
Used latest failed CI run from history:
```bash
gh run list --status failure --limit 20
gh run view 22290078297
gh run view 22290078297 --log-failed
```

Failure signature captured:
- Workflow: `CI`
- Job: `visual-regression` (`64475775908`)
- Step: `Run visual regression suite (chromium)`
- Error: Playwright screenshot diffs exceeded threshold (`toHaveScreenshot` mismatch)
- Representative snippet:
  - `start-overlay-card.png`: `9762 pixels (ratio 0.04)` different
  - `telemetry-banner.png`: `2377 pixels (ratio 0.03)` different
- Evidence artifacts:
  - `visual-playwright-report`
  - `visual-test-results`
  - Diff images in `test-results/...-diff.png`

## Fix Checklist (Reusable)
- [ ] Confirm failing check is GitHub Actions (`github.com/.../actions/runs/...`).
- [ ] Record failing workflow/run/job IDs.
- [ ] Capture the exact failing step and first actionable error snippet.
- [ ] Download/open failure artifacts (screenshots, traces, logs).
- [ ] Classify failure:
  - Intended visual update -> refresh baseline snapshots in same PR.
  - Unintended regression -> patch UI/styles/layout and keep existing snapshots.
  - Flake -> rerun once, then stabilize selector/waits/environment.
- [ ] Re-run local equivalent command (example):
  - `npx playwright test tests/e2e/visual-regression.spec.ts --project=chromium`
- [ ] Push fix and verify all checks pass:
  - `gh pr checks <PR_NUMBER>`
- [ ] Respond in-thread with `fixed` or `why not` and include run links.

## External Check Handling (Out of Scope)
When failing check is not GitHub Actions (for example SonarCloud), do not deep-debug via `gh` logs.
- Record the external URL and failing condition.
- Route to provider UI or dedicated owner.
- Example query for quick hotspot confirmation:
```bash
curl -s "https://sonarcloud.io/api/hotspots/search?projectKey=zachyzissou_INTERACTIVE-MUSIC-3D&pullRequest=<PR_NUMBER>&statuses=TO_REVIEW,REVIEWED"
```

## Incident Note Template
```md
- Failing check: <name>
- Run URL: <url>
- Job/step: <job> / <step>
- Signature: <first actionable error>
- Artifacts reviewed: <list>
- Fix applied: <what changed>
- Validation: <commands + new passing run>
```
