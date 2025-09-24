# Security Checklist

Use this checklist before each release or infrastructure change. Mark completed items and attach evidence (logs, screenshots, CI links) to the associated GitLab issue.

## 1. Build & Dependencies
- [ ] Run `npm run security:audit` and record the output in the release issue.
- [ ] Review `package-lock.json` diff for unexpected dependency changes.
- [ ] Confirm overrides keep `minimist` and `static-eval` patched (see `package.json` > `overrides`).
- [ ] Verify Docker base image (`node:20-alpine`) is up to date; rebuild images if new CVEs exist.

## 2. Application Configuration
- [ ] Ensure `.env` mirrors `.env.example`; missing variables are documented.
- [ ] Decide `NEXT_PUBLIC_ENABLE_PWA` policy per environment (production only after `sw.js` review).
- [ ] Configure telemetry endpoints only after consent UX is approved (`NEXT_PUBLIC_WEB_VITALS_ENDPOINT`, `ANALYTICS_FORWARD_URL`, `ANALYTICS_FORWARD_TOKEN`).

## 3. Transport & Headers
- [ ] Confirm the runtime emits the CSP and isolation headers (run `curl -I https://<host>` and capture output). Headers required:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `Cross-Origin-Embedder-Policy`
  - `Cross-Origin-Opener-Policy`
  - `Cross-Origin-Resource-Policy`
  - `Permissions-Policy`
  - `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`
- [ ] Verify TLS certificates are valid and renewed.

## 4. Real-time & Backend Services
- [ ] Restrict jam WebSocket access via network policy (VPN/firewall) until auth controls ship.
- [ ] Review `server/jam-server.js` logs for unexpected connection churn or abuse attempts.

## 5. User Privacy & Telemetry
- [ ] Confirm the in-app “Share Web Vitals Metrics” toggle defaults to off for new users (check `localStorage` entry `oscillo.analytics-consent`).
- [ ] With consent enabled, capture one network request to `/api/metrics/web-vitals` and verify payload omits PII.
- [ ] Ensure consent revocation stops network traffic immediately.

## 6. Monitoring & Logging
- [ ] Structured logging sinks are configured (`LOG_DIR`, external aggregators) and writable by the container user.
- [ ] Alerting rules cover security events (unauthorized WS attempts, CSP violations, audit failures).
- [ ] Review `docs/SECURITY.md` and update any new controls added in this cycle.

## 7. Incident Response & Documentation
- [ ] Update `docs/SECURITY.md` with new procedures and ensure links remain valid.
- [ ] Confirm contact paths for security incidents (email, paging) are current.
- [ ] Document this checklist run in the release issue, including links to evidence and open risks.

## 8. Sign-off
- [ ] Final reviewer validates all items and signs off in the relevant GitLab issue.
- [ ] Outstanding risks are captured in a follow-up ticket with mitigation timelines.
