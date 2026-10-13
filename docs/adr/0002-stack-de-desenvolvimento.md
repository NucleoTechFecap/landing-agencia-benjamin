# ADR-0002 — Stack final de desenvolvimento

| Campo        | Valor                                                      |
| ------------ | ---------------------------------------------------------- |
| Issue        | ARC-02 (#43)                                               |
| Status       | **Aceita** — coordenação técnica                           |
| Data         | 13/10/2026                                                 |
| Decisor      | Vinícius Nishimura Reis (`@Vinishireis`)                   |
| Depende de   | [ADR-0001](0001-arquitetura-da-plataforma.md) (ARC-01)     |

## Contexto

O relatório (PRJ §29) pede que a stack considere conhecimento do time, prazo, manutenção,
segurança, escalabilidade, integração com banco, hospedagem e painel administrativo, e que a
escolha **não assuma decisões não formalizadas**. Esta ADR formaliza a escolha.

## Decisão

| Camada | Tecnologia | Versão | Justificativa | Alternativa descartada |
| ------ | ---------- | ------ | ------------- | ---------------------- |
| Runtime | Node.js | ≥ 20.9 (dev em 26) | Requisito do Next.js 16; Cache Components exige runtime Node | Edge runtime (incompatível com Cache Components) |
| Framework | Next.js (App Router, Turbopack) | 16.4.0 | SSR/SSG/ISR, Server Actions, Metadata API, `proxy.ts`; já usado no FECAP Cases e no site do NúcleoTech | Remix, Astro (time sem experiência) |
| UI | React | 19.3.0 | Server Components, `useActionState`, `<Activity>` | — |
| Linguagem | TypeScript (strict) | 5.x | Contratos tipados entre domínios (TECH-02) | JavaScript |
| Estilo | Tailwind CSS v4 + tokens CSS do brandbook | 4.x | Tokens via `@theme`; sem CSS-in-JS em runtime | CSS Modules puros |
| Validação | Zod | 4.x | Mesmo schema no cliente e no servidor; mensagens em pt-BR | Yup, validação manual |
| Banco | PostgreSQL gerenciado pelo Supabase | 15+ | Relacional, RLS, backups, migrations SQL versionadas | MongoDB (sem integridade relacional) |
| Autenticação | Supabase Auth (e-mail + senha, somente convite) + `@supabase/ssr` | 2.x / 0.12 | Sessão em cookie httpOnly, renovação automática, sem cadastro público | Auth.js, implementação própria |
| Autorização | Matriz RBAC no código + RLS no banco | — | Defesa em profundidade (TECH-03) | Somente checagem na UI |
| Arquivos/mídia | Supabase Storage (bucket `media`) + `next/image` | — | URLs públicas para mídia publicada, políticas por papel (ARC-10) | Vercel Blob (outro fornecedor) |
| E-mail transacional | Resend (API REST) | — | Já usado no site do NúcleoTech; integração sem SDK obrigatório | SMTP próprio |
| Hospedagem | Vercel (Preview por PR + Production) | — | Deploy integrado ao GitHub, CDN, logs | Render, VPS própria |
| Testes unitários | Vitest | 5.x | Já usado no site do NúcleoTech; rápido e compatível com TS | Jest |
| Testes E2E | Playwright | 1.x | Jornadas críticas em navegadores reais (TECH-12/QA) | Cypress |
| Qualidade | ESLint 9 (flat config `eslint-config-next`) + `tsc --noEmit` + checagem de cabeçalhos | — | Padrão do repositório | — |
| Migrations | Supabase CLI (`supabase/migrations/*.sql`) | 2.x | SQL versionado, reexecutável em homologação/produção | ORM com migrations geradas |

### Bibliotecas adicionadas ao `package.json`

| Pacote | Uso | Adicionado em |
| ------ | --- | ------------- |
| `zod` | Schemas de formulários, conteúdo e variáveis de ambiente | ARC-05 |
| `server-only` | Impede importar módulos de servidor em Client Components | ARC-05 |
| `@supabase/supabase-js`, `@supabase/ssr` | Cliente de banco/Auth/Storage | ADM-02 |
| `vitest` (dev) | Testes unitários | ARC-03 |

Novas dependências exigem justificativa no PR (tamanho, manutenção, licença) — ver CONTRIBUTING.

## Riscos de plano e custo (decisão pendente da coordenação)

| Item | Risco | Recomendação |
| ---- | ----- | ------------ |
| Supabase Free | Projeto pausa após inatividade; sem backups diários gerenciáveis | Produção em plano pago **ou** conta institucional do NúcleoTech; homologação pode ficar no Free |
| Vercel Hobby | Termos restringem uso comercial | Usar time/conta do NúcleoTech com plano adequado para produção |
| Resend Free | Limite diário de envios | Suficiente para o volume esperado de leads no MVP |
| Domínio | Responsabilidade da Benjamin (CON-11) | Configuração em GO-03 |

A escolha de plano não altera a stack; deve ser registrada em GO-02 antes do provisionamento.

## Consequências

- O time precisa conhecer `'use cache'`, `cacheTag`, `updateTag` e `proxy.ts` (APIs do Next.js 16).
  A documentação oficial da versão instalada está em `node_modules/next/dist/docs/` (ver `AGENTS.md`).
- RLS passa a ser obrigatória em toda tabela exposta pelo Supabase (checklist de PR).
- Conteúdo do site não pode ficar fixo no código: entra pela camada de conteúdo
  (seed provisório até o CMS existir — PRJ §40).
