# Revisão e aprovação de PRs críticos

| Campo        | Valor                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| Issue        | TECH-13 (#177)                                                          |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                                |
| Versão       | 1.1.0 — revisão de segurança da entrega do CMS (27/10/2026)             |
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
| INT-02 (#282) e pilha do CMS #276–#285 | Leitura do Supabase, CMS de áreas, serviços, cases e mídia, site na base publicada, login | Revisão independente de segurança (27/10/2026), ver §5 | Sem achado alto; 4 médios e 3 baixos, corrigidos em #301, #312 e #316 | Gravação não atômica (#314), envio limitado a 4 MB (#313), baixos (#315) |
| INT-03 (#169) | Home e institucional editáveis | — | Pendente (PR ainda não aberto) | — |
| ADM-03 (#237) | Proteção de rotas e RBAC no banco | Vinícius Binda (solicitada) | Pendente | — |
| #301 e #312 (migrations da TECH-13) | Auditoria e Storage | Vinícius Binda (solicitada) | Pendente | — |

## 5. Revisão de segurança da entrega do CMS (27/10/2026)

Escopo: `git diff 862e02e..main` (PRs #274–#299), com foco em RLS e funções do banco, Server
Actions do painel, upload de mídia, autenticação, API pública, cache e `next.config.ts`. A revisão
leu o código, rodou os testes e consultou o Supabase local como `anon`, `viewer`, `editor` e
`admin`, dentro de transações desfeitas.

| # | Achado | Severidade | Situação |
| - | ------ | ---------- | -------- |
| 1 | Bucket `media` listável com a chave anon: expunha arquivos de cases em rascunho | Média | Corrigido em #312 (listagem exige `media:view`) |
| 2 | Envio que falhava no registro deixava o arquivo órfão (o editor não podia apagá-lo) | Média | Corrigido em #312 (quem enviou apaga o próprio arquivo sem registro) |
| 3 | Salvar não é atômico: falha nos vínculos gravava só o texto, sem auditoria nem cache | Média | Mitigado em #316 (ids sem repetição, auditoria da falha, cache e mensagem clara); transação em #314 |
| 4 | `bodySizeLimit` de 11 MB não vale na Vercel (teto de 4,5 MB) | Média | Corrigido em #316 (limite de 4 MB conferido no navegador e no servidor); envio direto em #313 |
| 5 | Páginas relacionadas mostravam o item arquivado na primeira visita | Média | Corrigido em #316 (`relatedPaths` no aquecimento) |
| 6 | Conta com evento auditado não podia ser excluída (achado na validação integrada) | Média | Corrigido em #301 |
| 7 | `record_audit_event` aceita evento de qualquer papel; `?aviso=` com texto livre; `revoke from anon` sem efeito | Baixa | `revoke` corrigido em #312; os outros dois em #315 |

Verificado e correto: anônimo não lê rascunho, arquivado nem agendado (nem pelos vínculos N:M);
`viewer` não grava; ninguém escala o próprio papel; toda Server Action checa permissão antes de
ler o banco; não há IDOR nem atribuição em massa de campos de controle; a concorrência otimista
vale no serviço e no `UPDATE`; o upload confere a assinatura dos bytes; o `next` do login não
redireciona para fora (10 tentativas de bypass); a leitura pública tem três barreiras (RLS,
filtro de status e data); os cabeçalhos de segurança estão ativos. A CSP continua prevista em
SEG-06.

Atualizar esta tabela a cada PR crítico revisado (data e link do comentário de revisão).
