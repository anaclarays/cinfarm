# Contribuindo

Boas-vindas! Contribuições são feitas por Pull Requests e ajudam a evoluir o projeto com mudanças pequenas e verificáveis. Em caso de dúvida, procure a equipe ou abra uma issue.

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

## Onboarding (primeiro dia)

- [ ] Instalar Docker e Docker Compose.
- [ ] Instalar o uv para executar o backend fora do container.
- [ ] Instalar o Git e configurar nome e e-mail.
- [ ] Clonar o repositório e criar `apps/backend/.env` a partir de `apps/backend/.env.example`.
- [ ] Subir o ambiente e confirmar a aplicação em `http://localhost:8000`.
- [ ] Rodar os testes com `uv run pytest` e o linter com `uv run ruff check .`.
- [ ] Ler o [README do backend](apps/backend/README.md).

## Fluxo de trabalho

1. Criar uma branch a partir de `main`.
2. Fazer commits pequenos e relacionados.
3. Abrir um Pull Request para `main`.
4. Pedir revisão à equipe.
5. Atualizar a branch conforme o feedback e fazer o merge após a aprovação.

## Convenção de branches e commits

O repositório não define uma convenção própria. Use prefixos curtos e mensagens no estilo Conventional Commits:

```text
feat/adicionar-endpoint
fix/corrigir-conexao
docs/atualizar-readme
feat: adicionar endpoint de usuários
fix: corrigir conexão com o banco
docs: atualizar instruções de execução
```

## Padrões de código

As ferramentas estão configuradas no `apps/backend/pyproject.toml` e devem ser executadas a partir de `apps/backend`:

```bash
uv run pytest
uv run ruff check .
uv run mypy .
```

## Pull Request

Antes de abrir o Pull Request:

- [ ] Testes executados, quando houver testes para a mudança.
- [ ] Ruff e mypy sem erros.
- [ ] Descrição clara do que foi alterado.
- [ ] Nenhum segredo ou arquivo `.env` incluído no commit.

## Dúvidas

Abra uma issue no repositório ou fale com a equipe para esclarecer requisitos e decisões técnicas.
