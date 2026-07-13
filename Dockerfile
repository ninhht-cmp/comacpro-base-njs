# syntax=docker/dockerfile:1

# Multi-stage build producing a minimal runtime image from Next.js standalone
# output (`output: 'standalone'` in next.config.ts). Node version tracks .nvmrc.
ARG NODE_VERSION=24.16

# --- deps: install with the frozen lockfile (cached unless lockfile changes) ---
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# --- builder: compile the app ---
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# No real .env at build time; runtime env is injected by the platform.
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=true
RUN pnpm build

# --- runner: standalone server, non-root ---
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
# Liveness probe via Node's built-in fetch — the alpine runtime image ships no
# curl/wget, and adding one just for this would grow the attack surface.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# `server.js` is emitted by the standalone build.
CMD ["node", "server.js"]
