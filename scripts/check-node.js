#!/usr/bin/env node

const REQUIRED_NODE = '20.0.0';
const REQUIRED_NPM = '10.0.0';

const parseVersion = (version) => {
  if (!version) return [];
  return version
    .replace(/^v/, '')
    .split('.')
    .map((segment) => Number.parseInt(segment, 10) || 0);
};

const isLessThan = (currentRaw, requiredRaw) => {
  const current = parseVersion(currentRaw);
  const required = parseVersion(requiredRaw);

  for (let index = 0; index < required.length; index += 1) {
    const cur = current[index] ?? 0;
    const req = required[index] ?? 0;
    if (cur > req) return false;
    if (cur < req) return true;
  }

  return false;
};

const exitWithMessage = (tool, version, required) => {
  const message = `\n${tool} ${version || 'unknown'} is below required ${required}.\n` +
    'Update your runtime (see docs/overhaul-plan.md Phase 2) before continuing.\n';
  console.error(message);
  process.exit(1);
};

const nodeVersion = process.versions.node;
if (isLessThan(nodeVersion, REQUIRED_NODE)) {
  exitWithMessage('Node', nodeVersion, REQUIRED_NODE);
}

const userAgent = process.env.npm_config_user_agent || '';
const npmMatch = userAgent.match(/npm\/(\d+\.\d+\.\d+)/);
let npmVersion = npmMatch?.[1];

if (!npmVersion) {
  try {
    const { execSync } = require('node:child_process');
    npmVersion = execSync('npm --version', { stdio: 'pipe' })
      .toString()
      .trim();
  } catch (error) {
    console.warn('Unable to determine npm version from npm_config_user_agent or exec: ', error.message);
  }
}

if (!npmVersion || isLessThan(npmVersion, REQUIRED_NPM)) {
  exitWithMessage('npm', npmVersion, REQUIRED_NPM);
}

console.log(`Environment check passed: Node ${nodeVersion}, npm ${npmVersion}`);
