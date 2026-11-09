# syntax=docker/dockerfile:1
# -------------------------------------------------------------------------------------------------------------------------------
# Dockerfile multi-stage para Frontend e React/NextJS
# Stack utilizada: Npm + React + Vitest
#
# Uso:
#   docker build --target dev   -t app:dev   .
#   docker build --target test  -t app:test  .
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
COPY --chown=node:node . .
RUN chown -R node:node /app
EXPOSE 5173
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
FROM base AS prod
WORKDIR /app
ENV NODE_ENV=production PORT=5173 HOSTNAME=0.0.0.0
	RUN addgroup --system app && adduser --system --ingroup app app
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 5173
CMD ["node", "server.js"]