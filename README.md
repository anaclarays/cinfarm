# CInFarm

Projeto acadêmico de banco de dados com API REST em Flask, SQLAlchemy, PostgreSQL e interface React.

## Executar o ambiente de desenvolvimento

Pré-requisitos: Docker e Docker Compose. Na raiz do repositório, crie o arquivo de configuração local e inicie os serviços:

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yaml up -d --build
docker compose -f docker-compose.dev.yaml exec backend flask --app src db upgrade
```

O backend fica disponível em `http://localhost:8000`, o frontend em `http://localhost:5173` e o pgAdmin em `http://localhost:16543`. A porta PostgreSQL publicada para clientes na máquina host é `15432`.

Para parar os containers sem remover os dados persistidos:

```bash
docker compose -f docker-compose.dev.yaml down
```

As variáveis do Compose vêm do `.env` na raiz. Use valores locais fictícios em `.env.example` e não versione o `.env` real.

## Estrutura

- `apps/backend/src/`: aplicação Flask, endpoints e modelos SQLAlchemy.
- `apps/backend/migrations/`: migrations Alembic via Flask-Migrate.
- `apps/backend/tests/`: testes automatizados do backend.
- `apps/frontend/`: aplicação React/TypeScript com Vite.
- `apps/nginx/`: proxy reverso para frontend e backend.
- `docker-compose.dev.yaml`: ambiente de desenvolvimento.
- `docker-compose.yaml`: configuração do ambiente de produção.

O PostgreSQL do Compose usa o banco `db_cinfarm`. Execute `flask --app src db upgrade` para aplicar as migrations; subir o container não altera automaticamente o schema.

## Backend

Consulte [apps/backend/README.md](apps/backend/README.md) para configuração, endpoints, migrations e testes. Os comandos de validação também estão descritos em [CONTRIBUTING.md](CONTRIBUTING.md).

## Licença

Consulte [LICENSE](LICENSE).
