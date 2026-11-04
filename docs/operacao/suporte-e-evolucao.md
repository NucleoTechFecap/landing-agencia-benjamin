# Suporte, correções e evolução depois do lançamento

| Campo        | Valor                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------- |
| Issue        | GO-11 (#201)                                                                                |
| Responsável  | Flávio Santos (conforme `ownership-por-issue.csv`; backup: Vinícius Binda)                  |
| Versão       | 0.1.0 — **proposta, ainda não acordada nem comunicada às equipes**                          |
| Data         | 04/11/2026                                                                                  |
| Depende de   | [GO-06](publicacao-mvp.md), [GO-09](handoff-e-manutencao.md), [GO-01](release-e-rollback.md), GOV-04, GOV-12 |
| Público      | NúcleoTech e Agência Benjamin                                                               |

> Este documento propõe como tratar pedidos e falhas depois da publicação. O que já está decidido em outro
> documento tem link. **O que ninguém acordou está marcado com ⏳ e reunido na seção 9**: prazos de
> atendimento, canal, escala e duração do suporte não existem ainda e não devem ser cobrados como se
> existissem.

## 1. Como cada demanda chega

| Demanda | Exemplo | Por onde (proposta) | Quem trata (proposta) | Situação |
| ------- | ------- | -------------------- | ----------------------- | -------- |
| Atualizar conteúdo | Trocar texto, publicar case, novo serviço | Pela própria Benjamin, no painel ([guia](../cms/guia-do-painel.md)) | Benjamin | Definido em GO-09 §3 |
| Dúvida de uso do painel | "Como troco a capa?" | ⏳ Canal entre NúcleoTech e Benjamin | ⏳ | O GO-09 §2 cita o "canal combinado em GOV-04", mas a GOV-04 está em aberto e o canal não está registrado no repositório |
| Defeito no site ou no painel | Botão sem efeito, página com erro | ⏳ Pelo mesmo canal, virando issue `[BUG]` no GitHub com a label `bug` | Triagem na seção 3 | Formato em [jornadas E2E §3](../qualidade/jornadas-e2e.md) |
| Falha grave em produção | Site fora do ar, formulários sem gravar | Coordenação técnica, imediatamente ([wiki](../wiki/Operação-e-incidentes.md)), e issue `[INCIDENTE]` | Coordenação técnica | Contato direto ⏳ |
| Vulnerabilidade | Falha de segurança | **Só** pelo relato privado do GitHub ([SECURITY.md](../../SECURITY.md)), nunca em issue pública | NúcleoTech | Definido; não há prazo de resposta garantido |
| Pedido de dado pessoal | Titular pede exclusão | Encarregado no aviso de privacidade; atendimento pelo `admin` ([SEG-01 §5](../seguranca/tratamento-de-dados-formularios.md)) | Benjamin | Contato do encarregado ⏳ (SEG-02), tela de leads ⏳ (FORM-09) |
| Melhoria ou funcionalidade nova | "Queremos newsletter" | Controle de escopo (GOV-12) e seção 6 | Coordenação + Benjamin | GOV-12 em aberto |

A Benjamin não precisa de conta no GitHub para pedir ajuda. ⏳ Quem do NúcleoTech transforma o pedido em
issue depende da decisão D2.

Ao relatar, informe: página ou tela, o que fez, o que esperava, o que aconteceu, dispositivo e navegador,
data e hora, e o código de atendimento se aparecer um. **Nunca** cole dados de formulário, senhas ou
tokens em issue ou mensagem.

## 2. Severidade

Proposta alinhada aos critérios de rollback do [GO-01 §6](release-e-rollback.md). Os prazos estão em
branco de propósito: até haver acordo, vale a ordem de prioridade, e não um tempo prometido.

| Nível | Quando | Exemplos | Resposta esperada | Prazo |
| ----- | ------ | -------- | ------------------ | ----- |
| **S1 Crítico** | Dados expostos, site fora do ar ou perda de envios | Vazamento de dado pessoal ou rascunho; credencial comprometida; acesso indevido ao painel; formulários sem gravar; home com erro para todos | Parar o que estiver fazendo; avaliar rollback (GO-01 §6 e §7) | ⏳ |
| **S2 Alto** | Função essencial quebrada, sem alternativa | Painel inacessível ao `admin`; publicar não funciona; notificações sem chegar, embora o envio esteja gravado | Próxima correção a entrar | ⏳ |
| **S3 Médio** | Função afetada, com alternativa | Filtro errado; imagem que não aparece em uma tela; texto cortado no celular | Fila normal, ordenada na seção 3 | ⏳ |
| **S4 Baixo** | Incômodo, sem efeito no uso | Espaçamento, mensagem pouco clara | Quando houver janela | ⏳ |

Dois limites já escritos em outros documentos, sem alteração aqui:

- GO-01 §6: rollback imediato se não houver correção segura em até 30 min, nos casos listados lá.
- TECH-08 §7: incidente com dado pessoal é comunicado à coordenação e ao controlador em até 24 h, prazo
  ainda marcado como pendente de aprovação institucional. O controlador decide sobre avisar a ANPD e os titulares.

## 3. Triagem e priorização

1. **Registrar.** Issue com prefixo `[BUG]`, label `bug`, `agencia-benjamin`, severidade e passos para reproduzir.
2. **Reproduzir.** Em local ou homologação, nunca com dados reais. Sem reprodução, pedir mais informação e
   manter a issue aberta.
3. **Classificar.** Severidade da seção 2. Se não é defeito, vai para o GOV-12 ("correção, melhoria, novo
   requisito ou pós-MVP").
4. **Atribuir ao dono do módulo**, como prevê a QA-10, conforme o
   [`ownership-por-issue.csv`](../gestao/ownership-por-issue.csv).
5. **Ordenar** nesta sequência:

   | Ordem | Critério |
   | ----- | -------- |
   | 1 | Severidade |
   | 2 | Risco a dados pessoais e a segurança, antes de aparência |
   | 3 | Quantas pessoas são afetadas: visitante antes de usuário do painel, se a severidade empatar |
   | 4 | Há alternativa? Sem alternativa vem antes |
   | 5 | Custo da correção: entre itens empatados, o mais barato |

⏳ Quem faz a triagem e com que frequência: decisão D2. A QA-10 prevê "a pessoa responsável" para os bugs da
homologação; depois do lançamento, ninguém foi indicado.

## 4. Procedimento de correção

| Passo | O que fazer | Referência |
| ----- | ------------ | ---------- |
| 1 | Branch `fix/<id>-<descricao>` a partir da `main`, ou `hotfix/` em urgência de produção | [CONTRIBUTING §2](../../CONTRIBUTING.md) |
| 2 | Teste que falha sem a correção; depois, a correção. Atualizar a [matriz de testes](../qualidade/matriz-de-testes.md) se o cenário não estava nela | [wiki de testes](../wiki/Testes-e-qualidade.md) |
| 3 | `npm run format`, `npm run verify` e as baterias da área tocada (`test:e2e`, `test:supabase`, `test:e2e:cms`, `supabase test db`) | CONTRIBUTING §4 |
| 4 | Banco: migration versionada, compatível com o código em produção, com rollback; nunca editar produção à mão | AGENTS.md, GO-01 §3 |
| 5 | PR com `Closes #n`, revisão; autenticação, permissões, RLS, publicação e formulários exigem a coordenação técnica | [TECH-13](../qualidade/revisao-de-prs.md) |
| 6 | Publicar, seguindo o fluxo em vigor (ver o alerta abaixo) | GO-01 §4 |
| 7 | Smoke test depois do deploy | GO-01 §5 |
| 8 | Se piorar, rollback pela Vercel; **não** reverter migration de improviso | GO-01 §7 |
| 9 | Comunicar a Benjamin e fechar a issue com a evidência; em incidente, issue `[INCIDENTE]` com linha do tempo, causa, impacto e ação corretiva, sem dados pessoais | GO-01 §7 e §8 |

**Alerta:** o GO-01 descreve `main → production`, mas em 02/11/2026 a branch `production` não existia e a
Vercel publicava a `main` como Production ([provisionamento §6](provisionamento-producao.md)). Enquanto
essa decisão não sair, **todo merge pode ir ao ar**: tratar a revisão e o merge como publicação. Hotfix
também passa por PR: a `main` e a `production` são protegidas, e bypass só com instrução do responsável.

## 5. Relação com as rotinas de manutenção

As rotinas de [GO-09 §3](handoff-e-manutencao.md) continuam como estão e são a principal fonte de achados.
O que uma rotina encontrar vira issue pela seção 3; o registro da execução fica no comentário da própria
issue MANUT. Todas começam a valer com a publicação (GO-06).

| Issue | Rotina | Frequência | Atribuída a | Se encontrar algo |
| ----- | ------ | ---------- | ------------ | ------------------ |
| [#302](https://github.com/NucleoTechFecap/landing-agencia-benjamin/issues/302) MANUT-01 | Notificações de formulário com falha | Semanal | `Vinishireis` | Destinatário sem receber: S2 |
| [#303](https://github.com/NucleoTechFecap/landing-agencia-benjamin/issues/303) MANUT-02 | Logs de erro da Vercel | Semanal | `Vinishireis` | Erro recorrente vira issue com o `requestId` |
| [#304](https://github.com/NucleoTechFecap/landing-agencia-benjamin/issues/304) MANUT-03 | Retenção de dados pessoais | Mensal | `Vinishireis` | Falha na rotina: S2, com risco de reter além do prazo |
| [#305](https://github.com/NucleoTechFecap/landing-agencia-benjamin/issues/305) MANUT-04 | Contas ativas e papéis | Mensal | `Vinishireis` | Conta indevida: desativar no mesmo dia e tratar como S1 se houve acesso |
| [#306](https://github.com/NucleoTechFecap/landing-agencia-benjamin/issues/306) MANUT-05 | Dependências | Mensal | `Vinishireis` | Vulnerabilidade: canal de segurança e severidade conforme o impacto |
| [#307](https://github.com/NucleoTechFecap/landing-agencia-benjamin/issues/307) MANUT-06 | Next.js a cada minor | A cada minor | `Vinishireis` | Mesma bateria da MANUT-05 |
| [#308](https://github.com/NucleoTechFecap/landing-agencia-benjamin/issues/308) MANUT-07 | Rotação de segredos | Semestral e ao desligar alguém com acesso | `Vinishireis` | Segredo exposto: S1 |
| [#309](https://github.com/NucleoTechFecap/landing-agencia-benjamin/issues/309) MANUT-08 | Teste de restauração | Trimestral | `VinnizzZ` | Restauração falhando: S2, porque é o único backup |

Lacunas observadas ao cruzar as rotinas com os outros documentos:

- ⏳ **Cópia semanal sem issue.** O GO-09 §3 lista "copiar banco e arquivos para o Drive institucional"
  (semanal, [DB-10 §4](backup-e-recuperacao.md)), que é o único backup no plano Free, mas ela não está entre
  as issues #302 a #309. A conferência de uso e do aviso de pausa do Supabase vai junto.
- ⏳ **Procedimento divergente na MANUT-08.** A issue manda restaurar o backup de produção em um projeto
  descartável; o GO-09 §3 e o DB-10 usam `npm run test:restore`, com stack local e dados fictícios.
- ⏳ **Reenvio de notificações.** A MANUT-01 cita o cron, mas `vercel.json` não declara nenhum: o agendamento
  é configurado no provisionamento (GO-02 §3), e cron frequente exige plano pago. Confirmar se está ativo.
- ⏳ **Acúmulo de atribuições.** Sete das oito rotinas estão com a mesma pessoa, sem substituto nas issues.

## 6. Evolução depois do lançamento

| Passo | Como funciona |
| ----- | -------------- |
| Entrada | Pedido novo passa pelo GOV-12, classificado como correção, melhoria, novo requisito ou pós-MVP |
| Especificação | Proposta em `docs/roadmap/`, com objetivo, estimativa, critérios de entrada e decisões pendentes |
| Priorização | ⏳ Quem decide e em que ciclo. Sugestão: junto com os S3 e S4 da seção 3, para não competirem às cegas |
| Conteúdo | Novos cases e seções: [priorização editorial](../roadmap/priorizacao-editorial.md) (FUT-10), decisão da agência |
| Execução | Só depois de aprovado. Cada item segue o fluxo normal de PR |

Propostas existentes, todas fora do MVP e à espera de aprovação: [CRM](../roadmap/evolucao-crm.md) (FUT-01),
[newsletter](../roadmap/newsletter.md) (FUT-02), [automações](../roadmap/automacoes-de-comunicacao.md)
(FUT-03), [histórico de versões](../roadmap/historico-de-versoes.md) (FUT-04),
[workflow editorial](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/roadmap/workflow-editorial.md) (FUT-05),
[analytics](../roadmap/analytics-avancado.md) (FUT-06), [integrações](../roadmap/integracoes-externas.md)
(FUT-07), [módulos internos](../roadmap/modulos-internos.md) (FUT-08) e
[filtros e busca](../roadmap/filtros-busca-e-relacionamentos.md) (FUT-09).

## 7. Comunicação

Os modelos de início, fim e incidente estão no [GO-01 §8](release-e-rollback.md), que cita um "grupo NúcleoTech
+ Benjamin" ainda não identificado aqui (⏳ D1). Em incidente: o que aconteceu, impacto, situação atual e
próximo passo, sem dados pessoais. A comunicação sobre titulares afetados é decisão do controlador.

## 8. Quando esta proposta vira plano

- [ ] Coordenação e Benjamin respondem às decisões da seção 9.
- [ ] Prazos, canal e nomes preenchidos neste documento; versão passa a 1.0.0.
- [ ] Plano comunicado às equipes do NúcleoTech e da Benjamin, com registro na issue GO-11.
- [ ] Lacunas da seção 5 resolvidas ou transformadas em issue.
- [ ] Revisão após a publicação (GO-06), com a versão e as datas reais, junto do [handoff](handoff-e-manutencao.md).

## 9. Lacunas e decisões pendentes

Nada abaixo foi acordado. Enquanto estiver em aberto, o suporte funciona por melhor esforço, sem prazo prometido.

- **D1.** Qual o canal entre NúcleoTech e Benjamin? Depende da GOV-04, em aberto.
- **D2.** Quem faz a triagem, quem transforma pedido em issue e com que frequência?
- **D3.** Quais prazos de resposta e correção por severidade, se houver? E em que dias e horários?
- **D4.** Quem atende S1 fora do horário, ou fica combinado que não há esse atendimento?
- **D5.** Até quando vai o suporte do NúcleoTech depois da publicação, e quem assume depois? O calendário
  acadêmico e a troca de integrantes afetam isso.
- **D6.** Quem substitui os responsáveis das rotinas em ausências?
- **D7.** Em nome de quem ficam as contas de produção, e qual o caminho se quem as administra sair
  ([checklist do handoff §6](handoff-e-manutencao.md))?
- **D8.** Quem decide o que entra entre os pedidos de evolução, e em qual ciclo?
- **D9.** Cópia semanal: abrir uma issue MANUT, e quem executa?
- **D10.** MANUT-08: qual procedimento vale, e o texto de qual documento muda?
