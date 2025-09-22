#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import {
  loadEnvFiles,
  getGitlabConfig,
  createGitlabClient,
} from './gitlab-utils.mjs';

const parseOverhaulPlan = async () => {
  const planPath = path.join(process.cwd(), 'docs', 'overhaul-plan.md');
  const content = await readFile(planPath, 'utf8');
  const headingRegex = /^###\s+(Phase\s+\d+\s+[\u2013-]\s+.+)$/gmu;
  const headings = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push(match[1].trim());
  }
  return headings;
};

const PHASE_BOARD_NAME = 'Phase Delivery';
const QUALITY_LABEL = 'quality-gate';
const SPRINT_LENGTH_DAYS = 14;

const ensureBoard = async (client, projectId) => {
  const boards = await client.collect(`/projects/${projectId}/boards`);
  const board = boards.find((b) => b.name === PHASE_BOARD_NAME);
  if (board) {
    return board;
  }
  return client.request('POST', `/projects/${projectId}/boards`, {
    body: { name: PHASE_BOARD_NAME },
  });
};

const ensureBoardLists = async (client, projectId, boardId, labelIds) => {
  const existingLists = await client.collect(`/projects/${projectId}/boards/${boardId}/lists`);
  const existingLabelIds = new Set(existingLists.filter((list) => list.label).map((list) => list.label.id));
  const created = [];
  for (const labelId of labelIds) {
    if (!existingLabelIds.has(labelId)) {
      const list = await client.request('POST', `/projects/${projectId}/boards/${boardId}/lists`, {
        body: { label_id: labelId },
      });
      created.push(list.id);
    }
  }
  return { existing: existingLists, created };
};

const updateMilestones = async (client, projectId, phaseMilestones) => {
  const today = new Date();
  const updates = [];
  phaseMilestones.forEach((milestone, index) => {
    const start = new Date(today);
    start.setDate(start.getDate() + index * SPRINT_LENGTH_DAYS);
    const due = new Date(start);
    due.setDate(due.getDate() + SPRINT_LENGTH_DAYS - 1);
    updates.push({ milestone, start, due });
  });

  for (const { milestone, start, due } of updates) {
    await client.request('PUT', `/projects/${projectId}/milestones/${milestone.id}`, {
      body: {
        start_date: start.toISOString().slice(0, 10),
        due_date: due.toISOString().slice(0, 10),
      },
    });
  }

  return updates.map(({ milestone, start, due }) => ({ title: milestone.title, start, due }));
};

export const syncBoards = async () => {
  await loadEnvFiles();
  const phaseHeadings = await parseOverhaulPlan();
  const config = getGitlabConfig();
  const client = createGitlabClient(config);

  const labels = await client.collect(`/projects/${config.projectId}/labels`, { query: { per_page: '100' } });
  const phaseLabels = labels.filter((label) => label.name.startsWith('phase::'));
  if (!phaseLabels.length) {
    throw new Error('No phase labels found. Run npm run gitlab:sync first.');
  }

  const qualityLabel = labels.find((label) => label.name === QUALITY_LABEL);
  const board = await ensureBoard(client, config.projectId);
  const labelOrder = [...phaseLabels].sort((a, b) => phaseHeadings.indexOf(a.name.replace('phase::', '')) - phaseHeadings.indexOf(b.name.replace('phase::', '')));
  if (qualityLabel) {
    labelOrder.push(qualityLabel);
  }
  const { created } = await ensureBoardLists(client, config.projectId, board.id, labelOrder.map((label) => label.id));

  const milestones = await client.collect(`/projects/${config.projectId}/milestones`, { query: { per_page: '100' } });
  const phaseMilestones = phaseHeadings
    .map((heading) => milestones.find((milestone) => milestone.title === heading))
    .filter(Boolean);
  const schedule = await updateMilestones(client, config.projectId, phaseMilestones);

  return {
    board: board.name,
    listsCreated: created,
    milestonesUpdated: schedule.map(({ title, start, due }) => ({
      title,
      start: start.toISOString().slice(0, 10),
      due: due.toISOString().slice(0, 10),
    })),
  };
};

const isDirectExecution = () => {
  const resolved = path.resolve(fileURLToPath(import.meta.url));
  const invoked = process.argv[1] ? path.resolve(process.argv[1]) : '';
  return resolved === invoked;
};

if (isDirectExecution()) {
  syncBoards()
    .then((result) => {
      console.log(`Board: ${result.board}`);
      console.log(`New lists added: ${result.listsCreated.length}`);
      console.log('Milestone schedule:');
      result.milestonesUpdated.forEach((item) => console.log(`- ${item.title}: ${item.start} → ${item.due}`));
    })
    .catch((error) => {
      console.error(`Failed to sync GitLab boards: ${error.message}`);
      process.exit(1);
    });
}
