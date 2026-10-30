# Contrato de APIs, erros, paginação e validação

| Campo        | Valor                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| Issue        | TECH-02 (#55)                                                            |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                                 |
| Versão       | 1.0.0 (API `v1`)                                                         |
| Data         | 13/10/2026                                                               |
| Depende de   | [ADR-0003](../adr/0003-limites-de-dominio.md) (TECH-01), DB-01 (modelagem — `@VinnizzZ`) |
| Código       | `lib/domain/api/contracts.ts`, `lib/server/http.ts`, `app/api/v1/**`     |

## 1. Visão geral

| Superfície | Tecnologia | Quem usa | Autenticação |
| ---------- | ---------- | -------- | ------------ |
| **API pública de leitura** `/api/v1/*` | Route Handlers (`GET`) | Integrações, `llms.txt`, testes de contrato, front futuro | Nenhuma (somente conteúdo publicado) |
| **Formulários públicos** | Server Actions (`submitLead`, `submitContact`, `submitFeedback`) | Páginas `/contato` e `/feedback` | Nenhuma + antispam + idempotência |
| **Escrita do CMS** | Server Actions do painel | `/admin` | Sessão Supabase + `requirePermission` |
| **Leitura do site** | Chamadas diretas ao repositório em Server Components | Páginas públicas | — |

O site e a API compartilham o **mesmo repositório** (`lib/server/content`), portanto a regra de
visibilidade é única (TECH-04, invariante I1).

## 2. Convenções

- JSON UTF-8, `camelCase`, datas ISO 8601 (UTC), mês de referência `AAAA-MM`.
- Identificador público = **slug** (IDs internos/UUIDs não são expostos).
- Sucesso: `{ "data": ..., "meta"?: {...} }` · Erro: `{ "error": { code, message, requestId, fieldErrors? } }`.
- Todo response traz `X-Request-Id` (o mesmo da mensagem de erro e do log).
- Leituras públicas: `Cache-Control: public, s-maxage=300, stale-while-revalidate=3600`; erros e escritas: `no-store`.
- Parâmetros desconhecidos são ignorados; parâmetros inválidos → `400 BAD_REQUEST` com `fieldErrors`.
- `status`, rascunhos e campos de controle **nunca** são parâmetros nem campos da API pública.

## 3. Paginação e filtros

| Parâmetro | Tipo | Padrão | Regra |
| --------- | ---- | ------ | ----- |
| `page` | inteiro | 1 | ≥ 1 |
| `pageSize` | inteiro | 12 | 1–50 |
| `category`, `service`, `area` | slug | — | `^[a-z0-9]+(-[a-z0-9]+)*$` |
| `client` | texto | — | 1–120, comparação sem diferenciar maiúsculas |
| `featured` (serviços) | `true`/`false` | — | — |

```json
{ "data": [ ... ], "meta": { "page": 1, "pageSize": 12, "total": 3, "totalPages": 1 } }
```

## 4. Endpoints públicos (`GET`)

| Endpoint | Resposta `data` | Erros |
| -------- | --------------- | ----- |
| `/api/v1/health` | `{ status: "ok", service, apiVersion }` | — |
| `/api/v1/settings` | `SiteSettingsDTO` | — |
| `/api/v1/pages/{slug}` | `PageDTO` (página publicada e blocos válidos) | 404 |
| `/api/v1/ctas?placement=` | `CtaDTO[]` (link já resolvido, com fallback) | 400 |
| `/api/v1/areas` | `AreaDTO[]` (ordem configurada) | — |
| `/api/v1/areas/{slug}` | `AreaDetailDTO` (área e serviços publicados vinculados) | 404 |
| `/api/v1/services?featured=` | `ServiceDTO[]` | 400 |
| `/api/v1/services/{slug}` | `ServiceDTO & { cases: CaseCardDTO[] }` | 301, 404 |
| `/api/v1/categories` | `CategoryDTO[]` | — |
| `/api/v1/cases?category=&service=&area=&client=&page=&pageSize=` | `CaseCardDTO[]` + `meta` | 400 |
| `/api/v1/cases/{slug}` | `CaseDetailDTO` | 301, 404 |

**301 nos detalhes de serviço e case (DB-08).** Endereço antigo (o item trocou de slug depois de
publicado) ou com maiúsculas responde `301` com `Location` no endereço atual, mantendo a query
string. Endereço de item fora do ar ou excluído continua `404`.

### DTOs

```ts
AreaDTO        { slug, name, summary, description, highlights[], icon?, url }
AreaDetailDTO  AreaDTO & { services: { slug, name, summary, url }[] }
ServiceDTO     { slug, name, summary, description, examples[], areas[] (slugs), featured, icon?, image?: MediaDTO, url }
CategoryDTO    { slug, name, description }
CaseCardDTO    { slug, title, client, category: {slug,name}|null, deliveryType?, summary, cover?: MediaDTO, date?, featured, url }
CaseDetailDTO  CaseCardDTO & { challenge?, solution?, results?, gallery: MediaDTO[], externalLinks: {label,url,source?,date?}[],
                 team[], services: {slug,name,url}[], areas: {slug,name}[], publishedAt }
MediaDTO       { src, alt, width?, height? }
SiteSettingsDTO { name, tagline, description, contact: {email?, phone?, address?, mapsUrl?}, socials: {instagram?, tiktok?, linkedin?} }
PageDTO        { slug, title, description?, path: string|null (rota fixa — PAGE_ROUTES), blocks: { type, content }[] }
CtaDTO         { label, href, external }   // placement: home-hero | home-highlight | footer | service-detail | case-detail
```

Exemplo (`GET /api/v1/cases?category=assessoria-de-imprensa`):

```json
{
  "data": [{
    "slug": "fecap",
    "title": "Assessoria de imprensa para a FECAP",
    "client": "FECAP",
    "category": { "slug": "assessoria-de-imprensa", "name": "Assessoria de Imprensa" },
    "deliveryType": "Releases e publicações",
    "summary": "Releases, pautas e conteúdos publicados…",
    "cover": { "src": "/brand/cases/fecap.webp", "alt": "…", "width": 1200, "height": 750 },
    "featured": true,
    "url": "/cases/fecap"
  }],
  "meta": { "page": 1, "pageSize": 12, "total": 1, "totalPages": 1 }
}
```

## 5. Formulários públicos (Server Actions)

```ts
submitLead(prev: FormActionState, formData: FormData): Promise<FormActionState>
submitContact(prev, formData) / submitFeedback(prev, formData)

type FormActionState =
  | { status: "idle" }
  | { status: "success"; protocol: string; duplicate: boolean }
  | { status: "error"; code: ErrorCode; message: string; requestId: string;
      fieldErrors?: Record<string, string[]>; values?: Record<string, string> }  // values para repreencher (sem campos técnicos)
```

| Situação | `status` | `code` |
| -------- | -------- | ------ |
| Campos inválidos (Zod — FORM-01) | `error` | `VALIDATION_FAILED` |
| Honeypot preenchido / envio rápido demais | `success` silencioso (não revela detecção) | — |
| Reenvio do mesmo `submissionId` | `success`, `duplicate: true`, mesmo protocolo | — |
| Limite de envios | `error` | `RATE_LIMITED` |
| Banco indisponível | `error` | `SERVICE_UNAVAILABLE` |

Regras de idempotência e falhas: TECH-07.

## 6. Escrita do CMS (Server Actions do painel)

Todas seguem o mesmo esqueleto e retornam `ActionResult<T>`:

```ts
type ActionResult<T> = { ok: true; data: T } | { ok: false; error: PublicError };

export async function publishCase(input: { id: string; expectedUpdatedAt: string }) {
  "use server";
  const user = await requirePermission("case", "publish");       // 401/403 (ADM-03)
  const current = await casesRepo.findById(input.id);             // 404
  if (current.updatedAt !== input.expectedUpdatedAt) throw new AppError("CONFLICT"); // 409
  const result = transition(current, "publish", { role: user.role, resource: "case",
                 now: new Date(), validateForPublish: () => validateCaseForPublish(current) }); // 409/422
  await casesRepo.save(...); await recordAuditEvent(...); invalidateContent("case", current.slug);
}
```

| Operação | Entrada | Permissão | Erros |
| -------- | ------- | --------- | ----- |
| `save<Entidade>` | DTO de rascunho (Zod da entidade) + `expectedUpdatedAt` | `edit` (`create` se novo) | 400, 401, 403, 409, 422 |
| `publish` / `unpublish` | `{ id, expectedUpdatedAt }` | `publish` | 401, 403, 404, 409 (`INVALID_TRANSITION`/`CONFLICT`), 422 |
| `archive` / `restore` | `{ id, expectedUpdatedAt }` | `archive` | + `assessRemovalImpact` (409 com bloqueios) |
| `delete` | `{ id }` (somente arquivado) | `delete` | 403, 409 |
| `uploadMedia` | `FormData { file, alt }` | `media:create` | 413, 415, 422 (ARC-10) |
| `listLeads` | `{ kind?, category?, status?, page, pageSize }` | `lead:view` | 401, 403 |
| `exportLeads` | filtros | `lead:export` | 401, 403 |

Entidades com Zod próprio: case (`case-schema.ts` — CASE-11); serviço, área, categoria, CTA e
página seguem o mesmo padrão rascunho/publicação, com campos obrigatórios de TECH-05 §5.

**Implementação (ADM-07).** `lib/server/cms/content-service.ts` aplica, para toda entidade
descrita em `lib/server/cms/entities.ts`: permissão → Zod da entidade → versão otimista
(`updated_at`) → slug único, sem reaproveitar endereço antigo ou reservado, e fixo após a primeira
publicação em área e categoria (DB-08) → `transition()` (inclusive no save
de item publicado) → `assessRemovalImpact` ao despublicar/arquivar/excluir → auditoria (crítica
antes da gravação, com registro de falha) → gravação pelo store → `updateTag`. O store de
produção (`supabase-store.ts`) usa a sessão do usuário, então a RLS do banco é a segunda barreira;
o de memória (`memory-store.ts`) cobre as regras nos testes. As Server Actions de cada tela usam
`cmsSaveAction`/`cmsCommandAction` (`context.ts`) e redirecionam com `?ok=` no sucesso.
O envio de mídia (ADM-08) é `cmsUploadAction` → `media-service.ts`: `media:create`, texto
alternativo, tipo real pela assinatura dos bytes, tamanho e dimensões (`readImageDimensions`),
`buildStoragePath`, upload ao bucket com a sessão do usuário e registro em `media_assets`; se o
registro falhar, o objeto é apagado. `serverActions.bodySizeLimit` = 11 MB (`next.config.ts`).

## 7. Códigos de erro

| Código | HTTP | Quando |
| ------ | ---- | ------ |
| `BAD_REQUEST` | 400 | Query/entrada malformada |
| `UNAUTHENTICATED` | 401 | Sem sessão válida |
| `FORBIDDEN` | 403 | Papel sem permissão |
| `NOT_FOUND` | 404 | Item inexistente **ou não publicado** (não revela existência) |
| `CONFLICT` | 409 | `expectedUpdatedAt` divergente (edição concorrente) |
| `INVALID_TRANSITION` | 409 | Transição de estado não permitida |
| `PAYLOAD_TOO_LARGE` | 413 | Upload acima do limite |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | Formato de arquivo recusado |
| `VALIDATION_FAILED` | 422 | Campos inválidos para salvar/publicar |
| `RATE_LIMITED` | 429 | Excesso de envios |
| `INTERNAL_ERROR` | 500 | Falha inesperada (mensagem genérica) |
| `SERVICE_UNAVAILABLE` | 503 | Dependência fora do ar |

## 8. Trabalho em paralelo

- Front-end consome os DTOs acima (tipos exportados de `lib/domain/api/contracts.ts`).
- Back-end: `lib/server/content/sources.ts` escolhe a fonte (`CONTENT_SOURCE`); a fonte Supabase
  (DB-03/04/05) lê configuração, páginas, CTAs, áreas, serviços, categorias, cases, galeria e mídia
  com a chave anônima, preservando os DTOs. Banco vazio devolve listas vazias e 404 nos detalhes.
- Testes de contrato: `contracts.test.ts`, `http.test.ts` e smoke test (`curl /api/v1/*`) no checklist de release.
- Mudança incompatível em DTO ou endpoint ⇒ `/api/v2` (estratégia em TECH-11).
