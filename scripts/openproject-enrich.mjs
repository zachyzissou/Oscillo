#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadEnvFiles,
  getOpenProjectConfig,
  createOpenProjectClient,
} from "./openproject-utils.mjs";

const parseOverhaulPlan = async () => {
  const planPath = path.join(process.cwd(), "docs", "overhaul-plan.md");
  const content = await readFile(planPath, "utf8");
  const headingRegex = /^###\s+(Phase\s+\d+\s+[\u2013-]\s+.+)$/gmu;
  const bulletRegex = /^-\s+(.+)$/gm;
  const qualityRegex = /\*\*Quality gates\*\*:\s*(.+)/i;

  const matches = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    matches.push({
      heading: match[1].trim(),
      bodyStart: headingRegex.lastIndex,
      index: match.index,
    });
  }

  const phases = [];
  for (let i = 0; i < matches.length; i += 1) {
    const current = matches[i];
    const next = matches[i + 1];
    const body = content.slice(current.bodyStart, next ? next.index : content.length);

    const bulletTasks = [...body.matchAll(bulletRegex)].map((entry) => entry[1].trim());
    const qualityMatch = body.match(qualityRegex);
    const qualityItems = qualityMatch
      ? qualityMatch[1]
          .split(/;\s*/)
          .map((item) => item.replace(/\s*\.?$/, "").trim())
          .filter(Boolean)
      : [];

    phases.push({
      heading: current.heading,
      tasks: bulletTasks,
      quality: qualityItems,
    });
  }

  return phases;
};

const phaseNarratives = {
  "Phase 1 – Baseline & Alignment": {
    overview:
      "Capture an empirical picture of the current product experience so every downstream optimization has a trustworthy before/after comparison.",
    outcomes: [
      "Benchmarks collected for bundle size, Lighthouse scores, runtime metrics, and CI throughput",
      "Shared assumptions catalogued for tooling, environments, and data capture",
      "Unified delivery board created with owners, risks, feature-flag inventory, and escalation path",
    ],
    metrics: [
      "Bundle analyzer report checked into /docs/metrics",
      "Lighthouse desktop & mobile runs archived with screenshots and JSON exports",
      "Playwright performance recordings captured for FPS, memory, and CPU",
    ],
    docs: [
      "docs/metrics/",
      "docs/overhaul-plan.md",
      "README.md",
    ],
  },
  "Phase 2 – Environment & Dependencies": {
    overview:
      "Lock the engineering environment to modern, supportable baselines and eliminate dependency drift before heavier refactors land.",
    outcomes: [
      "Node 20 / npm 10 enforced locally, in CI, and Docker",
      "Dependency inventory triaged with clear upgrade/removal plan",
      "Audit findings captured with remediation owners",
    ],
    metrics: [
      "npm outdated snapshot stored for comparison",
      "Audit log summarizing resolved vs. deferred vulnerabilities",
      "Updated package-lock.json size and install timing",
    ],
    docs: [
      "docs/environment.md",
      "docs/dependencies.md",
      "docs/security.md",
    ],
  },
  "Phase 3 – Config & Tooling Modernization": {
    overview:
      "Modernize the build and lint toolchain so the project leans on Next.js/Turbopack defaults and consistent formatting across contributors.",
    outcomes: [
      "Legacy webpack customizations retired in favour of Next 15 primitives",
      "Tailwind/PostCSS strategy documented and implemented",
      "Linting/formatting baselines hardened with minimal overrides",
    ],
    metrics: [
      "Cold dev-start timing before/after",
      "Lint/type-check runtime deltas",
      "Bundle diff showing effect of config changes",
    ],
    docs: [
      "next.config.js",
      "tailwind.config.js",
      "eslint.config.js",
      "docs/tooling.md",
    ],
  },
  "Phase 4 – TypeScript Guardrails": {
    overview:
      "Tighten the TypeScript surface so regressions surface at compile time and unused code paths are aggressively flagged.",
    outcomes: [
      "Loosened compiler flags removed; strictness features enabled",
      "Type errors reduced phase-by-phase with tracked backlog",
      "ts-prune or equivalent integrated into CI for unused exports",
    ],
    metrics: [
      "Type-check duration and error count trend",
      "List of modules migrated to strict mode",
      "Unused export report committed per run",
    ],
    docs: [
      "tsconfig.json",
      "docs/typescript.md",
    ],
  },
  "Phase 5 – Codebase Hygiene & Architecture": {
    overview:
      "Reshape oversized components and stale modules into a composable architecture that scales with future features.",
    outcomes: [
      "Zero-byte and deprecated components removed or replaced",
      "Large scene/render features decomposed into domain modules",
      "Shared audio/render interaction contracts defined",
    ],
    metrics: [
      "Bundle size delta after decompositions",
      "Architecture diagrams committed to docs/architecture",
      "Component count + size histogram before/after",
    ],
    docs: [
      "docs/architecture/",
      "src/components/",
      "docs/rendering.md",
    ],
  },
  "Phase 6 – Audio & Plugin System Hardening": {
    overview:
      "Engineer the audio pipeline so plugins, presets, and lifecycle management behave predictably across browsers and sessions.",
    outcomes: [
      "Lifecycle-managed audio service with explicit init/dispose",
      "Schema validation protecting presets and plugin storage",
      "Deterministic test coverage across audio initialization flows",
    ],
    metrics: [
      "Audio init latency across browsers",
      "Plugin failure-handling test evidence",
      "docs/audio-init.md updated with new API surface",
    ],
    docs: [
      "docs/audio-init.md",
      "src/lib/audio/",
      "src/plugins/",
    ],
  },
  "Phase 7 – Rendering & Performance Optimization": {
    overview:
      "Elevate the realtime rendering stack to handle complex scenes with predictable performance across device classes.",
    outcomes: [
      "Profiler-driven LOD/instancing/adaptive DPR strategy",
      "Rendering subsystems modularized with measured memoization",
      "Performance telemetry wired into Playwright thresholds",
    ],
    metrics: [
      "AVG/MIN FPS before/after scene optimizations",
      "GPU/CPU utilization snapshots",
      "Playwright perf suite trend reports",
    ],
    docs: [
      "docs/performance.md",
      "src/components/ImmersiveMusicalUniverse",
      "tests/e2e/performance.spec.ts",
    ],
  },
  "Phase 8 – Testing & CI Overhaul": {
    overview:
      "Level-up automated confidence by expanding coverage, reducing flake, and tightening CI feedback loops.",
    outcomes: [
      "Vitest coverage baseline with enforced thresholds",
      "Playwright suites segmented with reusable fixtures",
      "CI workflow optimized for cache and artifact reuse",
    ],
    metrics: [
      "Coverage percentage per module group",
      "CI runtime trend (total + critical path)",
      "Flake rate recorded with remediation notes",
    ],
    docs: [
      "docs/testing.md",
      "tests/",
      ".github/workflows/",
    ],
  },
  "Phase 9 – Observability, Security, & Ops": {
    overview:
      "Instill production-grade observability and security posture so the platform is diagnosable, compliant, and resilient.",
    outcomes: [
      "Structured logging with environment-controlled transports",
      "Web Vitals and consent-aware analytics instrumented",
      "Security checklist executed across headers, WS auth, dependencies, and service worker",
    ],
    metrics: [
      "Latency/error dashboards linked",
      "Security audit report with remediations",
      "Rollback playbook validated",
    ],
    docs: [
      "docs/observability.md",
      "docs/security.md",
      "docs/ops.md",
    ],
  },
  "Phase 10 – Documentation, Design System, Release Readiness": {
    overview:
      "Tie the overhaul together with refreshed documentation, cohesive design system assets, and a repeatable release train.",
    outcomes: [
      "README, AGENTS, CLAUDE, CONTRIBUTING, and roadmap fully modernized",
      "Design tokens and optional Storybook coverage aligned",
      "Regression + release workflow hardened with automation",
    ],
    metrics: [
      "Documentation change log entries",
      "Design token diff / Storybook coverage",
      "Release dry-run evidence with semantic versioning checks",
    ],
    docs: [
      "docs/",
      "design-system/",
      "docs/release-checklist.md",
    ],
  },
};

const stripPhasePrefix = (subject) => subject.replace(/^Phase\s+\d+\s+[\u2013-]\s+/u, "").trim();

const toBulletList = (items) => items.map((item) => `- ${item}`).join("\n");

const splitActivities = (text) => {
  let working = text.replace(/\.$/, "");
  working = working.replace(/^Quality Gate:\s*/i, "");
  const separators = [";", " and ", ", then ", ", and "];
  for (const sep of separators) {
    if (working.includes(sep)) {
      const parts = working.split(sep).map((part) => part.trim()).filter(Boolean);
      if (parts.length > 1) {
        return parts;
      }
    }
  }
  const commaParts = working.split(/,\s+/).map((part) => part.trim()).filter(Boolean);
  if (commaParts.length > 1 && commaParts.join(", ") !== working) {
    return commaParts;
  }
  return [working];
};

const buildCommonDeliverables = (phaseHeading) => {
  const meta = phaseNarratives[phaseHeading];
  const docLinks = meta?.docs ?? ["docs/overhaul-plan.md"];
  return [
    "Pull request referencing the relevant OpenProject work package ID",
    "Updated changelog entry summarizing scope and impact",
    ...docLinks.map((doc) => `Documentation updated: \`${doc}\``),
  ];
};

const buildValidationChecklist = (text) => {
  const checklist = [
    "`npm run type-check`",
    "`npm run lint:check`",
    "`npm run build`",
  ];
  const lower = text.toLowerCase();
  if (lower.includes("playwright")) {
    checklist.push("`npm run test:performance`", "`npm run test:smoke` (as applicable)");
  }
  if (lower.includes("vitest") || lower.includes("coverage")) {
    checklist.push("`npm run test:unit -- --coverage` (generate coverage artifacts)");
  }
  if (lower.includes("lighthouse")) {
    checklist.push("Record Lighthouse runs (desktop + mobile) and archive reports");
  }
  if (lower.includes("metrics")) {
    checklist.push("Update `/docs/metrics/` with before/after snapshots");
  }
  if (lower.includes("audio")) {
    checklist.push("Audio smoke-test across supported browsers + mobile");
  }
  if (lower.includes("security") || lower.includes("audit")) {
    checklist.push("Run `npm run security:audit` and capture the report");
  }
  if (lower.includes("render") || lower.includes("performance")) {
    checklist.push("Capture Playwright performance trace and compare FPS minima");
  }
  if (lower.includes("documentation")) {
    checklist.push("Proofread docs and secure reviewer sign-off");
  }
  return [...new Set(checklist)];
};

const buildMilestoneEvidence = (text) => {
  const evidence = [
    "Comment in OpenProject with links to supporting metrics/docs",
    "Attach screenshots or logs demonstrating the gate criteria",
  ];
  const lower = text.toLowerCase();
  if (lower.includes("metrics")) {
    evidence.push("Link to `/docs/metrics/` snapshot with recorded values");
  }
  if (lower.includes("tracking board")) {
    evidence.push("Screenshot or URL of the updated tracking board");
  }
  if (lower.includes("ci")) {
    evidence.push("Latest CI run proving required checks and failure gating");
  }
  if (lower.includes("audit")) {
    evidence.push("Audit report or issue tracker showing triage outcomes");
  }
  if (lower.includes("documentation")) {
    evidence.push("Links to merged documentation PRs");
  }
  if (lower.includes("release")) {
    evidence.push("Release checklist artifact or dry-run output");
  }
  return [...new Set(evidence)];
};

const generatePhaseDescription = (phaseHeading, tasks, quality) => {
  const meta = phaseNarratives[phaseHeading] ?? { overview: "", outcomes: [], metrics: [], docs: [] };
  const taskList = tasks.map((task) => `- ${stripPhasePrefix(task)}`).join("\n") || "- (tasks will be imported automatically)";
  const qualityList = quality.length
    ? quality.map((item) => `- ${item.replace(/^Quality Gate:\s*/i, "")}`).join("\n")
    : "- (quality gates pending definition)";
  const docsList = meta.docs?.length ? meta.docs.map((doc) => `- \`${doc}\``).join("\n") : "- docs/overhaul-plan.md";

  return [
    "## Mission",
    meta.overview || stripPhasePrefix(phaseHeading),
    "",
    "## Key Outcomes",
    meta.outcomes?.length ? toBulletList(meta.outcomes) : taskList,
    "",
    "## Workstreams",
    taskList,
    "",
    "## Quality Gates",
    qualityList,
    "",
    "## Success Evidence",
    meta.metrics?.length ? toBulletList(meta.metrics) : "- Metrics documentation updated",
    "",
    "## Reference Docs",
    docsList,
    "",
    "## Coordination Notes",
    "- Sync with adjacent phases at weekly overhaul stand-up",
    "- Ensure tracking board reflects owner and target dates",
    "- Surface risks + mitigations in OpenProject comments",
  ].join("\n");
};

const generateTaskDescription = (phaseHeading, taskText) => {
  const objective = stripPhasePrefix(taskText);
  const activities = splitActivities(objective);
  const deliverables = buildCommonDeliverables(phaseHeading);
  const validation = buildValidationChecklist(objective);

  return [
    "## Objective",
    objective,
    "",
    "## Key Activities",
    toBulletList(activities),
    "",
    "## Deliverables",
    toBulletList(deliverables),
    "",
    "## Validation",
    toBulletList(validation),
    "",
    "## Collaboration",
    "- Pair with domain experts (audio, rendering, infra) where relevant",
    "- Document decisions as ADRs or inline design notes",
    "- Cross-link related work packages in OpenProject comments",
  ].join("\n");
};

const generateMilestoneDescription = (phaseHeading, qualityText) => {
  const label = qualityText.replace(/^Phase \d+\s+[\u2013-]\s+/u, "");
  const entryCriteria = splitActivities(label);
  const evidence = buildMilestoneEvidence(label);
  const validation = buildValidationChecklist(label);
  const meta = phaseNarratives[phaseHeading];
  const docsList = meta?.docs?.map((doc) => `- \`${doc}\``) ?? ["- docs/overhaul-plan.md"];

  return [
    "## Quality Gate",
    label.replace(/^Quality Gate:\s*/i, ""),
    "",
    "## Entry Criteria",
    toBulletList(entryCriteria),
    "",
    "## Evidence to Attach",
    toBulletList(evidence),
    "",
    "## Validation",
    toBulletList(validation),
    "",
    "## Reference Docs",
    docsList.join("\n"),
    "",
    "## Notes",
    "- Post completion summary + links in OpenProject",
    "- Ensure rollback/fallback plan is documented where relevant",
    "- Notify stakeholders in overhaul channel once satisfied",
  ].join("\n");
};

const defaultStatusByType = {
  "Summary task": 6, // Scheduled
  Task: 1, // New
  Milestone: 1,
};

const defaultPriorityByType = {
  "Summary task": 9, // High
  Task: 9,
  Milestone: 10, // Immediate
};

const updateWorkPackage = async (client, id, buildPayload) => {
  const current = await client.requestJson(`/api/v3/work_packages/${id}`);
  const body = buildPayload(current);
  if (!body) {
    return null;
  }
  body.lockVersion = current.lockVersion;
  const response = await client.requestJson(`/api/v3/work_packages/${id}`, {
    method: "PATCH",
    body,
  });
  return response;
};

const enrich = async () => {
  await loadEnvFiles();
  const config = getOpenProjectConfig();
  const client = createOpenProjectClient(config);

  const projects = await client.collectElements("/api/v3/projects");
  const project = projects.find((p) => p.identifier === config.projectIdentifier || (p.name ?? "").toLowerCase() === config.projectIdentifier.toLowerCase());
  if (!project) {
    throw new Error(`Project "${config.projectIdentifier}" not found.`);
  }
  const projectId = client.extractId(project);

  const phases = await parseOverhaulPlan();
  const phaseMap = new Map(phases.map((phase) => [phase.heading, phase]));

  const workPackagesHref = project._links?.workPackages?.href ?? `/api/v3/projects/${projectId}/work_packages`;
  const workPackages = await client.collectElements(`${workPackagesHref}?pageSize=200`);

  const summary = [];

  for (const wp of workPackages) {
    const typeName = wp._links?.type?.title ?? "Task";
    const priorityId = defaultPriorityByType[typeName] ?? 9;
    const statusId = defaultStatusByType[typeName] ?? 1;
    const subject = wp.subject?.trim();
    if (!subject) {
      continue;
    }

    let description;
    if (typeName === "Summary task") {
      const phase = phaseMap.get(subject);
      if (!phase) {
        continue;
      }
      description = generatePhaseDescription(subject, phase.tasks, phase.quality);
    } else {
      const parentTitle = wp._links?.parent?.title;
      const phase = phaseMap.get(parentTitle ?? "");
      if (!phase) {
        continue;
      }
      if (typeName === "Milestone") {
        const qualityMatch = phase.quality.find((item) => subject.endsWith(item) || stripPhasePrefix(item) === stripPhasePrefix(subject));
        description = generateMilestoneDescription(parentTitle, qualityMatch ?? stripPhasePrefix(subject));
      } else {
        const taskMatch = phase.tasks.find((item) => subject.endsWith(item) || stripPhasePrefix(item) === stripPhasePrefix(subject));
        description = generateTaskDescription(parentTitle, taskMatch ?? subject);
      }
    }

    await updateWorkPackage(client, wp.id, (current) => ({
      description: {
        format: "markdown",
        raw: description,
      },
      _links: {
        ...(priorityId ? { priority: { href: `/api/v3/priorities/${priorityId}` } } : {}),
        ...(statusId ? { status: { href: `/api/v3/statuses/${statusId}` } } : {}),
      },
    }));

    summary.push({ id: wp.id, subject, type: typeName });
  }

  return summary;
};

const isDirectExecution = () => {
  const currentFile = fileURLToPath(import.meta.url);
  const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return currentFile === invoked;
};

const runCli = async () => {
  try {
    const updated = await enrich();
    console.log(`Enriched ${updated.length} work packages.`);
  } catch (error) {
    console.error(`Failed to enrich OpenProject work packages: ${error.message}`);
    process.exit(1);
  }
};

if (isDirectExecution()) {
  runCli();
}

export const enrichOpenProject = enrich;
