# Docker Deployment Guide for Oscillo

This guide explains how to build, test, and deploy the Oscillo Docker image.

## Quick Start

### Using Pre-built Image (Recommended)

```bash
docker run -d \
  --name oscillo \
  -p 31415:3000 \
  -v ./logs:/app/logs \
  -v ./uploads:/app/uploads \
  -e NODE_ENV=production \
  -e NEXT_TELEMETRY_DISABLED=1 \
  ghcr.io/zachyzissou/interactive-music-3d:latest
```

### Building Locally

```bash
# Build the image
docker build -t oscillo .

# Run the image
docker run -d --name oscillo -p 31415:3000 oscillo
```

## Unraid Template

The Unraid template is located at `unraid/oscillo.xml`. It provides a user-friendly interface for deploying Oscillo on Unraid systems.

### Template Configuration

- **Repository**: `ghcr.io/zachyzissou/interactive-music-3d:latest`
- **Default Port**: 31415 (maps to container port 3000)
- **Volumes**:
  - `/mnt/user/appdata/oscillo/logs` → `/app/logs`
  - `/mnt/user/appdata/oscillo/uploads` → `/app/uploads`

## Troubleshooting

### Image Not Found Error

If you encounter:
```
docker: Error response from daemon: Head "https://ghcr.io/v2/zachyzissou/interactive-music-3d/manifests/latest": denied.
```

This means the image hasn't been published to GitHub Container Registry yet. You can:

1. **Wait for automatic deployment**: The image is automatically built and published when changes are pushed to the main branch.

2. **Manual deployment**: Use the deployment script:
   ```bash
   chmod +x scripts/deploy-docker.sh
   ./scripts/deploy-docker.sh
   ```

3. **Build locally**: Build and run the image locally:
   ```bash
   docker build -t oscillo .
   docker run -d -p 31415:3000 oscillo
   ```

### Build Issues

If you encounter SSL certificate errors during build:

The Dockerfile includes `npm config set strict-ssl false` to handle certificate issues in Docker environments. This is safe for building in controlled environments.

### Health Check

The container includes a health check endpoint at `/api/health`. You can verify the container is running correctly:

```bash
curl http://localhost:31415/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-XX-XXTXX:XX:XX.XXXZ","service":"interactive-music-3d"}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `NEXT_TELEMETRY_DISABLED` | `1` | Disable Next.js telemetry |
| `LOG_DIR` | `/app/logs` | Directory for application logs |
| `TZ` | `America/New_York` | Container timezone |

## Volumes

| Host Path | Container Path | Purpose |
|-----------|---------------|---------|
| `./logs` | `/app/logs` | Application logs |
| `./uploads` | `/app/uploads` | User uploads and exports |

## Ports

| Host Port | Container Port | Purpose |
|-----------|---------------|---------|
| `31415` | `3000` | Web interface |

## Multi-Architecture Support

The image is built for multiple architectures:
- `linux/amd64` (Intel/AMD 64-bit)
- `linux/arm64` (ARM 64-bit, including Apple Silicon and ARM servers)

## Security

- Container runs as non-root user `nextjs` (UID 1001)
- No privileged access required
- Health checks enabled for monitoring