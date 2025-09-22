#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";

export const loadEnvFiles = async (envFiles = [".env.local", ".env"]) => {
  for (const filename of envFiles) {
    const envPath = path.join(process.cwd(), filename);
    try {
      const content = await readFile(envPath, "utf8");
      content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .forEach((line) => {
          const [key, ...rest] = line.split("=");
          const value = rest.join("=").trim();
          if (key && !(key in process.env)) {
            process.env[key] = value;
          }
        });
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }
};

export const getOpenProjectConfig = () => {
  const baseUrl = (process.env.OPENPROJECT_URL ?? "").replace(/\/$/, "");
  const apiToken = process.env.OPENPROJECT_API_TOKEN;
  const projectIdentifier = process.env.OPENPROJECT_PROJECT_IDENTIFIER ?? "oscillo";
  const authStrategy = (process.env.OPENPROJECT_AUTH_STRATEGY ?? "basic").toLowerCase();
  const username = process.env.OPENPROJECT_USERNAME ?? "apikey";

  if (!baseUrl) {
    throw new Error("Missing OPENPROJECT_URL environment variable.");
  }

  if (!apiToken) {
    throw new Error("Missing OPENPROJECT_API_TOKEN environment variable.");
  }

  return {
    baseUrl,
    apiToken,
    projectIdentifier,
    authStrategy,
    username,
  };
};

export const createOpenProjectClient = (config) => {
  const authHeader = config.authStrategy === "bearer"
    ? `Bearer ${config.apiToken}`
    : `Basic ${Buffer.from(`${config.username}:${config.apiToken}`).toString("base64")}`;

  const addPageSize = (href) =>
    href.includes("pageSize=") ? href : `${href}${href.includes("?") ? "&" : "?"}pageSize=100`;

  const resolveHref = (href) => (href.startsWith("http") ? href : `${config.baseUrl}${href}`);

  const requestJson = async (href, { method = "GET", body, headers } = {}) => {
    const url = resolveHref(href);
    const response = await fetch(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        Accept: "application/hal+json",
        Authorization: authHeader,
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(headers ?? {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Request failed ${response.status} ${response.statusText}: ${text}`);
    }

    return response.json();
  };

  const collectElements = async (initialHref) => {
    const results = [];
    let href = addPageSize(initialHref);

    while (href) {
      const payload = await requestJson(href);
      const elements = payload._embedded?.elements ?? [];
      results.push(...elements);
      const nextHref = payload._links?.nextByOffset?.href ?? null;
      href = nextHref ? addPageSize(nextHref) : null;
    }

    return results;
  };

  const extractId = (resource) => resource.id ?? resource?._links?.self?.href?.split("/").pop();

  return {
    requestJson,
    collectElements,
    extractId,
    authHeader,
  };
};
