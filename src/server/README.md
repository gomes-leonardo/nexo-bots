# Backend (`src/server`)

Código que roda só no servidor. As rotas HTTP ficam em `src/app/api/*` e apenas
chamam os serviços daqui. Componentes de cliente (`'use client'`) **não** devem
importar nada desta pasta, só tipos (`import type`). Código que roda nos dois lados
(ex.: pontuação) fica em `src/shared/`.

```
src/server/
├── config/env.ts        # variáveis de ambiente (documente em .env.example)
├── db/                  # conexão com o banco (ainda não configurado)
├── lib/http.ts          # respostas JSON padrão e tratamento de erro
└── modules/
    └── <modulo>/
        ├── types.ts               # tipos do domínio
        ├── <modulo>.repository.ts # acesso a dados (hoje: arquivos; depois: banco)
        ├── <modulo>.service.ts    # regras de negócio
        └── index.ts               # o que o resto do app pode usar
```

## Rotas existentes

| Método | Rota                    | O que faz                                  |
| ------ | ----------------------- | ------------------------------------------ |
| GET    | `/api/health`           | Verifica se a API está no ar               |
| GET    | `/api/impostor/themes`  | Lista os temas do Impostor (sem palavras)  |
| GET    | `/api/mostra-o-numero/categories` | Categorias do Mostra o número |
| GET    | `/api/quem-e-o-jogador/stats` | Quantos jogadores e clubes existem (sem respostas) |

## Adicionando um módulo

1. Crie `src/server/modules/<nome>/` seguindo a estrutura acima.
2. Crie a rota em `src/app/api/<nome>/route.ts` usando `handle()` e `ok()` de `lib/http.ts`.
