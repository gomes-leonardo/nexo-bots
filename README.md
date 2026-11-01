# Bora jogar

Joguinhos de festa pra jogar num celular só. Feito em Next.js (App Router + TypeScript), publicado na Vercel.

| Rota                  | Jogo                                                     |
| --------------------- | -------------------------------------------------------- |
| `/`                   | Página inicial com a lista de jogos                      |
| `/fala-ao-contrario`  | Grava uma frase, toca invertida e você tenta imitar      |
| `/impostor`           | Jogo do impostor com temas (grupo de 3 a 12, ou dupla)   |
| `/mostra-o-numero`    | Mímica de número: um mostra, a turma adivinha            |
| `/quem-e-o-jogador`   | Adivinhe o jogador pelos clubes (2, 3 ou 4 pistas)       |

## Rodando local

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de produção
npm run typecheck  # checagem de tipos
```

O microfone só funciona em HTTPS ou `localhost`. Para testar no iPhone, use o link da Vercel.

## Estrutura

```
src/
├── app/                      # Frontend (rotas do Next)
│   ├── page.tsx              # Página inicial
│   ├── fala-ao-contrario/    # Jogo: Fala ao contrário
│   ├── impostor/             # Jogo: Impostor
│   └── api/                  # Rotas HTTP do backend (finas, só chamam src/server)
├── components/               # Componentes compartilhados entre jogos
└── server/                   # Backend: config, banco, regras de negócio
```

Detalhes do backend em [`src/server/README.md`](src/server/README.md).
