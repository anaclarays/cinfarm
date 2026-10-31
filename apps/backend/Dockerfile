# syntax=docker/dockerfile:1
FROM python:3.12-slim-trixie AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

FROM base AS dep
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates
ADD https://astral.sh/uv/install.sh /uv-installer.sh
RUN sh /uv-installer.sh && rm /uv-installer.sh
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
    
FROM base AS dev
ENV PATH="/app/.venv/bin/$PATH"
COPY --from=dep-dev /root/.local/bin/uv /root/.local/bin/uvx /usr/local/bin/
COPY --from=dep-dev /app/.venv /app/.venv

COPY . .

CMD ["flask", "--app", "src", "run", "--debug", "--host", "0.0.0.0", "--port", "8000"]

FROM base AS prod
ENV PATH="/app/.venv/bin/$PATH"
RUN groupadd --system app && useradd --system --gid app --create-home app
COPY --from=dep --chown=app:app /app/.venv /app/.venv
COPY --chown=app:app . .
USER app
EXPOSE 8000
CMD ["gunicorn", "src:create_app()", "--bind", "0.0.0.0", "--port", "8000"]