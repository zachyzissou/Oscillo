#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdir, readFile } from 'node:fs/promises';
import {
  loadEnvFiles,
  getGitlabConfig,
  createGitlabClient,
} from './gitlab-utils.mjs';

const METRICS_DIR = path.join(process.cwd(), 'docs', 'metrics');
const WIKI_TITLE = 'Metrics Dashboard';

const listMetricFiles = async () => {
  try {
    const entries = await readdir(METRICS_DIR, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

const uploadFile = async (client, projectId, filename) => {
  const buffer = await readFile(path.join(METRICS_DIR, filename));
  const form = new FormData();
  form.append('file', new Blob([buffer]), filename);
  const response = await fetch(`${client.baseUrl}/projects/${projectId}/uploads`, {
    method: 'POST',
    headers: {
      'PRIVATE-TOKEN': client.token,
    },
    body: form,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload failed ${response.status} ${response.statusText}: ${text}`);
  }
  return response.json();
};

const fetchWikiPage = async (client, projectId, title) => {
  const pages = await client.collect(`/projects/${projectId}/wikis`, { query: { with_content: 'true' } });
  return pages.find((page) => page.title === title);
};

const updateWikiPage = async (client, projectId, slug, content) => client.request('PUT', `/projects/${projectId}/wikis/${encodeURIComponent(slug)}`, {
  body: { content },
});

export const syncMetrics = async () => {
  await loadEnvFiles();
  const config = getGitlabConfig();
  const client = createGitlabClient(config);
  const files = await listMetricFiles();
  if (!files.length) {
    return { uploaded: [], message: 'No files in docs/metrics/' };
  }

  const uploads = [];
  for (const filename of files) {
    const result = await uploadFile(client, config.projectId, filename);
    uploads.push({ filename, markdown: result.markdown });
  }

  const wikiPage = await fetchWikiPage(client, config.projectId, WIKI_TITLE);
  if (!wikiPage) {
    throw new Error('Metrics Dashboard page not found. Run npm run gitlab:wiki first.');
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const newSection = [`## Upload ${timestamp}`, ...uploads.map((item) => `- ${item.markdown}`), ''];
  const updatedContent = `${wikiPage.content.trim()}\n\n${newSection.join('\n')}`;
  await updateWikiPage(client, config.projectId, wikiPage.slug, updatedContent);

  return { uploaded: uploads.map((u) => u.filename) };
};

const isDirectExecution = () => {
  const resolved = fileURLToPath(import.meta.url);
  const invoked = process.argv[1] ? path.resolve(process.argv[1]) : '';
  return path.resolve(resolved) === invoked;
};

if (isDirectExecution()) {
  syncMetrics()
    .then((result) => {
      if (result.uploaded?.length) {
        console.log(`Uploaded metrics: ${result.uploaded.join(', ')}`);
      } else {
        console.log(result.message ?? 'No metrics uploaded.');
      }
    })
    .catch((error) => {
      console.error(`Metrics sync failed: ${error.message}`);
      process.exit(1);
    });
}
