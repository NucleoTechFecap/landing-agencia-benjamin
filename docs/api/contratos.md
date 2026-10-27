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
| `/api/v1/areas` | `AreaDTO[]` | — |
| `/api/v1/services?featured=` | `ServiceDTO[]` | 400 |
| `/api/v1/services/{slug}` | `ServiceDTO & { cases: CaseCardDTO[] }` | 404 |
| `/api/v1/categories` | `CategoryDTO[]` | — |
| `/api/v1/cases?category=&service=&area=&client=&page=&pageSize=` | `CaseCardDTO[]` + `meta` | 400 |
| `/api/v1/cases/{slug}` | `CaseDetailDTO` | 404 |

### DTOs

```ts
AreaDTO        { slug, name, summary, description, highlights[], icon?, url }
ServiceDTO     { slug, name, summary, description, examples[], areas[] (slugs), featured, icon?, image?: MediaDTO, url }
CategoryDTO    { slug, name, description }
CaseCardDTO    { slug, title, client, category: {slug,name}|null, deliveryType?, summary, cover?: MediaDTO, date?, featured, url }
CaseDetailDTO  CaseCardDTO & { challenge?, solution?, results?, gallery: MediaDTO[], externalLinks: {label,url}[],
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
- Back-end implementa `loadSnapshot()`/repositórios do CMS no Supabase preservando os DTOs.
- Testes de contrato: `contracts.test.ts`, `http.test.ts` e smoke test (`curl /api/v1/*`) no checklist de release.
- Mudança incompatível em DTO ou endpoint ⇒ `/api/v2` (estratégia em TECH-11).
