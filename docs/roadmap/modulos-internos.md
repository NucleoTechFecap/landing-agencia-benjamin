# Módulos internos para a operação da agência (pós-MVP)

| Campo        | Valor                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------- |
| Issue        | FUT-08 (#209)                                                                                |
| Responsável  | Murilo Ribeiro Vasconcellos (`@murilovasconcellos`) · redação: Vinícius Nishimura Reis (`@Vinishireis`) |
| Versão       | 1.0.0 — **roteiro para aprovação (não faz parte do MVP)**                                    |
| Data         | 27/10/2026                                                                                   |
| Origem       | ATA §4.7 ("ferramentas internas poderão ser consideradas como evoluções posteriores"); PRJ §2, §42, §47, §57 |
| Relacionadas | FUT-01 (CRM), FUT-02/FUT-03 (newsletter e automações), FUT-05 (workflow editorial), FUT-06 (analytics), FUT-07 (integrações) |

## 1. Objetivo e limite

Descobrir quais ferramentas de gestão interna a Benjamin precisa e decidir, para cada uma, se ela
vale ser construída na plataforma, sem tornar o site institucional mais pesado, mais lento ou mais
arriscado. O resultado esperado é um **roteiro aprovado e independente do MVP**, não um módulo
pronto.

## 2. O que as fontes dizem e o que não dizem

- A ata e o plano citam "ferramentas internas", "funcionalidades internas da agência" e "gestão
  interna" só como evolução posterior (ATA §4.7; PRJ §42, §57), e pedem que a plataforma possa
  "evoluir para incorporar novas ferramentas de comunicação e gestão" (PRJ §2).
- **Nenhuma fonte diz qual é a necessidade.** Não há registro do que a Benjamin usa hoje, de qual
  processo dói, nem de quantas pessoas usariam. Um módulo especificado agora seria palpite.
- O plano exige classificar qualquer pedido novo antes de entrar no projeto (PRJ §47): correção,
  requisito previsto, melhoria, novo requisito ou funcionalidade futura (GOV-12).

Por isso este roteiro começa por **descoberta** (seção 4) e trata os módulos da seção 3 como
hipóteses a confirmar.

## 3. Hipóteses de módulo

Cada hipótese tem uma recomendação inicial de **usar ferramenta de mercado** ou **construir na
plataforma**. O critério: construir só quando o módulo depende de dados que já estão na plataforma
(leads, cases, conteúdo) e uma ferramenta pronta obrigaria a copiar esses dados à mão.

| # | Hipótese | Problema que resolveria | Já coberto por | Recomendação inicial |
| - | -------- | ----------------------- | -------------- | -------------------- |
| M1 | Funil comercial | Acompanhar pedidos do site até virar projeto | **FUT-01** (especificado) | Seguir a FUT-01; não duplicar aqui |
| M2 | Demandas e projetos de clientes | Briefing, tarefas, prazos e entregas por cliente | — | **Mercado** (Trello, Notion, ClickUp ou GitHub Projects, com plano gratuito). Construir só se o case precisar nascer do projeto concluído (M1 → M2 → case) |
| M3 | Calendário editorial | Pautas e posts das redes, quem produz, quando sai | — | **Mercado** (Notion, Google Sheets ou o planejador do Meta Business Suite) |
| M4 | Clipping de imprensa | Registro de releases e matérias conquistadas | Links com veículo e data nos cases (CASE-10) | **Plataforma**, se a Benjamin quiser uma página pública de imprensa: vira uma entidade do CMS com o mesmo fluxo de publicação |
| M5 | Equipe e alocação | Integrantes, área de cada um, disponibilidade, entrada e saída | — | **Mercado** ou planilha. Construir traria dados pessoais de estudantes para a plataforma, com retenção e LGPD próprias, sem ganho para o site |
| M6 | Acervo de marca e documentos | Brandbook, modelos, contratos | Pacote de marca versionado para o site (CON-01) | **Mercado** (Google Drive institucional) |
| M7 | Indicadores da agência | Leads por origem, cases publicados, tempo de resposta | Painel da FUT-01 e analytics da FUT-06 | Seguir FUT-01 e FUT-06; não duplicar aqui |

**Fora deste roteiro:** revisão e aprovação de conteúdo antes de publicar (é a FUT-05), newsletter e
automações (FUT-02/FUT-03) e integrações com serviços de terceiros (FUT-07).

## 4. Descoberta com a Benjamin

Uma reunião de 1 hora com quem coordena a agência, precedida deste questionário:

1. Quais ferramentas a agência usa hoje para organizar o trabalho (planilhas, Trello, Notion,
   WhatsApp, Drive…)? Quem paga e quem administra cada uma?
2. Quais tarefas tomam mais tempo ou se perdem com frequência? Dê um exemplo recente.
3. Quantas pessoas usariam uma ferramenta interna, e a equipe muda a cada semestre?
4. Como um pedido de cliente vira projeto hoje, e como o projeto vira case no site?
5. Existe calendário de conteúdo das redes? Quem aprova os posts?
6. A agência registra clippings e matérias? Quer exibi-los no site?
7. Que informação de integrantes a agência guarda, e onde?
8. O que **não** pode ficar fora da agência (dados de clientes, contratos) e o que pode ficar numa
   ferramenta de terceiros?
9. Se pudesse ter uma única ferramenta nova em 2027, qual seria?

**Saída:** cada hipótese confirmada, descartada ou nova, com valor (alto, médio ou baixo),
frequência de uso e quem usa. A priorização pondera valor × esforço; o esforço de construir vem da
seção 6.

## 5. Princípios para o que for construído

Se algum módulo passar pela descoberta como "construir", ele segue estas regras para não pesar no
site institucional:

| Regra | Como garantir |
| ----- | ------------- |
| Nenhuma rota pública nova | O módulo vive em `app/admin/(painel)/…`, atrás do login e do RBAC (TECH-03) |
| Nenhum JavaScript a mais no site | Componentes só nas rotas do painel; o Lighthouse mobile do site (≥ 90, QA-07) é conferido no PR |
| Dados separados do conteúdo público | Tabelas próprias, sem política de leitura para `anon`; o site e a API pública não leem essas tabelas |
| Domínio isolado | Pasta própria em `lib/domain/<modulo>` e `lib/server/<modulo>`, sem importar do site (limites do [ADR-0003](../adr/0003-limites-de-dominio.md)) |
| Pode ser desligado | Chave de configuração por ambiente; com o módulo desligado, o build e os testes do site não mudam |
| Mesmo padrão de segurança | Recursos e ações novos no RBAC, auditoria dos eventos críticos (TECH-10), retenção definida antes de coletar dados pessoais |
| Aprovado antes | Proposta própria aprovada como novo requisito (GOV-12), com estimativa, como a FUT-01 e a FUT-04 |

Um aplicativo separado (outro projeto no mesmo repositório, com subdomínio interno) só se justifica
se o volume de módulos crescer a ponto de o painel misturar CMS com gestão. Não é o caso para uma
ou duas ferramentas.

## 6. Roteiro proposto

| Fase | Quando | O quê | Esforço do NúcleoTech |
| ---- | ------ | ----- | --------------------- |
| 0 — Descoberta | Após o go-live (GO-06), junto do checkpoint com a Benjamin (GOV-08) | Questionário e reunião da seção 4; hipóteses priorizadas | 4–6 h |
| 1 — Ferramentas de mercado | 2–4 semanas após o MVP | Configurar as ferramentas escolhidas para M2, M3, M5 e M6, com contas da Benjamin, e entregar um guia curto de uso | 6–10 h (configuração e guia) |
| 2 — Módulo na plataforma | Só se a fase 0 apontar | Especificação própria por módulo (provável candidato: M4 clipping), depois aprovação e implementação | Estimado na especificação; M4 fica em torno de 12–18 h, por reaproveitar o CMS |

A fase 1 resolve as necessidades genéricas sem código novo. A fase 2 só existe se a agência
precisar de algo que use os dados da plataforma.

## 7. Critérios de aprovação deste roteiro

- [ ] Benjamin responde ao questionário e participa da reunião de descoberta.
- [ ] Hipóteses classificadas (confirmada, descartada ou nova) e registradas nesta página.
- [ ] Coordenação aprova as fases e o esforço (GOV-12), confirmando que nada disto entra no MVP.
- [ ] Para a fase 1: definido quem administra cada ferramenta na Benjamin, para que as contas não
      fiquem com integrantes do NúcleoTech.

## 8. Riscos

| Risco | Mitigação |
| ----- | --------- |
| Construir o que uma ferramenta gratuita já resolve | Recomendação padrão "mercado", e construção só com dependência de dados da plataforma |
| Rotatividade da equipe a cada semestre | Contas institucionais da Benjamin, guia de uso e nada atrelado a e-mail pessoal |
| Dados pessoais de integrantes ou clientes em terceiros | Pergunta 8 da descoberta e revisão de LGPD (SEG-02) antes da fase 1 |
| Painel do CMS ficar confuso com módulos de gestão | Menu separado por seção e as regras da seção 5; aplicativo separado se o número de módulos crescer |
