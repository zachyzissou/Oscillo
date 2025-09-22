#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadEnvFiles,
  getGitlabConfig,
  createGitlabClient,
} from './gitlab-utils.mjs';

const OVERDUE_LABEL = 'attention::overdue';
const OVERDUE_COLOR = '#E53E3E';

const ensureLabel = async (client, projectId, name, color, description) => {
  const labels = await client.collect(`/projects/${projectId}/labels`, { query: { search: name } });
  const existing = labels.find((label) => label.name === name);
  if (existing) {
    return existing;
  }
  return client.request('POST', `/projects/${projectId}/labels`, {
    body: { name, color, description },
  });
};

const fetchIssuesByLabel = async (client, projectId, label) => client.collect(`/projects/${projectId}/issues`, {
  query: { labels: label, per_page: '100', scope: 'all', state: 'all' },
});

const addQualityGateComments = async (client, projectId) => {
  const issues = await fetchIssuesByLabel(client, projectId, 'quality-gate');
  const summary = [];
  for (const issue of issues) {
    const notes = await client.collect(`/projects/${projectId}/issues/${issue.iid}/notes`, { query: { per_page: '100' } });
    const hasAutomationNote = notes.some((note) => note.body.includes('Automation summary'));
    if (!hasAutomationNote) {
      const body = `Automation summary:\n- Link metrics artifacts to this issue once Playwright/Lighthouse runs complete.\n- Update the wiki [Metrics Dashboard](./-/wikis/Metrics%20Dashboard) after attaching evidence.\n- Capture failure analysis (if any) in the issue comments.\n`;
      await client.request('POST', `/projects/${projectId}/issues/${issue.iid}/notes`, {
        body: { body },
      });
      summary.push(issue.title);
    }
  }
  return summary;
};

const markOverdueTasks = async (client, projectId) => {
  const overdueLabel = await ensureLabel(client, projectId, OVERDUE_LABEL, OVERDUE_COLOR, 'Auto-applied when milestone due date is past');
  const issues = await fetchIssuesByLabel(client, projectId, 'task');
  const now = new Date();
  const flagged = [];
  for (const issue of issues) {
    if (!issue.milestone || !issue.milestone.due_date) continue;
    const due = new Date(issue.milestone.due_date);
    const hasOverdue = issue.labels.includes(overdueLabel.name);
    if (due < now && !hasOverdue) {
      const labels = [...new Set([...issue.labels, overdueLabel.name])];
      await client.request('PUT', `/projects/${projectId}/issues/${issue.iid}`, {
        body: { labels: labels.join(',') },
      });
      flagged.push(issue.title);
    }
  }
  return flagged;
};

const assignUnownedTasks = async (client, projectId) => {
  const project = await client.request('GET', `/projects/${projectId}`);
  const defaultAssignee = project.owner?.id;
  if (!defaultAssignee) {
    return [];
  }
  const issues = await fetchIssuesByLabel(client, projectId, 'task');
  const assigned = [];
  for (const issue of issues) {
    if (issue.assignees.length) continue;
    await client.request('PUT', `/projects/${projectId}/issues/${issue.iid}`, {
      body: { assignee_id: defaultAssignee },
    });
    assigned.push(issue.title);
  }
  return assigned;
};

export const runAutomationSweep = async () => {
  await loadEnvFiles();
  const config = getGitlabConfig();
  const client = createGitlabClient(config);

  const [qualityNotes, overdue, assignments] = await Promise.all([
    addQualityGateComments(client, config.projectId),
    markOverdueTasks(client, config.projectId),
    assignUnownedTasks(client, config.projectId),
  ]);

  return {
    qualityNotes: qualityNotes.length,
    overdueFlagged: overdue.length,
    assignments: assignments.length,
  };
};

const isDirectExecution = () => {
  const resolved = fileURLToPath(import.meta.url);
  const invoked = process.argv[1] ? path.resolve(process.argv[1]) : '';
  return path.resolve(resolved) === invoked;
};

if (isDirectExecution()) {
  runAutomationSweep()
    .then((result) => {
      console.log(`Automation sweep complete. Quality notes added: ${result.qualityNotes}; overdue flagged: ${result.overdueFlagged}; tasks assigned: ${result.assignments}.`);
    })
    .catch((error) => {
      console.error(`Automation sweep failed: ${error.message}`);
      process.exit(1);
    });
}
