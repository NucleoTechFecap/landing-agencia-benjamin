# Revisão e aprovação de PRs críticos

| Campo        | Valor                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| Issue        | TECH-13 (#177)                                                          |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                                |
| Versão       | 1.0.0                                                                   |
| Data         | 13/10/2026                                                              |
| Depende de   | INT-02 (#168), INT-03 (#169), ADM-03 (#79)                              |
| Automação    | `.github/CODEOWNERS` (revisão solicitada automaticamente em caminhos críticos) |

## 1. O que é PR crítico

Qualquer PR que altere ao menos um dos itens abaixo (os caminhos estão no `CODEOWNERS`):

| Categoria | Exemplos | Revisores |
| --------- | -------- | --------- |
| Autenticação, sessão e permissões | `proxy.ts`, `lib/*/auth/`, `app/admin/actions.ts` | Coordenação técnica |
| Publicação e cache | `lib/*/content/`, Server Actions do CMS | Coordenação técnica + banco |
| Integrações (CMS ↔ site ↔ API) | INT-02, INT-03, `app/api/`, `lib/domain/api/` | Coordenação técnica |
| Dados pessoais | `lib/*/forms/`, `form_submissions`, exportação de leads | Coordenação técnica |
| Banco e RLS | `supabase/migrations/` | Vinícius Binda + coordenação técnica |
| Configuração/segredos | `lib/config/`, `.env.example`, `next.config.ts` | Coordenação técnica |

## 2. Checklist de revisão

### Isolamento de domínios (ADR-0003)
- [ ] `lib/domain` continua sem I/O/framework; `components` não importa `lib/server` (o lint passa).
- [ ] Nada de regra de negócio em componente de UI.

### Autorização (TECH-03 / ADM-03)
- [ ] Toda página do painel chama `requirePageAccess`; toda Server Action/Route Handler usa `requirePermission`/`guardedAction` **antes** de ler ou gravar.
- [ ] Tabela nova tem RLS na mesma migration, usando `has_permission()`; nenhum `grant` para `anon` além do necessário.
- [ ] Papel nunca vem do cliente; nenhuma checagem só na interface.
- [ ] Alteração de `rbac.ts` acompanha nova migration de `role_permissions` (teste `rbac-sql` verde).

### Contratos API/CMS (TECH-02 / TECH-11)
- [ ] DTOs v1 só mudam de forma aditiva (`contract-compat.test.ts` verde).
- [ ] Erros usam `AppError`/envelope padronizado; nenhuma mensagem interna vai ao cliente.
- [ ] Repositório público continua retornando só itens publicados (I1).

### Publicação e cache (TECH-04 / TECH-09)
- [ ] Transições passam por `transition()` com a validação da entidade.
- [ ] Toda escrita publicada chama `invalidateContentFromAction()` com as tags certas.
- [ ] Operações críticas registram auditoria (TECH-10).

### Dados pessoais e logs (TECH-08 / ARC-09)
- [ ] Nenhum `console.log` com objetos de domínio; `logger` com chaves novas mascaradas quando forem PII.
- [ ] Nada de PII em URL, cache key, tag de cache ou metadado de auditoria.

### Performance
- [ ] Dados de páginas públicas vêm de funções `'use cache'`; leitura de cookies/searchParams fica atrás de `<Suspense>`.
- [ ] Imagens com `next/image`, `sizes` e `priority` só acima da dobra.
- [ ] Sem dependência nova sem justificativa (tamanho, manutenção, licença).

### Segurança geral
- [ ] Entradas validadas com Zod no servidor; uploads pela política de mídia (ARC-10).
- [ ] Links externos com `rel="noopener noreferrer"`; redirecionamentos internos validados.
- [ ] Sem segredos no diff.

## 3. Fluxo

1. Autor marca o PR como **crítico** no template e garante `npm run verify` (e `npm run test:e2e` se mexer em jornada).
2. `CODEOWNERS` solicita a revisão; o revisor percorre o checklist acima e comenta com
   **Aprovado**, **Aprovado com ressalvas** (risco aceito explicitamente, registrado no PR) ou
   **Mudanças necessárias**.
3. Riscos **altos** precisam ser corrigidos antes do merge ou aceitos por escrito pela coordenação
   técnica e pelo coordenador do projeto (Flávio Santos).
4. Antes de liberar a homologação, o artefato de integração (deploy de `main`) passa pelo checklist
   integrado de TECH-11.

## 4. Registro de revisões

| PR | Escopo | Revisor | Resultado | Riscos aceitos |
| -- | ------ | ------- | --------- | -------------- |
| INT-02 (#168) | Serviços e cases na base publicada | — | Pendente | — |
| INT-03 (#169) | Home e institucional editáveis | — | Pendente | — |
| ADM-03 (#237) | Proteção de rotas e RBAC no banco | Vinícius Binda (solicitada) | Pendente | — |

Atualizar esta tabela a cada PR crítico revisado (data e link do comentário de revisão).
