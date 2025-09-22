#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFiles } from "./openproject-utils.mjs";
import { syncOpenProjectPhases } from "./openproject-sync.mjs";
import { buildOpenProjectPlan } from "./openproject-build.mjs";

export const bootstrapOpenProject = async ({
  createPhases = true,
  applyTasks = true,
  outputJson = false,
} = {}) => {
  await loadEnvFiles();

  const syncSummary = await syncOpenProjectPhases({
    createMissing: createPhases,
    loadEnv: false,
  });

  const buildSummary = await buildOpenProjectPlan({
    apply: applyTasks,
    loadEnv: false,
  });

  const summary = {
    createdPhases: syncSummary.created,
    missingPhases: syncSummary.missingInOpenProject,
    extraPhases: syncSummary.missingInRoadmap,
    createdTasks: buildSummary.created,
    phases: buildSummary.phases.map((phase) => ({
      name: phase.phase,
      existing: phase.existingCount,
      desired: phase.desiredCount,
      missing: phase.missing.map((task) => task.subject),
    })),
    project: syncSummary.project,
  };

  if (outputJson) {
    console.log(JSON.stringify(summary, null, 2));
    return summary;
  }

  console.log(`Project: ${summary.project.name} (#${summary.project.id})`);

  if (summary.missingPhases.length) {
    console.log("\nRoadmap phases missing after sync:");
    summary.missingPhases.forEach((phase) => console.log(` - ${phase}`));
  } else {
    console.log("\nAll roadmap phases present in OpenProject.");
  }

  if (summary.extraPhases.length) {
    console.log("\nOpenProject contains additional phases not in the roadmap:");
    summary.extraPhases.forEach((phase) => console.log(` - ${phase}`));
  }

  if (summary.createdPhases.length) {
    console.log("\nCreated phase work packages:");
    summary.createdPhases.forEach((pkg) => console.log(` - #${pkg.id} ${pkg.subject}`));
  }

  const newlyCreatedTasks = summary.createdTasks;
  if (newlyCreatedTasks.length) {
    console.log("\nCreated tasks / milestones:");
    newlyCreatedTasks.forEach((pkg) =>
      console.log(` - #${pkg.id} ${pkg.subject} (parent: ${pkg.parent})`)
    );
  }

  const remainingGaps = summary.phases
    .filter((phase) => phase.missing.length > 0)
    .map((phase) => ({ name: phase.name, missing: phase.missing }));

  if (remainingGaps.length) {
    console.log("\nRemaining missing items:");
    remainingGaps.forEach((phase) => {
      console.log(` - ${phase.name}`);
      phase.missing.forEach((task) => console.log(`   • ${task}`));
    });
  } else {
    console.log("\nAll phases fully populated." );
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
  const outputJson = args.includes("--json");
  const createPhases = !args.includes("--no-create");
  const applyTasks = !args.includes("--no-apply");

  try {
    await bootstrapOpenProject({ createPhases, applyTasks, outputJson });
  } catch (error) {
    console.error(`Failed to bootstrap OpenProject: ${error.message}`);
    process.exit(1);
  }
};

if (isDirectExecution()) {
  runCli();
}
