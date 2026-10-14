# Contrato de integração ponta a ponta e estratégia de compatibilidade

| Campo        | Valor                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| Issue        | TECH-11 (#175)                                                           |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                                 |
| Versão       | 1.0.0                                                                    |
| Data         | 13/10/2026                                                               |
| Depende de   | [TECH-02 — contratos](contratos.md), [ARC-06 — ambientes](../ambientes/matriz-de-ambientes.md) |
| Código       | `lib/domain/api/contract-compat.test.ts` (trava dos DTOs v1)             |

## 1. Fronteiras de integração e responsáveis

| # | Fronteira | Produtor | Consumidor | Contrato | Responsável pela fronteira |
| - | --------- | -------- | ---------- | -------- | -------------------------- |
| F1 | Banco → repositório público | Tabelas de conteúdo + RLS (DB-01/02) | `lib/server/content/repository.ts` | Tipos de `lib/domain/content/types.ts` | Vinícius Binda (`@VinnizzZ`) |
| F2 | Repositório → páginas | `repository.ts` | `app/(site)/**` | Funções `list*`/`get*` (somente publicados) | Caio Moraes (`@caiomorhaes`) |
| F3 | Repositório → API v1 | `repository.ts` | `/api/v1/*`, `llms.txt`, sitemap | DTOs de `contracts.ts` | Vinícius Nishimura Reis |
| F4 | CMS → banco | Server Actions do painel | Tabelas + `audit_log` | `ActionResult`, `transition()`, `requirePermission` | Murilo Vasconcellos (`@murilovasconcellos`) |
| F5 | CMS → cache público | Server Actions | Páginas/API | `invalidateContentFromAction()` (tags) | Murilo Vasconcellos |
| F6 | Formulários → persistência → e-mail | `app/(site)/actions.ts` | `form_submissions`, Resend | `FormActionState`, `SubmissionStore`, `Notifier` | Gustavo Duarte Güering (backup: Vinícius Nishimura Reis) |
| F7 | Painel ↔ Auth | Supabase Auth | `proxy.ts`, `getSessionUser()` | Papéis de `profiles` | Vinícius Nishimura Reis |
| F8 | Mídia | Storage `media` | `next/image`, CMS | `buildStoragePath`, `publicMediaUrl`, `remotePatterns` | Vinícius Binda |

## 2. Matriz de compatibilidade API ↔ front-end ↔ CMS

| Mudança | Banco (DB) | Repositório/DTO | Front-end | CMS | Tipo |
| ------- | ---------- | --------------- | --------- | --- | ---- |
| Novo campo opcional em entidade | Coluna `null` | Campo opcional no tipo/DTO | Renderiza se existir | Campo novo no formulário | **Compatível** (aditiva) |
| Campo novo obrigatório | Coluna com `default` e *backfill* antes do `not null` | Opcional até o backfill | Trata ausência | Validação após backfill | Compatível em 2 etapas |
| Renomear/remover campo | Nova coluna + cópia + remoção na versão seguinte | **`/api/v2`** ou manter alias | Migra antes da remoção | Migra antes da remoção | **Incompatível** — exige plano |
| Novo estado de publicação | Ajuste do `check` | `PUBLICATION_STATUSES` + `isPubliclyVisible` | Nada (só vê publicados) | Novos botões | Compatível se público continuar só com `published` |
| Mudança de slug | Registro de redirecionamento (DB-08) | Invalidar slug antigo (TECH-09) | Links via `resolveCtaHref` | Aviso ao editor | Compatível com 301 |
| Nova permissão/papel | Nova migration de `role_permissions` | `rbac.ts` | Menu por `can()` | Telas | Compatível (teste de consistência garante) |

**Regra de ouro:** API pública só muda de forma **aditiva** dentro de `v1`. A trava
`contract-compat.test.ts` falha se um campo dos DTOs v1 for removido ou renomeado.

## 3. Fallbacks de conteúdo

| Situação | Comportamento |
| -------- | ------------- |
| CMS ainda sem tabelas/dados | Repositório usa `content/` (seed provisório versionado) |
| Lista vazia (ex.: nenhum case publicado) | Estado vazio amigável, sem erro |
| Destino de CTA arquivado/inexistente | `resolveCtaHref` → listagem correspondente |
| Campo opcional vazio (desafio, galeria…) | Seção omitida |
| Imagem sem cadastro | Card sem capa (layout preservado) |
| Slug inexistente | HTTP 404 real (proxy) |
| Supabase fora do ar | Páginas servem cache; formulários respondem 503 com código de atendimento |

## 4. Ordem de implantação em homologação

1. **Banco**: `supabase db push` no projeto `benjamin-hml` (auth/RBAC → auditoria → formulários → conteúdo de DB-02).
2. **Seed fictício** de desenvolvimento/homologação (ARC-11) e usuários de teste por papel (INT-08).
3. **Variáveis** do ambiente Preview/`main` na Vercel (ARC-05).
4. **Repositório**: trocar `loadSnapshot()` e `publishedSlugExists()` para Supabase (DB-03/04/05) — PR único, com testes do repositório.
5. **Front-end** e **CMS** (PRs de LAY/HOME/SOB/SERV/CASE/ADM) sobre o contrato já publicado.
6. **Smoke test integrado** (seção 6) antes de liberar a homologação para a Benjamin (QA-08).

## 5. Dados de teste e endpoints

| Recurso | Onde |
| ------- | ---- |
| Estrutura do MVP (6 áreas, 9 serviços, 3 categorias, 3 cases) | `content/` e `lib/domain/content/__fixtures__/snapshot.ts` |
| Formulários (válidos/ inválidos/ duplicados) | `lib/server/forms/submission-service.test.ts` (cenários S1–S10) |
| Usuários por papel (`super_admin`, `admin`, `editor`, `viewer`, `pending`) | Convites no `benjamin-hml` (INT-08) — nunca dados reais |
| Endpoints | `GET /api/v1/{health,settings,areas,services,services/{slug},categories,cases,cases/{slug}}`, `POST /api/internal/revalidate`, `/sitemap.xml`, `/llms.txt` |

## 6. Checklist integrado (homologação)

| # | Verificação | Fronteira | Responsável |
| - | ----------- | --------- | ----------- |
| 1 | `GET /api/v1/health` = 200 | F3 | Coordenação técnica |
| 2 | Serviço publicado no CMS aparece em `/servicos`, `/api/v1/services` e no sitemap em ≤ 5 s | F4, F5, F2, F3 | CMS + front |
| 3 | Rascunho não aparece em site, API, sitemap e `llms.txt` | F1–F3 | Banco + coordenação |
| 4 | Arquivar case: URL 404, some das listas, CTA usa fallback | F1, F2, F5 | CMS + front |
| 5 | Envio de formulário gera registro, e-mail ao destinatário de teste e protocolo | F6 | Formulários |
| 6 | `editor` não abre leads; `admin` abre e gera `lead.viewed` na auditoria | F4, F7 | Coordenação técnica |
| 7 | Upload de imagem e uso em case com `next/image` | F8 | Banco/mídia |
| 8 | `npm run verify` verde no commit implantado | Todas | Autor do PR |

## 7. Rollback e incompatibilidades previstas

| Risco | Prevenção | Rollback |
| ----- | --------- | -------- |
| Migration quebra leitura pública | Aplicar primeiro em homologação; migrations aditivas | *Promote* do deployment anterior na Vercel + migration reversa preparada (GO-01) |
| Troca do seed pelo Supabase deixa site vazio | PR com testes do repositório e checklist item 2–3 | Reverter o PR do repositório (volta ao seed) |
| DTO alterado sem aviso | `contract-compat.test.ts` | Reverter PR |
| Cache com dado antigo após publicação | Tags compartilhadas + webhook | `POST /api/internal/revalidate {"entity": "<tipo>"}` |
| Papel/permissão divergente entre código e banco | `rbac-sql.test.ts` | Nova migration alinhando o seed |
