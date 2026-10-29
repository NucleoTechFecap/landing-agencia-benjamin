# Arquitetura

A plataforma é um monólito modular em Next.js App Router. A interface pública, o painel, APIs e
formulários vivem no mesmo projeto e compartilham regras de domínio explícitas.

## Camadas

| Caminho | Responsabilidade |
| --- | --- |
| `app/` | Rotas, páginas, metadados, Server Actions e Route Handlers |
| `components/` | Componentes de interface reutilizáveis |
| `content/` | Conteúdo local provisório para desenvolvimento |
| `lib/config/` | Leitura e validação das variáveis de ambiente |
| `lib/domain/` | Regras puras de conteúdo, permissões, formulários e publicação |
| `lib/server/` | Supabase, autenticação, repositórios, auditoria, cache e integrações |
| `supabase/migrations/` | Estrutura do banco e políticas versionadas |
| `docs/` | Arquitetura, ADRs, segurança, operação e requisitos |

`lib/domain` não deve depender de Next.js, banco ou rede. `components` não importa `lib/server`.
Operações administrativas são autorizadas no servidor e protegidas novamente por RLS no banco.

## Integrações

- Supabase: PostgreSQL, autenticação e armazenamento de mídia.
- Resend: notificações de formulário quando configurado no ambiente.
- Vercel: hospedagem, previews e deploy da aplicação.
- GitHub Actions: validação de PR, checks de release, Dependabot e CodeQL.

## Rotas principais

- Site: `/`, `/sobre`, `/areas`, `/servicos`, `/cases`, `/contato`, `/feedback`.
- Painel: `/admin` e fluxos de autenticação associados.
- API pública: `/api/v1`; health check em `/api/v1/health`.
- Operação interna: `/api/internal/revalidate`, autenticada por segredo.

O detalhamento atualizado está em
[`docs/arquitetura/documentacao-tecnica.md`](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/arquitetura/documentacao-tecnica.md)
e nas decisões em `docs/adr/`.
