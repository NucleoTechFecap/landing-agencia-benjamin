# Autorização, retenção e ciclo de vida de dados pessoais

| Campo           | Valor                                                                   |
| --------------- | ----------------------------------------------------------------------- |
| Issue           | TECH-08 (#109)                                                          |
| Responsável     | Vinícius Nishimura Reis (`@Vinishireis`)                                |
| Revisão técnica | Vinícius Binda (`@VinnizzZ`)                                            |
| Versão          | 1.0.0                                                                   |
| Data            | 13/10/2026                                                              |
| Depende de      | [SEG-01](tratamento-de-dados-formularios.md), [ADM-01](perfis-e-permissoes.md), [TECH-03](matriz-rbac.md) |
| Código          | `lib/domain/forms/retention.ts`, `lib/server/logger.ts` (mascaramento) |

> Traduz as decisões de LGPD em **regras técnicas implementáveis**. Não define base legal nem
> prazos finais: itens marcados com ⏳ dependem de aprovação institucional (SEG-02).

## 1. Ciclo de vida

```mermaid
stateDiagram-v2
  [*] --> coletado: envio do formulário (validação + aviso)
  coletado --> armazenado: persistência com RLS
  armazenado --> em_uso: consulta no painel (admin, auditada)
  em_uso --> armazenado
  armazenado --> anonimizado: retenção (feedback identificado)
  armazenado --> eliminado: retenção / pedido do titular
  anonimizado --> eliminado: retenção (24 meses)
  eliminado --> [*]
```

## 2. Princípios aplicados (LGPD art. 6º)

| Princípio | Regra técnica |
| --------- | ------------- |
| Finalidade | Cada formulário tem finalidade única (SEG-01); dados não são reaproveitados para marketing |
| Adequação/necessidade | Campos mínimos (FORM-01); CPF, endereço e orçamento não são coletados |
| Livre acesso | Pedido do titular atendido pelo `admin` (SEG-01 §5) |
| Segurança | RLS, papéis, TLS, segredos fora do Git, logs sem PII |
| Prevenção | Honeypot/tempo mínimo/idempotência contra abuso; IP só como HMAC |
| Transparência | Aviso de privacidade linkado em todo formulário (SEG-02/SEG-03) ⏳ |
| Responsabilização | Trilha de acesso e de eliminação (TECH-10) |

## 3. Modelo de autorização

| Camada | Regra |
| ------ | ----- |
| Banco (RLS) | `anon`: somente `insert` controlado (via função), **sem** `select/update/delete`. `authenticated`: `select/update/delete` apenas com `has_permission('lead'|'feedback', ação)` |
| Servidor | Toda listagem/consulta/exportação chama `requirePermission("lead"|"feedback", ação)` |
| Papéis | Somente `admin` (Benjamin) lê/exporta. `super_admin` não lê por padrão (acesso emergencial = atribuição temporária de `admin`, auditada) |
| Service role | Usada só por rotinas operacionais (retenção, provisionamento); nunca em rotas públicas. Quem pode restaurar e acessar dados reais: [retenção e descarte §2](../operacao/retencao-e-descarte.md) |
| Ambientes | Dados reais só em produção; o banco local usa o seed fictício, e homologação usa só conteúdo provisório aprovado (ARC-06/ARC-11) |

## 4. Consulta restrita e exportação

| Operação | Regra |
| -------- | ----- |
| Listagem | Mostra nome, categoria, status e data; conteúdo completo só ao abrir o registro. Filtros de lista fechada: nome e e-mail nunca vão para a URL (FORM-09) |
| Abrir registro | Gera evento de auditoria `lead.viewed`/`feedback.viewed` (sem conteúdo). O conteúdo é exibido como texto com escape, e a página de origem nunca vira link, porque vem do navegador e aceita `//evil.com` (FORM-09) |
| Excluir registro | Só depois de arquivar, um por vez, com `lead.deleted`/`feedback.deleted` gravado antes (FORM-09) |
| Sair do painel | Recarga completa da página: sem ela, o Next mantém as telas visitadas no documento, escondidas, e um envio aberto ficaria no DOM depois de sair (SEG-04) |
| Exportação (eventual) | Somente `admin`, CSV com filtros aplicados, máximo 1 000 linhas por arquivo, evento `lead.exported` com quantidade e filtros; arquivo não fica armazenado na plataforma |
| Cópia por e-mail | Notificação interna contém os dados (destinatários restritos — CON-10); orientar destinatários a não encaminhar |

## 5. Retenção e descarte

Regras em código (`RETENTION_RULES`, `retentionActionFor`, `planRetention`, `anonymizeFeedback`):

| Registro | Prazo (desde o último andamento) | Ação | Status |
| -------- | -------------------------------- | ---- | ------ |
| Lead | 12 meses | Excluir | ⏳ |
| Contato | 6 meses | Excluir | ⏳ |
| Feedback identificado | 12 meses | Anonimizar (remove nome/e-mail) | ⏳ |
| Feedback anônimo | 24 meses | Excluir | ⏳ |
| Registro com *legal hold* | Suspenso | Manter | — |

**Execução (DBX-05):** [retenção e descarte](../operacao/retencao-e-descarte.md).

1. Rota `/api/internal/jobs/retencao`, protegida por `CRON_SECRET`, chamada à mão uma vez por mês.
2. `retention_subjects()` entrega id, tipo, último andamento e se é identificado, sem o conteúdo do envio, e
   `planRetention()` separa `delete`/`anonymize`.
3. `apply_retention()` executa numa transação e registra `retention.executed` **só com contagens**. Enquanto os prazos
   não forem aprovados, a rota só simula.
4. Cópias semanais criptografadas no Drive institucional ([DB-10](../operacao/backup-e-recuperacao.md)), já que o plano
   Free não tem backup do provedor. Quantas manter depende da aprovação destes prazos. Restaurar uma cópia reaplica a lista
   de eliminados e a rotina antes de reabrir o acesso.

## 6. Proteção de PII em logs e notificações

- `logger` mascara chaves e padrões sensíveis (e-mail, telefone, nome, mensagem, IP, tokens) — ARC-09.
- Eventos de auditoria guardam **identificadores**, nunca conteúdo de formulários (TECH-10).
- Erros exibidos ao usuário usam código de atendimento, sem eco dos dados enviados.

## 7. Incidente envolvendo dados pessoais

1. Conter: revogar chaves/sessões afetadas (ARC-05 §4) e bloquear o acesso.
2. Avaliar: quais registros, período e risco aos titulares.
3. Comunicar a coordenação e o controlador em até 24 h; o controlador decide sobre comunicação à
   ANPD e aos titulares (art. 48). ⏳
4. Registrar causa e ação corretiva no repositório (sem dados pessoais).

## 8. Pendências de aprovação institucional

- [ ] Prazos de retenção (seção 5).
- [ ] Bases legais e texto do aviso de privacidade (SEG-02).
- [ ] Responsável por pedidos de titulares e canal de contato.
- [ ] Fluxo de comunicação de incidentes (seção 7).
