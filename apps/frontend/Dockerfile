# syntax=docker/dockerfile:1
# -------------------------------------------------------------------------------------------------------------------------------
# Dockerfile multi-stage para Frontend e React/NextJS
# Stack utilizada: Npm + React + Vitest
#
# Uso:
#   docker build --target dev   -t app:dev   .
#   docker build --target test  -t app:test  .
#   docker build --target e2e   -t app:e2e   .
#   docker build --target prod  -t app:prod  .
# -------------------------------------------------------------------------------------------------------------------------------

# ---------- Base ----------
FROM node:20-bookworm-slim AS base
WORKDIR /app
COPY package.json package-lock.json ./

# ---------- Dependencies ----------
FROM base AS deps
RUN npm ci

# ---------- Development ----------
FROM deps AS dev
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---------- Test ----------
FROM deps AS test
COPY . .
CMD ["npm", "run", "test"]

# ---------- Build ----------
FROM deps AS build
COPY . .
RUN npm run build

# ---------- Production ----------
FROM node:20-bookworm-slim AS prod
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup --system app && adduser --system --ingroup app app
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
CMD ["node", "server.js"]