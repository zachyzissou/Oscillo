#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadEnvFiles,
  getOpenProjectConfig,
  createOpenProjectClient,
} from "./openproject-utils.mjs";

const parseOverhaulPlan = async ({ taskPrefix }) => {
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

    const headingMatch = current.heading.match(/^Phase\s+(\d+)\s+([\u2013-])\s+(.+)$/);
    if (!headingMatch) {
      continue;
    }

    const [, phaseNumber, separator] = headingMatch;
    const prefix = `Phase ${phaseNumber} ${separator} `;

    const tasks = bulletTasks.map((task) => ({
      kind: "task",
      subject: `${taskPrefix}${prefix}${task}`,
      description: task,
    }));

    const qualityTasks = qualityItems.map((item) => ({
      kind: "quality",
      subject: `${taskPrefix}${prefix}Quality Gate: ${item}`,
      description: item,
    }));

    phases.push({
      heading: current.heading,
      tasks,
      qualityTasks,
    });
  }

  return phases;
};

const toSubjectSet = (workPackages) => new Set(workPackages.map((wp) => wp.subject?.trim()).filter(Boolean));

export const buildOpenProjectPlan = async ({
  apply = false,
  loadEnv = true,
} = {}) => {
  if (loadEnv) {
    await loadEnvFiles();
  }

  const taskPrefix = process.env.OPENPROJECT_TASK_PREFIX ?? "";
  const config = getOpenProjectConfig();
  const {
    requestJson,
    collectElements,
    extractId,
  } = createOpenProjectClient(config);

  const phasesFromPlan = await parseOverhaulPlan({ taskPrefix });
  if (!phasesFromPlan.length) {
    throw new Error("No phases parsed from docs/overhaul-plan.md.");
  }

  const projects = await collectElements("/api/v3/projects");
  const targetProject = projects.find((project) => {
    const identifier = project.identifier ?? "";
    const normalizedName = (project.name ?? "").toLowerCase();
    const normalizedTarget = config.projectIdentifier.toLowerCase();
    return identifier.toLowerCase() === normalizedTarget || normalizedName === normalizedTarget;
  });

  if (!targetProject) {
    throw new Error(`Project "${config.projectIdentifier}" not found in OpenProject.`);
  }

  const projectId = extractId(targetProject);
  const projectName = targetProject.name;
  const phaseSubjects = phasesFromPlan.map((phase) => phase.heading);

  const workPackagesHref =
    targetProject._links?.workPackages?.href ?? `/api/v3/projects/${projectId}/work_packages`;
  const allWorkPackages = await collectElements(workPackagesHref);

  const phaseMap = new Map();
  for (const wp of allWorkPackages) {
    if (phaseSubjects.includes(wp.subject?.trim())) {
      phaseMap.set(wp.subject.trim(), wp);
    }
  }

  const missingPhases = phaseSubjects.filter((subject) => !phaseMap.has(subject));
  if (missingPhases.length) {
    throw new Error(
      `The following phases are missing from OpenProject: ${missingPhases.join(", ")}. Run openproject-sync first.`
    );
  }

  const types = await collectElements(`/api/v3/projects/${projectId}/types`);
  const taskType = types.find((type) => type.name?.toLowerCase() === "task");
  const milestoneType = types.find((type) => type.name?.toLowerCase() === "milestone");
  const fallbackType = taskType ?? types[0];

  if (!fallbackType) {
    throw new Error("No work package types are available for this project.");
  }

  const phaseSummaries = [];

  for (const phase of phasesFromPlan) {
    const phaseWp = phaseMap.get(phase.heading);
    const phaseId = extractId(phaseWp);
    const childWps = allWorkPackages.filter((wp) => wp._links?.parent?.href?.endsWith(`/${phaseId}`));
    const existingSubjects = toSubjectSet(childWps);

    const desiredTasks = [...phase.tasks, ...phase.qualityTasks];
    const missingTasks = desiredTasks.filter((task) => !existingSubjects.has(task.subject));

    phaseSummaries.push({
      phase: phase.heading,
      parentId: phaseId,
      existingCount: childWps.length,
      desiredCount: desiredTasks.length,
      missing: missingTasks,
    });
  }

  const summary = {
    project: { id: projectId, name: projectName },
    phases: phaseSummaries,
    created: [],
  };

  if (apply) {
    for (const entry of phaseSummaries) {
      for (const task of entry.missing) {
        const type = task.kind === "quality" && milestoneType ? milestoneType : fallbackType;
        const created = await requestJson("/api/v3/work_packages", {
          method: "POST",
          body: {
            subject: task.subject,
            description: task.description
              ? {
                  format: "markdown",
                  raw: task.description,
                }
              : undefined,
            _links: {
              project: { href: `/api/v3/projects/${projectId}` },
              type: { href: type._links?.self?.href ?? `/api/v3/types/${extractId(type)}` },
              parent: { href: `/api/v3/work_packages/${entry.parentId}` },
            },
          },
        });

        summary.created.push({
          id: created.id,
          subject: created.subject,
          parent: entry.phase,
          type: created._links?.type?.title ?? type.name,
        });
      }
    }
  }

  return summary;
};

const isDirectExecution = () => {
  const currentFile = fileURLToPath(import.meta.url);
  const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return currentFile === invoked;
};

const runCli = async () => {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const outputJson = args.includes("--json");

  try {
    const summary = await buildOpenProjectPlan({ apply });

    if (outputJson) {
      console.log(JSON.stringify(summary, null, 2));
      return;
    }

    console.log(`Project: ${summary.project.name} (#${summary.project.id})`);
    for (const entry of summary.phases) {
      console.log(`\n${entry.phase}`);
      console.log(` - existing tasks: ${entry.existingCount}`);
      console.log(` - desired tasks: ${entry.desiredCount}`);
      if (entry.missing.length) {
        console.log(" - missing tasks to create:");
        entry.missing.forEach((task) => console.log(`   - ${task.subject}`));
      } else {
        console.log(" - all tasks present");
      }
    }

    if (summary.created.length) {
      console.log("\nCreated work packages:");
      summary.created.forEach((pkg) =>
        console.log(` - #${pkg.id} ${pkg.subject} (parent: ${pkg.parent})`)
      );
    } else if (apply) {
      console.log("\nNo new work packages were required.");
    }
  } catch (error) {
    console.error(`Failed to build OpenProject plan: ${error.message}`);
    process.exit(1);
  }
};

if (isDirectExecution()) {
  runCli();
}
