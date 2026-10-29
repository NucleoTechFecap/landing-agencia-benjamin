# Começando

## Pré-requisitos

- Node.js na versão informada em `.nvmrc` (atualmente 22).
- npm e Git.
- Acesso aos serviços externos apenas quando a tarefa precisar deles. Para desenvolvimento local,
  use dados fictícios e as configurações descritas em `.env.example`.

## Instalação

```bash
git clone https://github.com/NucleoTechFecap/landing-agencia-benjamin.git
cd landing-agencia-benjamin
npm ci
cp .env.example .env.local
npm run dev
```

Abra `http://localhost:3000`. Sem Supabase configurado, o site usa conteúdo local provisório para
desenvolvimento; esse conteúdo não pode ser publicado em produção.

## Comandos úteis

| Comando | Uso |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run lint` | ESLint |
| `npm run typecheck` | Geração de tipos Next.js e TypeScript |
| `npm test` | Testes unitários e de integração do Vitest |
| `npm run test:e2e` | Playwright; requer ambiente adequado |
| `npm run verify` | Cabeçalhos, formatação, tipos, lint, testes e build |
| `npm run release:check` | Verificação completa mais gate de conteúdo de release |

## Configuração local

Copie apenas os nomes e valores demonstrativos de `.env.example`. Não copie variáveis da Vercel ou
chaves de produção para a máquina local. Consulte [[Ambientes e variáveis]] e
[`docs/ambientes/variaveis-de-ambiente.md`](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/ambientes/variaveis-de-ambiente.md).
