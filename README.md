# CInfarm

Projeto acadêmico de Banco de Dados para desenvolver uma aplicação web integrada com API REST, PostgreSQL e Flask.

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

- **Banco de dados modelado**, com entidades, relacionamentos e integridade referencial — **pendente**.
- **Backend com API CRUD**, conectado ao banco de dados — **parcial**: a estrutura Flask está prevista, mas ainda não há rotas ou modelos implementados.
- **Interface gráfica**, comunicando-se exclusivamente pelos endpoints do backend — **pendente**: nenhum frontend foi encontrado.

## Execução rápida

Pré-requisitos: Docker e Docker Compose.

O fluxo pretendido é:

```bash
git clone https://github.com/GabrielCassio/cinfarm.git
cd cinfarm
cp apps/backend/.env.example apps/backend/.env
docker compose up --build
```

O backend está configurado para a porta `8000`, em <http://localhost:8000>. Não há documentação de API nem endpoint funcional de verificação no estado atual. O healthcheck do Compose tenta consultar essa mesma URL.

O Compose declara também os serviços `database` e `nginx`, mas eles ainda não têm imagem nem porta configuradas. Além disso, o build do backend referencia um `uv.lock` ausente. Portanto, o fluxo acima depende dessas pendências serem corrigidas.

Para parar e remover os containers:

```bash
docker compose down
```

Não há usuário, senha de aplicação, migrations ou seed definidos no repositório.

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
├── apps/
│   ├── backend/                 # Estrutura da API Flask
│   │   ├── .env.example         # Variáveis de ambiente de exemplo
│   │   ├── Dockerfile            # Imagens de desenvolvimento e produção
│   │   ├── pyproject.toml        # Dependências e ferramentas Python
│   │   ├── README.md             # [Documentação do backend](apps/backend/README.md)
│   │   └── src/
│   │       └── __init__.py       # Pacote da aplicação, atualmente vazio
│   ├── database/                 # Diretório reservado para o banco
│   └── nginx/                    # Dockerfile e configuração do Nginx
├── docker-compose.yaml           # Orquestração dos serviços
├── Makefile                      # Arquivo de automação, sem alvos
├── .dockerignore                 # Arquivos ignorados no build
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md  # Modelo de Pull Request
└── LICENSE                       # Licença do projeto
```

A arquitetura prevista é interface → API Flask → PostgreSQL. Essas camadas ainda não estão conectadas no código; o único README de serviço existente é o do backend.

## Banco de dados

O SGBD previsto é o PostgreSQL, indicado nas dependências e no `.env.example` do backend. Não foram encontrados modelo ER/EER, scripts SQL, migrations, seed, entidades ou relacionamentos implementados.

## API

Não há endpoints implementados ou documentação de API no repositório. O `apps/backend/src/__init__.py` está vazio.

## Equipe

| Nome | Função | GitHub |
|---|---|---|
| Ana Clara Souza Bizarria | <A definir> | <@anaclarays> |
| Byanca Hayally Candido de Souza | <A definir> | <@> |
| Gabriel Cássio Gomes Cileiro | <A definir> | <@GabrielCassio> |
| Jaianny Karla de Oliveira Souza| <A definir> | <@jaikarla> |
| Luiz Miguel de Oliveira Siqueira | <A definir> | <@oliveiraluizmiguel57-blip> |
| Raiana Lais Pereira Donato | <A definir> | <@raianalais> |
| Samara Petrilly de Arruda Barbosa| <A definir> | <@samarapetrilly> |
| Samuel Renan Mendes Umbelino do Monte | <A definir> | <@Samukarn> |


## Licença

Este projeto utiliza a licença definida em [LICENSE](LICENSE).
