
# Security Guide

For CI audit thresholds and protected-branch governance decisions, see [`docs/security-governance.md`](./security-governance.md).

## Current Security Issues

> For a release-ready verification flow, follow the step-by-step checklist in [`docs/security-checklist.md`](./security-checklist.md).

### Critical Vulnerabilities (8 total) - UPDATED STATUS

* **minimist ≤0.2.3**: Prototype pollution vulnerabilities ⚠️ **Cannot fix** (deep dependency of @magenta/music)
* **static-eval ≤2.0.1**: Sandbox breakout and arbitrary code execution ⚠️ **Cannot fix** (deep dependency of @magenta/music)
* **@magenta/music ≥1.1.14**: Depends on vulnerable transitive dependencies ⚠️ **Upstream issue**

**Risk Mitigation**: These vulnerabilities are in audio processing dependencies
and are not directly exposed to user input. The application includes:

* Input sanitization for all user data
* Content Security Policy (CSP) headers
* Rate limiting on audio functions
* Sandboxed execution environment

### Immediate Actions Required

1. **Update Dependencies**

   ```bash

   npm audit fix
   npm audit fix --force  # For breaking changes
   ```

1. **Security Headers**
   Add to `next.config.js`:

   ```js

   async headers() {
     return [
       {
         source: '/:path*',
         headers: [
           { key: 'X-Frame-Options', value: 'DENY' },
           { key: 'X-Content-Type-Options', value: 'nosniff' },
           { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },

{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()'
}
         ]
       }
     ]
   }

   ```javascript

1. **Content Security Policy**
   ```js

   const cspHeader = `
     default-src 'self';
     script-src 'self' 'unsafe-eval' 'unsafe-inline';
     style-src 'self' 'unsafe-inline';
     img-src 'self' blob: data:;
     font-src 'self';
     object-src 'none';
     base-uri 'self';
     form-action 'self';
     frame-ancestors 'none';
     upgrade-insecure-requests;
   `;
   ```

1. **Service Worker Opt-in**
   - Set `NEXT_PUBLIC_ENABLE_PWA=false` in staging/test environments to skip service worker registration.
   - Only enable PWA in production once the `sw.js` behavior has been verified.

1. **Jam Collaboration Surface**
   - The bundled jam WebSocket server currently accepts connections without authentication tokens.
   - Restrict access via network policy (VPN, firewall) until UI-based access controls are implemented.
   - Monitor `server/jam-server.js` logs for unexpected connection churn or abuse.

1. **Web Vitals Telemetry (Opt-in Only)**
   - Consent is stored in `localStorage` under `oscillo.analytics-consent` and managed via the in-app toggle.
   - Metrics post to `/api/metrics/web-vitals` and optionally forward to `ANALYTICS_FORWARD_URL` when configured.
   - To send metrics to an external service set `NEXT_PUBLIC_WEB_VITALS_ENDPOINT` (client) and `ANALYTICS_FORWARD_TOKEN` if bearer auth is required.
   - Keep telemetry disabled by default in privacy-sensitive environments.

1. **Structured Logging**
 - Configure `LOG_LEVEL` per environment (`info` in production, `debug` for staging) and disable file output with `LOG_TO_FILE=false` when using stdout collectors.
 - Set `LOG_PRETTY=true` locally for human-readable console logs; leave unset in production to keep JSON output for ingestion.

### Environment Variable Reference

All supported keys are documented in `.env.example`. Copy that file to `.env.local` (or your secret store) and update values according to the environment. The table below summarizes the purpose of each variable:

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_ENABLE_PWA` | Client | Enable service worker registration after PWA review is complete |
| `NEXT_PUBLIC_WEB_VITALS_ENDPOINT` | Client | Optional override for sending Web Vitals to an external endpoint |
| `ANALYTICS_FORWARD_URL` | Server | Optional forwarding URL for server-side Web Vitals relays |
| `ANALYTICS_FORWARD_TOKEN` | Server | Bearer token paired with `ANALYTICS_FORWARD_URL` when auth is required |
| `LOG_DIR` / `LOG_FILE` | Server | Filesystem path and filename for structured logs when persisted |
| `LOG_LEVEL` | Server | Logging verbosity (`info`, `debug`, `error`, etc.) |
| `LOG_TO_FILE` | Server | Persist logs to disk (`true`) or emit to stdout only (`false`) |
| `LOG_PRETTY` | Server | Pretty-print logs for local debugging; keep disabled in production |
| `GITLAB_URL` / `GITLAB_PROJECT_ID` | Tooling | Configure automation scripts for the self-hosted GitLab instance |
| `GITLAB_TOKEN` | Tooling | Personal access token (`read_api`/`write_api`) for GitLab automation scripts |

Keep tokens and host-specific values out of source control. When provisioning Unraid or containerized deployments, mirror the same values through the template (`unraid/oscillo.xml`) or Docker secrets.

## Best Practices

### Input Validation

* Sanitize all user inputs before audio processing
* Validate file uploads for model files
* Implement rate limiting for WebRTC connections

### Audio Context Security

* Always require user gesture before audio initialization
* Implement proper cleanup of audio nodes
* Validate audio parameter ranges

### WebGL Security

* Sanitize shader code if user-generated
* Implement context loss recovery
* Validate texture inputs

## Monitoring

### Error Tracking

* Structured logging is provided by Pino (`src/lib/logger.server.ts` / `server/logger.js`) with JSON payloads shipped to stdout and optional file targets (`${LOG_DIR}/${LOG_FILE}`, defaulting to `<project>/logs/app.log`).
* Enforce `LOG_LEVEL`, `LOG_PRETTY`, and `LOG_TO_FILE` defaults via deployment manifests so production retains immutable audit trails.
* Content Security Policy is applied globally (see `next.config.js`); adjust `connect-src` if you expose additional APIs.
* Jam sessions enforce origin allow lists (`JAM_ALLOWED_ORIGINS`) and optional tokens (`JAM_SERVER_TOKEN` / `NEXT_PUBLIC_JAM_TOKEN`). Keep tokens secret and rotate periodically in multi-user deployments.
* Monitor for security events
* Set up alerts for suspicious activity

### Dependencies

* Run `npm audit` before each deployment
* Use Dependabot for automated security updates
* Review all dependency changes
