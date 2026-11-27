# CInfarm

Projeto acadêmico de Banco de Dados para desenvolver uma aplicação web integrada com API REST, PostgreSQL e Flask. Em conjunto, foi desenvolvido também uma interface interativa em NodeJs e React.

## Sumário

1. [Sobre o projeto](#sobre-o-projeto)
2. [Requisitos do projeto](#requisitos-do-projeto)
3. [Execução rápida](#execução-rápida)
4. [Tecnologias](#tecnologias)
5. [Arquitetura e estrutura do repositório](#arquitetura-e-estrutura-do-repositório)
6. [Banco de dados](#banco-de-dados)
7. [API](#api)
8. [Equipe](#equipe)
9. [Licença](#licença)

## Sobre o projeto

O cinfarm-api é um projeto acadêmico da disciplina de Banco de Dados. Seu objetivo é aplicar conceitos de modelagem, organização, persistência e manipulação de dados em uma aplicação web integrada.

A solução está sendo estruturada com um backend que deverá expor operações CRUD por uma API REST e uma interface gráfica para consumo desses endpoints. O banco deverá representar entidades e relacionamentos com integridade referencial, demonstrando o ciclo completo de gerenciamento de dados.

## Requisitos do projeto

- **Banco de dados modelado**, com entidades, relacionamentos e integridade referencial — **completo**.
- **Backend com API CRUD**, conectado ao banco de dados — **completo**: a estrutura Flask está prevista, mas ainda não há rotas ou modelos implementados.
- **Interface gráfica** com navegação e listagens de agenda e cadastros via API. Consulte a [documentação do frontend](apps/frontend/README.md).

## Executar o ambiente de desenvolvimento

Pré-requisitos: Docker e Docker Compose. Na raiz do repositório, crie o arquivo de configuração local e inicie os serviços:

```bash
git clone https://github.com/anaclarays/cinfarm.git
cd cinfarm
cp .env.example .env
make up
make upgrade
make seed
```

Antes do `make up`, abra o `.env` e ajuste as variáveis:

```env
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="yours_password"
POSTGRES_DB="db_cinfarm"
PGADMIN_EMAIL="email@cin.ufpe.br"
PGADMIN_PASSWORD="yours_password"
```

> ⚠️ Troque `yours_password` por senhas reais e nunca faça commit do `.env`.

## Serviços

| Serviço | URL | Observações |
|---|---|---|
| Backend | <http://localhost:8000> | Documentação básica de todos endpoints utilizados, que permitem verificar o estado atual. O healthcheck do Compose consulta essa mesma URL. |
| Frontend | <http://localhost:5173> | Sem documentação de System Design ou UI/UX no estado atual. O healthcheck do Compose consulta essa mesma URL. |
| pgAdmin | <http://localhost:16543> | Interface web para o PostgreSQL (veja abaixo). |
| `database` | porta `5432` | PostgreSQL, banco `db_cinfarm`. |
| `nginx` | — | Proxy reverso. |

O Compose declara os serviços `database`, `pgadmin4` e `nginx` com imagens estáveis e portas definidas.

## Configurando o pgAdmin

### 1. Acessar a interface

Após o `make up`, abra <http://localhost:16543>. Se a página não carregar de imediato, aguarde alguns instantes: o pgAdmin demora para inicializar.

Faça login com as credenciais do `.env`:

- **Email:** valor de `PGADMIN_EMAIL`
- **Senha:** valor de `PGADMIN_PASSWORD`

### 2. Registrar o servidor PostgreSQL

1. No painel esquerdo, clique com o botão direito em **Servers** → **Register** → **Server...**
2. Aba **General**
   - **Name:** `cinfarm` (qualquer nome)
3. Aba **Connection**
   - **Host name/address:** `database`
   - **Port:** `5432`
   - **Maintenance database:** `db_cinfarm` (valor de `POSTGRES_DB`)
   - **Username:** `postgres` (valor de `POSTGRES_USER`)
   - **Password:** valor de `POSTGRES_PASSWORD`
   - Marque **Save password** se desejar
4. Clique em **Save**.

> ℹ️ Use `database` como host, e não `localhost`. Dentro do container do pgAdmin, `localhost` é o próprio pgAdmin. O nome do serviço do Compose é resolvido pela rede interna do Docker.

### 3. Visualizar as tabelas

Depois de rodar `make migration`, navegue até:

**Servers → cinfarm → Databases → db_cinfarm → Schemas → public → Tables**

Para executar consultas SQL, clique com o botão direito em `db_cinfarm` → **Query Tool**.

### Problemas comuns

**Não consigo logar após mudar `PGADMIN_EMAIL` ou `PGADMIN_PASSWORD`**
O pgAdmin só lê essas variáveis na primeira inicialização, pois as credenciais ficam salvas no volume. Remova os containers e o volume do pgAdmin e suba novamente.

**Mudei `POSTGRES_PASSWORD` e a conexão falha**
O mesmo vale para o PostgreSQL: as variáveis só são aplicadas quando o volume é criado. Apagar o volume do banco remove os dados.

**`could not translate host name "database"`**
O pgAdmin e o banco precisam estar na mesma rede do Compose. Suba tudo pelo mesmo arquivo Compose.

**E-mail inválido ao subir o pgAdmin**
O `PGADMIN_EMAIL` precisa ter formato válido (`usuario@dominio.com`).


Para parar e remover os containers:

```bash
make dev-clear
```

Não há usuário, senha de aplicação ou seed definidos no repositório.

## Tecnologias

- Python 3.11 ou superior
- Flask
- SQLAlchemy e Flask-SQLAlchemy
- PostgreSQL, previsto nas dependências e variáveis de ambiente
- uv
- Docker
- Nginx

## Arquitetura e estrutura do repositório

```text
.
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md  # Modelo de Pull Request
├── apps/
│   ├── backend/                 # Estrutura da API Flask
│   │   ├── migrations           # Migrations dos models do banco de dados
│   │   ├── .env.example         # Variáveis de ambiente de exemplo
│   │   ├── Dockerfile            # Imagens de desenvolvimento e produção
│   │   ├── pyproject.toml        # Dependências e ferramentas Python
│   │   ├── README.md             # [Documentação do backend](apps/backend/README.md)
│   │   └── src/
│   │       ├── __init__.py       # Pacote da aplicação
│   │       ├── core/             # Central de processamento de modulos
│   │       ├── health/           #	Modulo de saude da api
│   │       ├── agendamento/      #	Modulo de agendamentos
│   │       ├── consulta/        	#	Modulo de consultas 
│   │       ├── estabelecimento/  # Modulo estabelecimentos
│   │       ├── medicamento/      #	Modulo de medicamentos
│   │       └── pessoa/           # Modulo pessoa
│   ├── frontend/                 # Estrutura do Frontend
│   │   ├── public/			         # Assets estáticos do frontend
│   │   ├── src/         					# Codebase do frontend
│   │   │   └── assets/
│   │   └── Dockerfile            # Imagens de desenvolvimento e produção
│   └── nginx/                    # Dockerfile e configuração do Nginx
├── docker-compose.yaml           # Orquestração dos serviços
├── docker-compose.dev.yaml       # Orquestração dos serviços/conteiners de desenvolvimento
├── Makefile                      # Arquivo de automação, sem alvos
├── .dockerignore                 # Arquivos ignorados no build
└── LICENSE                       # Licença do projeto
```

A arquitetura prevista é interface → API Flask → PostgreSQL. Essas camadas ainda não estão conectadas no código; o único README de serviço existente é o do backend.

## Banco de dados

O SGBD utilizado é o PostgreSQL junto ao pgadmin4. O objetivo é implementar uma aplicação capaz de traduzir o modelo EER construído na etapas anteriores do projeto a fim de utilidade prática.

## API

Os endpoints existentes são: `[health/, agendamento/, consulta/, estabelecimentos/, medicamento/, pessoa/]` implementados e documentados da API com swagger. para acessá-lo consulte em: <http://localhost:8000/api/docs> ou <http://localhost:8000/api/openapi.json>.

## Equipe

| Nome | Função | GitHub |
|---|---|---|
| Ana Clara Souza Bizarria | dev | <@anaclarays> |
| Byanca Hayally Candido de Souza | dev | <@byancasouzacs> |
| Gabriel Cássio Gomes Cileiro | dev | <@GabrielCassio> |
| Jaianny Karla de Oliveira Souza| dev | <@jaikarla> |
| Luiz Miguel de Oliveira Siqueira | dev | <@oliveiraluizmiguel57-blip> |
| Raiana Lais Pereira Donato | dev | <@raianalais> |
| Samara Petrilly de Arruda Barbosa| dev | <@samarapetrilly> |
| Samuel Renan Mendes Umbelino do Monte | dev | <@Samukarn> |

## Licença

Este projeto utiliza a licença definida em [LICENSE](LICENSE).
