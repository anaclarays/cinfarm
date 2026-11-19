# CInFarm API

API REST em Flask, com SQLAlchemy, PostgreSQL e migrations gerenciadas por Flask-Migrate/Alembic.

## Módulos

- `person`: pessoas, pacientes, profissionais, estagiários e dados de saúde.
- `estabelecimento`: cadastro e consulta de estabelecimentos.
- `medicamento`: cadastro, consulta, atualização e remoção de medicamentos.
- `agendamento`: criação de agendamentos e medições clínicas.
- `consulta`: criação e consulta de atendimentos vinculados a estabelecimento e responsável.
- `health`: endpoint de verificação em `/health/`.

Os modelos ficam nos diretórios dos módulos em `src/`. As migrations ficam em `migrations/versions/`.

## Variáveis de ambiente

Para executar o Flask diretamente na máquina, copie `.env.example` para `.env` e configure os valores. Nesse arquivo, `POSTGRES_HOST=localhost` e `POSTGRES_PORT=15432` apontam para a porta publicada pelo Compose.

O Docker Compose é iniciado na raiz do repositório e lê o `.env` da raiz para interpolar suas variáveis. O Compose de desenvolvimento passa ao backend as variáveis `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_HOST=database` e `POSTGRES_PORT=5432`.

O backend monta a conexão usando essas variáveis em `src/config.py`; ele não consome `DATABASE_URL`.

## Executar com Docker

Na raiz do repositório:

```bash
docker compose -f docker-compose.dev.yaml up -d --build
docker compose -f docker-compose.dev.yaml exec backend flask --app src db upgrade
```

## Executar localmente

Em `apps/backend`, configure `.env` e execute:

```bash
uv sync
uv run flask --app src run --debug --host 0.0.0.0 --port 8000
```

## Migrations e verificações

```bash
uv run flask --app src db heads
uv run flask --app src db current
uv run flask --app src db upgrade
uv run flask --app src db check
```

## Testes e qualidade

Os testes apagam e recriam as tabelas antes/depois de cada caso. Se executar a suíte em PostgreSQL, use exclusivamente `db_cinfarm_test` em `TEST_DATABASE_URL`; a configuração em `tests/conftest.py` rejeita outro banco PostgreSQL.

```bash
uv run pytest
uv run ruff check .
uv run mypy .
```
