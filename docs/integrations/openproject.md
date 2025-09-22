# OpenProject Integration

## Overview
OpenProject is the source of truth for the Interactive Music 3D overhaul plan. The shared project is hosted at:

> http://192.168.4.225:5683/projects/oscillo/

All roadmap phases and work packages must be tracked here so progress stays synchronized with the codebase. This document captures setup steps, API usage patterns, and the mapping between repository phases and OpenProject entities.

## Project Structure
- **Project**: `oscillo`
- **Work package types**: `Phase` (parent), `Task` (default for actionable work), `Doc Update`, `QA Gate`.
- **Custom fields**:
  - `Phase` (list) — must match the 10 phases in `docs/overhaul-plan.md`.
  - `Quality Gate` (boolean) — set to `true` only after metrics/tests/docs are attached.
  - `Metrics Document` (string) — link to `/docs/metrics/<date>.md` snapshot.
- **Boards**: Kanban board grouped by `Phase` with columns `Backlog → In progress → QA → Done`.
- **Versioning**: Create a Version per milestone if release tracking is required.

## API Access
OpenProject exposes a REST API (HAL+JSON) at `http://192.168.4.225:5683/api/v3`. Authentication uses personal access tokens.

### Generate an API Token
1. Sign in to OpenProject with an account that has access to the `oscillo` project.
2. Click your avatar (top-right) → **My account**.
3. Open the **Access tokens** tab.
4. Under **API tokens**, click **+** and name the token (e.g., `IM3D Integration`).
5. Copy the token and store it securely (password manager or secret store). The token is shown only once.
6. Treat the token like a password; avoid committing it to the repository or sharing in plaintext.

### Using the Token
Use HTTP Basic Auth with your username as the login and the API token as the password, or pass the token in the `Authorization` header:

```bash
curl -u "<username>:<token>" \
  http://192.168.4.225:5683/api/v3/projects
```

or

```bash
curl -H "Authorization: Bearer <token>" \
  http://192.168.4.225:5683/api/v3/projects
```

The API returns HAL-formatted JSON. Use the `_links` section to traverse related resources (work package type, project, assignee, etc.).

## Common API Workflows

### List Open Work Packages for a Phase
```bash
curl -u "<username>:<token>" \
  "http://192.168.4.225:5683/api/v3/work_packages?filters=[{\"customField\":{\"operator\":\"=\",\"values\":[\"Phase 1 – Baseline\"]}}]"
```
- Replace the `values` entry with the exact custom field value (URL encode spaces and punctuation).

### Create a Task Under a Phase
```bash
curl -u "<username>:<token>" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{
    "subject": "Capture baseline bundle metrics",
    "_links": {
      "project": { "href": "/api/v3/projects/oscillo" },
      "type": { "href": "/api/v3/types/2" },
      "parent": { "href": "/api/v3/work_packages/123" }
    },
    "customField1": "Phase 1 – Baseline",
    "customField2": false
  }' \
  http://192.168.4.225:5683/api/v3/work_packages
```
- Replace `/api/v3/types/2` with the `Task` type ID for your instance.
- `customField1/2` correspond to the IDs of the `Phase` and `Quality Gate` fields (check `/api/v3/custom_fields`).
- `parent` should reference the Phase work package.

### Update Quality Gate After QA
```bash
curl -u "<username>:<token>" \
  -H "Content-Type: application/json" \
  -H "If-Match: \"<etag>\"" \
  -X PATCH \
  -d '{
    "customField2": true,
    "customField3": "https://github.com/<org>/<repo>/blob/main/docs/metrics/2025-09-21.md"
  }' \
  http://192.168.4.225:5683/api/v3/work_packages/456
```
- Retrieve the current ETag via `GET` before patching.
- `customField3` stores the metrics link.

## Repository Interaction
- Each phase in `docs/overhaul-plan.md` should have a corresponding Phase work package referencing aggregated tasks.
- When creating Git branches or PRs, reference the work package ID (e.g., `IM3D-OP-42`) to link commits back to OpenProject.
- Add progress comments in OpenProject when metrics/docs are updated, linking to the relevant commit or PR.

## MCP / Automation Ideas
- Build a small service that authenticates with the API, fetches phase summaries, and exposes them to agents (CLI or dash).
- Schedule nightly jobs to sync `/docs/metrics` contents into OpenProject attachments or comments.
- Optional: integrate OpenProject webhooks to notify Slack/Teams when quality gates change.

## Maintenance Checklist
- Review custom field values whenever phases are added/renamed in the repo.
- Rotate API tokens periodically; update any scripts or secrets immediately.
- Export regular backups of the `oscillo` project (OpenProject admin console) for disaster recovery.

## Troubleshooting
- 401 Unauthorized → verify token, username, and HTTPS (if available).
- 422 Unprocessable Entity → check `_links` paths and custom field IDs.
- 409 Conflict → include the latest ETag in PATCH requests.
- HAL payloads may omit nested data; follow `_links` to fetch full records.

## CLI Utilities

### Sync Roadmap Phases with OpenProject
Use the repository script `scripts/openproject-sync.mjs` to verify that the 10 overhaul phases defined in `docs/overhaul-plan.md` exist as parent work packages in OpenProject.

1. Create a `.env.local` (or `.env`) file with the following keys (values stay local and are ignored by git):
   - `OPENPROJECT_URL` — for example `http://192.168.4.225:5683`
   - `OPENPROJECT_API_TOKEN` — personal access token generated in OpenProject
   - Optional: `OPENPROJECT_USERNAME` if the token requires a username (defaults to `apikey`)
   - Optional: `OPENPROJECT_AUTH_STRATEGY=bearer` to force Bearer auth instead of Basic
2. Run `node scripts/openproject-sync.mjs` to perform a read-only diff between the roadmap and OpenProject.
3. Add `--create-missing` to automatically create any missing phase work packages (the script picks the best available type for the project, typically `Summary task`).
4. Append `--json` to emit machine-readable output for tooling or dashboards.

```bash
node scripts/openproject-sync.mjs --create-missing
# or
npm run openproject:sync -- --create-missing
```

The script uses pagination-safe API calls and only creates parent phase items; child tasks should still be managed manually or via dedicated automation.

### Build Phase Task Breakdown
`scripts/openproject-build.mjs` reads `docs/overhaul-plan.md` and ensures every bullet and quality gate is represented as a child work package beneath the corresponding phase in OpenProject.

1. Configure the same environment variables described above (`OPENPROJECT_URL`, `OPENPROJECT_API_TOKEN`, etc.).
2. Run `node scripts/openproject-build.mjs` to preview which tasks are missing for each phase.
3. Add `--apply` to create any missing work packages (standard actions use the `Task` type; quality gates prefer `Milestone` when that type is available).
4. Optional flags: `--json` for structured output, `OPENPROJECT_TASK_PREFIX` env var to prepend a consistent tag to every subject.

```bash
node scripts/openproject-build.mjs --apply
# or
npm run openproject:build -- --apply
```

The script is idempotent — reruns simply report that all tasks exist once the tree matches the overhaul plan.
### Bootstrap Entire Plan
`scripts/openproject-bootstrap.mjs` combines the sync and build steps so a single call can hydrate an empty OpenProject project from `docs/overhaul-plan.md`.

1. Defaults run `--create-missing` for phases and `--apply` for tasks in one pass.
2. Use `--no-create` or `--no-apply` to switch either step into read-only mode; `--json` emits a combined automation summary.
3. Ideal for MCP workflows: expose this script as an MCP tool/command so agents can fully bootstrap the project without manual intervention.

```bash
node scripts/openproject-bootstrap.mjs
# or
npm run openproject:bootstrap
```

Pair this with the standalone commands above when you need finer-grained control.
**Claude Desktop example**

Add an entry to `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "openproject-bootstrap": {
      "command": "node",
      "args": ["/absolute/path/to/scripts/openproject-bootstrap.mjs"]
    }
  }
}
```

The same command can also be added as a custom tool inside the upstream [openproject-mcp-server](https://github.com/AndyEverything/openproject-mcp-server) if you prefer Python-based orchestration—set the tool's process to run `npm run openproject:bootstrap` from this repository.


### Enrich Work Package Templates
`scripts/openproject-enrich.mjs` hydrates every phase, task, and quality gate with rich descriptions, priorities, and status defaults.

```bash
node scripts/openproject-enrich.mjs
# or
npm run openproject:enrich
```

Re-run this after updating `docs/overhaul-plan.md` to regenerate copy or when you introduce new work packages.


### Refresh Project Dashboard Widgets
`scripts/openproject-dashboard.mjs` keeps the project home grid in sync with the delivery command center widgets (custom overview, Kanban table, milestone calendar).

```bash
node scripts/openproject-dashboard.mjs
# or
npm run openproject:dashboard
```

Reapply this after adjusting widget copy or when you add new saved filters.


### MCP Server Integration
The repository vendors [openproject-mcp-server](tools/openproject-mcp-server) for richer agent access to OpenProject. Environment defaults are already populated from `.env.local`; start it alongside your MCP client:

```bash
npm run openproject:mcp
```

Expose the server to Claude Desktop (or another MCP host) by adding:

```json
{
  "mcpServers": {
    "openproject": {
      "command": "python",
      "args": ["C:/Users/Zachg/INTERACTIVE-MUSIC-3D/tools/openproject-mcp-server/openproject-mcp.py"]
    }
  }
}
```

The server ships with `test_connection`, `list_projects`, `list_work_packages`, `list_types`, and `create_work_package` tools. Extend it under `tools/openproject-mcp-server` if you need additional workflows.

