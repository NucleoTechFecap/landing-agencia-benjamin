# Jornadas críticas e testes de aceitação ponta a ponta

| Campo        | Valor                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| Issue        | TECH-12 (#176)                                                           |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                                 |
| Versão       | 1.0.0                                                                    |
| Data         | 13/10/2026                                                               |
| Depende de   | [TECH-05](../negocio/integridade-de-conteudo.md), [TECH-06](../formularios/captacao-e-roteamento.md), [TECH-04](../negocio/maquina-de-estados-publicacao.md) |
| Código       | `tests/e2e/*.spec.ts` (Playwright), `tests/integration/*.test.ts` (Vitest), `playwright.config.ts` |

## 1. Como rodar

```bash
npm run build && npm run test:e2e        # Playwright com o Chrome do sistema (desktop + mobile)
E2E_BASE_URL=https://hml-... npm run test:e2e   # contra homologação
npm run test                              # inclui os testes integrados (Vitest)
```

## 2. Matriz E2E

Legenda de tipo: **E2E** navegador real · **INT** teste integrado de domínio/serviço · **MAN** roteiro manual em homologação.

### J1 — Navegação → serviço → case → contato (visitante)

| # | Cenário | Pos/Neg | Tipo | Responsável | Situação |
| - | ------- | ------- | ---- | ----------- | -------- |
| J1.1 | Home → Serviços → detalhe → case relacionado → "Quero este serviço" → formulário com serviço pré-selecionado → envio com protocolo | Pos | E2E (desktop e mobile) | Front (Caio) + Formulários | ✅ automatizado |
| J1.2 | Campos inválidos mostram erros e focam o primeiro campo inválido | Neg | E2E | Formulários | ✅ automatizado |
| J1.3 | Case inexistente responde HTTP 404 com página da marca | Neg | E2E | Front | ✅ automatizado |
| J1.4 | Filtros do portfólio por categoria/serviço/área/cliente | Pos | MAN (QA-02) | Front (Julia) | ⏳ roteiro |
| J1.5 | Navegação completa por teclado e leitor de tela | Pos | MAN (SEG-07) | QA | ⏳ roteiro |

### J2 — Usuário administrativo → editar → publicar → verificar site

| # | Cenário | Pos/Neg | Tipo | Responsável | Situação |
| - | ------- | ------- | ---- | ----------- | -------- |
| J2.1 | Rascunho → publicar (editor) → visível, sem erros de integridade, tags de cache corretas | Pos | INT | CMS (Murilo) + coordenação | ✅ automatizado |
| J2.2 | Viewer não publica; case incompleto não publica | Neg | INT | Coordenação | ✅ automatizado |
| J2.3 | Arquivar case → some do site e CTA usa fallback | Pos | INT | CMS | ✅ automatizado |
| J2.4 | Painel sem sessão redireciona ao login com `next` | Neg | E2E | Coordenação | ✅ automatizado |
| J2.5 | Login → editar case no CMS → publicar → página atualizada em ≤ 5 s | Pos | E2E/MAN em homologação | CMS | ⛔ **gap**: telas do CMS ainda não existem (ADM-08, ADM-13) |

### J3 — Envio → persistência → notificação → consulta interna

| # | Cenário | Pos/Neg | Tipo | Responsável | Situação |
| - | ------- | ------- | ---- | ----------- | -------- |
| J3.1 | Lead persistido, notificado (e-mail com serviço), consulta só por `admin`, retenção dentro do prazo | Pos | INT | Formulários + coordenação | ✅ automatizado |
| J3.2 | Duplo clique, reenvio, honeypot, falha de banco, falha de e-mail, limite | Neg | INT (S1–S10, TECH-07) | Formulários | ✅ automatizado |
| J3.3 | Envio real em homologação chega ao destinatário de teste via Resend | Pos | MAN | Formulários | ⛔ **gap**: Supabase/Resend de homologação (GO-02) e destinatários (CON-10) |
| J3.4 | `admin` abre o lead no painel e gera `lead.viewed` na auditoria | Pos | E2E/MAN | Formulários | ⛔ **gap**: tela de leads (FORM-09) |

## 3. Gaps registrados

| Gap | Impacto | Issue que resolve | Bloqueia go-live? |
| --- | ------- | ----------------- | ----------------- |
| Telas de edição/publicação do CMS | J2.5 sem E2E real | ADM-04, ADM-08, ADM-13 | Sim (CA-20, CA-21) |
| Consulta de leads no painel | J3.4 | FORM-09 | Sim (CA-23) |
| Ambiente de homologação com Supabase/Resend | J3.3, roteiros MAN | GO-02, ARC-07 | Sim |
| Destinatários institucionais | J3.3 | CON-10 | Sim (CA-15) |

Quando um teste desta matriz falhar durante a homologação, abrir issue com o prefixo `[BUG]`,
label `agencia-benjamin`, referência ao cenário (ex.: `J1.1`) e evidência (trace do Playwright).

## 4. Responsabilidades

| Papel | Responsabilidade |
| ----- | ---------------- |
| Autor do PR | Rodar `npm run verify` e, se tocar jornada, `npm run test:e2e` |
| Coordenação técnica | Manter esta matriz e revisar PRs críticos (TECH-13) |
| QA (Rafael Morais Rocha) | Roteiros MAN e reexecução pós-correções (QA-11) |
| Donos das frentes | Fechar os gaps da seção 3 |
