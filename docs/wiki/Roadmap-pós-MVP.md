# Roadmap pós-MVP

O MVP cobre site institucional, serviços, cases, formulários e o painel de conteúdo. Tudo abaixo fica
**fora da primeira versão**. Cada item só entra no backlog depois de aprovado como novo requisito
(GOV-12), com estimativa e critérios de entrada.

## Evoluções com especificação

| Item | Proposta | Estimativa | Documento |
| --- | --- | --- | --- |
| FUT-01 — CRM | Pedidos do site viram oportunidades com etapas, responsável, histórico e lembretes | 70–94 h | [evolucao-crm.md](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/roadmap/evolucao-crm.md) |
| FUT-02 — Newsletter | Inscrição com consentimento, opt-in duplo, descadastro em um clique e domínio próprio de envio, sem disparo antes da aprovação | 42–60 h | [newsletter.md](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/roadmap/newsletter.md) |
| FUT-03 — Automações | Catálogo de eventos e gatilhos com governança de dados; campanha só com aprovação humana | 30–45 h | [automacoes-de-comunicacao.md](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/roadmap/automacoes-de-comunicacao.md) |
| FUT-04 — Histórico de versões | Cada gravação guarda uma versão; "Usar esta versão" preenche o formulário | 26–36 h | [historico-de-versoes.md](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/roadmap/historico-de-versoes.md) |
| FUT-06 — Analytics avançado | Indicadores e tratamento de dados definidos antes de implementar, sem cookies; muda o aviso de privacidade e a CSP | 30–46 h | [analytics-avancado.md](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/roadmap/analytics-avancado.md) |
| FUT-07 — Integrações externas | Analytics sem cookies, monitoramento de erros, Search Console, feed e embeds | Por integração | [integracoes-externas.md](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/roadmap/integracoes-externas.md) |
| FUT-08 — Módulos internos | Descoberta com a Benjamin; ferramenta de mercado para o genérico, construção só com dados da plataforma | Descoberta: 4–6 h | [modulos-internos.md](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/roadmap/modulos-internos.md) |

## Evoluções ainda sem especificação

| Item | Tema |
| --- | --- |
| FUT-05 | Fluxo editorial de revisão e aprovação antes de publicar |
| FUT-09 | Filtros, busca e relacionamentos de conteúdo |
| FUT-10 | Novas seções, conteúdos e cases |

## Melhorias técnicas já mapeadas

Achados aceitos na revisão de segurança de 27/10/2026, com issue própria:

- **#313:** envio de mídia direto ao Storage, para voltar a aceitar PDF até 10 MB.
- **#314:** gravação atômica do CMS (item, vínculos e galeria numa transação).
- **#315:** auditoria validada por papel e mensagens do painel por código.

Acompanhe pelo [Project do NúcleoTech](https://github.com/users/NucleoTechFecap/projects/4), com as
labels `pos-mvp` e `roadmap`.
