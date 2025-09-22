# GitLab Integration

## Overview
This project can mirror the overhaul roadmap into GitLab issues using the REST API. Phases become project milestones + labels, while individual tasks and quality gates are created as GitLab issues with rich descriptions.

## Environment
Set the following variables (already appended to `.env.local`):

```
GITLAB_URL=http://192.168.4.225:9080
GITLAB_TOKEN=<personal access token>
GITLAB_PROJECT_ID=<project numeric id>
```

The current token scopes must include `read_api` and `write_api`.

## Commands

- `npm run gitlab:sync` – parse `docs/overhaul-plan.md`, ensure phase labels + milestones, and create/update task + quality gate issues with generated descriptions.
- `npm run openproject:build` / `:enrich` – still available if you wish to keep OpenProject in parallel.

## How the Sync Works
1. Labels: `phase::<Phase Name>` for every phase, plus `task` and `quality-gate`.
2. Milestones: one per phase, titled exactly like the phase heading.
3. Issues:
   - Tasks → issue titled without the "Phase X" prefix, labeled with `task` + the phase label.
   - Quality gates → issue titled without the prefix, labeled with `quality-gate` + phase label.
   - Descriptions include objectives, activities, deliverables, validation checklist, and collaboration notes.
4. Re-running `npm run gitlab:sync` is idempotent: it updates descriptions, labels, and milestone assignment.

## Extending
- Add extra labels or reviewers by editing `scripts/gitlab-sync.mjs`.
- Use GitLab boards to group by phase labels (`phase::…`).
- Attach CI artifacts or metrics by calling GitLab APIs within the same script.

### Wiki Automation
Run `npm run gitlab:wiki` to regenerate GitLab wiki pages (`Home`, `Overhaul Plan`, `Automation & Operations`, `Metrics Dashboard`) from repo sources. The script:
- Reads `docs/overhaul-plan.md` for phase/task content.
- Builds quick links to boards, quality-gate filters, and repo docs.
- Keeps the wiki idempotent (re-run any time docs change).


### CI/CD
The repository ships a `.gitlab-ci.yml` with the following stages:
- `lint_and_types`: runs `npm run lint:check` + `npm run type-check`.
- `unit_tests`: executes `npm run test:unit -- --coverage --runInBand` and publishes Cobertura coverage.
- `playwright_smoke` / `playwright_performance`: powered by the official Playwright image to run smoke/perf suites and collect artifacts.
- `record_metrics`: manual placeholder for attaching Lighthouse or metrics bundles once available.

Pipelines use Node 20 and cache `node_modules/`. Adjust scripts as the project evolves.


### Automation Sweep
`npm run gitlab:automation` adds delivery automation:
- Comments on each quality-gate issue with instructions for attaching metrics.
- Flags overdue tasks with an `attention::overdue` label based on milestone due dates.
- Assigns unowned tasks to the project owner by default (customise in `scripts/gitlab-automation.mjs`).

Schedule this via GitLab CI or a cron job to keep the board clean.


### Metrics Attachments
`npm run gitlab:metrics` uploads every file in `docs/metrics/` to the project uploads API and appends a dated section to the `Metrics Dashboard` wiki page. Re-run after collecting Lighthouse/Playwright artifacts to keep evidence centralised.

