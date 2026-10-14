# Plataforma Institucional — Agência Benjamin

Site institucional, portfólio e painel de conteúdo da **Agência Benjamin**, agência experimental de
comunicação da FECAP, desenvolvido pelo **NúcleoTech — Núcleo de Tecnologia da FECAP**.

- **Data-alvo da primeira versão:** 04/11/2026
- **Backlog:** [GitHub Projects](https://github.com/users/NucleoTechFecap/projects/4) ·
  [Issues](https://github.com/NucleoTechFecap/landing-agencia-benjamin/issues)
- **Documentação técnica:** [`docs/`](docs/README.md)

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS v4 · Zod ·
Supabase (Postgres, Auth, Storage) · Resend · Vercel · Vitest.
Justificativas em [ADR-0002](docs/adr/0002-stack-de-desenvolvimento.md).

> **Atenção:** esta versão do Next.js tem APIs novas (ex.: `proxy.ts`, `'use cache'`,
> `updateTag`). Consulte a documentação instalada em `node_modules/next/dist/docs/` antes de
> escrever código (ver [`AGENTS.md`](AGENTS.md)).

## Pré-requisitos

- Node.js **≥ 20.9** (recomendado 22 LTS — veja `.nvmrc`)
- npm 10+
- Git
- Opcional: [Supabase CLI](https://supabase.com/docs/guides/cli) para banco local

## Como rodar localmente

```bash
git clone https://github.com/NucleoTechFecap/landing-agencia-benjamin.git
cd landing-agencia-benjamin
nvm use            # opcional
npm ci             # instala exatamente o package-lock.json
npm run dev        # http://localhost:3000
```

O site público funciona sem banco configurado (usa o conteúdo provisório versionado em
`content/`). Painel, formulários persistidos e mídia exigem as variáveis de ambiente descritas em
`.env.example` (ARC-05).

## Scripts

| Comando | O que faz |
| ------- | --------- |
| `npm run dev` | Servidor de desenvolvimento (Turbopack) |
| `npm run build` | Build de produção |
| `npm run start` | Sobe o build de produção |
| `npm run lint` | ESLint (flat config do Next.js) |
| `npm run typecheck` | Checagem de tipos com `tsc --noEmit` |
| `npm run test` / `test:watch` | Testes unitários com Vitest |
| `npm run check:headers` | Valida o cabeçalho padrão dos arquivos de código |
| `npm run headers:write` | Insere o cabeçalho padrão nos arquivos que não o possuem |
| `npm run verify` | Executa tudo acima, na ordem usada antes de abrir PR |

## Estrutura

```text
.
├── app/                 # Rotas (App Router): site público, painel /admin, APIs e metadados
├── components/          # Componentes React reutilizáveis (UI, layout, seções, formulários)
├── content/             # Conteúdo provisório versionado (fallback até o CMS)
├── lib/
│   ├── config/          # Configuração (variáveis de ambiente validadas, dados do site)
│   ├── domain/          # Regras de negócio puras (publicação, RBAC, formulários, mídia)
│   └── server/          # Acesso a dados e serviços do servidor (Supabase, logs, auditoria)
├── public/              # Arquivos estáticos (logos, ícones, imagens)
├── scripts/             # Scripts de manutenção (cabeçalhos, provisionamento)
├── supabase/migrations/ # Migrations SQL versionadas
└── docs/                # Requisitos, ADRs, regras de negócio, segurança e operação
```

## Padrão de cabeçalho

Todo arquivo de código começa com o cabeçalho padrão do projeto (sistema, módulo, arquivo,
descrição, desenvolvedor, versão, datas e histórico). Use `npm run headers:write` para criar o
bloco e preencha a **Descrição**; ao alterar um arquivo, acrescente uma linha no **Histórico** e
atualize **Modificado em**.

## Contribuição

Branches, commits, PRs e checklist de revisão: [`CONTRIBUTING.md`](CONTRIBUTING.md) (GOV-10).

## Equipe

Coordenação: Flávio Santos · Coordenação técnica: Vinícius Nishimura Reis · Vice-coordenação:
Vinícius Binda · Design: Vinícius Cardoso de Lima · Desenvolvimento: Caio Moraes, Gustavo Duarte
Güering, Julia Damasio, Murilo Ribeiro Vasconcellos, Rafael Morais Rocha.
Representantes da Agência Benjamin: Melissa Namie e Renan Hida.

---

© 2026 Agência Benjamin · FECAP. Desenvolvido pelo NúcleoTech.
