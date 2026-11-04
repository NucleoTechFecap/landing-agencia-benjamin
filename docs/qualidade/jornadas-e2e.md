# Jornadas críticas e testes de aceitação ponta a ponta

| Campo        | Valor                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| Issue        | TECH-12 (#176)                                                           |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                                 |
| Versão       | 1.2.0                                                                    |
| Data         | 13/10/2026 (J2 com o CMS real em 27/10/2026; formulários em 04/11/2026)  |
| Depende de   | [TECH-05](../negocio/integridade-de-conteudo.md), [TECH-06](../formularios/captacao-e-roteamento.md), [TECH-04](../negocio/maquina-de-estados-publicacao.md) |
| Código       | `tests/e2e/*.spec.ts` (Playwright), `tests/integration/*.test.ts` (Vitest), `playwright.config.ts` |

## 1. Como rodar

```bash
npm run build && npm run test:e2e        # Playwright com o Chrome do sistema (desktop + mobile)
npx supabase start && npx supabase db reset
npm run test:e2e:cms                      # J2 com o CMS real: build contra o Supabase local + specs @cms
                                          # e, depois, em série, @home-global (tira da Home os CTAs e destaques de todos)
E2E_BASE_URL=https://hml-... npm run test:e2e   # contra homologação
npm run test                              # inclui os testes integrados (Vitest)
```

## 2. Matriz E2E

A ligação de todos os testes com os critérios de aceite está na [matriz de testes](matriz-de-testes.md) (QA-01).

Legenda de tipo: **E2E** navegador real · **INT** teste integrado de domínio/serviço · **MAN** roteiro manual em homologação.

### J1 — Navegação → serviço → case → contato (visitante)

| # | Cenário | Pos/Neg | Tipo | Responsável | Situação |
| - | ------- | ------- | ---- | ----------- | -------- |
| J1.1 | Home → Serviços → detalhe → case relacionado → "Quero este serviço" → formulário com serviço pré-selecionado → envio com protocolo | Pos | E2E (desktop e mobile) | Front (Caio) + Formulários | ✅ automatizado |
| J1.2 | Campos inválidos mostram erros e focam o primeiro campo inválido | Neg | E2E | Formulários | ✅ automatizado |
| J1.3 | Case inexistente responde HTTP 404 com página da marca | Neg | E2E | Front | ✅ automatizado |
| J1.3b | Endereço com maiúsculas responde 301 para as minúsculas, mantendo a query (DB-08) | Pos | E2E | Banco (Binda) | ✅ automatizado |
| J1.4 | Filtros do portfólio por categoria/serviço/área/cliente | Pos | MAN (QA-02) | Front (Julia) | ⏳ roteiro |
| J1.5 | Navegação completa por teclado e leitor de tela | Pos | MAN (SEG-07) | QA | ⏳ roteiro |

### J2 — Usuário administrativo → editar → publicar → verificar site

| # | Cenário | Pos/Neg | Tipo | Responsável | Situação |
| - | ------- | ------- | ---- | ----------- | -------- |
| J2.1 | Rascunho → publicar (editor) → visível, sem erros de integridade, tags de cache corretas | Pos | INT | CMS (Murilo) + coordenação | ✅ automatizado |
| J2.2 | Viewer não publica; case incompleto não publica | Neg | INT | Coordenação | ✅ automatizado |
| J2.3 | Arquivar case → some do site e CTA usa fallback | Pos | INT | CMS | ✅ automatizado |
| J2.4 | Painel sem sessão redireciona ao login com `next` | Neg | E2E | Coordenação | ✅ automatizado |
| J2.5 | Login → novo case (slug gerado) → rascunho invisível (404) → completar → publicar → página no ar em ≤ 5 s → editar → página atualizada → arquivar → 404 | Pos | E2E `@cms` (Supabase local) + MAN em homologação | CMS (Murilo) + coordenação | ✅ automatizado (`jornada-editor-cms.spec.ts`) |
| J2.6 | Leitor (`viewer`) vê o CMS sem "Novo case" e `/admin/cases/novo` → "sem permissão" | Neg | E2E `@cms` | Coordenação | ✅ automatizado |
| J2.7 | Menu do painel por papel: página atual marcada, "Em construção" sem link, abrir e fechar no celular por toque e teclado (ADM-04) | Pos/Neg | E2E `@cms` | Coordenação | ✅ automatizado (`painel-menu-e-visao-geral.spec.ts`) |
| J2.8 | Visão geral: fila de revisão, leitor sem edição, editor completa o rascunho e ele sai da fila; visitante e conta pendente não leem (ADM-18) | Pos/Neg | E2E `@cms` + INT | Coordenação | ✅ automatizado (`painel-menu-e-visao-geral.spec.ts`, `cms-visao-geral.test.ts`) |
| J2.9 | Todas as telas de `/admin` em 360, 768 e 1280 px: sem rolagem lateral nem tabela com rolagem própria, alvos de toque, teclado alcança todos os controles com foco visível (ADM-16) | Pos | E2E `@cms` | Coordenação | ✅ automatizado (`painel-responsivo.spec.ts`; tela nova sem verificação faz o teste falhar) |

### J3 — Envio → persistência → notificação → consulta interna

| # | Cenário | Pos/Neg | Tipo | Responsável | Situação |
| - | ------- | ------- | ---- | ----------- | -------- |
| J3.1 | Lead persistido, notificado (e-mail com serviço), consulta só por `admin`, retenção dentro do prazo | Pos | INT | Formulários + coordenação | ✅ automatizado |
| J3.2 | Duplo clique, reenvio, honeypot, falha de banco, falha de e-mail, limite | Neg | INT (S1–S10, S12 a S14 e S16, TECH-07) | Formulários | ✅ automatizado |
| J3.3 | Envio real em homologação chega ao destinatário de teste via Resend | Pos | MAN | Formulários | ⛔ **gap**: Supabase/Resend de homologação (GO-02) e destinatários (CON-10) |
| J3.4 | Visitante envia, `admin` vê na lista, abre o detalhe e muda o status, com `lead.viewed` e `lead.status_changed` na auditoria e sem depender do e-mail | Pos | E2E `@cms` | Formulários | ✅ automatizado (`jornada-leads-cms.spec.ts`) |
| J3.5 | Contato e feedback válidos com protocolo; inválidos com erro no campo e foco, sem POST | Pos/Neg | E2E (`formularios.spec.ts`) | Formulários | ✅ automatizado |
| J3.6 | Envio sem JavaScript e antes da hidratação, nos três formulários | Pos/Neg | E2E | Formulários | ✅ automatizado |
| J3.7 | Rede cai, resposta se perde e erro da plataforma: aviso, campos mantidos, reenvio sem duplicar | Neg | E2E | Formulários | ✅ automatizado |
| J3.8 | Duplo clique gera um único POST e um único protocolo | Neg | E2E | Formulários | ✅ automatizado |
| J3.9 | Aviso de privacidade linkado nos três formulários e no rodapé; sem a ciência nada é enviado | Pos/Neg | E2E + INT | Formulários | ✅ automatizado; texto do aviso pendente (SEG-02) |
| J3.10 | `editor` e `super_admin` recebem "sem permissão"; sem sessão vai ao login; `/api/v1` não tem rota de envios | Neg | E2E `@cms` | Coordenação | ✅ automatizado |
| J3.11 | Conteúdo hostil é só texto, `//evil.com` não vira link, falha de e-mail fica à vista, entrada malformada não expõe erro | Neg | E2E `@cms` | Coordenação | ✅ automatizado |
| J3.12 | `admin` só exclui depois de arquivar, com a trilha gravada | Pos | E2E `@cms` | Coordenação | ✅ automatizado |
| J3.13 | Ao sair, o envio aberto não fica na página, nem escondido | Neg | E2E `@cms` | Coordenação | ✅ automatizado |

Registro da execução: [FORM-10](form-10-entrega-de-contatos.md). Os envios do E2E contam para o limite real de
5 por IP em 10 min, que não é afrouxado: `formularios.spec.ts` dá a cada teste um `x-forwarded-for` próprio. Em
homologação (`E2E_BASE_URL`) a borda da Vercel substitui esse cabeçalho, e a bateria passa do limite: rode por
partes (`-g`), esperando a janela entre elas.

## 3. Gaps registrados

| Gap | Impacto | Issue que resolve | Bloqueia go-live? |
| --- | ------- | ----------------- | ----------------- |
| ~~Telas de edição/publicação do CMS~~ | ~~J2.5 sem E2E real~~ | Resolvido: ADM-06/07/08 + INT-02 (E2E `@cms`) | — |
| J2.5 em homologação | Mesma jornada contra o Supabase de homologação | GO-02 | Sim |
| ~~Consulta de leads no painel~~ | ~~J3.4~~ | Resolvido: FORM-09 (E2E `@cms`) | — |
| J3.4 em homologação | Mesma jornada contra o Supabase de homologação | GO-02 | Sim (CA-23) |
| Ambiente de homologação com Supabase/Resend | J3.3, roteiros MAN | GO-02, ARC-07 | Sim |
| Destinatários institucionais | J3.3 | CON-10 | Sim (CA-15) |

A E2E da J2.5 já encontrou um defeito: a sugestão automática de slug, feita no foco do campo,
se juntava ao texto colado ou digitado (slug salvo como `case-x` + `case-x`). Agora o campo fica
opcional na criação e o servidor gera o endereço a partir do nome/título, único entre os itens.

Quando um teste desta matriz falhar durante a homologação, abrir issue com o prefixo `[BUG]`,
label `agencia-benjamin`, referência ao cenário (ex.: `J1.1`) e evidência (trace do Playwright).

## 4. Responsabilidades

| Papel | Responsabilidade |
| ----- | ---------------- |
| Autor do PR | Rodar `npm run verify` e, se tocar jornada, `npm run test:e2e` |
| Coordenação técnica | Manter esta matriz e revisar PRs críticos (TECH-13) |
| QA (Rafael Morais Rocha) | Roteiros MAN e reexecução pós-correções (QA-11) |
| Donos das frentes | Fechar os gaps da seção 3 |
