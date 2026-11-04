# SEG-04 — Autorização de leitura de dados pessoais no painel

| Campo        | Valor                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------- |
| Issue        | SEG-04 (#98)                                                                             |
| Execução     | 04/11/2026, sobre a tela de FORM-09 (#75), na branch `feat/form-09-leads-no-painel`       |
| Ambiente     | Local: `next start` (build de produção) + Supabase local (Postgres 17, Auth, RLS e PostgREST reais), Chrome headless |
| Fora do escopo | Homologação e produção (GO-02): nada aqui foi executado contra banco remoto           |
| Decisão pendente | Quem pode ver leads e feedbacks ainda aguarda a Agência Benjamin ([ADM-01 §5](../seguranca/perfis-e-permissoes.md), [TECH-06 §10](../formularios/captacao-e-roteamento.md)). Os testes provam a proposta atual; se a matriz mudar, mudam juntos |

## 1. Como reexecutar

```bash
npm run test                                 # regras, guardas e tela, sem Docker
npx supabase start && npx supabase db reset
npx supabase test db                         # leads_painel.test.sql e form_submissions_rls.test.sql
npm run test:supabase                        # leads-no-painel.test.ts: contas reais e API REST direta
npm run test:e2e:cms                         # jornada-leads-cms.spec.ts: navegador
```

Massa: contas `*@teste.local` e envios fictícios, com um marcador por execução, removidos ao final. Se o
marcador aparecer na resposta de quem não pode ler, o teste falha, mesmo em formato inesperado.

## 2. Entradas não confiáveis, atores e ameaças

| Entrada ou ator | Ameaça | Mitigação | Prova |
| --------------- | ------ | --------- | ----- |
| Visitante com a chave anônima pública | Ler ou alterar direto pela API REST ou GraphQL | `anon` sem nenhum privilégio na tabela | `leads-no-painel.test.ts`, `leads_painel.test.sql` |
| Conta autenticada sem o papel (`pending`, `viewer`, `editor`, `super_admin`) | Usar o próprio token na API REST | RLS por tipo: 0 linhas | `leads-no-painel.test.ts` |
| Conta desativada com token ainda válido | Continuar lendo depois do desligamento | `current_app_role()` vale como `pending`, na hora | `leads-no-painel.test.ts`, `leads_painel.test.sql` |
| `admin` | Reescrever o que o visitante enviou ou forjar a notificação | `update` só na coluna `status` | `leads-no-painel.test.ts`, `leads_painel.test.sql` |
| Falha na aplicação | Guarda esquecida ou papel errado no servidor | A consulta usa a sessão, sem service role; a RLS segura sozinha. O teste chama os serviços com todos os tipos e o papel forjado | `leads-no-painel.test.ts`, `inbox.test.ts` (arquitetura) |
| `id` na URL e no formulário | Texto arbitrário chegando ao banco; descobrir se um registro existe | Formato conferido antes do banco; guarda antes do id; mesma resposta para "não existe" e "não pode ver" | `inbox-context.test.ts`, `leads-no-painel.test.ts`, E2E J3.5 e J3.6 |
| Filtros e página na URL | Operador do PostgREST, valor enorme, nome ou e-mail na URL | Lista fechada e padrão fixo em `parseInboxQuery`; o resto vira "sem filtro" | `inbox.test.ts`, E2E J3.6 |
| Conteúdo do envio (`payload`) | HTML ou script executado no painel de quem atende (XSS guardado) | Só texto com o escape do React, sem link automático | `submission-detail.test.ts`, E2E J3.6 |
| `sourcePath` | `//evil.com` virando link para outro site | Só texto, nunca link | `submission-detail.test.ts`, E2E J3.6 |
| Formulário de status | Forjar `kind`, gravar status inválido, sobrescrever a alteração de outra pessoa | Tipo lido do banco; status de lista fechada; `update` condicionado ao status lido | `inbox.test.ts`, `leads-no-painel.test.ts` |
| Trilha de auditoria | Forjar eventos de dados pessoais; gravar conteúdo no evento | `record_audit_event` só aceita `lead.*` e `feedback.*` do `admin`; metadados de lista permitida | `leads_painel.test.sql`, `leads-no-painel.test.ts`, `inbox-context.test.ts` |
| Pré-carregamento de links | Passar o mouse contar como leitura e gravar evento falso | `prefetch={false}` nos links do painel de envios | Revisão de código |
| Computador compartilhado | Envio aberto ficar no DOM depois de sair (Activity do Next) | Recarga completa ao sair | E2E J3.8 |
| Logs e cache | Dado pessoal em log ou em `use cache` | Telas sem `use cache`; logger com mascaramento; guarda registra só id e papel | `inbox.test.ts` (arquitetura), `logger.test.ts` |

## 3. Matriz de acesso observada

Cada célula foi exercitada com conta real. **0 linhas** = sem erro e sem dado, com a linha intacta no banco.
Na tela, "sem permissão" é `/admin/sem-permissao`.

| Quem | Tela (`/admin/leads`, `/admin/leads/<id>`) | Ler pela API REST | Alterar pela API REST | Excluir pela API REST |
| ---- | ------------------------------------------ | ----------------- | --------------------- | --------------------- |
| Sem sessão | Login | Sem chave: `401` no gateway | — | — |
| Chave anônima | — | `401`, `42501` | `401`, `42501` | `401`, `42501` |
| Token inválido | — | `401`, sem dado | — | — |
| `pending` | Acesso pendente | 200, 0 linhas | 0 linhas | 0 linhas |
| `viewer` | Sem permissão | 200, 0 linhas | 0 linhas | 0 linhas |
| `editor` | Sem permissão | 200, 0 linhas | 0 linhas | 0 linhas |
| `super_admin` | Sem permissão | 200, 0 linhas | 0 linhas | 0 linhas |
| `admin` desativado | Acesso pendente | 200, 0 linhas | 0 linhas | 0 linhas |
| `admin` | Abre | Lê os três tipos | Só `status`; outra coluna, sozinha ou junto, `42501`; valor fora da lista, `23514` | Permitido pela RLS; na tela, só depois de arquivar |

A tela de `editor`, `super_admin` e sem sessão foi vista no navegador (E2E J3.5). A de `pending` e `viewer` está
nos testes de guarda (`inbox-context.test.ts`). A do `admin` desativado segue de `getSessionUser`, que o trata como
`pending`, sem teste de navegador próprio; a leitura dele pela RLS está em `leads-no-painel.test.ts`.

**Entrada malformada pela API REST** (`id=eq.nao-e-uuid`, coluna inexistente, `or=(`, `limit=-1`, `offset=-1`,
`status=in.(novo`, ordenação inválida, `payload->>email=like.*`), com a chave anônima e com o token do `editor`:
nenhuma resposta trouxe dado de envio. **Na tela**, com `admin`: filtros inválidos caem na lista sem filtro, página
além do fim mostra a última, id inválido ou inexistente mostra a página 404, e nada de `PGRST`, `22P02` ou
`invalid input` aparece.

## 4. As provas falham quando a proteção é retirada

As mutações de banco foram aplicadas à mão na stack local e desfeitas em seguida: depois de reverter, 63 de 63 e
`PASS`. As de aplicação foram feitas num build temporário, ou observadas antes da correção.

| Mutação | Resultado |
| ------- | --------- |
| `grant update` na tabela inteira, como antes da TECH-06 | 1 falha em `leads-no-painel.test.ts` |
| Policy de leitura com `using (true)` | 15 falhas |
| `anon` com `select` e policy aberta | 8 falhas |
| `lead:view` dado ao `super_admin` | 3 falhas |
| Policy de `update` com `using (true)` | Passou em `leads-no-painel.test.ts`: sem efeito sem o select. Falha no `leads_painel.test.sql` (teste 28, papel que lê e não altera) |
| Policy de `delete` com `using (true)` | Idem |
| Sem `revalidatePath` na Server Action | A lista mostra o status antigo ao voltar: falha na E2E J3.4 |
| Sem recarga ao sair (situação antes da correção) | O envio aberto continuava no DOM, na tela de login: foi assim que o defeito apareceu. A E2E J3.8 exige a recarga |

As duas mutações que passaram na integração eram uma lacuna real da primeira versão dos testes: a RLS aplica o
`select` também em `update` e `delete` com `where`, então um papel sem leitura nunca exercita as policies de
escrita. Por isso o pgTAP tem o caso com permissão isolada.

## 5. Resultado

| Bateria | Resultado em 04/11/2026 |
| ------- | ----------------------- |
| `npm run verify` | Verde: 75 arquivos e 961 testes passando, 140 testes pulados (entre eles os 15 arquivos de integração, que precisam do Supabase e rodam na linha abaixo); build de produção ok |
| `npx supabase test db`, banco limpo | `Files=10, Tests=260, Result: PASS` (`leads_painel.test.sql`: 46) |
| `npm run test:supabase` | 15 arquivos, 138 testes, `PASS` (`leads-no-painel.test.ts`: 63) |
| `npm run test:e2e:cms -- tests/e2e/jornada-leads-cms.spec.ts --repeat-each=3` | 24 de 24 (8 cenários, 3 vezes cada) |
| `npm run test:e2e:cms`, todas as jornadas `@cms` | 30 de 30 |

## 6. O que continua pendente

- **Aprovação da Benjamin** de quem vê leads e feedbacks, etapas de atendimento e destinatários (ADM-01, TECH-06
  §10, CON-10). Nada disso foi tratado como aprovado.
- **Homologação:** repetir J3.4 a J3.8 contra o Supabase de homologação (GO-02, QA-06).
- **N13** (sessão expirada em ação de escrita) segue no roteiro de QA-06.

### Riscos residuais

| Risco | Por que fica | Como reduzir |
| ----- | ------------ | ------------ |
| Sessão que expira com um envio aberto: o redirecionamento ao login não recarrega a página, e o envio fica escondido no DOM até a próxima carga | A recarga está só na saída pelo botão **Sair**: exige acesso físico à mesma aba | Estender a recarga ao `?erro=sessao`, se a coordenação achar necessário |
| Uma abertura pode gerar mais de um evento (recarga, salvar o status) | Cada carga é uma leitura; a trilha prefere sobrar a faltar | Nenhuma ação necessária |
| A lista mostra o nome sem gerar evento | TECH-08 §4 pede evento ao abrir, e o catálogo descreve `lead.viewed` como "aberto" | Rever se a Benjamin pedir trilha também da listagem |
