# Trilha de auditoria e limites de operações críticas do CMS

| Campo           | Valor                                                                  |
| --------------- | ---------------------------------------------------------------------- |
| Issue           | TECH-10 (#111)                                                         |
| Responsável     | Vinícius Nishimura Reis (`@Vinishireis`)                               |
| Revisão técnica | Vinícius Binda (`@VinnizzZ`)                                           |
| Versão          | 1.0.0                                                                  |
| Data            | 13/10/2026                                                             |
| Depende de      | [TECH-03](matriz-rbac.md), [TECH-04](../negocio/maquina-de-estados-publicacao.md) |
| Código          | `lib/domain/audit/events.ts`, `lib/server/audit.ts`, `supabase/migrations/20261013000300_audit_log.sql`, `20261027000100_audit_log_anonimiza_ator.sql`, `20261028000100_audit_event_authorization.sql` + testes |

## 1. Objetivo

Responder, para qualquer operação sensível: **quem** fez, **o quê**, **quando**, **em qual
recurso** e **com qual resultado** — sem guardar segredos, conteúdo de formulários ou dados
pessoais dos visitantes.

## 2. Formato do registro (`public.audit_log`)

| Campo | Exemplo | Origem |
| ----- | ------- | ------ |
| `id` | 1042 | Sequência |
| `occurred_at` | `2026-10-20T14:03:11Z` | Banco (`now()`) |
| `actor_id` | UUID do usuário | Sessão (`auth.uid()`) — não vem do cliente. Fica nulo se a conta for excluída |
| `actor_role` | `editor` | `current_app_role()` |
| `event` | `content.published` | Catálogo fechado (check no banco = `AUDIT_EVENTS`) |
| `resource_type` / `resource_id` | `content` / UUID do case | Aplicação |
| `outcome` | `success` · `denied` · `failure` | Aplicação |
| `metadata` | `{"slug":"meridiano","toStatus":"published"}` | Lista permitida de chaves, ≤ 2 KB |
| `request_id` | UUID | Correlação com logs (ARC-09) |

**Nunca registrar:** senhas, tokens, cookies, e-mails/telefones/nomes de visitantes, conteúdo de
leads/feedbacks, payloads completos. `sanitizeAuditMetadata()` descarta qualquer chave fora da
lista permitida.

## 3. Eventos críticos

| Evento | Quando | Crítico¹ |
| ------ | ------ | :------: |
| `auth.login.succeeded` / `auth.logout` / `auth.password.changed` | Sessão e credencial | — |
| `user.invited` · `user.role_changed` · `user.activation_changed` | Gestão de acesso (gravado na mesma transação pelas funções SQL) | ✔ |
| `content.published` · `content.unpublished` · `content.archived` · `content.deleted` | Transições de publicação (TECH-04) | ✔ |
| `content.created` · `content.updated` · `content.restored` | Edição | — |
| `settings.updated` | Contato institucional e redes sociais | ✔ |
| `media.uploaded` / `media.deleted` | Biblioteca de mídia | — / ✔ |
| `lead.viewed` · `feedback.viewed` · `lead.status_changed` | Acesso a dados pessoais (trilha de acesso — TECH-08) | — |
| `lead.exported` · `lead.deleted` · `feedback.deleted` · `retention.executed` | Saída/eliminação de dados pessoais | ✔ |
| `access.denied` | Tentativa negada pelo RBAC | — |

¹ **Crítico:** se a auditoria não puder ser gravada, a operação é **abortada**
(`SERVICE_UNAVAILABLE`). Em operações críticas da aplicação, o evento é gravado **antes** da
alteração; se a alteração falhar em seguida, registra-se um evento com `outcome: "failure"`.

Falhas de login **não** entram na tabela (não há sessão para identificar o ator): ficam no log
estruturado (`auth.login.failed`, sem e-mail) e nos *Auth logs* do Supabase.

## 4. Limites de operações críticas

| Operação | Limite | Onde |
| -------- | ------ | ---- |
| Alterar o próprio papel / desativar a si mesmo | Proibido | `assign_role`, `set_profile_active`, `canAssignRole` |
| Remover/rebaixar o último `super_admin` ativo | Proibido | Funções SQL |
| `admin` promover a `admin`/`super_admin` | Proibido | Funções SQL + RBAC |
| Exclusão definitiva | Só de itens **arquivados**, um por vez, máx. 20/hora por usuário | TECH-04 + `CRITICAL_LIMITS` (aplicado nas actions de ADM-06/07/08) |
| Exportação de leads | Só `admin`, máx. 1 000 linhas e 5 exportações/hora | `CRITICAL_LIMITS` (aplicado na exportação de FORM-09) + TECH-08 |
| Operações em lote (publicar/excluir vários) | Fora do MVP | — |
| Alteração da trilha de auditoria | Proibida (append-only por trigger, inclusive para `service_role`). Única exceção: ao excluir uma conta, a chave estrangeira anula o `actor_id` dos eventos dela; evento, papel, recurso e metadados ficam intactos (TECH-13) | `audit_log_append_only` + `supabase/tests/database/audit_log.test.sql` |

## 5. Acesso à trilha

- Leitura: somente `audit:view` (`super_admin`, `admin`) via RLS. **Leitura anônima: impossível**
  (`revoke all ... from anon` + policy).
- Escrita: somente pela função `record_audit_event` (sessão obrigatória) e pelas funções SQL de
  gestão de acesso. Eventos `content.*` e `media.*` exigem papel `editor` ou superior; eventos
  `lead.*`, `feedback.*`, `retention.*`, `settings.*` e `user.*` exigem `admin` ou `super_admin`.
  Eventos `auth.*` e `access.denied` podem ser gravados por qualquer sessão autenticada; eventos
  fora dessas famílias são recusados.
- Retenção proposta: 24 meses (⏳ aprovação institucional junto a TECH-08).

## 6. Política de erro e rastreabilidade

| Situação | Comportamento |
| -------- | ------------- |
| Auditoria falha em evento não crítico | Operação segue; `audit.record_failed` (nível `error`) no log |
| Auditoria falha em evento crítico | Operação abortada; usuário vê "Não foi possível registrar a operação…" com código de atendimento |
| Investigação | Filtrar `audit_log` por `actor_id`/`resource_id` e cruzar `request_id` com os logs da Vercel |

## 7. Testes

- `events.test.ts` — metadados sem PII, catálogo fechado, eventos destrutivos críticos e
  **check do banco idêntico ao catálogo**.
- `audit.test.ts` — envio filtrado ao RPC, abort em evento crítico, apenas log em não crítico.
- `guards.test.ts` — negação de permissão gera `access.denied`.
