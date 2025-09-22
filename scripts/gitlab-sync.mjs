#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import {
  loadEnvFiles,
  getGitlabConfig,
  createGitlabClient,
} from './gitlab-utils.mjs';

const COLORS = {
  phase: '#1A67A3',
  task: '#3182CE',
  quality: '#DD6B20',
};

const parseOverhaulPlan = async () => {
  const planPath = path.join(process.cwd(), 'docs', 'overhaul-plan.md');
  const content = await readFile(planPath, 'utf8');
  const headingRegex = /^###\s+(Phase\s+\d+\s+[\u2013-]\s+.+)$/gmu;
  const bulletRegex = /^-\s+(.+)$/gm;
  const qualityRegex = /\*\*Quality gates\*\*:\s*(.+)/i;

  const phases = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const heading = match[1].trim();
    const nextIndex = headingRegex.lastIndex;
    const endIndex = content.indexOf('### ', nextIndex);
    const section = content.slice(nextIndex, endIndex === -1 ? content.length : endIndex);

    const tasks = [...section.matchAll(bulletRegex)].map((entry) => entry[1].trim());
    const qualityMatch = section.match(qualityRegex);
    const quality = qualityMatch
      ? qualityMatch[1]
          .split(/;\s*/)
          .map((item) => item.replace(/\s*\.?$/, '').trim())
          .filter(Boolean)
      : [];

    phases.push({ heading, tasks, quality });
  }

  return phases;
};

const slugifyPhase = (heading) => heading
  .toLowerCase()
  .replace(/^phase\s+(\d+)/, (_, num) => `phase-${Number(num).toString().padStart(2, '0')}`)
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

const phaseLabelName = (heading) => `phase::${slugifyPhase(heading)}`;

const stripPhasePrefix = (text) => text.replace(/^Phase\s+\d+\s+[\u2013-]\s+/u, '').trim();

const splitActivities = (text) => {
  const cleaned = text.replace(/^Quality Gate:\s*/i, '').replace(/\.$/, '');
  const separators = ['; ', ' and ', ', then ', ', and '];
  for (const sep of separators) {
    if (cleaned.includes(sep)) {
      const parts = cleaned.split(sep).map((part) => part.trim()).filter(Boolean);
      if (parts.length > 1) {
        return parts;
      }
    }
  }
  const commaParts = cleaned.split(/,\s+/).map((part) => part.trim()).filter(Boolean);
  if (commaParts.length > 1 && commaParts.join(', ') !== cleaned) {
    return commaParts;
  }
  return [cleaned];
};

const buildDeliverables = (heading) => {
  const docs = ['<code>docs/overhaul-plan.md</code>'];
  if (heading.includes('Phase 1')) docs.push('<code>docs/metrics/</code>');
  if (heading.includes('Phase 5')) docs.push('<code>docs/architecture/</code>');
  if (heading.includes('Phase 6')) docs.push('<code>docs/audio-init.md</code>');
  if (heading.includes('Phase 7')) docs.push('<code>docs/performance.md</code>');
  if (heading.includes('Phase 8')) docs.push('<code>docs/testing.md</code>');
  if (heading.includes('Phase 9')) docs.push('<code>docs/security.md</code>');
  if (heading.includes('Phase 10')) docs.push('<code>README.md</code>');
  return [
    'Pull request referencing this issue',
    'Updated changelog entry summarizing impact',
    ...docs,
  ];
};

const buildValidationChecklist = (text) => {
  const checklist = [
    '<code>npm run type-check</code>',
    '<code>npm run lint:check</code>',
    '<code>npm run build</code>',
  ];
  const lower = text.toLowerCase();
  if (lower.includes('playwright')) {
    checklist.push('<code>npm run test:performance</code>', '<code>npm run test:smoke</code> (as applicable)');
  }
  if (lower.includes('vitest') || lower.includes('coverage')) {
    checklist.push('<code>npm run test:unit -- --coverage</code> (generate coverage artifacts)');
  }
  if (lower.includes('lighthouse')) {
    checklist.push('Record Lighthouse runs (desktop + mobile) and archive reports');
  }
  if (lower.includes('metrics')) {
    checklist.push('Update <code>/docs/metrics/</code> with before/after snapshots');
  }
  if (lower.includes('audio')) {
    checklist.push('Audio smoke-test across supported browsers + mobile');
  }
  if (lower.includes('security') || lower.includes('audit')) {
    checklist.push('<code>npm run security:audit</code> and capture the report');
  }
  if (lower.includes('render') || lower.includes('performance')) {
    checklist.push('Capture Playwright performance trace and compare FPS minima');
  }
  if (lower.includes('documentation')) {
    checklist.push('Proofread docs and secure reviewer sign-off');
  }
  return [...new Set(checklist)];
};

const generateTaskDescription = (phaseHeading, taskText) => {
  const objective = stripPhasePrefix(taskText);
  const activities = splitActivities(objective);
  const deliverables = buildDeliverables(phaseHeading);
  const validation = buildValidationChecklist(objective);

  return `## Objective\n${objective}\n\n## Key Activities\n${activities.map((item) => `- ${item}`).join('\n')}\n\n## Deliverables\n${deliverables.map((item) => `- ${item}`).join('\n')}\n\n## Validation\n${validation.map((item) => `- ${item}`).join('\n')}\n\n## Collaboration\n- Pair with domain experts (audio, rendering, infra) where relevant\n- Document decisions as ADRs or inline design notes\n- Cross-link related issues and wiki pages in GitLab`;
};

const generateQualityDescription = (phaseHeading, gateText) => {
  const label = stripPhasePrefix(gateText);
  const criteria = splitActivities(label);
  const validation = buildValidationChecklist(label);
  const evidence = [
    'Comment on this issue with links to metrics/tests/docs',
    'Attach screenshots or logs demonstrating the gate criteria',
  ];
  if (label.toLowerCase().includes('metrics')) evidence.push('Link to <code>/docs/metrics/</code> snapshot');
  if (label.toLowerCase().includes('tracking board')) evidence.push('Screenshot or URL of the updated tracking board');
  if (label.toLowerCase().includes('ci')) evidence.push('Latest CI run proving required checks');
  if (label.toLowerCase().includes('documentation')) evidence.push('Links to merged documentation MR');

  return `## Quality Gate\n${label}\n\n## Entry Criteria\n${criteria.map((item) => `- ${item}`).join('\n')}\n\n## Evidence to Attach\n${[...new Set(evidence)].map((item) => `- ${item}`).join('\n')}\n\n## Validation\n${validation.map((item) => `- ${item}`).join('\n')}\n\n## Notes\n- Announce completion in the delivery channel\n- Ensure rollback/fallback plans are documented where relevant`;
};

const ensureLabel = async (client, projectId, { name, color, description }) => {
  const labels = await client.collect(`/projects/${projectId}/labels`, { query: { search: name } });
  const existing = labels.find((label) => label.name === name);
  if (existing) {
      return existing;
  }
  return client.request('POST', `/projects/${projectId}/labels`, {
    body: { name, color, description },
  });
};

const ensureMilestone = async (client, projectId, title) => {
  const milestones = await client.collect(`/projects/${projectId}/milestones`, { query: { search: title } });
  const existing = milestones.find((milestone) => milestone.title === title);
  if (existing) {
    return existing;
  }
  return client.request('POST', `/projects/${projectId}/milestones`, {
    body: { title },
  });
};

export const syncGitlabIssues = async () => {
  await loadEnvFiles();
  const config = getGitlabConfig();
  const client = createGitlabClient(config);
  const phases = await parseOverhaulPlan();
  const issues = await client.collect(`/projects/${config.projectId}/issues`, {
    query: { per_page: '100', scope: 'all', state: 'all' },
  });
  const issueMap = new Map(issues.map((issue) => [issue.title.toLowerCase(), issue]));

  const baseLabels = {
    task: await ensureLabel(client, config.projectId, { name: 'task', color: COLORS.task, description: 'Standard overhaul task' }),
    quality: await ensureLabel(client, config.projectId, { name: 'quality-gate', color: COLORS.quality, description: 'Quality gate milestone issue' }),
  };

  const created = [];
  const updated = [];

  for (const phase of phases) {
    const phaseLabel = phaseLabelName(phase.heading);
    await ensureLabel(client, config.projectId, { name: phaseLabel, color: COLORS.phase, description: phase.heading });
    const milestone = await ensureMilestone(client, config.projectId, phase.heading);

    for (const task of phase.tasks) {
      const title = stripPhasePrefix(task);
      const description = generateTaskDescription(phase.heading, task);
      const labels = [phaseLabel, baseLabels.task.name];
      const existing = issueMap.get(title.toLowerCase());

      if (existing) {
        await client.request('PUT', `/projects/${config.projectId}/issues/${existing.iid}`, {
          body: {
            description,
            labels: labels.join(','),
            milestone_id: milestone.id,
          },
        });
        updated.push(title);
      } else {
        let issue;
        try {
          issue = await client.request('POST', `/projects/${config.projectId}/issues`, {
            body: {
              title,
              description,
              labels: labels.join(','),
              milestone_id: milestone.id,
            },
          });
        } catch (error) {
          throw new Error(`Failed to create task issue for ${title}: ${error.message}`);
        }
        created.push(issue.title);
      }
    }

    for (const gate of phase.quality) {
      const title = stripPhasePrefix(gate);
      const description = generateQualityDescription(phase.heading, gate);
      const labels = [phaseLabel, baseLabels.quality.name];
      const existing = issueMap.get(title.toLowerCase());

      if (existing) {
        await client.request('PUT', `/projects/${config.projectId}/issues/${existing.iid}`, {
          body: {
            description,
            labels: labels.join(','),
            milestone_id: milestone.id,
          },
        });
        updated.push(title);
      } else {
        let issue;
        try {
          issue = await client.request('POST', `/projects/${config.projectId}/issues`, {
            body: {
              title,
              description,
              labels: labels.join(','),
              milestone_id: milestone.id,
            },
          });
        } catch (error) {
          throw new Error(`Failed to create quality gate issue for ${title}: ${error.message}`);
        }
        created.push(issue.title);
      }
    }
  }

  return { created, updated };
};

const isDirectExecution = () => {
  const resolved = fileURLToPath(import.meta.url);
  const invoked = process.argv[1] ? path.resolve(process.argv[1]) : '';
  return path.resolve(resolved) === invoked;
};

if (isDirectExecution()) {
  syncGitlabIssues()
    .then((result) => {
      console.log(`GitLab sync complete. Created ${result.created.length} issues, updated ${result.updated.length}.`);
    })
    .catch((error) => {
      console.error(`Failed to sync GitLab issues: ${error.message}`);
      process.exit(1);
    });
}
