#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvFiles, getGitlabConfig, createGitlabClient } from './gitlab-utils.mjs';

async function addIssueComment(issueIid, body) {
  await loadEnvFiles();
  const config = getGitlabConfig();
  const client = createGitlabClient(config);
  return client.request('POST', `/projects/${config.projectId}/issues/${issueIid}/notes`, {
    body: { body },
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const issue = process.argv[2];
  const messagePath = process.argv[3];
  if (!issue || !messagePath) {
    console.error('Usage: node scripts/gitlab-comment.mjs <issueIid> <message-file>');
    process.exit(1);
  }
  const body = fs.readFileSync(messagePath, 'utf8');
  await addIssueComment(issue, body);
  console.log(`Comment posted to issue #${issue}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
