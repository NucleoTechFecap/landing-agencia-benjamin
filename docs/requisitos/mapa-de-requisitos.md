# Mapa de Requisitos Funcionais e Não Funcionais

| Campo        | Valor                                                                 |
| ------------ | --------------------------------------------------------------------- |
| Documento    | AB-REQ-001                                                            |
| Issue        | GOV-02 (#2)                                                           |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                              |
| Versão       | 1.0.0                                                                 |
| Data         | 13/10/2026                                                            |
| Fontes       | NT-ATA-2026-003 (ata de 29/09/2026); NT-PRJ-2026-001 (relatório de 05/10/2026) |
| Status       | Consolidado — sujeito a validação de escopo (GOV-03) e de publicação (GOV-11) |

## 1. Objetivo

Converter o que foi registrado na ata de alinhamento e no relatório de projeto em requisitos
**rastreáveis** (cada item tem ID, origem e critério verificável) para que backlog, testes
(QA-01) e critérios de aceite (GOV-13) falem a mesma língua.

## 2. Convenções

- **RF-xx** — requisito funcional · **RNF-xx** — requisito não funcional · **RN-xx** — regra de negócio.
- **Escopo:** `MVP` (entrega de 04/11/2026) ou `Pós-MVP` (não bloqueia a primeira entrega).
- **Prioridade:** `Must` (bloqueia o MVP), `Should` (esperado no MVP, pode ser negociado), `Could` (desejável).
- **Origem:** `ATA §n` = NT-ATA-2026-003, seção n · `PRJ §n` = NT-PRJ-2026-001, seção n.
- **Critério verificável:** condição objetiva usada em teste/homologação.
- Conteúdo textual citado nos documentos é **provisório** (PRJ §40) — os requisitos tratam de
  estrutura e comportamento, não do texto final.

## 3. Requisitos funcionais — área pública

| ID    | Requisito | Escopo | Prior. | Origem | Critério verificável | Backlog |
| ----- | --------- | ------ | ------ | ------ | -------------------- | ------- |
| RF-01 | Home com manifesto de marca em destaque | MVP | Must | ATA §4.3; PRJ §7.1 | Primeira dobra exibe manifesto administrável; sem manifesto publicado, exibe fallback sem quebrar layout | HOME-01 |
| RF-02 | Home com apresentação inicial (quem é, proposta, como atua, soluções) | MVP | Must | PRJ §7.2 | Bloco com os 4 tópicos visível na Home | HOME-02 |
| RF-03 | Home com CTAs para Serviços, Cases, Sobre e Contato | MVP | Must | PRJ §7.3 | 4 CTAs presentes e navegáveis sem erro 404 | HOME-05 |
| RF-04 | Home com serviços e cases em destaque | MVP | Should | PRJ §7, §10, §11 | Seções listam apenas itens publicados e marcados como destaque | HOME-03, HOME-04 |
| RF-05 | Página Sobre: agência experimental, proposta de valor, modelo de atuação e relação com a FECAP | MVP | Must | ATA §4.3; PRJ §8.1 | Página `/sobre` apresenta os 4 tópicos | SOB-01, SOB-02 |
| RF-06 | Seção "Nosso time" opcional | MVP | Could | PRJ §8.2 | Bloco pode ser ocultado pelo CMS sem deixar espaço vazio | SOB-03 |
| RF-07 | Seis áreas de atuação (Eventos e Parcerias, Social Media, Comunicação Interna, Copywriting, Criação, Assessoria de Imprensa) | MVP | Must | PRJ §9 | Listagem com 6 áreas, cada uma com descrição; ordem controlada | SOB-04…SOB-10 |
| RF-08 | Listagem de serviços (9 serviços iniciais) | MVP | Must | ATA §4.3; PRJ §10 | `/servicos` lista os serviços publicados com nome, descrição curta e CTA | SERV-01, SERV-03…SERV-11 |
| RF-09 | Detalhe de serviço com descrição, visual, exemplos, CTA e cases relacionados | MVP | Should | PRJ §10 | `/servicos/[slug]` exibe campos preenchidos e omite os vazios; CTA leva ao formulário com o serviço pré-selecionado | SERV-02, SERV-12 |
| RF-10 | Portfólio de cases e conteúdos com filtros por cliente, categoria, serviço, área ou tipo de entrega | MVP | Must | ATA §4.3; PRJ §11 | `/cases` lista cases publicados; filtros combinam sem recarregar dados inválidos | CASE-01, CASE-03 |
| RF-11 | Detalhe do case (título, cliente, categoria, serviço, desafio, solução, resultados, galeria, links, data, equipe) | MVP | Must | PRJ §13 | `/cases/[slug]` renderiza apenas campos preenchidos; case não publicado retorna 404 | CASE-02, CASE-04, CASE-11 |
| RF-12 | Categorias de trabalhos: Copywriting, Social Media & Criação, Assessoria de Imprensa | MVP | Should | PRJ §12 | Filtro por categoria retorna os itens corretos | CASE-08…CASE-10 |
| RF-13 | Cases iniciais: Aventura de Construir, Meridiano, FECAP (condicionados ao envio de material) | MVP | Should | PRJ §11; PRJ §45 | Case só é publicado após material validado (CON-06…CON-08) | CASE-05…CASE-07 |
| RF-14 | Contato institucional | MVP | Must | ATA §4.3; PRJ §15 | Formulário de contato envia e confirma recebimento | FORM-02, FORM-04 |
| RF-15 | Formulário de prospecção de novos clientes e projetos | MVP | Must | PRJ §15 | Campos validados com a Benjamin (FORM-01); envio persistido e notificado | FORM-03 |
| RF-16 | Canal de feedback para clientes, parceiros, alunos e comunidade | MVP | Must | ATA §4.3; PRJ §14 | Feedback registrado separado de leads, com perfil do remetente | FORM-05 |
| RF-17 | Links oficiais para Instagram, TikTok e LinkedIn | MVP | Must | PRJ §16 | Links presentes no header/footer, abrem em nova aba com `rel="noopener"` | LAY-03, CON-12 |
| RF-18 | Página 404 consistente com a identidade | MVP | Should | Boas práticas; LAY-09 | Rota inexistente retorna HTTP 404 com navegação de retorno | LAY-09 |
| RF-19 | Aviso/política de privacidade acessível a partir dos formulários | MVP | Must | PRJ §32 | Link presente em todos os formulários e no footer | SEG-02, SEG-10 |

## 4. Requisitos funcionais — área administrativa (CMS)

| ID    | Requisito | Escopo | Prior. | Origem | Critério verificável | Backlog |
| ----- | --------- | ------ | ------ | ------ | -------------------- | ------- |
| RF-20 | Autenticação da equipe autorizada | MVP | Must | ATA §4.3; PRJ §25, §41 | Login, sessão, renovação e logout funcionando; sem cadastro público | ADM-02 |
| RF-21 | Perfis e permissões por papel | MVP | Must | PRJ §25 | Matriz papel × recurso × ação aplicada no servidor (negar por padrão) | ADM-01, TECH-03, ADM-03 |
| RF-22 | Gestão de textos e blocos institucionais (Home, Sobre, páginas) | MVP | Must | ATA §3; PRJ §22 | Edição salva rascunho e publica sem deploy | ADM-05 |
| RF-23 | CRUD de serviços | MVP | Must | PRJ §22, §41 | Criar/editar/publicar/arquivar serviço reflete no site | ADM-06 |
| RF-24 | CRUD de áreas de atuação | MVP | Should | PRJ §9, §22 | Ordem e textos das 6 áreas editáveis | ADM-07 |
| RF-25 | CRUD de cases e categorias | MVP | Must | PRJ §13, §41 | Case com campos do PRJ §13 e status de publicação | ADM-08, CASE-11 |
| RF-26 | Biblioteca de mídia (upload, uso e substituição de imagens) | MVP | Must | ATA §3; PRJ §41 | Upload valida formato/tamanho e gera URL pública otimizada | ADM-09, ARC-10 |
| RF-27 | Edição de contato, links e redes sociais | MVP | Must | PRJ §22, §41 | Alteração refletida em header/footer/contato | ADM-10 |
| RF-28 | Edição de CTAs e destaques da Home | MVP | Should | PRJ §22 | CTA editável com validação de link interno/externo | ADM-11 |
| RF-29 | Fluxo mínimo de publicação (rascunho → publicado → arquivado) | MVP | Must | ATA §5; PRJ §23 | Site público nunca exibe rascunho | ADM-12, ADM-13, TECH-04 |
| RF-30 | Pré-visualização antes de publicar | MVP | Should | PRJ §23 | Pré-visualização restrita a usuários autenticados | ADM-14 |
| RF-31 | Consulta interna de leads e feedbacks | MVP | Must | PRJ §14, §15 | Apenas papéis autorizados listam registros; acesso auditado | FORM-09, TECH-08 |
| RF-32 | Histórico de versões e restauração | Pós-MVP* | Could | ATA §4.6; PRJ §24 | *Decisão registrada em ADM-17 | ADM-17, FUT-04 |
| RF-33 | Fontes e elementos visuais configuráveis | Pós-MVP* | Could | ATA §3 | *Somente a partir de lista fechada do design system | ADM-05 |

## 5. Regras de negócio

| ID    | Regra | Origem | Onde é garantida |
| ----- | ----- | ------ | ---------------- |
| RN-01 | Conteúdo em rascunho ou arquivado nunca é retornado por rotas/APIs públicas | PRJ §23 | Repositório de conteúdo + RLS (TECH-04) |
| RN-02 | Leads (pedido comercial), contatos gerais e feedbacks são registros distintos | PRJ §14, §15 | Esquemas de formulário (TECH-06) |
| RN-03 | Destinatário das notificações é configuração, nunca e-mail fixo no código | PRJ §15; ATA §5 | Variáveis de ambiente/CMS (TECH-06) |
| RN-04 | Nenhum lead válido pode ser perdido silenciosamente: persistência precede notificação | PRJ §45 | Serviço de submissão (TECH-07) |
| RN-05 | Exclusão/arquivamento de serviço ou case não deixa links quebrados | PRJ §11 | Regras de integridade (TECH-05) |
| RN-06 | Cases só são publicados com material validado pela Benjamin | PRJ §45, §46 | Fluxo editorial (CON-06…08) |
| RN-07 | Domínio oficial é responsabilidade da Agência Benjamin | ATA §4.9; PRJ §33 | GO-03 depende de CON-11 |
| RN-08 | CRM, newsletter, automações e analytics avançado não bloqueiam o MVP | ATA §4.7; PRJ §42 | Controle de escopo (GOV-12) |

## 6. Requisitos não funcionais

| ID     | Categoria | Requisito | Prior. | Origem | Critério verificável |
| ------ | --------- | --------- | ------ | ------ | -------------------- |
| RNF-01 | Responsividade | Funcionar em smartphones, tablets, notebooks e desktops sem app separado | Must | PRJ §20 | Sem rolagem horizontal em 360, 768, 1280 e 1920 px (QA-03) |
| RNF-02 | Identidade | Seguir brandbook (paleta, Aptly/Poppins, logo, zona de exclusão, tamanho mínimo 70 px) | Must | PRJ §18 | Revisão QA-12 sem desvios bloqueantes |
| RNF-03 | Acessibilidade | WCAG 2.2 nível AA nos fluxos principais | Must | PRJ §19 | Contraste ≥ 4,5:1, navegação por teclado, rótulos em formulários (SEG-07) |
| RNF-04 | Desempenho | Core Web Vitals "bons" em mobile | Should | PRJ §19 | LCP ≤ 2,5 s, CLS ≤ 0,1, INP ≤ 200 ms em homologação (SEG-08) |
| RNF-05 | SEO | Metadados por página, Open Graph, sitemap, robots, dados estruturados e `llms.txt` | Should | PRJ §17, §19 | Validador de rich results sem erros; sitemap lista só conteúdo publicado (SEG-09) |
| RNF-06 | Segurança | Autenticação segura, proteção de rotas, validação no servidor, credenciais fora do Git | Must | PRJ §31 | Testes de acesso indevido sem falhas (QA-06) |
| RNF-07 | Privacidade/LGPD | Finalidade, minimização, retenção e acesso restrito a dados pessoais | Must | PRJ §32 | Matriz de dados aprovada (SEG-01) e aviso publicado (SEG-02) |
| RNF-08 | Observabilidade | Erros rastreáveis sem expor PII ou segredos nos logs | Should | PRJ §31 | Logs estruturados com `requestId` e campos sensíveis mascarados (ARC-09) |
| RNF-09 | Disponibilidade | Ambientes separados de desenvolvimento, homologação e produção | Must | PRJ §34 | Matriz de ambientes aprovada (ARC-06) |
| RNF-10 | Manutenibilidade | Código tipado, documentado e com convenções de contribuição | Must | PRJ §29, §48 | `npm run verify` passa; README/CONTRIBUTING atualizados |
| RNF-11 | Autonomia | Alterações rotineiras de conteúdo sem deploy e sem intervenção do NúcleoTech | Must | ATA §4.4; PRJ §21 | Publicação no CMS reflete no site em até 60 s (TECH-09) |
| RNF-12 | Recuperabilidade | Backup e recuperação de banco e mídia | Should | PRJ §30 | Restauração testada antes do go-live (DB-10) |
| RNF-13 | Evolutividade | Base preparada para CRM, newsletter e integrações futuras | Could | PRJ §26, §27, §57 | Domínios isolados (TECH-01); leads com status extensível |

## 7. Matriz de cobertura

| Frente | Requisitos | Situação no mapa |
| ------ | ---------- | ---------------- |
| Áreas públicas | RF-01 … RF-19 | Mapeadas |
| CMS | RF-20 … RF-33 | Mapeadas (RF-32/33 classificados como Pós-MVP até decisão) |
| Formulários | RF-14 … RF-16, RF-31, RN-02 … RN-04 | Mapeadas — campos dependem de FORM-01 |
| Responsividade | RNF-01 | Mapeada |
| Segurança e LGPD | RF-20, RF-21, RNF-06, RNF-07, RNF-08 | Mapeadas — base legal depende de validação institucional |
| Publicação/infra | RNF-09, RNF-11, RNF-12, RN-07 | Mapeadas |

## 8. Pendências que afetam requisitos

| Pendência | Dono | Requisitos afetados |
| --------- | ---- | ------------------- |
| Textos finais (manifesto, Sobre, serviços, CTAs) | Agência Benjamin (CON-02…CON-05) | RF-01, RF-02, RF-05, RF-08 |
| Materiais dos cases | Agência Benjamin (CON-06…CON-08) | RF-13 |
| Destinatário institucional dos formulários | Agência Benjamin (CON-10) | RF-14…RF-16, RN-03 |
| Domínio oficial | Agência Benjamin (CON-11) | RN-07, GO-03 |
| Quantidade de usuários e perfis | Agência Benjamin + NúcleoTech (ADM-01) | RF-20, RF-21 |
| Política de privacidade e retenção | Responsáveis institucionais (SEG-02) | RF-19, RNF-07 |

## 9. Controle de mudanças

Qualquer requisito novo segue o fluxo de GOV-12 (classificação: correção, requisito previsto,
melhoria, novo requisito ou funcionalidade futura — PRJ §47) e só entra neste mapa com nova versão
do documento.

| Versão | Data       | Autor                   | Descrição |
| ------ | ---------- | ----------------------- | --------- |
| 1.0.0  | 13/10/2026 | Vinícius Nishimura Reis | Consolidação inicial a partir da ata e do relatório. |
