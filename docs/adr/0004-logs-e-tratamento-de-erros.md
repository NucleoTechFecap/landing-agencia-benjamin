# ADR-0004 — Estratégia de logs e tratamento de erros

| Campo        | Valor                                                              |
| ------------ | ------------------------------------------------------------------ |
| Issue        | ARC-09 (#50)                                                       |
| Status       | **Aceita** — coordenação técnica                                   |
| Data         | 13/10/2026                                                         |
| Decisor      | Vinícius Nishimura Reis (`@Vinishireis`)                           |
| Código       | `lib/server/logger.ts`, `lib/server/errors.ts`, `instrumentation.ts` + testes |

## Contexto

A plataforma recebe dados pessoais (leads e feedbacks) e opera com credenciais de Supabase e
Resend. Precisamos rastrear falhas no servidor sem que logs se tornem um vazamento de PII ou de
segredos (RNF-08), e mostrar mensagens úteis ao usuário sem expor detalhes internos.

## Decisão

### 1. Formato de log

- **JSON em uma linha** via `logger.{debug,info,warn,error}(evento, dados)`, coletado pelos logs
  da Vercel por ambiente.
- Campos fixos: `level`, `event`, `timestamp` (ISO), `service`, `environment`, `requestId`.
- **Eventos estáveis** no formato `dominio.entidade.acao` — ex.: `forms.submission.persisted`,
  `auth.login.failed`, `content.case.published`, `next.request_error`.
- Níveis: `debug` (dev), `info` (fluxo normal relevante), `warn` (erro esperado/negado/validação),
  `error` (falha inesperada ou dependência indisponível). Nível mínimo por `LOG_LEVEL`.

### 2. Proteção de dados nos logs

| Regra | Implementação |
| ----- | ------------- |
| Chaves sensíveis viram `[REDACTED]` (e-mail, telefone, nome, empresa, mensagem, descrição, senha, token, segredo, cookie, authorization, IP, endereço, CPF…) | `redact()` recursivo |
| E-mails, telefones, JWT e `Bearer` em texto livre são mascarados | `scrubString()` |
| Query strings removidas de caminhos | `safePath()` |
| Cabeçalhos HTTP nunca são registrados | `instrumentation.ts` registra apenas método, rota e tipo |
| Stack trace só fora de produção | `serializeError()` |
| Identificadores opacos (`requestId`, `userId`, `submissionId`) são mantidos | chaves terminadas em `id` |

**Nunca registrar:** corpo de formulários, payload de Server Actions, tokens de sessão, chaves de
API, conteúdo de cookies, respostas completas do Supabase.

### 3. Tratamento de erros

| Tipo | Classe/código | O usuário vê | Log |
| ---- | ------------- | ------------ | --- |
| Erro esperado (validação, permissão, conflito, limite) | `AppError(code)` | Mensagem amigável do código + `fieldErrors` | `warn` |
| Dependência indisponível (Supabase, Resend) | `AppError("SERVICE_UNAVAILABLE")` | "Serviço temporariamente indisponível" | `error` |
| Erro inesperado | qualquer `Error` | Mensagem genérica + código de atendimento (`requestId`) | `error` com stack (sem PII) |
| Erro de renderização | Error boundary (`error.tsx`) + `onRequestError` | Página de erro com `digest` | `next.request_error` |

Códigos e status HTTP (base do contrato de API — TECH-02):

| Código | HTTP | Código | HTTP |
| ------ | ---- | ------ | ---- |
| `BAD_REQUEST` | 400 | `PAYLOAD_TOO_LARGE` | 413 |
| `UNAUTHENTICATED` | 401 | `UNSUPPORTED_MEDIA_TYPE` | 415 |
| `FORBIDDEN` | 403 | `VALIDATION_FAILED` | 422 |
| `NOT_FOUND` | 404 | `RATE_LIMITED` | 429 |
| `CONFLICT` | 409 | `INTERNAL_ERROR` | 500 |
| `INVALID_TRANSITION` | 409 | `SERVICE_UNAVAILABLE` | 503 |

`toPublicError(error, requestId)` é a única porta de saída de erro para o cliente.

### 4. Correlação

Cada Server Action/Route Handler gera `requestId` (`newRequestId()`) ou reaproveita
`x-request-id`/`x-vercel-id`. O mesmo valor aparece no log e na mensagem de erro
("Código de atendimento: …"), permitindo localizar o problema sem pedir dados pessoais ao usuário.

### 5. Observabilidade básica (MVP)

- Logs da Vercel filtrados por `event` e `level` (retenção conforme o plano).
- Revisão diária de `level=error` durante a homologação; alerta manual no canal da equipe.
- Pós-MVP: *log drain* para ferramenta externa e alertas automáticos (FUT-06/FUT-07).

## Consequências

- Todo código de servidor usa `logger` (proibido `console.log` com objetos de domínio — revisão de PR).
- Novas chaves com PII devem ser adicionadas a `SENSITIVE_KEYS` no mesmo PR.
- Testes (`logger.test.ts`, `errors.test.ts`) garantem o mascaramento e o envelope de erro.
