# Analytics avançado de desempenho do site (pós-MVP)

| Campo        | Valor                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------- |
| Issue        | FUT-06 (#207)                                                                                |
| Responsável  | Rafael Morais Rocha (sugerido na issue; usuário do GitHub ainda a confirmar, GOV-06)         |
| Revisão      | A confirmar (o `ownership-por-issue.csv` indica Vinícius Nishimura Reis como backup)         |
| Versão       | 1.0.0 — **proposta de novo escopo (não faz parte do MVP)**                                   |
| Data         | 04/11/2026                                                                                   |
| Origem       | NT-ATA-2026-003 e NT-PRJ-2026-001; RN-08 do [mapa de requisitos](../requisitos/mapa-de-requisitos.md); itens I3, I4 e I5 das [integrações externas](integracoes-externas.md) (FUT-07) |
| Base técnica | [Tratamento de dados](../seguranca/tratamento-de-dados-formularios.md) (SEG-01), [ciclo de vida](../seguranca/ciclo-de-vida-dados-pessoais.md) (TECH-08), [logs e erros](../adr/0004-logs-e-tratamento-de-erros.md) (ADR-0004), `next.config.ts`, `proxy.ts`, guias `analytics.md` e `content-security-policy.md` em `node_modules/next/dist/docs/01-app/02-guides/` |

> Esta proposta define indicadores e tratamento de dados **antes** de qualquer implementação. Nenhuma
> ferramenta é ligada sem atualizar o aviso de privacidade. As bases legais são sugestões técnicas: a
> decisão é institucional (SEG-02).

## 1. Objetivo

Responder com dados a quatro perguntas da Benjamin (quais páginas e cases interessam, de onde vêm os
visitantes, quantos viram pedidos, se o site está rápido) sem cookies de rastreamento e sem identificar
pessoas.

## 2. O que o MVP já entrega (ponto de partida)

- **Nenhuma ferramenta de analytics.** `package.json` não tem dependência de analytics, e nenhuma página
  carrega script de medição.
- **O aviso de privacidade promete** (`app/(site)/privacidade/page.tsx`, ainda minuta): "Não usamos
  cookies de publicidade nem rastreamento no site público" e que o IP é usado "apenas em forma cifrada
  (hash) para evitar abuso e envios em massa". Lista como compartilhamento só "hospedagem, banco de dados
  e envio de e-mail".
- **Dados internos que já servem:** `form_submissions` guarda tipo, categoria, página de origem e data;
  a Vercel guarda logs estruturados sem dados pessoais (ADR-0004).
- **Search Console** já está previsto para o go-live (FUT-07 I5), sem exigir código.
- **Não há CSP** na `main`: `next.config.ts` envia outros cabeçalhos de segurança, sem
  `Content-Security-Policy`. A SEG-06 (#100) está em andamento e pode mudar isso (ver seção 5).

## 3. Indicadores propostos

Não há metas: elas só fazem sentido depois de um ciclo de linha de base, e cabem à Benjamin (D3).

| ID | Indicador | Pergunta | Cálculo | Fonte | Dado pessoal? | Fase |
| -- | --------- | -------- | ------- | ----- | -------------- | ---- |
| IND-01 | Visualizações por página | O que as pessoas leem? | Soma por rota no período | Ferramenta sem cookies | Não | 1 |
| IND-02 | Visitantes aproximados | Quantas pessoas vieram? | Estimativa da ferramenta, sem histórico entre dias | Ferramenta sem cookies | Não, se a ferramenta não guardar IP | 1 |
| IND-03 | Origem do tráfego | De onde vêm? | Visitas por site de origem e por direta | Ferramenta sem cookies | Não | 1 |
| IND-04 | Envios por tipo e serviço | O que pedem? | Contagem de `form_submissions` por `kind` e `category` | Banco, consulta agregada | Agregado, a partir de tabela com dados pessoais | 1 |
| IND-05 | Conversão do formulário | Quem chega ao contato envia? | IND-04 de `lead` ÷ visualizações de `/contato` | Banco + ferramenta | Não | 1 |
| IND-06 | Cases e serviços mais vistos | Qual trabalho atrai? | IND-01 em `/cases/*` e `/servicos/*`, só publicados | Ferramenta | Não | 1 |
| IND-07 | Busca orgânica | O site aparece? | Impressões, cliques e posição por página | Search Console | Não | 1 |
| IND-08 | Core Web Vitals | Está rápido para quem usa? | LCP, INP e CLS no percentil 75 por grupo de rota, celular e desktop | `useReportWebVitals` ou ferramenta | Não | 1 |
| IND-09 | Erros por rota | Algo quebrou? | Contagem de `level=error` por `event` e rota | Logs da Vercel (ADR-0004) | Não, com o mascaramento atual | 1 |
| IND-10 | Cliques em CTAs | Qual chamada funciona? | Evento com o id do CTA, sem dado do visitante | Evento próprio | Não | 2 |
| IND-11 | Início × envio do formulário | Onde desistem? | Evento ao primeiro foco ÷ envios, por tipo | Evento próprio | Não, se não levar valor de campo | 2 |
| IND-12 | Filtros usados no portfólio | O que procuram? | Contagem de categoria, serviço e área | Evento próprio | Não; cliente é texto de terceiro e fica de fora | 2 |

Fora desta lista: tempo de resposta a pedidos e taxa de ganho, que dependem da [FUT-01](evolucao-crm.md);
métricas de newsletter, que dependem da decisão D10 da [FUT-02](newsletter.md); e remarketing ou anúncios.

## 4. Tratamento de dados e privacidade

### 4.1 O aviso atual e o que muda

| O aviso diz hoje | Consequência |
| ---------------- | ------------- |
| Não há cookies de publicidade nem **rastreamento** no site público | Qualquer medição precisa de texto novo. Não publicar a ferramenta sob o texto atual, mesmo sem cookies: "rastreamento" é mais amplo que cookie |
| O IP é usado só em hash, para evitar abuso | O HMAC de `form_submissions` **não** pode ser reaproveitado como visitante. A ferramenta não pode guardar IP |
| Compartilhamento só com hospedagem, banco e envio de e-mail | Ferramenta de terceiro é novo operador e entra na lista (SEG-01 §1 e §3) |
| Fornecedores podem processar dados fora do Brasil | Confirmar onde a ferramenta processa e citar no aviso |

GA4 e Meta Pixel seguem **não recomendados** (FUT-07 I4): exigem banner de consentimento, política de
cookies e decisão institucional, e contrariam a promessa atual.

### 4.2 Regras de coleta

| Regra | Como vale |
| ----- | --------- |
| Sem cookies e sem armazenamento local | Nada de identificador persistente nem impressão digital do navegador. Com isso a proposta dispensa banner, sujeito à validação da SEG-02 |
| Sem conteúdo de formulário | Eventos nunca levam valor de campo, protocolo ou `submissionId` |
| Painel fora da medição | `/admin` e rotas de API não carregam script nem geram evento |
| URL limpa | Medir só o caminho e uma lista permitida de parâmetros (`categoria`, `servico`, `area`, `tipo`). `?next=` e outros ficam fora |
| Agregação mínima | Contagens pequenas de IND-04 não mostram mensagem nem identificam quem enviou. Limite mínimo de exibição: D6 |
| Banco | IND-04 lê por consulta agregada no servidor, com RBAC e sem devolver linha. Definir se `viewer` e `editor` veem agregados (D5) |
| Ambientes | Só produção. Prévia e homologação não medem, nem misturam números |
| Base legal sugerida | Legítimo interesse (art. 7º, IX, e art. 10), com o registro de avaliação que a instituição decidir manter |
| Retenção | Conforme a ferramenta e a decisão D4. Agregados por mês podem ficar por mais tempo por não identificarem ninguém |
| Direitos do titular | Sem identificador, não há registro individual a localizar. Explicar isso no aviso |

### 4.3 Texto do aviso

A redação é da instituição (SEG-02, SEG-10) e entra junto da mudança técnica. A proposta só precisa
dizer: o que é medido, que não há cookies nem identificação, qual ferramenta opera os dados e onde.

## 5. Impacto na CSP

Situação em 04/11/2026: sem CSP na `main`, com SEG-06 aberta. **Esta proposta entra depois da SEG-06**,
para não mudar a política duas vezes. O que cada caminho pediria:

| Caminho | `script-src` | `connect-src` | Observação |
| ------- | ------------ | ------------- | ----------- |
| Vercel Web Analytics e Speed Insights | `'self'` em produção, se o script for servido em `/_vercel/...` | `'self'` | A confirmar na documentação vigente da Vercel, junto das regras de hash e retenção |
| Plausible (ou similar) em domínio próprio dela | Domínio da ferramenta | Domínio da ferramenta | Abre a política para um terceiro; pode ser servido por proxy no mesmo domínio |
| `useReportWebVitals` + endpoint próprio | Nada novo | `'self'` | Sem terceiro, mas com endpoint público a proteger: limite, tamanho e validação |
| GA4 / Pixel | Vários domínios | Vários domínios, além de `img-src` | Não recomendado |

Pontos de atenção:

- O guia da CSP deste Next diz que **nonce exige renderização dinâmica**. O site usa Cache Components e
  Partial Prefetching. Se a SEG-06 não usar nonce, script inline de terceiro fica fora: prefira carregamento
  por arquivo do mesmo domínio.
- Hoje `proxy.ts` só atua em `/admin`, `/servicos/:slug` e `/cases/:slug`. CSP ou exclusão de medição não
  pode depender dele nas demais rotas.
- `Referrer-Policy: strict-origin-when-cross-origin` manda só a origem entre sites. IND-03 vê o domínio de
  origem, e não a página, e isso basta.
- Ao adicionar a ferramenta, os testes de cabeçalhos que a SEG-06 trouxer precisam mudar no mesmo PR.

## 6. Proposta técnica (a validar)

| Fase | O que entra | Código |
| ---- | ------------ | ------ |
| 1. Medição básica | IND-01 a IND-09: ferramenta sem cookies (FUT-07 I3, recomendada lá para logo após o MVP), Search Console e relatório agregado | Componente no layout de `(site)`, nunca no de `admin`; `useReportWebVitals` se a ferramenta não cobrir; consulta em `lib/server/analytics/` |
| 2. Eventos | IND-10 a IND-12 | Catálogo fechado de eventos em `lib/domain/analytics/` (nome e propriedades permitidas, com teste), como o da auditoria |
| 3. Painel | Tela `/admin/indicadores` com período e totais | Recurso RBAC novo, `analytics:view`, com `rbac.ts`, seed e matriz no mesmo PR |

Antes de implementar, ler `analytics.md` e a API de `useReportWebVitals` nos documentos instalados do
Next (AGENTS.md), além do efeito no build com `cacheComponents`. Medição precisa ser não bloqueante: falha
da ferramenta não pode afetar a página, e o script não deve piorar os próprios IND-08.

## 7. Estimativa preliminar

| Bloco | Horas |
| ----- | ----- |
| Fase 1: ferramenta, CSP, consulta agregada, testes e aviso | 8–12 |
| Fase 2: catálogo, eventos e testes | 8–12 |
| Fase 3: painel, RBAC, E2E | 12–18 |
| Documentação (SEG-01, variáveis, guia do painel) | 2–4 |
| **Total** | **30–46 h** |

Feita por comparação com a FUT-05 (23–32 h). Não foi medida em código e deve ser revista pela
coordenação. Cada fase pode parar por si: a Fase 1 sozinha já responde às quatro perguntas do objetivo.
Custo de plano da ferramenta não está incluído e depende da D2.

## 8. Critérios de entrada (antes de começar)

- [ ] MVP publicado (GO-06), em domínio definitivo ou com a decisão de medir em `*.vercel.app`.
- [ ] SEG-06 (#100) mesclada, para saber a CSP de partida.
- [ ] Aviso de privacidade validado (SEG-02) e novo texto aprovado para a medição.
- [ ] Benjamin confirma as perguntas, quem acompanha os números e com que frequência (D1).
- [ ] Coordenação aprova o novo escopo e a estimativa (GOV-12, classificação "novo requisito").
- [ ] Ferramenta escolhida, com conta institucional, custo e região conhecidos (D2).
- [ ] Priorização no backlog pós-MVP.

## 9. Critérios de aceite da implementação

- [ ] Nenhum cookie nem item de armazenamento local é criado por medição no site público (E2E).
- [ ] `/admin` não carrega o script nem gera evento (E2E).
- [ ] Prévia e homologação não medem.
- [ ] Parâmetro fora da lista permitida não chega à ferramenta.
- [ ] Evento fora do catálogo, ou com propriedade fora da lista, é recusado (teste de domínio).
- [ ] Falha da ferramenta não muda a página nem gera erro de console para o visitante.
- [ ] A CSP continua restrita, e os testes de cabeçalhos cobrem a ferramenta.
- [ ] O aviso publicado corresponde ao que está ligado, antes de ligar.
- [ ] IND-04 não devolve linha nem dado de titular; papéis sem permissão recebem `FORBIDDEN`.

## 10. Riscos e decisões pendentes

| Risco | Mitigação |
| ----- | --------- |
| Medição ligada contradiz o aviso em vigor | Aviso como critério de entrada e de aceite |
| Fornecedor muda termos ou método sem aviso | Reavaliar na revisão periódica; métricas principais não dependem de um único formato |
| Dado pessoal vaza por URL | Lista permitida de parâmetros e teste negativo |
| Números parecem exatos, mas são estimativas sem cookies | Rotular "aproximado" no painel; comparar tendências, e não valores absolutos |
| CSP precisa abrir para terceiro | Preferir caminho no mesmo domínio (seção 5) |
| Números que ninguém acompanha | Responsável e rotina definidos em D1; se não houver, parar na Fase 1 |

Decisões que dependem da Agência Benjamin, da FECAP e da coordenação:

- **D1.** Quais perguntas importam, quem acompanha e com que frequência?
- **D2.** Qual ferramenta (Vercel Web Analytics, Plausible, própria) e em nome de quem fica a conta?
- **D3.** Quais metas, depois da linha de base?
- **D4.** Por quanto tempo guardar os dados na ferramenta e os agregados?
- **D5.** Quem no painel vê os indicadores? IND-04 deriva de tabela restrita a `admin`.
- **D6.** Qual a contagem mínima para exibir um número (evitar identificar alguém em volume baixo)?
- **D7.** A Fase 2 (eventos) e a Fase 3 (painel) entram, ou os relatórios da ferramenta bastam?

Nada desta proposta é implementado antes da aprovação acima. O MVP segue sem medição e isso não o
bloqueia.
