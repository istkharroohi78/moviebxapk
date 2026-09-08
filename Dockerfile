# ─── Stage 1: Build Node API server ──────────────────────────────────────────
FROM node:24-slim AS node-builder

WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json tsconfig.json ./
COPY lib ./lib
COPY artifacts/api-server ./artifacts/api-server

RUN npm install -g pnpm@10.26.1 && pnpm install --no-frozen-lockfile
RUN pnpm --filter @workspace/api-server run build

# ─── Stage 2: Build Next.js website ──────────────────────────────────────────
FROM node:24-slim AS web-builder

WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json tsconfig.json ./
COPY lib ./lib
COPY artifacts/filmora ./artifacts/filmora

RUN npm install -g pnpm@10.26.1 && pnpm install --no-frozen-lockfile

ARG TMDB_API_KEY
ENV TMDB_API_KEY=$TMDB_API_KEY

RUN pnpm --filter @workspace/filmora run build

# ─── Stage 3: Install Python bot deps ────────────────────────────────────────
FROM python:3.11-slim AS python-builder

# git is required for pip git+https:// packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    git gcc g++ libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /bot
COPY bot/requirements.txt ./

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY bot/ ./

# ─── Stage 4: Final runtime image ────────────────────────────────────────────
FROM python:3.11-slim

# Install Node.js 24 + nginx + supervisor + system libs needed by bot packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl gnupg supervisor nginx libgl1 libglib2.0-0 \
    && curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Node API server ───────────────────────────────────────────────────────────
COPY --from=node-builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=node-builder /app/artifacts/api-server/package.json ./artifacts/api-server/
COPY --from=node-builder /app/node_modules ./node_modules

# ── Next.js website (standalone build) ───────────────────────────────────────
COPY --from=web-builder /app/artifacts/filmora/.next/standalone ./web
COPY --from=web-builder /app/artifacts/filmora/.next/static ./web/artifacts/filmora/.next/static
# Fix: public must sit next to server.js inside the monorepo standalone layout
COPY --from=web-builder /app/artifacts/filmora/public ./web/artifacts/filmora/public

# ── Python bot + its installed packages ──────────────────────────────────────
COPY --from=python-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=python-builder /usr/local/bin /usr/local/bin
COPY --from=python-builder /bot ./bot

# ── nginx + Supervisor config ─────────────────────────────────────────────────
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Single public-facing port — nginx routes /api → :5000, /* → :3000
EXPOSE 80

CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
