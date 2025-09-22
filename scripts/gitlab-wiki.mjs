#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadEnvFiles,
  getGitlabConfig,
  createGitlabClient,
} from './gitlab-utils.mjs';
import { readFile } from 'node:fs/promises';

const parseOverhaulPlan = async () => {
  const planPath = path.join(process.cwd(), 'docs', 'overhaul-plan.md');
  const content = await readFile(planPath, 'utf8');
  const headingRegex = /^###\s+(Phase\s+\d+\s+[\u2013-]\s+.+)$/gmu;
  const bulletRegex = /^-\s+(.+)$/gm;
  const phases = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const heading = match[1].trim();
    const nextIndex = headingRegex.lastIndex;
    const section = content.slice(nextIndex, content.indexOf('### ', nextIndex) === -1 ? content.length : content.indexOf('### ', nextIndex));
    const bullets = [...section.matchAll(bulletRegex)].map((entry) => entry[1].trim());
    const qualityMatch = section.match(/\*\*Quality gates\*\*:\s*(.+)/i);
    const quality = qualityMatch
      ? qualityMatch[1]
          .split(/;\s*/)
          .map((item) => item.replace(/\s*\.?$/, '').trim())
          .filter(Boolean)
      : [];
    phases.push({ heading, bullets, quality });
  }
  return phases;
};

const renderHomePage = ({ projectUrl, boardUrl, qualityUrl, repoDocsUrl }) => `# Interactive Music 3D Overhaul

Welcome to the delivery command center. Use the links below to jump straight into active work, quality gates, and documentation.

## Quick Actions
- [Phase delivery board](${boardUrl})
- [Quality gate tracker](${qualityUrl})
- [Repository docs](${repoDocsUrl})

## How to Use This Wiki
1. Review the [Overhaul Plan](./Overhaul%20Plan) page for scoped phases and success criteria.
2. Use the board to move issues through the workflow; phase labels and milestones keep everything organised.
3. Attach evidence (metrics, screenshots, logs) to quality-gate issues as you complete them.
4. Check the [Automation & Operations](./Automation%20%26%20Operations) page for commands and pipelines.

## Automation Shortcuts
- \`npm run gitlab:sync\` — rebuild GitLab labels/milestones/issues from \`docs/overhaul-plan.md\`.
- \`npm run openproject:bootstrap\` — legacy OpenProject sync (if needed for comparison).
- \`npm run openproject:mcp\` — launch the OpenProject MCP bridge.

## Useful Links
- [Project on GitLab](${projectUrl})
- [Delivery metrics (repo)](${repoDocsUrl}/metrics)
- [Architecture docs](./Automation%20%26%20Operations#architecture)
`;

const renderOverhaulPage = (phases) => {
  const sections = phases.map((phase) => {
    const tasks = phase.bullets.map((bullet) => `- ${bullet}`).join('\n') || '- (no tasks listed)';
    const quality = phase.quality.map((gate) => `- ${gate.replace(/^Quality Gate:\s*/i, '')}`).join('\n') || '- (quality gates pending definition)';
    return `## ${phase.heading}

### Workstreams
${tasks}

### Quality Gates
${quality}
`;
  });
  return `# Overhaul Plan

This page is generated from \`docs/overhaul-plan.md\`. Update the source file and run \`npm run gitlab:sync\` to regenerate both issues and wiki content.

${sections.join('\n')}
`;
};

const renderAutomationPage = () => `# Automation & Operations

## Command Reference
- \`npm run gitlab:sync\`: Sync GitLab issues/labels/milestones from \`docs/overhaul-plan.md\`.
- \`npm run openproject:build\`: Legacy OpenProject task builder.
- \`npm run openproject:enrich\`: Refresh OpenProject work-package descriptions.
- \`npm run openproject:dashboard\`: Update the OpenProject project dashboard widgets.
- \`npm run openproject:mcp\`: Launch OpenProject MCP server for agent tooling.

## Architecture
- [Architecture diagrams](../docs/architecture)
- [Rendering pipeline](../docs/performance.md)
- [Audio service](../docs/audio-init.md)

## Testing & CI
- Playwright suites: <code>npm run test:smoke</code>, <code>npm run test:performance</code>, <code>npm run test:a11y</code>
- Vitest coverage: <code>npm run test:unit -- --coverage</code>
- Security audit: <code>npm run security:audit</code>

## Metrics & Evidence
- Store snapshots in \`docs/metrics/\`.
- Attach artifacts to quality-gate issues or release notes.
- Nightly summaries (planned) will publish to the [Metrics](./Metrics%20Dashboard) page.
`;

const renderMetricsPage = () => `# Metrics Dashboard

This page aggregates performance and quality evidence. After each quality gate, attach relevant artifacts here.

## Baseline Metrics
- Bundle analysis: \`docs/metrics/bundle-*.html\`
- Lighthouse reports: \`docs/metrics/lighthouse-*.json\`
- Playwright performance traces: \`docs/metrics/playwright-*.zip\`

## Latest Snapshots
- TODO: automate upload of latest metrics files to this page.
- TODO: include charts comparing FPS/memory/CI duration over time.

## Evidence Checklist
- Link to the corresponding GitLab issue comment with metrics summary.
- Upload artifacts (JSON, PNG, ZIP) using GitLab attachments.
- Note the date, environment, and tooling version.
`;

const ensureWikiPage = async (client, projectId, title, content, existingPages) => {
  const existing = existingPages.find((page) => page.title.toLowerCase() === title.toLowerCase());
  if (existing) {
    await client.request('PUT', `/projects/${projectId}/wikis/${encodeURIComponent(existing.slug)}`, {
      body: { content },
    });
    return { title, action: 'updated' };
  }
  await client.request('POST', `/projects/${projectId}/wikis`, {
    body: { title, content },
  });
  return { title, action: 'created' };
};

const syncWiki = async () => {
  await loadEnvFiles();
  const config = getGitlabConfig();
  const client = createGitlabClient(config);

  const phases = await parseOverhaulPlan();
  const project = await client.request('GET', `/projects/${config.projectId}`);
  const existingPages = await client.collect(`/projects/${config.projectId}/wikis`);

  const baseProjectUrl = project.web_url;
  const boardUrl = `${baseProjectUrl}/-/boards`;
  const qualityUrl = `${baseProjectUrl}/-/issues?label_name[]=quality-gate`;
  const docsUrl = `${baseProjectUrl}/-/blob/main/docs`;

  const pages = [
    { title: 'Home', content: renderHomePage({ projectUrl: baseProjectUrl, boardUrl, qualityUrl, repoDocsUrl: docsUrl }) },
    { title: 'Overhaul Plan', content: renderOverhaulPage(phases) },
    { title: 'Automation & Operations', content: renderAutomationPage() },
    { title: 'Metrics Dashboard', content: renderMetricsPage() },
  ];

  const results = [];
  for (const page of pages) {
    results.push(await ensureWikiPage(client, config.projectId, page.title, page.content, existingPages));
  }

  return results;
};

const isDirectExecution = () => {
  const resolved = path.resolve(fileURLToPath(import.meta.url));
  const invoked = process.argv[1] ? path.resolve(process.argv[1]) : '';
  return resolved === invoked;
};

if (isDirectExecution()) {
  syncWiki()
    .then((results) => {
      const summary = results.map(({ title, action }) => `- ${title}: ${action}`).join('\n');
      console.log(`Wiki sync complete:\n${summary}`);
    })
    .catch((error) => {
      console.error(`Failed to sync GitLab wiki: ${error.message}`);
      process.exit(1);
    });
}

export const syncGitlabWiki = syncWiki;
