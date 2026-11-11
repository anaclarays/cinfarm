# syntax=docker/dockerfile:1
# -------------------------------------------------------------------------------------------------------------------------------
# Dockerfile multi-stage para Backend e Python/Flask/UV
# Stack utilizada: Python 
#
# Uso:
#   docker build --target dev   -t app:dev   .
#   docker build --target prod  -t app:prod  .
# -------------------------------------------------------------------------------------------------------------------------------

# ---------- Base ----------
FROM ghcr.io/astral-sh/uv:python3.12-trixie-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# ---------- Dependencies ----------
FROM base AS dep
ENV PATH="/root/.local/bin/:$PATH"
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-install-project --no-dev

FROM dep AS dep-dev
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-install-project

# ---------- Development ----------
FROM base AS dev
ARG HOST_UID=1000
ARG HOST_GID=1000
RUN groupadd --non-unique --gid ${HOST_GID} dev \
	&& useradd --non-unique --uid ${HOST_UID} --gid ${HOST_GID} --create-home --shell /bin/bash dev
ENV PATH="/app/.venv/bin:$PATH" \	
	UV_LINK_MODE=copy
COPY --from=dep-dev --chown=${HOST_UID}:${HOST_GID} /app/.venv /app/.venv
COPY --chown=${HOST_UID}:${HOST_GID} . .
CMD ["flask", "--app", "src", "run", "--debug", "--host", "0.0.0.0", "--port", "8000"]

# ---------- Production ----------
FROM base AS prod
ENV PATH="/app/.venv/bin:$PATH"
RUN groupadd --system app && useradd --system --gid app --create-home app
COPY --from=dep --chown=app:app /app/.venv /app/.venv
COPY --chown=app:app . .
USER app
EXPOSE 8000
CMD ["gunicorn", "src:create_app()", "--bind", "0.0.0.0:8000"]