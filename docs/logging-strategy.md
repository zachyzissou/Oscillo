# Logging Strategy

This document explains how Oscillo collects, stores, and ships logs across browser, Node.js, and infrastructure surfaces. Refer to it when configuring new environments or troubleshooting observability gaps.

## 1. Log Producers

### 1.1 Client runtime
- Uses `src/lib/logger.client.ts`, aliased via `@lib/logger`.
- Emits to the browser console with level prefixes (`INFO`, `DEBUG`, `ERROR`).
- Intended for development diagnostics and lightweight telemetry (no PII).

### 1.2 Next.js / Node runtime
- Imports resolve to `src/lib/logger.server.ts` (Pino) and `server/logger.js`.
- Pino writes JSON to stdout and, when `LOG_TO_FILE=true`, to `${LOG_DIR}/${LOG_FILE}` (defaults: `<project>/logs` + `app.log`).
- Formatters add ISO8601 timestamps plus `{ "level": "info" }` keys for downstream parsing.

### 1.3 Ancillary services
- Jam WebSocket server (`server/jam-server.js`) and automation scripts reuse the same logger ensuring consistent formatting.

### 1.4 Web Vitals telemetry
- Metrics originate from `app/reportWebVitals.ts` and land in `/api/metrics/web-vitals` when users opt in.
- The API handler logs each metric (`event: web-vitals`) and optionally forwards the payload to `ANALYTICS_FORWARD_URL`.
- Consent is managed client-side; no metrics are sent when consent is denied or undecided.

## 2. Message Format & Levels

| Level  | Usage                                   | Example                                     |
|--------|------------------------------------------|---------------------------------------------|
| INFO   | Lifecycle milestones, feature toggles    | `Renderer initialized: WebGPU-enhanced`     |
| DEBUG  | Detailed instrumentation (gated in prod) | `AI model 'melody' generated 16 notes`      |
| WARN   | Recoverable anomalies                     | `Plugin state read failed`                  |
| ERROR  | Crashes, failed external calls            | `web vitals forward failed: ECONNREFUSED`   |

Server logs use ISO8601 timestamps and consistent `[LEVEL]` prefixes for ingestion by Splunk, Loki, or ELK pipelines.

## 3. Configuration

Environment variables:

| Variable                | Description                                               |
|-------------------------|-----------------------------------------------------------|
| `LOG_DIR`               | Directory where server-side logs are persisted (default `<project>/logs`). |
| `LOG_FILE`              | Filename (relative to `LOG_DIR` unless absolute). Defaults to `app.log`. |
| `LOG_LEVEL`             | Pino log level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`). Defaults to `info` in production and `debug` otherwise. |
| `LOG_PRETTY`            | Set to `true` to route stdout through `pino-pretty` (defaults to `true` outside production). |
| `LOG_TO_FILE`           | Set to `false` to disable file logging. Defaults to writing `${LOG_DIR}/${LOG_FILE}` (`./logs/app.log` locally, `/app/logs/app.log` in containers). |
| `NODE_ENV`              | Production mode reduces noisy debug output.               |

**Docker Compose** mounts `/mnt/user/appdata/interactive-music-3d/logs` ensuring persistence. For Kubernetes, mount a persistent volume claim at `/app/logs` or direct stdout to a log collector sidecar.

## 4. Shipping & Retention

1. **Local development**: inspect `artifacts/pipeline/*.log` and `logs/app.log` for smoketest runs. `LOG_PRETTY` falls back to JSON to avoid bundler worker threads; use external tooling if you prefer pretty output.
2. **Production**:
   - Ship `${LOG_DIR}/${LOG_FILE}` (default `/app/logs/app.log` in container deployments) via Fluent Bit / Vector.
   - Rotate with `logrotate` or container runtime (configure 7-day retention).
   - Mirror container stdout/stderr to centralized logging (e.g., CloudWatch, Stackdriver).

## 5. Alerting Hooks

- Unauthorized WebSocket attempts (close code `4401`) are logged as `WARN`; downstream systems should alert when frequency exceeds baseline.
- Telemetry forwarding failures log `ERROR` with the remote URL for immediate triage.
- Add parsing rules for `[LEVEL]` prefixed entries to extract `event` fields when JSON logging is introduced.

## 6. Implementation Checklist (per environment)

- [ ] Container deployments: mount or provision persistent storage for `/app/logs`.
- [ ] Configure log shipping agent to tail `app.log` (Fluent Bit example below).
- [ ] Validate that redacted secrets are not present in logs.
- [ ] Document the log access path in your runbook.

```ini
# fluent-bit.conf snippet
[INPUT]
    Name              tail
    Path              /app/logs/app.log
    Tag               oscillo.app
    Refresh_Interval  5
[OUTPUT]
    Name  loki
    Match oscillo.*
    Url   https://loki.example/api/prom/push
```

## 7. Roadmap

- Add request correlation IDs on top of Pino to trace user journeys.
- Add browser batching to forward client errors to `/api/logs` when consent is granted.
- Integrate with OpenTelemetry for trace-aware logging.

Maintain this document alongside any future logging changes to keep the quality gate satisfied.
