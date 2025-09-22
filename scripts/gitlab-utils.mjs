#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const loadEnvFiles = async (files = ['.env.local', '.env']) => {
  for (const filename of files) {
    const envPath = path.join(process.cwd(), filename);
    try {
      const content = await readFile(envPath, 'utf8');
      content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .forEach((line) => {
          const [key, ...rest] = line.split('=');
          const value = rest.join('=').trim();
          if (key && !(key in process.env)) {
            process.env[key] = value;
          }
        });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
};

export const getGitlabConfig = () => {
  const baseUrlRaw = (process.env.GITLAB_URL ?? '').replace(/\/$/, '');
  const baseUrl = `${baseUrlRaw}/api/v4`;
  const token = process.env.GITLAB_TOKEN;
  const projectId = process.env.GITLAB_PROJECT_ID ?? '';

  if (!baseUrl) {
    throw new Error('Missing GITLAB_URL environment variable.');
  }

  if (!token) {
    throw new Error('Missing GITLAB_TOKEN environment variable.');
  }

  if (!projectId) {
    throw new Error('Missing GITLAB_PROJECT_ID environment variable.');
  }

  return {
    baseUrl,
    token,
    projectId,
  };
};

export const createGitlabClient = (config) => {
  const defaultHeaders = {
    'PRIVATE-TOKEN': config.token,
    Accept: 'application/json',
  };

  const buildUrl = (path, query) => {
    const url = `${config.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    if (!query) return url;
    const params = new URLSearchParams(query);
    return `${url}?${params.toString()}`;
  };

  const request = async (method, path, { query, body, headers } = {}) => {
    const url = buildUrl(path, query);
    const response = await fetch(url, {
      method,
      headers: {
        ...defaultHeaders,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(headers ?? {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GitLab request failed ${response.status} ${response.statusText} for ${method} ${path}: ${text}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  };

  const collect = async (path, { query, headers } = {}) => {
    const results = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await request('GET', path, {
        query: { per_page: '100', page: String(page), ...(query ?? {}) },
        headers,
      });

      if (Array.isArray(response)) {
        results.push(...response);
        hasMore = response.length === 100;
        page += 1;
      } else {
        return response;
      }
    }

    return results;
  };

  return {
    request,
    collect,
  };
};
