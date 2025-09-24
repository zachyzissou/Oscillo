# GitLab Issue Triage (2025-09-24)

## Process Overview
- Sync configuration via `scripts/gitlab-utils.mjs` to query the self-hosted GitLab project (project ID 2).
- Classify issues by `priority::*` and `category::*` labels to drive sequencing.
- For each issue, capture context, define a work log entry, implement the fix, then document closure notes before marking the ticket resolved.
- Maintain this file as the running log so Unraid/GitLab history stays aligned with repository state.

## Automation Sweep (Run `npm run gitlab:automation`)
- Adds quality-gate reminder comments to issues missing automation notes.
- Flags overdue tasks with the `attention::overdue` label.
- Assigns unowned tasks to the project owner as a fallback.

### Latest Run (2025-09-24)
| Metric | Count |
|--------|-------|
| Quality notes added | 0 |
| Overdue tasks flagged | 0 |
| Unassigned tasks auto-assigned | 0 |

Logs: see `artifacts/gitlab/automation-2025-09-24.json`.

## Manual Follow-Up
- Review newly flagged `attention::overdue` issues and reset due dates or re-plan as needed.
- For quality-gate issues, ensure pipeline logs (lint/type/test/build) and metrics artifacts are linked.
- Confirm jam security updates (`JAM_ALLOWED_ORIGINS`, `JAM_SERVER_TOKEN`) are documented per issue #52.

## Backlog Snapshot (top priority items)
| IID | Title | Priority | Category |
| --- | --- | --- | --- |
| 101 | [Migration] Industrial Beverage Automation - DrinkBot Pro Operations | high | business |
| 100 | [Migration] Audiobook MP3 to M4B Conversion - 91K Words | very-high | media |
| 99 | [Migration] Self-Hosted Social Media Platforms Guide | medium | self-hosted |
| 98 | [Migration] SPT-AKI SIT Docker - Single Player Tarkov Server | medium | gaming |
| 97 | [Migration] Twitch2Tuner Integration - Streaming to DVR Setup | medium | media |
| 96 | [Migration] Self-Hosted Music Metadata Services - Lidarr Setup | high | media |
| 95 | [Migration] Unraid Hardware Troubleshooting - Drive Detection | high | infrastructure |
| 94 | [Migration] Game Concept Foundation - 82K Words | very-high | gaming |
| 93 | [Migration] n8n Movie Clip Twitter Bot - Complete Automation | high | automation |
| 92 | [Migration] Tailscale Mesh with Mullvad VPN - Complete Setup Guide | high | infrastructure |

> Full export available by re-running `node scripts/gitlab-utils.mjs` helper queries (see shell history in `artifacts/pipeline/` if needed).

## Completed This Session
- **Issue #5 - tracking board link added to README**
  - Added "Project Links" section with direct board URL so contributors can jump from the repo to the live backlog.
  - Context recorded here; ready for closure once mirrored on GitLab.
- **Issue #15 - normalize environment variable docs**
  - Added `.env.example` with canonical defaults and expanded README + `docs/SECURITY.md` tables.
  - Updated `docs/overhaul-plan.md` Phase 3 status to reflect completion; ready to close once merged.
- **Issue #6 - enforce Node 20.17 / npm 10.8 across environments**
  - Updated `.nvmrc`, Dockerfile, and `scripts/check-node.js` to pin Node 20.17.0 + npm 10.8 minimums.
  - Refreshed README and deployment docs to instruct contributors to run the version guard before pipeline smoke tests.
- **Issue #2 - document environment assumptions**
  - Added `docs/environment-assumptions.md` covering Node/npm, Playwright cache guidance, and Docker base image.
  - Linked the new reference from contributor docs (`README.md`, `AGENTS.md`, `CLAUDE.md`) and Phase 1 status.
- **Issue #3 - create shared tracking board**
  - Ran `npm run gitlab:boards` to ensure the Phase Delivery board and sprint milestones exist.
  - Added `docs/tracking-board.md` with board usage guidelines, current milestone schedule, and owner/risk expectations.
- **Issue #7 - dependency audit snapshot**
  - Captured `npm outdated --long` results in `docs/dependencies/2025-09-24-outdated.md` with prioritized upgrade plan.
  - Recorded `depcheck` findings (noting false positives due to archived components / Next.js dynamic imports).
- **Issue #8 - remove redundant stacks**
  - Uninstalled unused Radix/UI/audio helper packages and recorded the change in `docs/dependencies/2025-09-24-stack-cleanup.md`.
  - Verified lint/type/test suites to confirm no code paths relied on the removed packages.
- **Issue #9 - CI fails on unsupported Node version**
  - Added `node-version-guard` job to `.gitlab-ci.yml` (uses `node:20.17.0`, runs `node scripts/check-node.js`).
  - Ensures pipeline enforces the documented runtime and surfaces drift immediately.

## Immediate Focus Queue
1. **Issue #8 - remove redundant stacks**
   - Evaluate duplicate Playwright/Jest tooling (`depcheck` notes) and clean archived components if possible.
   - Ensure license review docs are updated alongside removals.
2. **Issue #93 - n8n Movie Clip Twitter Bot migration**
   - Inventory current n8n workflows in GitLab artifacts (if any) and recreate as JSON exports under `docs/automation/`.
   - Validate Twitter API credentials flow and document scheduling/monitoring.

- **Issue #126 - GHCR manifest unknown when pulling unraid/oscillo template image** (priority::low)
  - Logged after Unraid pull continued to fail against `ghcr.io/zachyzissou/interactive-music-3d:latest`.
  - Follow-up: confirm image publication status/visibility and adjust template once the tag is accessible.
