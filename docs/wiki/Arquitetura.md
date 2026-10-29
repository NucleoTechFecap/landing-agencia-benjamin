# Arquitetura

A plataforma é um **monólito modular** em Next.js App Router. Site público, painel, API e
formulários vivem no mesmo projeto e compartilham regras de domínio explícitas.

## Camadas

| Caminho | Responsabilidade |
| --- | --- |
| `app/(site)/` | Páginas públicas, metadados e Server Actions dos formulários |
| `app/admin/` | Painel (CMS): login, telas e Server Actions protegidas |
| `app/api/v1/` | API pública de leitura (somente conteúdo publicado) |
| `app/api/internal/` | Rotas operacionais autenticadas por segredo (revalidação, jobs) |
| `components/` | Interface reutilizável; nunca importa `lib/server` |
| `content/` | Conteúdo versionado: fallback de desenvolvimento e fonte do seed |
| `lib/domain/` | Regras puras: publicação, integridade, permissões, formulários, mídia |
| `lib/server/` | I/O: Supabase, sessão, CMS, auditoria, cache, notificações |
| `lib/config/` | Leitura e validação das variáveis de ambiente |
| `supabase/` | Migrations, rollbacks, testes pgTAP, seed e templates de e-mail |
| `docs/` | Arquitetura, ADRs, segurança, operação e requisitos |

`lib/domain` não depende de Next.js, banco ou rede. Toda escrita do painel é autorizada no servidor
(`requirePermission`) e de novo no banco (RLS).

## Como o conteúdo chega ao site

1. A equipe publica pelo painel (Server Action → serviço de conteúdo → Supabase).
2. O serviço valida o item, grava, audita e invalida as tags de cache afetadas (`updateTag`).
3. O site lê só o que está publicado, com `"use cache"` por tag. Listas e API refletem a mudança na
   hora; as páginas de detalhe relacionadas são aquecidas logo após a resposta.

Decisão completa: [ADR-0006 — Cache e invalidação](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/adr/0006-cache-e-invalidacao.md).

## Integrações

- **Supabase:** Postgres, autenticação do painel e bucket `media`.
- **Resend:** e-mail de notificação dos formulários.
- **Vercel:** hospedagem, pré-visualização por PR e deploy.
- **GitHub Actions:** checks de PR e de release, Dependabot e CodeQL.

## Rotas principais

- Site: `/`, `/sobre`, `/areas`, `/servicos` e `/servicos/[slug]`, `/cases` e `/cases/[slug]`,
  `/contato`, `/feedback`.
- Painel: `/admin` (login, nova senha, áreas, serviços, categorias, cases e mídia).
- API: `/api/v1/*` (veja [[API pública]]); health check em `/api/v1/health`.
- Operação: `/api/internal/revalidate` e `/api/internal/jobs/notificacoes`.

## Decisões de arquitetura (ADRs)

| ADR | Tema |
| --- | --- |
| [0001](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/adr/0001-arquitetura-da-plataforma.md) | Arquitetura da plataforma |
| [0002](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/adr/0002-stack-de-desenvolvimento.md) | Stack de desenvolvimento |
| [0003](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/adr/0003-limites-de-dominio.md) | Limites de domínio |
| [0004](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/adr/0004-logs-e-tratamento-de-erros.md) | Logs e tratamento de erros |
| [0005](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/adr/0005-armazenamento-de-midia.md) | Armazenamento de mídia |
| [0006](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/adr/0006-cache-e-invalidacao.md) | Cache e invalidação |
| [0007](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/adr/0007-historico-de-versoes.md) | Histórico de versões |

Visão consolidada: [`docs/arquitetura/documentacao-tecnica.md`](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/arquitetura/documentacao-tecnica.md).

> Esta versão do Next.js tem APIs diferentes das versões anteriores. Antes de mudar código, leia a
> documentação instalada em `node_modules/next/dist/docs/`.
