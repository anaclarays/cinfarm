.PHONY: dev dev-down dev-clear dev-reset up prod down clear reset init-back init-front

export HOST_UID := $(shell id -u)
export HOST_GID := $(shell id -g)

dev:
	docker compose -f docker-compose.dev.yaml up -d --build

dev-down:
	docker compose -f docker-compose.dev.yaml down

dev-clear:
	docker compose -f docker-compose.dev.yaml down -v

dev-reset:
	docker compose -f docker-compose.dev.yaml down -v
	docker compose -f docker-compose.dev.yaml up -d --build

up:
	docker compose up -d --build

prod:
	docker compose --profile prod up --build

down:
	docker compose down

clear:
	docker compose down -v

reset:
	docker compose down -v
	docker compose up -d --build

init-back:
	docker run --rm -it -v $(PWD)/apps/backend:/app -w /app ghcr.io/astral-sh/uv:python3.12-trixie-slim uv lock

init-front:
	docker run --rm -it -v $(PWD)/apps/frontend:/app -w /app node:20-bookworm-slim bash -c "npm install && npm run build"
