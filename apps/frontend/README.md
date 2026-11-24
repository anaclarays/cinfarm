# Frontend do CinFarm

Interface em React e TypeScript para consultar a agenda e os cadastros do sistema.

## Estrutura

| Caminho             | Responsabilidade                                                                    |
| ------------------- | ----------------------------------------------------------------------------------- |
| `src/App.tsx`       | Layout e exibição da página ativa                                                   |
| `src/navigation.ts` | Páginas e endereços da navegação                                                    |
| `src/components/`   | Barra lateral e listagem compartilhada                                              |
| `src/pages/`        | Telas de Agenda, Pacientes, Profissionais de Saúde, Medicamentos e Estabelecimentos |
| `src/api/`          | Consultas e tipos das respostas da API                                              |

## Desenvolvimento local

Com o backend na porta 8000, execute nesta pasta:

```sh
npm ci
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173). O Vite encaminha as chamadas de `/api/` ao backend. No Docker Compose de desenvolvimento, o destino é o serviço `backend`.

Use `npm run build` para verificar os tipos e gerar a versão compilada.
