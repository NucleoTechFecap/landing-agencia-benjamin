# Planejamento de integrações externas (pós-MVP)

| Campo        | Valor                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| Issue        | FUT-07 (#208)                                                            |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                                 |
| Versão       | 1.0.0                                                                    |
| Data         | 13/10/2026                                                               |
| Origem       | ATA §3 (newsletter, automações, domínio de e-mail); PRJ §27, §42, §57    |

> Cada integração é avaliada **separadamente** e só entra no backlog com aprovação de escopo
> (GOV-12). Nenhuma delas bloqueia o MVP.

## 1. Critérios de avaliação

Valor para a Benjamin · esforço · custo recorrente · credenciais e quem é dono da conta ·
impacto em LGPD (dados enviados a terceiros, transferência internacional, cookies) · impacto em
desempenho/SEO · risco de dependência (API instável, mudança de termos).

## 2. Avaliação

| # | Integração | Para quê | Requisitos | Credenciais (dono) | Custo | Riscos | Recomendação |
| - | ---------- | -------- | ---------- | ------------------ | ----- | ------ | ------------ |
| I1 | **Feed do Instagram** (Instagram Graph API) | Mostrar posts recentes na Home | Conta profissional vinculada a Página do Facebook; app Meta aprovado; token de longa duração renovado a cada 60 dias | Meta Business da Benjamin | Gratuito | Tokens expiram; mudanças de API; imagens de terceiros no site | **Fase 2** — com cache diário e fallback para links das redes |
| I2 | **Embed de TikTok/LinkedIn** | Destacar vídeos/posts em cases | Apenas oEmbed/iframe por URL | Nenhuma | Gratuito | Scripts de terceiros (desempenho, cookies) | **Fase 2** — carregar sob clique ("facade") |
| I3 | **Analytics sem cookies** (Vercel Web Analytics ou Plausible) | Páginas mais vistas, origem do tráfego | Habilitar no projeto | Conta NúcleoTech | Vercel: incluído/plano; Plausible: pago | Baixo (sem cookies, sem PII) | **Logo após o MVP** — atende FUT-06 básico sem banner de cookies |
| I4 | Google Analytics 4 / Meta Pixel | Campanhas e remarketing | Banner de consentimento (LGPD), política de cookies | Contas da Benjamin | Gratuito | Alto: cookies de rastreamento, consentimento, transferência internacional | **Não recomendado** sem decisão institucional e CMP |
| I5 | **Google Search Console** | Indexação e desempenho orgânico | Verificação TXT do domínio | Conta da Benjamin (com NúcleoTech como usuário) | Gratuito | Nenhum | **No go-live** (QA-07) |
| I6 | **Newsletter** (Resend Broadcasts, Brevo ou Mailchimp) | Comunicação recorrente (FUT-02) | Domínio verificado, opt-in duplo, descadastro em 1 clique | Conta da Benjamin | Gratuito até limites; pago acima | LGPD (consentimento específico), reputação do domínio | **Fase 3** — junto de FUT-02, com lista própria e consentimento |
| I7 | **CRM de mercado** (HubSpot Free, RD Station) | Alternativa ao CRM próprio (FUT-01) | Webhook do formulário → API do CRM | Conta da Benjamin | HubSpot Free: gratuito; RD: pago | Dados de leads em terceiro; dependência | **Avaliar contra FUT-01** — integração simples via webhook se a Benjamin já usar uma ferramenta |
| I8 | **WhatsApp** (link click-to-chat) | Contato rápido | Número institucional | Benjamin | Gratuito | Número pessoal exposto se não for institucional | **Fase 2** — só com número institucional (CON-10) |
| I9 | Calendário de eventos (Google Calendar embed) | Agenda de eventos da área Eventos e Parcerias | Agenda pública da Benjamin | Benjamin | Gratuito | Iframe de terceiro | **Sob demanda** |
| I10 | Monitoramento de erros (Sentry) e uptime (Better Stack/UptimeRobot) | Detectar falhas antes do usuário | SDK + DSN; ping em `/api/v1/health` | NúcleoTech | Planos gratuitos | Envio de dados de erro (configurar sem PII — ADR-0004) | **Logo após o MVP** |

## 3. Roteiro sugerido

| Fase | Quando | Itens |
| ---- | ------ | ----- |
| Go-live | 04/11/2026 | I5 (Search Console) |
| Fase 1 | 1–2 semanas após o MVP | I3 (analytics sem cookies), I10 (erros/uptime) |
| Fase 2 | Após estabilização | I1, I2, I8 (redes e contato) |
| Fase 3 | Com aprovação de novo escopo | I6 (newsletter), I7 ou FUT-01 (CRM) |
| Em avaliação institucional | — | I4 (rastreamento com cookies) |

## 4. Padrão técnico para qualquer integração

1. Credenciais em variáveis de ambiente por estágio (ARC-05), conta em nome da instituição.
2. Chamadas no servidor com timeout, `logger` sem PII e fallback visual quando o serviço falhar.
3. Dados de terceiros cacheados (`'use cache'` + tag própria) para não afetar desempenho.
4. Scripts de terceiros só sob interação (facade) ou com consentimento quando usam cookies.
5. Atualizar o aviso de privacidade e o mapa de dados (SEG-01) antes de ativar.
