# syntax=docker/dockerfile:1.4
# Multi-stage Dockerfile for Enhanced Oscillo Audio-Reactive Platform

FROM node:25.5.0-alpine AS base
WORKDIR /app

# Install basic dependencies
RUN apk add --no-cache libc6-compat && \
    npm install -g npm@10

FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --omit=dev

FROM base AS builder
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

COPY . .

# Build with optimizations for audio/graphics
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV LOG_DIR=/app/logs

# Create directories
RUN mkdir -p "$LOG_DIR" && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Create server.js if it doesn't exist
RUN if [ ! -f server.js ]; then \
    echo "const { createServer } = require('http')" > server.js && \
    echo "const { parse } = require('url')" >> server.js && \
    echo "const next = require('next')" >> server.js && \
    echo "" >> server.js && \
    echo "const dev = process.env.NODE_ENV !== 'production'" >> server.js && \
    echo "const hostname = '0.0.0.0'" >> server.js && \
    echo "const port = process.env.PORT || 3000" >> server.js && \
    echo "" >> server.js && \
    echo "const app = next({ dev, hostname, port })" >> server.js && \
    echo "const handle = app.getRequestHandler()" >> server.js && \
    echo "" >> server.js && \
    echo "app.prepare().then(() => {" >> server.js && \
    echo "  createServer(async (req, res) => {" >> server.js && \
    echo "    try {" >> server.js && \
    echo "      const parsedUrl = parse(req.url, true)" >> server.js && \
    echo "      await handle(req, res, parsedUrl)" >> server.js && \
    echo "    } catch (err) {" >> server.js && \
    echo "      console.error('Error occurred handling', req.url, err)" >> server.js && \
    echo "      res.statusCode = 500" >> server.js && \
    echo "      res.end('internal server error')" >> server.js && \
    echo "    }" >> server.js && \
    echo "  }).listen(port, (err) => {" >> server.js && \
    echo "    if (err) throw err" >> server.js && \
    echo "    console.log(\`> Ready on http://\${hostname}:\${port}\`)" >> server.js && \
    echo "  })" >> server.js && \
    echo "})" >> server.js; \
    fi

USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

EXPOSE 3000

CMD ["node", "server.js"]
