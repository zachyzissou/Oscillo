# Oscillo Master Roadmap

## Purpose
This roadmap consolidates every known initiative for the Interactive Music 3D overhaul (Oscillo). It stitches together delivery phases, platform investments, quality gates, and governance so contributors can navigate the entire transformation from a single source. Update this document whenever scope changes, new dependencies emerge, or sequencing is adjusted-then mirror the update to GitLab via `npm run gitlab:wiki`.

## Macro Timeline
| Phase | Theme | Timebox* | Primary Outcomes |
| ----- | ----- | -------- | ---------------- |
| 1 | Baseline & Alignment | Week 1 | Metrics snapshot, environment assumptions, shared delivery board |
| 2 | Environment & Dependencies | Week 2 | Enforced Node/npm floor, dependency audit, license review, audit triage |
| 3 | Config & Tooling Modernization | Weeks 3-4 | Lean Next/Tailwind config, stricter linting, environment docs |
| 4 | TypeScript Guardrails | Weeks 5-6 | Stricter compiler flags, type debt burndown log, `ts-prune` reports |
| 5 | Codebase Hygiene & Architecture | Weeks 7-8 | Decomposed mega-components, updated architecture diagrams |
| 6 | Audio & Plugin System Hardening | Weeks 9-10 | Lifecycle-safe audio engine, plugin sandbox, audio test suites |
| 7 | Rendering & Performance Optimization | Weeks 11-13 | Profiling-driven scene refactors, DPR/LOD tuning, perf telemetry |
| 8 | Testing & CI Overhaul | Weeks 14-15 | Stabilized Playwright matrix, coverage thresholds, faster CI |
| 9 | Observability, Security & Ops | Weeks 16-17 | Structured logging, security posture upgrades, deployment rehearsal |
| 10 | Documentation, Design System & Release | Weeks 18-19 | Updated knowledge base, design tokens, release automation |

\*Timeboxes are indicative. Revisit as needed.

## Cross-Cutting Workstreams
- **Program & Governance**: cadences, change control, stakeholder updates, risk register, decision logs.
- **Developer Experience**: tooling modernization, lint/type gates, local environment ergonomics.
- **Audio Platform**: engine lifecycle, plugin ecosystem, preset validation, browser parity.
- **Rendering & UX**: WebGPU/WebGL fallbacks, scene composition, UI/UX refinements, accessibility.
- **Infrastructure & Ops**: CI, deployments, observability, GitLab/OpenProject automation.
- **Documentation & Enablement**: living docs, wiki, design system, onboarding assets.

## Phase Summaries & Expanded Scope
Each phase inherits deliverables and quality gates from `docs/overhaul-plan.md` and extends them with roadmap-level context.

### Phase 1 - Baseline & Alignment
- Capture metrics: bundle analyzer, Lighthouse desktop/mobile, Playwright perf (FPS, memory), CI duration.
- Document environment assumptions: Node/npm, pnpm status, Playwright cache, Docker base image.
- Standing artifacts: `/docs/metrics/YYYY-MM-DD.md`, shared GitLab board, risk & mitigation log, feature flag inventory.
- Stakeholder actions: kickoff readout, align on success criteria, schedule standing reviews.

### Phase 2 - Environment & Dependencies
- Enforce Node >=20 / npm >=10 (CI, Docker, Husky, docs) and regenerate lockfile.
- Run `npm outdated --long`, `npm audit`, `npx depcheck --json`; classify upgrades vs removals vs spikes.
- Track third-party license review (MIT/BSD/Apache confirmation) and record in `/docs/dependencies/`.
- Produce audit triage: advisories resolved, deferred (with rationale), scheduled follow-ups.

### Phase 3 - Config & Tooling Modernization
- Refactor `next.config.js` toward Next 15 defaults; isolate PWA configuration; remove legacy loaders when possible.
- Decide Tailwind v4 adoption vs rollback to v3; document PostCSS/Tailwind pipeline and custom plugins.
- Harden lint/formatting (`eslint.config.js`, `.prettierrc`, optional stylelint) and ensure `npm run lint:check` is canonical.
- Refresh `.env.example`, add environment key README entries, sync with GitLab CI and Docker secrets.
- Spike major upgrades (Vite 7, Vitest 3) to clear esbuild advisory and document compatibility plan.

_Update 2025-09-22_: Adopted Tailwind v4 with a typed `tailwind.config.ts`, plugin strategy (forms, typography, custom neon utilities), and PostCSS pipeline confirmed compatible with Next/Turbopack. Upgraded Vitest/Vite to 3.2/7.1 respectively, resolving the esbuild advisory and updating CI flags to `--maxWorkers=1 --no-file-parallelism`.

### Phase 4 - TypeScript Guardrails
- Simplify `tsconfig.json`, remove unused paths/globs, and reinstate strict mode options incrementally.
- Integrate `ts-prune` and `typescript-eslint` rules to eliminate dead exports.
- Build a type-debt burndown board in GitLab; annotate modules that require deeper refactors.
- Pair with audio/render teams to untangle complex types; add shared interfaces for cross-boundary data.

### Phase 5 - Codebase Hygiene & Architecture
- Eliminate zero-byte/placeholder components and align imports.
- Decompose oversized React trees (e.g., `ImmersiveMusicalUniverse`) into domain modules with documented boundaries.
- Standardize Zustand usage: selectors, middleware, immutability helpers; ensure stores only hold serializable state.
- Create architecture diagrams (`docs/architecture/`) covering rendering pipeline, audio flow, data flow, and deployment.
- Resolve archived assets (e.g., `EffectsPanel`) by either reintroducing them behind flags or removing their dependencies.

### Phase 6 - Audio & Plugin System Hardening
- Rebuild audio engine with explicit init/dispose lifecycle, error boundaries, logging.
- Enforce schema validation for presets, plugin metadata, and storage payloads.
- Sandbox plugin execution with allowlisted APIs and lifecycle hooks (load, update, teardown).
- Expand Vitest suites around audio init, plugin registration, persistence scenarios.
- Document new API (`docs/audio-init.md` updates) and provide migration guide for plugin authors.

### Phase 7 - Rendering & Performance Optimization
- Profile Three.js scene; implement instancing, level-of-detail, adaptive device pixel ratio.
- Modularize rendering concerns (lighting, particles, geometry) with memoization and caching.
- Enhance runtime telemetry: FPS overlays, structured logging, Playwright perf thresholds, GPU capability detection.
- Benchmark improvements against Phase 1 metrics and capture before/after snapshots.

### Phase 8 - Testing & CI Overhaul
- Increase Vitest coverage (stores/lib/hooks) and enforce thresholds in CI.
- Reorganize Playwright suites (smoke, full, perf, a11y) with fixtures, environment selectors, and artifacts.
- Optimize GitHub/GitLab CI pipelines: caching, parallelization, artifact publishing (bundle analyzer, perf traces).
- Document test strategy in `docs/testing.md`, including triage process for flakes.

### Phase 9 - Observability, Security & Ops
- Introduce structured logging (Pino or equivalent), environment-driven log levels, and log shipping plan.
- Audit security (headers, CSP, WS auth, dependency vulnerabilities) and document mitigations in `docs/SECURITY.md`.
- Implement Web Vitals telemetry, consent-driven analytics, and incident response playbooks.
- Rehearse deployment/rollback workflows; document SLOs and operational runbooks.

### Phase 10 - Documentation, Design System & Release Readiness
- Refresh README, AGENTS, CLAUDE, CONTRIBUTING, onboarding docs, and automation references.
- Formalize design tokens, theming strategy, and UI guidelines (consider Storybook or exported MDX docs).
- Execute final regression checklist (unit, e2e, visual, perf, a11y) and enable release automation (changesets/semantic-release).
- Prepare launch communications: release notes, demo assets, adoption guidance, training content.

## Supporting Tracks & Backlogs
- **Feature Flags**: maintain inventory, default states, cleanup plan; document fallback paths per flag.
- **Metrics & Analytics**: baseline, continuous collection, dashboards in GitLab wiki (Metrics page), retention policy.
- **Automation**: GitLab/OpenProject sync scripts, MCP server usage, nightly jobs for metrics ingestion.
- **Knowledge Management**: enforce ADR templates, cross-linking between repo docs, wiki, and GitLab issues.
- **Community & Feedback**: beta cohort management, survey instrumentation, support triage workflows.

## Delivery Governance
- Weekly roadmap sync (program + tech leads) reviewing progress, risks, and metrics deltas.
- Bi-weekly stakeholder readout (product, design, ops) covering upcoming milestones and decision log.
- Daily async standup in GitLab issue comments or dedicated channel referencing current phase label.
- Change control: major scope changes require updated roadmap entry, GitLab issue, and stakeholder approval.
- Definition of Done: phase quality gates satisfied, tests/metrics recorded, documentation updated, GitLab issues closed.

## Metrics & Success Criteria
- **Performance**: maintain/improve FPS, reduce bundle size vs baseline, track memory footprint, CI duration.
- **Quality**: TS strictness debt burn-down, Vitest coverage >=80%, zero lint/type errors pre-merge, Playwright suites stable.
- **Security**: no outstanding high/critical advisories, security headers enforced, WebSocket auth in place.
- **Reliability**: documented rollback plans, observability dashboards live, incident response drill complete.
- **Adoption**: UX scores (surveys), engagement metrics, plugin ecosystem health, design system usage.

## Risk Register (living)
| Risk | Impact | Mitigation | Owner |
| ---- | ------ | ---------- | ----- |
| WebGPU fallback gaps | High | Maintain WebGL/Tone-only fallback, automated detection, staged rollout | Rendering Lead |
| Audio plugin incompatibility | High | Compatibility layer, migration guide, beta program | Audio Lead |
| Vite/Vitest major upgrade regressions | Medium | Dedicated spike + branch, isolated CI job, roll-forward plan | Tooling Lead |
| CI duration creep | Medium | Pipeline profiling, caching strategy, self-hosted runners | DevOps Lead |
| Documentation drift | Medium | Monthly docs audit, wiki sync automation, ADR enforcement | Documentation Lead |
| Cross-team alignment | Medium | Weekly roadmap sync, shared board, dependency tracking | Program Manager |

## Dependency Map
- **GitLab**: labels, milestones, issues synced via `npm run gitlab:sync`; wiki via `npm run gitlab:wiki`.
- **OpenProject**: reference board (historical), integrations documented in `docs/integrations/openproject.md`.
- **Playwright**: ensure browsers cached in CI, align fixture versions across GitHub/GitLab.
- **Docker**: base image pinned to Node 20, npm 10; consider multi-arch builds later in Phase 9.
- **MCP Server**: optional assistant integration for OpenProject; ensure tokens stored securely.

## Communication & Reporting Cadences
- GitLab board = source of truth for in-flight work; use phase labels and milestones.
- Weekly written status posted to GitLab wiki (Metrics Dashboard) referencing updated metrics and risk heatmap.
- Post-phase retrospectives logged in docs (`docs/retros/`) with action items folded into next phases.
- Keep CHANGELOG updated per release candidate; cross-link to GitLab releases.

## Getting Started Checklist
1. Clone repo, run `npm install` (fails fast without Node >=20/npm >=10).
2. Run `npm run type-check && npm run lint:check && npm run build` to confirm baseline.
3. Sync GitLab (`npm run gitlab:sync`) to ensure labels/issues align with this roadmap.
4. Review the current phase label and dequeue highest-priority issue from GitLab board.
5. Capture metrics updates in `/docs/metrics/` and attach evidence to the relevant GitLab issue.

## Revision History
- **2025-09-22** - Comprehensive overhaul roadmap authored (Phase 2 completion); integrated dependency/license records.

