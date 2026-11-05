.PHONY: compose-up compose-down compose-reset init-backend init-frontend

compose-up:
	docker compose up -d --build

compose-down:
	docker compose down

compose-reset:
	docker compose down -v --remove-orphans
	docker compose up -d --build

init-backend:
	docker run --rm -it -v $(PWD)/apps/backend:/app -w /app node:20-bookworm-slim bash -c "npm install && npm run build"

init-frontend:
	docker run --rm -it -v $(PWD)/apps/frontend:/app -w /app node:20-bookworm-slim bash -c "npm install && npm run build"