# Critérios de aceite da primeira entrega (MVP — 04/11/2026)

| Campo        | Valor                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| Issue        | GOV-13 (#13)                                                             |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                                 |
| Versão       | 1.0.0                                                                    |
| Data         | 13/10/2026                                                               |
| Fontes       | PRJ §41 (escopo do MVP), PRJ §44 (validação), PRJ §45 (critérios gerais); [mapa de requisitos](../requisitos/mapa-de-requisitos.md) |
| Uso          | Base da matriz de testes (QA-01), da homologação (QA-08/09) e do go/no-go (TECH-14) |

## 1. Como usar

- Cada critério tem **ID**, **verificação** (como provar) e **evidência** esperada.
- **Aprovação técnica** (NúcleoTech): todos os critérios `T` atendidos → TECH-14 assina o go/no-go.
- **Aprovação institucional** (Agência Benjamin): critérios `I` validados por Melissa Namie e
  Renan Hida na homologação (QA-09) → GO-07 registra o aceite.
- Critério **condicionado** só é exigido se o insumo da Benjamin tiver sido entregue (PRJ §45).

## 2. Navegação e páginas públicas

| ID | Critério | Tipo | Verificação | Evidência |
| -- | -------- | ---- | ----------- | --------- |
| CA-01 | Home com manifesto, apresentação, áreas, serviços e cases em destaque e CTAs para Serviços, Cases, Sobre e Contato | T + I | Navegação manual em homologação | Prints mobile/desktop |
| CA-02 | Página Sobre (agência experimental, proposta, modelo de atuação, relação com a FECAP) | T + I | Revisão de conteúdo | Aceite do texto (CON-03) |
| CA-03 | Seis áreas de atuação com descrição e serviços relacionados | T + I | `/areas` | Print + aceite (CON-04) |
| CA-04 | Menu, rodapé, breadcrumbs e links internos sem 404; rota inexistente retorna HTTP 404 | T | Teste de links (INT-06) + `curl -I` | Relatório de links |
| CA-05 | Redes sociais oficiais (Instagram, TikTok, LinkedIn) corretas, abrindo em nova aba | T + I | Clique em cada link | Print |
| CA-06 | Responsivo em 360, 768, 1280 e 1920 px, sem rolagem horizontal | T | QA-03 | Prints por largura |
| CA-07 | Acessibilidade: navegação por teclado, foco visível, rótulos, contraste AA, `alt` | T | Lighthouse ≥ 95 + teste de teclado (SEG-07) | Relatório Lighthouse |
| CA-08 | SEO básico: título/descrição por página, canonical, Open Graph, sitemap, robots, JSON-LD | T | Rich Results Test + `sitemap.xml` (QA-07) | Relatórios |

## 3. Serviços

| ID | Critério | Tipo | Verificação | Evidência |
| -- | -------- | ---- | ----------- | --------- |
| CA-09 | Os 9 serviços oficiais cadastrados e publicados com descrição final | T + I | `/servicos` e CMS (INT-04) | Aceite dos textos (CON-05) |
| CA-10 | Detalhe de serviço com CTA que abre o formulário com o serviço pré-selecionado | T | Fluxo manual | Print |

## 4. Cases (condicionados ao material)

| ID | Critério | Tipo | Verificação | Evidência |
| -- | -------- | ---- | ----------- | --------- |
| CA-11 | Cases cujo material foi entregue (Aventura de Construir, Meridiano, FECAP) publicados com campos de CASE-11 | T + I · **condicionado** | `/cases` | Aceite por case (CON-06…08) |
| CA-12 | Filtros por categoria, serviço, área e cliente funcionando | T | QA-02 | Print/registro |
| CA-13 | Nenhum case sem material validado aparece como publicado | T | Revisão no CMS | Lista de cases publicados |

## 5. Formulários e contatos

| ID | Critério | Tipo | Verificação | Evidência |
| -- | -------- | ---- | ----------- | --------- |
| CA-14 | Formulários de novo projeto, contato e feedback validam campos e confirmam com protocolo | T | QA-05 (positivos e negativos) | Registro de testes |
| CA-15 | Envio chega ao destinatário institucional definido pela Benjamin | T + I | Teste em produção (GO-05/FORM-10) | E-mail recebido pelos destinatários (CON-10) |
| CA-16 | Envio duplicado não gera dois registros; falha de e-mail não perde o lead | T | Cenários S1–S12 (TECH-07) | Saída dos testes |
| CA-17 | Aviso de privacidade validado e linkado em todos os formulários | T + I | SEG-02/SEG-10 | Texto aprovado |

## 6. Painel administrativo (CMS)

| ID | Critério | Tipo | Verificação | Evidência |
| -- | -------- | ---- | ----------- | --------- |
| CA-18 | Login, sessão, renovação e logout funcionando; sem cadastro público | T | Roteiro de ADM-02 | Prints/registro |
| CA-19 | Permissões por papel aplicadas no servidor e no banco (casos N01–N13) | T | QA-06 | Relatório de acesso indevido |
| CA-20 | Equipe da Benjamin edita textos institucionais, serviços, cases, mídia, contato e redes sem ajuda do NúcleoTech | I | Homologação guiada (QA-09) | Aceite da Benjamin |
| CA-21 | Rascunho nunca aparece no site; publicação reflete no site em até 5 s | T | Testes de TECH-09 | Registro |
| CA-22 | Upload de imagem com validação e uso em case/serviço | T | Roteiro de ARC-10 | Print |
| CA-23 | Leads e feedbacks visíveis apenas para `admin`; acessos auditados | T | QA-06 + `audit_log` | Consulta à trilha |

## 7. Produção

| ID | Critério | Tipo | Verificação | Evidência |
| -- | -------- | ---- | ----------- | --------- |
| CA-24 | Produção isolada da homologação (projetos e chaves separados) | T | Matriz de ambientes (ARC-06) e GO-02 | Checklist assinado |
| CA-25 | Domínio oficial com HTTPS válido | T · **condicionado ao domínio** (CON-11) | `curl -I https://…` + SSL Labs | Relatório |
| CA-26 | Backup do banco e da mídia configurado e restauração testada | T | DB-10 | Registro do teste |
| CA-27 | Checklist de release e plano de rollback executáveis | T | GO-01 | Documento aprovado |
| CA-28 | `npm run verify` verde no commit publicado e sem conteúdo provisório (`check:release-content`) | T | Pipeline/execução local | Saída dos comandos |
| CA-29 | Smoke test pós-publicação sem falhas (páginas, formulários, painel, API `/api/v1/health`) | T | QA-11 | Registro |

## 8. Fora dos critérios do MVP

CRM, newsletter, automações, analytics avançado, histórico de versões (ADR-0007), workflow de
aprovação editorial e integrações externas (FUT-01…FUT-10). Pedidos nessas linhas seguem o controle
de escopo (GOV-12).

## 9. Assinaturas

| Aprovação | Responsável | Data | Situação |
| --------- | ----------- | ---- | -------- |
| Técnica (go/no-go) | Vinícius Nishimura Reis (revisão: Flávio Santos) | — | Pendente (TECH-14) |
| Institucional | Melissa Namie / Renan Hida | — | Pendente (GO-07) |
