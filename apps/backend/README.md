# CInfarm-API

API REST em Python, construída com Flask e SQLAlchemy, para acesso ao banco PostgreSQL.

## Estrutura

```text
apps/backend/
├── .env.example       # Modelo de variáveis de ambiente
├── Dockerfile         # Imagens de desenvolvimento e produção
├── pyproject.toml     # Metadados, dependências e ferramentas
├── README.md          # Documentação do serviço
└── src/
    └── __init__.py    # Pacote Python da aplicação (atualmente vazio)
```

## Principais componentes

O pacote `src` contém apenas o arquivo `__init__.py`; não há módulos de aplicação implementados no momento.

## Variáveis de ambiente

Crie o arquivo local a partir do modelo:

```bash
cp .env.example .env
```

| Variável | Finalidade | Exemplo |
|---|---|---|
| `FLASK_DEBUG` | Ativa o modo de depuração | `1` |
| `SECRET_KEY` | Chave secreta da aplicação | `troque-isto` |
| `POSTGRES_USER` | Usuário do PostgreSQL | `cinfarm` |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL | `cinfarm` |
| `POSTGRES_DB` | Nome do banco | `cinfarm` |
| `DATABASE_URL` | URL de conexão com o banco | `******database:5432/cinfarm` |

## Como executar

### Com Docker Compose

Na raiz do repositório, suba o backend e o banco:

```bash
docker compose up backend database
```

A aplicação fica disponível em <http://localhost:8000>.

### Localmente com uv

Em `apps/backend`, instale as dependências e inicie o Flask:

```bash
uv sync
uv run flask --app src run --debug --host 0.0.0.0 --port 8000
```

## Comandos úteis

| Comando | Finalidade |
|---|---|
| `uv run pytest` | Executa os testes com cobertura |
| `uv run ruff check .` | Verifica lint |
| `uv run mypy .` | Verifica tipos |
