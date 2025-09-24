# Deployment & Rollback Runbook

This guide covers how to promote a build, ship it via Docker/Unraid, and recover quickly if something regresses. It assumes you have run through the project’s quality gate (`npm run lint:check && npm run type-check && npm test`).

## 1. Pre-Deployment Checklist

1. **Smoke the pipeline locally**
   ```bash
   ./scripts/pipeline-smoke.sh  # writes logs to artifacts/pipeline/
   ```
   Capture the generated logs; they are referenced from the release issue.

2. **Security audit**
   ```bash
   npm run security:audit
   ```
   Resolve or document any reported vulnerabilities.

3. **Version/Changelog**
   - Update `CHANGELOG.md` (or the release notes) with the planned tag.
   - Tag the commit: `git tag -a vX.Y.Z -m "release: vX.Y.Z"`.

## 2. Build the Docker Image

The repository ships with a multi-stage Dockerfile (`Dockerfile`). Build it with BuildKit to benefit from caching:

```bash
docker build --pull --rm \
  -t ghcr.io/zachyzissou/oscillo:vX.Y.Z \
  --build-arg BUILDKIT_INLINE_CACHE=1 .
```

Artifacts:
- Standalone Next.js output lives under `.next/standalone`.
- Logs default to `/app/logs` inside the container (override `LOG_DIR`).

Push the image if you host it in GHCR:
```bash
docker push ghcr.io/zachyzissou/oscillo:vX.Y.Z
```

## 3. Deploy Options

### 3.1 Docker Compose (recommended for self-hosting)

`docker-compose.yml` already maps logs/uploads. Export a tag via `IMAGE_TAG`:
```bash
IMAGE_TAG=ghcr.io/zachyzissou/oscillo:vX.Y.Z docker compose up -d --pull always
```

Key environment variables:
- `NODE_ENV=production`
- `LOG_DIR=/app/logs`
- `JAM_ALLOWED_ORIGINS` (comma-separated list)
- `JAM_SERVER_TOKEN` (optional shared secret)
- `NEXT_PUBLIC_JAM_TOKEN` (matches `JAM_SERVER_TOKEN` when used)

Health check (inside compose):
```bash
docker compose ps
curl -I http://localhost:3000/api/health
```

### 3.2 Unraid Template

1. Import `unraid/oscillo.xml`.
2. Set repository tag to the desired version.
3. Map volumes:
   - `/mnt/user/appdata/oscillo/logs -> /app/logs`
   - `/mnt/user/appdata/oscillo/uploads -> /app/uploads`
4. Configure env vars (token, allowed origins, telemetry) via the template UI.
5. Start the container and confirm `http://[UNRAID-IP]:31415/api/health` returns `200`.

## 4. Post-Deploy Verification

1. Hit the health endpoint from the load balancer and from inside the cluster.
2. Check service worker and CSP headers:
   ```bash
   curl -I https://your-domain.example/api/health
   
   # Confirm headers
   #   Content-Security-Policy: default-src 'self'; ...
   #   Cross-Origin-Embedder-Policy: require-corp
   #   Permissions-Policy: accelerometer=(), camera=(), ...
   ```
3. Open the UI:
   - Web Vitals prompt should appear on first load.
   - Jam session toggle should only connect when allowed origins & tokens match.
4. Tail logs to ensure structured output is flowing:
   ```bash
   docker compose logs -f --tail=200 interactive-music-3d
   ```

## 5. Rollback Procedure

**Immediate rollback (Docker Compose)**
```bash
PREVIOUS=ghcr.io/zachyzissou/oscillo:vX.Y.(Z-1)
IMAGE_TAG=$PREVIOUS docker compose up -d --force-recreate
```

**Immediate rollback (Unraid)**
1. Stop the container.
2. Change the repository tag in the template to the previous version.
3. Apply and start the container.

Document the rollback in the release issue, including:
- Previous/target tags
- Reason for rollback
- Observed impact (logs, metrics)

## 6. Environment Matrix

| Variable | Local Default | Production Guidance |
|----------|---------------|---------------------|
| `LOG_DIR` | `./logs` | Mount to `/app/logs` in containers |
| `LOG_FILE` | `app.log` | Rotate via host (Fluent Bit/Vector) |
| `JAM_SERVER_PORT` | `3030` | Expose behind TLS/Proxy if internet-facing |
| `JAM_ALLOWED_ORIGINS` | `http://localhost:3000,https://localhost:3000` | Set to the actual domain(s) |
| `JAM_SERVER_TOKEN` | _(blank)_ | Supply a secret token for non-local deployments |
| `NEXT_PUBLIC_JAM_SERVER_URL` | _(blank)_ | Only override when load balancer rewrites ports |
| `NEXT_PUBLIC_JAM_TOKEN` | _(blank)_ | Mirror `JAM_SERVER_TOKEN` when token auth is enabled |
| `NEXT_PUBLIC_WEB_VITALS_ENDPOINT` | _(blank)_ | Configure when forwarding metrics externally |

Keep this file updated whenever deployment tooling or procedures change.
