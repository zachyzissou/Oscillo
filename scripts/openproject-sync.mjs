#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadEnvFiles,
  getOpenProjectConfig,
  createOpenProjectClient,
} from "./openproject-utils.mjs";

const readRoadmapPhases = async () => {
  const planPath = path.join(process.cwd(), "docs", "overhaul-plan.md");
  const content = await readFile(planPath, "utf8");
  const matches = [...content.matchAll(/^###\s+(Phase\s+\d+\s+[\u2013-]\s+.+)$/gmu)];
  return matches.map((match) => match[1].trim());
};

const findPreferredType = (types, preferredNames) => {
  const normalized = types.map((type) => ({
    reference: type,
    name: type.name?.toLowerCase() ?? "",
  }));

  for (const candidate of preferredNames) {
    const match = normalized.find((entry) => entry.name === candidate.toLowerCase());
    if (match) {
      return match.reference;
    }
  }

  return null;
};

export const syncOpenProjectPhases = async ({
  createMissing = false,
  loadEnv = true,
} = {}) => {
  if (loadEnv) {
    await loadEnvFiles();
  }

  const config = getOpenProjectConfig();
  const {
    requestJson,
    collectElements,
    extractId,
  } = createOpenProjectClient(config);

  const preferredTypeNames = [
    process.env.OPENPROJECT_PHASE_TYPE_NAME ?? "Phase",
    ...(process.env.OPENPROJECT_PHASE_TYPE_FALLBACKS ?? "Summary task,Milestone,Task")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean),
  ];

  const roadmapPhases = await readRoadmapPhases();
  if (!roadmapPhases.length) {
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

  const types = await collectElements(`/api/v3/projects/${projectId}/types`);
  const phaseType = findPreferredType(types, preferredTypeNames);

  if (!phaseType) {
    throw new Error(
      `Unable to find a work package type matching any of: ${preferredTypeNames.join(", ")}.`
    );
  }

  const phaseTypeId = String(extractId(phaseType));
  const workPackagesHref =
    targetProject._links?.workPackages?.href ?? `/api/v3/projects/${projectId}/work_packages`;
  const filters = encodeURIComponent(
    JSON.stringify([{ type: { operator: "=", values: [phaseTypeId] } }])
  );
  const workPackages = await collectElements(
    `${workPackagesHref}${workPackagesHref.includes("?") ? "&" : "?"}filters=${filters}`
  );
  const openProjectPhases = workPackages.map((pkg) => pkg.subject?.trim()).filter(Boolean);

  let missingInOpenProject = roadmapPhases.filter((phase) => !openProjectPhases.includes(phase));
  const missingInRoadmap = openProjectPhases.filter((phase) => !roadmapPhases.includes(phase));
  const created = [];

  if (createMissing && missingInOpenProject.length > 0) {
    for (const phase of missingInOpenProject) {
      const body = {
        subject: phase,
        description: {
          format: "markdown",
          raw: "Auto-created from docs/overhaul-plan.md sync.",
        },
        _links: {
          project: { href: `/api/v3/projects/${projectId}` },
          type: { href: phaseType._links?.self?.href ?? `/api/v3/types/${extractId(phaseType)}` },
        },
      };

      const createdWp = await requestJson("/api/v3/work_packages", { method: "POST", body });
      created.push({ id: createdWp.id, subject: createdWp.subject });
      openProjectPhases.push(createdWp.subject?.trim());
    }

    missingInOpenProject = roadmapPhases.filter((phase) => !openProjectPhases.includes(phase));
  }

  return {
    project: { id: projectId, name: projectName },
    typeUsed: phaseType.name,
    roadmapPhaseCount: roadmapPhases.length,
    openProjectPhaseCount: openProjectPhases.length,
    missingInOpenProject,
    missingInRoadmap,
    created,
  };
};

const isDirectExecution = () => {
  const currentFile = fileURLToPath(import.meta.url);
  const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return currentFile === invoked;
};

const runCli = async () => {
  const args = process.argv.slice(2);
  const createMissing = args.includes("--create-missing");
  const outputJson = args.includes("--json");

  try {
    const summary = await syncOpenProjectPhases({ createMissing });

    if (outputJson) {
      console.log(JSON.stringify(summary, null, 2));
      return;
    }

    console.log("OpenProject connection established.");
    console.log(`Project: ${summary.project.name} (#${summary.project.id})`);
    console.log(`Roadmap phases: ${summary.roadmapPhaseCount}`);
    console.log(`OpenProject phase work packages: ${summary.openProjectPhaseCount}`);
    console.log(`Type used: ${summary.typeUsed}`);

    if (summary.missingInOpenProject.length) {
      console.log("\nRoadmap phases missing in OpenProject:");
      summary.missingInOpenProject.forEach((phase) => console.log(` - ${phase}`));
    } else {
      console.log("\nAll roadmap phases exist in OpenProject.");
    }

    if (summary.missingInRoadmap.length) {
      console.log("\nOpenProject phases not documented in overhaul plan:");
      summary.missingInRoadmap.forEach((phase) => console.log(` - ${phase}`));
    }

    if (summary.created.length) {
      console.log("\nCreated phase work packages:");
      summary.created.forEach((pkg) => console.log(` - #${pkg.id} ${pkg.subject}`));
    }
  } catch (error) {
    console.error(`Failed to sync OpenProject phases: ${error.message}`);
    process.exit(1);
  }
};

if (isDirectExecution()) {
  runCli();
}
