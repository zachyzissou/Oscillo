#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadEnvFiles,
  getOpenProjectConfig,
  createOpenProjectClient,
} from "./openproject-utils.mjs";

const DASHBOARD_GRID_ID = 9;

const buildNarrative = (projectId, docsUrl) => {
  const boardLink = `./work_packages?query_props=%7B%22t%22:%22work_packages%22,%22f%22:%5B%7B%22n%22:%22project%22,%22o%22:%22=%22,%22v%22:%5B%22${projectId}%22%5D%7D%5D,%22g%22:%7B%22attribute%22:%22status%22%7D,%22c%22:%5B%22id%22,%22subject%22,%22status%22,%22assignee%22,%22priority%22,%22dueDate%22%5D%7D`;
  const gatesLink = `./work_packages?query_props=%7B%22t%22:%22work_packages%22,%22f%22:%5B%7B%22n%22:%22project%22,%22o%22:%22=%22,%22v%22:%5B%22${projectId}%22%5D%7D,%7B%22n%22:%22type%22,%22o%22:%22=%22,%22v%22:%5B%22Milestone%22%5D%7D%5D,%22c%22:%5B%22id%22,%22subject%22,%22status%22,%22assignee%22,%22dueDate%22%5D%7D`;
  return [
    "## Delivery Command Center",
    "",
    "**Quick actions**",
    `- [Phase delivery board](${boardLink})`,
    `- [Quality gates](${gatesLink})`,
    `- [Docs & metrics repo view](${docsUrl})`,
    "",
    "**How to use this hub**",
    "1. Track active work in the Phase Delivery board widget below.",
    "2. Use the calendar to visualise milestone cadence and due dates.",
    "3. Update work packages with the enrichment script when docs change.",
    "4. Comment on quality gates with links to metrics, tests, and PRs.",
    "",
    "**Automation shortcuts**",
    "- `npm run openproject:bootstrap` — sync phases + tasks from the repo.",
    "- `npm run openproject:enrich` — regenerate high-fidelity descriptions.",
    "- `npm run openproject:build` — rebuild task tree from docs.",
    "",
  ].join("\n");
};

const resolveProject = async (client, identifier) => {
  const projects = await client.collectElements("/api/v3/projects");
  const target = projects.find((project) => {
    const slug = (project.identifier ?? "").toLowerCase();
    const name = (project.name ?? "").toLowerCase();
    const targetSlug = identifier.toLowerCase();
    return slug === targetSlug || name === targetSlug;
  });
  if (!target) {
    throw new Error(`Project "${identifier}" not found.`);
  }
  return target;
};

export const refreshDashboard = async () => {
  await loadEnvFiles();
  const config = getOpenProjectConfig();
  const client = createOpenProjectClient(config);
  const project = await resolveProject(client, config.projectIdentifier);
  const projectId = String(client.extractId(project));

  const boardQueryProps = {
    t: "work_packages",
    f: [
      { n: "project", o: "=", v: [projectId] },
    ],
    g: { attribute: "status" },
    c: ["id", "subject", "status", "assignee", "priority", "dueDate"],
    h: [],
  };

  const calendarQueryProps = {
    t: "work_packages",
    f: [
      { n: "project", o: "=", v: [projectId] },
    ],
    h: [],
  };

  const narrative = buildNarrative(projectId, "https://github.com/<your-org>/INTERACTIVE-MUSIC-3D/tree/main/docs");

  const widgets = [
    { id: 47, identifier: "project_description", startRow: 1, endRow: 3, startColumn: 1, endColumn: 2, options: { name: "Project description" } },
    { id: 48, identifier: "project_status", startRow: 1, endRow: 2, startColumn: 2, endColumn: 3, options: { name: "Project status" } },
    { id: 49, identifier: "work_packages_overview", startRow: 3, endRow: 4, startColumn: 1, endColumn: 3, options: { name: "Work packages overview" } },
    { id: 50, identifier: "members", startRow: 2, endRow: 3, startColumn: 2, endColumn: 3, options: { name: "Members" } },
    { id: 51, identifier: "work_packages_table", startRow: 5, endRow: 6, startColumn: 1, endColumn: 3, options: { name: "Phase Delivery Board", queryProps: boardQueryProps } },
    { id: 52, identifier: "work_packages_calendar", startRow: 6, endRow: 8, startColumn: 1, endColumn: 3, options: { name: "Phase Timeline Calendar", queryProps: calendarQueryProps } },
    { identifier: "custom_text", startRow: 4, endRow: 5, startColumn: 1, endColumn: 3, options: { text: { format: "markdown", raw: narrative } } },
  ];

  const payload = {
    rowCount: 7,
    columnCount: 2,
    options: {},
    widgets,
  };

  const updated = await client.requestJson(`/api/v3/grids/${DASHBOARD_GRID_ID}`, {
    method: "PATCH",
    body: payload,
  });

  return updated.widgets.map((widget) => ({
    id: widget.id,
    identifier: widget.identifier,
    name: widget.options?.name,
  }));
};

const isDirectExecution = () => {
  const resolved = path.resolve(fileURLToPath(import.meta.url));
  const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return resolved === invoked;
};

if (isDirectExecution()) {
  refreshDashboard()
    .then((widgets) => {
      console.log(`Updated dashboard with ${widgets.length} widgets.`);
    })
    .catch((error) => {
      console.error(`Failed to update dashboard: ${error.message}`);
      process.exit(1);
    });
}
