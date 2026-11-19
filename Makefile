.PHONY: up prod down clear reset merge migration upgrade init-back init-front

export HOST_UID := $(shell id -u)
export HOST_GID := $(shell id -g)

up:
	docker compose -f docker-compose.dev.yaml up -d --build

down:
	docker compose -f docker-compose.dev.yaml down

clear:
	docker compose -f docker-compose.dev.yaml down -v

reset:
	docker compose -f docker-compose.dev.yaml down -v
	docker compose -f docker-compose.dev.yaml up -d --build

merge:
	docker exec -it backend_dev_cinfarm uv run flask src merge heads -m "Merge das heads - $(m)"

migration:
	docker exec -it backend_dev_cinfarm uv run flask src db migrate -m "$(m)"
	
upgrade:
	docker exec -it backend_dev_cinfarm uv run flask --app src db upgrade

init-back:
	docker run --rm -it -v $(PWD)/apps/backend:/app -w /app ghcr.io/astral-sh/uv:python3.12-trixie-slim uv lock

init-front:
	docker run --rm -it -v $(PWD)/apps/frontend:/app -w /app node:20-bookworm-slim bash -c "npm install && npm run build"
