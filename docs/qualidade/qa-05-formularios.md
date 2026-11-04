# QA-05 — Formulários, validações e notificações

| Campo        | Valor                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| Issue        | QA-05 (#183)                                                                                            |
| Execução     | 04/11/2026                                                                                              |
| Versão       | `b40318f`, branch `test/qa-06-acesso-links-e-telas`, sobre a `main` em `4e0f40c`                         |
| Ambiente     | Local: `next start` (build de produção) + Supabase local (Postgres 17, RLS real), Chrome headless. `NOTIFY_PROVIDER=log`, destinatários em `@benjamin.test` |
| Base         | Conferência contra [FORM-10](form-10-entrega-de-contatos.md) e os critérios CA-14, CA-15 e CA-16 da [matriz](matriz-de-testes.md). O que já tinha evidência não foi refeito à mão: foi repetido pelas baterias |
| **Fora do escopo: não executado** | **Entrega real de e-mail.** Depende do destinatário oficial (CON-10) e do domínio verificado no Resend. Nenhum e-mail saiu do ambiente, e nada rodou contra o site publicado |

> **Dados válidos chegam ao destino?** Até o banco e até o notificador, sim. **Até a caixa de quem atende, não está
> provado:** é o CT-24 da FORM-10 e o CA-15, que seguem abertos. Por isso esta issue continua em aberto.

## 1. Como reexecutar

```bash
npx supabase start && npx supabase db reset
npx supabase test db
npm run test:supabase
npm run test:e2e:cms -- tests/e2e/job-de-notificacoes.spec.ts tests/e2e/jornada-leads-cms.spec.ts
```

`tests/e2e/formularios.spec.ts` não tem a tag `@cms`. Para rodar contra o Postgres, construa com as variáveis do stack
local, suba `next start` com elas e rode a spec com `--project=desktop`, como descrito na
[FORM-10 §1](form-10-entrega-de-contatos.md). **Espere o PostgREST reconectar depois do `db reset`** (seção 5).

## 2. Massa de teste

A mesma da FORM-10: pessoa fictícia, textos com UUID e `x-forwarded-for` próprio de cada teste, da faixa de documentação
`198.51.0.0/16`. Os envios do job são inseridos direto no banco, no estado que ele precisa encontrar, e removidos ao final.

## 3. Conferência

| Critério | O que pede | Resultado | Onde |
| -------- | ---------- | --------- | ---- |
| CA-14 | Três formulários com validação, confirmação e erro | Conforme | `formularios.spec.ts`, 24 de 24 contra o Postgres; CT-01 a CT-14 da FORM-10 |
| CA-15 | E-mail chega ao destinatário | **Não executado**: depende de CON-10 e do domínio no Resend. Só o `LogNotifier`, no fluxo completo, e o `ResendNotifier` com `fetch` falso | CT-20 e CT-24 da FORM-10 |
| CA-16 | Duplicado não gera dois registros; falha de e-mail não perde o lead | Conforme. **A lacuna da rota do job foi fechada aqui** | Seção 4; `job-de-notificacoes.spec.ts` |

### Persistência, reenvio e duplicidade, conferidos na tabela

Depois de `tests/e2e/formularios.spec.ts`, com o banco zerado. Só contagens: nenhum dado da massa foi impresso.

| Conferência | Resultado |
| ----------- | --------- |
| Registros por tipo | `contact` 5, `feedback` 4, `lead` 2: 11, igual à FORM-10 |
| Notificação | 11 `sent`, pelo `LogNotifier`: **nenhum e-mail real** |
| Ciência do aviso | `payload.privacyConsent = true` em 11 de 11 |
| Protocolo repetido | 0 |
| Mesmo conteúdo gravado mais de uma vez, incluindo a resposta perdida | 0 (`fingerprint` sem repetição) |
| Honeypot gravado | 0 |
| Campos técnicos no `payload` | 0 |
| `ip_hash` | 11 de 11; IP em claro: 0 |
| Sem JavaScript ou antes da hidratação | 5 registros sem `source_path`, como esperado |

| Evento no log do servidor | Ocorrências |
| ------------------------- | ----------- |
| `forms.submission.persisted` | 11 |
| `forms.notification.logged` | 11 |
| `forms.notification.sent` | 11 |
| `app.error.validation_failed` | 3 |
| `forms.submission.duplicate` | 1 |
| `forms.submission.spam_suspected` | 1 |

Busca no mesmo log por `teste.e2e@exemplo.com`, `Pessoa de Teste`, `benjamin.test` e `198.51.`: **0 ocorrências**.

## 4. Rota do job de reenvio

O que faltava para CA-16. Em `tests/e2e/job-de-notificacoes.spec.ts`, por HTTP, com `CRON_SECRET`, sobre o Postgres local. A
recusa sem o token está em [QA-06](qa-06-acesso-indevido.md).

| # | Cenário | Esperado | Observado |
| - | ------- | -------- | --------- |
| CT-01 | Envio `pending` | Vira `sent`, com uma tentativa a mais; `status` e `payload` intactos. Sem destinatário no ambiente, como em `npm run test:e2e:cms`, vira `skipped`, sem contar tentativa | Conforme, nos dois casos |
| CT-02 | Segunda rodada do job | Não repete a notificação | Conforme |
| CT-03 | `failed` há 7 dias, com uma tentativa | Reenviado | Conforme |
| CT-04 | `failed` agora, com uma tentativa | Espera o intervalo | Conforme |
| CT-05 | `failed`, com 5 tentativas | Fica de fora | Conforme |

## 5. Observações

Nenhuma é defeito novo.

| # | Observação | Severidade | Passos | O que fazer |
| - | ---------- | ---------- | ------ | ------------ |
| O-01 | **Não é defeito do produto.** A primeira execução de `formularios.spec.ts` teve 3 falhas de 24, porque o servidor subiu logo depois do `db reset`, com o PostgREST ainda reconectando (`PGRST001`). O visitante viu o erro de serviço indisponível, com o código de atendimento, e nada foi gravado: é o CT-17 da FORM-10, em situação real. Com a espera, 24 de 24 | — | `npx supabase db reset` e, em seguida, um envio | Esperar o PostgREST antes de testar |
| O-02 | `vercel.json` não declara cron, então o reenvio só roda se o agendamento for criado no provisionamento. Já registrado em [suporte e evolução](../operacao/suporte-e-evolucao.md) | Média, em produção | Conferir `vercel.json` | Confirmar em GO-02. Sem isso, notificação que falhar não é reenviada |
| O-03 | A fila do job lê os 20 envios mais antigos pendentes ou com falha, e só depois aplica o intervalo. Com mais de 20 falhas antigas ainda em espera, um envio novo aguarda até elas esgotarem as tentativas. Nada se perde, e o envio fica salvo e visível no painel. Conclusão por leitura de `listNotificationBacklog`, sem reprodução | Baixa | Ler `supabase-store.ts` e `retryPendingNotifications` | Rever se houver indisponibilidade longa do Resend |

Riscos já registrados, sem mudança: sucesso falso do antispam, limite por IP na rede da FECAP e duplo clique sem JavaScript
([FORM-10 §6](form-10-entrega-de-contatos.md), [TECH-07](../formularios/idempotencia-e-falhas.md)).

## 6. As provas falham quando a regra é retirada

Não houve mutação específica do job. A prova de que ele age é a mudança de estado na tabela, de `pending` para `sent`, com o
contador de tentativas. A recusa sem o token está em [QA-06](qa-06-acesso-indevido.md). As regras de intervalo e de
tentativas esgotadas têm testes unitários próprios em `submission-service.test.ts` (S8 e S13).

## 7. Resultado

Em `b40318f`, sobre `4e0f40c`.

| Bateria | Resultado em 04/11/2026 |
| ------- | ----------------------- |
| `npx supabase test db`, banco limpo | `Files=10, Tests=260, Result: PASS` |
| `npm run test:supabase` | 19 arquivos, 187 de 187 |
| `formularios.spec.ts`, desktop, Postgres local | 24 de 24, com a mesma contagem da seção 3 |
| `job-de-notificacoes.spec.ts`, com destinatário fictício, `--repeat-each=3` | 6 de 6, com `sent` |
| `job-de-notificacoes.spec.ts`, sem destinatário, dentro de `npm run test:e2e:cms` | Passou, com `skipped`. A bateria inteira: 425 de 425 (421 em paralelo e 4 de `@home-global`, em série) |
| Entrega real de e-mail | **Não executada** (CON-10) |

## 8. O que falta para fechar

- **CT-24 (entrega real):** repetir em homologação quando CON-10 e o domínio no Resend estiverem resolvidos (GO-02, J3.3).
- **Aprovações da agência:** campos (FORM-01), aviso de privacidade (SEG-02) e destinatários (CON-10) seguem pendentes, e
  esta execução não os trata como aprovados.
