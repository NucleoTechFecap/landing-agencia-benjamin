# FORM-10 — Teste de entrega de contatos

| Campo        | Valor                                                                                   |
| ------------ | --------------------------------------------------------------------------------------- |
| Issue        | FORM-10 (#76)                                                                           |
| Execução     | 04/11/2026                                                                              |
| Ambiente     | Local: `next start` (build de produção) + Supabase local (Postgres 17, RLS real), Chrome headless |
| Escopo       | Novo projeto, contato e feedback: mensagens na tela, persistência, notificação e logs   |
| **Fora do escopo: não testado** | **Entrega real de e-mail.** Depende do destinatário oficial (CON-10) e do domínio verificado no Resend. Nesta execução nenhum e-mail saiu para a Resend nem para caixa real |

> **O que esta execução não prova.** Ela não mostra que um envio chega ao responsável correto, que é o primeiro
> critério de FORM-06 e o CA-15. O cenário J3.3 continua aberto. A notificação foi exercida de duas formas
> parciais: o `LogNotifier` no fluxo completo, com destinatários fictícios, e o `ResendNotifier` com `fetch` falso.

## 1. Como reexecutar

```bash
npm run test                        # regras, adaptador da Resend e eventos de log
npm run build && npm run test:e2e   # inclui tests/e2e/formularios.spec.ts, com armazenamento em memória
npx supabase start && npx supabase db reset
npm run test:supabase               # persistência no Postgres local (formularios.test.ts)
```

A execução contra o banco (seção 4) usou `npm run build` e `next start` com `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` do stack local, `SUBMISSION_HASH_SECRET` gerado na
hora, `NOTIFY_PROVIDER=log` e `*_NOTIFICATION_TO` com endereços fictícios em `@benjamin.test`.

## 2. Massa de teste

- Pessoa fictícia ("Pessoa de Teste E2E", `teste.e2e@exemplo.com`) e textos com UUID, para um envio não voltar como
  duplicado de outro.
- Cada teste usa um `x-forwarded-for` próprio, da faixa de documentação `198.51.0.0/16`: o limite real de 5 envios
  por IP não foi afrouxado para o teste.
- Nenhum dado pessoal real e nenhum destinatário real.

## 3. Casos de teste

Tipos: **UNI** regra com armazenamento em memória · **INT** Supabase local · **E2E** navegador real, desktop e celular.

| # | Cenário | Esperado | Observado | Tipo | Evidência |
| - | ------- | -------- | --------- | ---- | --------- |
| CT-01 | Novo projeto válido | Confirmação com protocolo `AB-XXXXXX`; registro `lead`; notificação registrada | Conforme | UNI, INT, E2E | `submission-service.test.ts` (S1), `formularios.test.ts`, `jornada-visitante.spec.ts` (J1.1) |
| CT-02 | Contato válido | Idem, com "Mensagem enviada!"; registro `contact` | Conforme | UNI, INT, E2E | `formularios.spec.ts`, seção 4 |
| CT-03 | Feedback anônimo válido | Idem, com "Obrigado pelo feedback!"; registro `feedback`, sem exigir nome nem e-mail | Conforme | UNI, INT, E2E | `formularios.spec.ts`, `schemas.test.ts`, seção 4 |
| CT-04 | Campos inválidos, com JavaScript | Erro no campo, foco no primeiro inválido, nenhum POST | Conforme (após B-04) | UNI, E2E | `browser-validation.test.ts`, `formularios.spec.ts`, J1.2 |
| CT-05 | Campos inválidos, sem JavaScript | O servidor recusa: erro no campo e texto repreenchido | Conforme (após B-01) | UNI, E2E | S2, `formularios.spec.ts` |
| CT-06 | "Quero retorno" sem e-mail | Erro no campo de e-mail | Conforme | UNI, E2E | `schemas.test.ts`, `formularios.spec.ts` |
| CT-07 | Sem a ciência do aviso, nos 3 formulários | Erro no campo, nada salvo nem notificado | Conforme | UNI, E2E | `schemas.test.ts`, `submission-service.test.ts`, `formularios.spec.ts` |
| CT-08 | Ciência declarada | `payload.privacyConsent === true` no registro | Conforme | UNI, INT | `submission-service.test.ts`, seção 4 |
| CT-09 | Duplo clique | Um único POST e um único protocolo | Conforme | UNI, E2E | S3, `formularios.spec.ts` |
| CT-10 | Rede cai no envio | Aviso no formulário, campos mantidos, reenvio confirma | Conforme (após B-02) | E2E | `formularios.spec.ts` |
| CT-11 | Resposta perdida depois de salvar | Reenvio devolve `duplicate: true` e o mesmo protocolo; um único registro | Conforme (após B-02) | E2E | `formularios.spec.ts`, seção 4 |
| CT-12 | Erro 500 da plataforma | Mesmo aviso, formulário de pé | Conforme (após B-02) | E2E | `formularios.spec.ts` |
| CT-13 | Envio sem JavaScript, nos 3 formulários | Confirmação ou erro, na página recarregada | Conforme (após B-01) | UNI, E2E | `formularios.spec.ts` (S14) |
| CT-14 | Envio antes da hidratação | Resultado na tela, hidratação sem erro | Conforme (após B-01) | E2E | `formularios.spec.ts` |
| CT-15 | Honeypot e envio rápido demais | Sucesso silencioso, nada salvo, `forms.submission.spam_suspected` no log | Conforme, com o risco da seção 6 | UNI, E2E | S6, `submission-service.test.ts`, `formularios.spec.ts` |
| CT-16 | Sexto envio do mesmo IP em 10 min | "Muitas tentativas…", sem gravar | Conforme, com o risco da seção 6 | UNI | S9 |
| CT-17 | Banco indisponível ao gravar | Erro com código de atendimento, nada notificado | Conforme | UNI | S7 |
| CT-18 | Falha na notificação | Visitante vê sucesso; registro `failed`; `forms.notification.failed`; reenvio entrega depois | Conforme | UNI | S8 |
| CT-19 | Falha ao gravar o resultado da notificação | Visitante vê sucesso; `forms.notification.status_update_failed`; reenvio em lote não para | Conforme (após B-03) | UNI | S16 |
| CT-20 | Chamada à Resend | URL, `Authorization`, `Idempotency-Key`, `reply_to`; exceção em 4xx e 5xx | Conforme, só com `fetch` falso | UNI | `notifier.test.ts` |
| CT-21 | Logs sem dados pessoais | Nenhuma linha com e-mail, nome, mensagem ou IP | Conforme | UNI, E2E | `submission-service.test.ts`, seção 4 |
| CT-22 | Aviso de privacidade acessível | Link nos 3 formulários e no rodapé; `/privacidade` responde 200 | Conforme; o texto segue como minuta (SEG-02) | E2E | `formularios.spec.ts` |
| CT-23 | Deploy de Production da Vercel sem armazenamento persistente, mesmo com `NEXT_PUBLIC_SITE_ENV` errado | Erro com código de atendimento, sem confirmação nem protocolo; texto mantido | Conforme (após B-05), em simulação local | UNI, E2E pontual | `deps.test.ts`, `store-policy.test.ts`, seção 4 |
| CT-24 | **Entrega real ao destinatário institucional** | E-mail chega ao responsável correto | **Não executado**: depende de CON-10 e do domínio no Resend | — | J3.3 |

## 4. Execução contra o Postgres local

`tests/e2e/formularios.spec.ts` rodou no desktop contra o Postgres local: **24 de 24 testes passaram**. Depois, o
log do servidor e a tabela `form_submissions` foram conferidos diretamente.

| Conferência | Resultado |
| ----------- | --------- |
| Registros por tipo | `contact` 5, `feedback` 4, `lead` 2: 11 no total, todos com protocolo distinto |
| Notificação | 11 registros `sent`, pelo `LogNotifier`: **nenhum e-mail real** |
| Ciência do aviso | `payload.privacyConsent = true` em 11 de 11 |
| Mesmo conteúdo gravado mais de uma vez, incluindo a resposta perdida (CT-11) | 0 |
| Envio do honeypot gravado | 0 |
| Sem JavaScript ou antes da hidratação | 5 registros sem `source_path`, como esperado; os outros 6 com origem |
| IP | `ip_hash` em 11 de 11; IP em claro: 0 |
| Campos técnicos no `payload` (`website`, `startedAt`, `submissionId`) | 0 |

| Evento no log do servidor | Ocorrências |
| ------------------------- | ----------- |
| `forms.submission.persisted` | 11 |
| `forms.notification.logged` | 11 |
| `forms.notification.sent` | 11 |
| `forms.submission.duplicate` | 1 |
| `forms.submission.spam_suspected` | 1 |
| `app.error.validation_failed` | 3 |

Busca no mesmo log pelo e-mail e pelo nome da pessoa de teste, pelos destinatários fictícios, pela faixa de IP e pelo
texto das mensagens: **0 ocorrências**.

Baterias da mesma data:

| Bateria | Resultado |
| ------- | --------- |
| `npm run verify` (unitários e integrados) | 959 passaram, 78 ignorados (precisam do Supabase local) |
| `npm run test:supabase` | 76 de 76 |
| `npx supabase test db` | 214 asserções em 9 arquivos, todas passaram |
| `formularios.spec.ts`, 3 repetições, desktop e celular, em memória | 144 de 144 |
| `npm run test:e2e` completo, uma repetição, em memória | 215 passaram, 77 ignorados (`@cms`, precisam do Supabase local) |

**Simulação de Production sem armazenamento (CT-23).** O mesmo build, sem `VERCEL_ENV` na construção, com o processo
de `next start` em `VERCEL_ENV=production` e sem Supabase. Com e sem JavaScript, o visitante viu "Serviço
temporariamente indisponível" com código de atendimento, sem "Mensagem enviada!" nem protocolo e com o texto mantido.
O log trouxe 2 `app.error.service_unavailable` com `reason: submission_store_not_configured`, e nenhum
`forms.submission.persisted`. Foi uma simulação local: o site publicado não recebeu nenhum envio.

## 5. Defeitos encontrados

Encontrados nesta frente, corrigidos e retestados no mesmo PR. B-01 e B-02 foram reproduzidos antes da correção, no
navegador. B-03 e B-05 têm testes que falhavam antes.

| # | Defeito | Passos para reproduzir | Severidade | Correção | Reteste |
| - | ------- | ---------------------- | ---------- | -------- | ------- |
| B-01 | Sem JavaScript nada era enviado. Em `/feedback`, "Revise os campos destacados" sem campo destacado, porque os campos técnicos vazios eram recusados. Em `/contato`, "Carregando formulário…" para sempre, sem formulário | Desligar o JavaScript → abrir `/feedback` ou `/contato` | Alta | Vazio vale como ausente; páginas estáticas `/contato/projeto` e `/contato/mensagem` | ✅ E2E |
| B-02 | Falha de rede derrubava a página: `error.tsx` ("Algo deu errado por aqui."), nenhum formulário na tela e texto perdido | Preencher → cortar a rede → enviar | Alta | Envio pelo `onSubmit` com `try/catch` | ✅ E2E |
| B-03 | Falha ao gravar o resultado da notificação chegava ao visitante como erro, com o envio já salvo, e parava o reenvio em lote | `updateNotification` falhar depois do `insert` | Alta | Fica no log, e o envio é confirmado | ✅ UNI |
| B-05 | Deploy de Production da Vercel construído sem as variáveis caía no armazenamento em memória: confirmação e protocolo para o visitante, e o dado perdido com a instância da função (RN-04). Conclusão por leitura de código e pela CSP publicada: **nenhum formulário foi enviado no site publicado** | `VERCEL_ENV=production`, sem Supabase e sem `NEXT_PUBLIC_SITE_ENV` | Alta | `allowsMemoryStore` recusa, com o erro de produção e homologação | ✅ UNI e simulação local |
| B-04 | Sem validação no navegador, ao contrário dos documentos e da issue FORM-04 | Enviar com e-mail inválido e ver o POST | Média | `browser-validation.ts`, com o esquema do servidor | ✅ E2E |

## 6. Pendências e riscos

- **Reexecução:** [QA-05](qa-05-formularios.md), com a mesma contagem contra o Postgres e a rota do job de reenvio.
- **CT-24 (entrega real):** repetir em homologação quando CON-10 e o domínio no Resend estiverem resolvidos (GO-02).
- **Aprovações da agência:** campos (FORM-01), aviso de privacidade (SEG-02) e destinatários (CON-10) seguem
  pendentes. Esta execução usou o que está proposto e não os trata como aprovados.
- **Sucesso falso do antispam e limite por IP na rede da FECAP:** registrados, sem correção, em
  [TECH-07 §8](../formularios/idempotencia-e-falhas.md).
- **Duplo clique sem JavaScript:** a proteção é só a deduplicação por conteúdo, e dois POSTs simultâneos podem gravar
  dois registros ([TECH-07 §7](../formularios/idempotencia-e-falhas.md)).
