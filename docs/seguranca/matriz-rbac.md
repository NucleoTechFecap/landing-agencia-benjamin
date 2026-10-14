# Matriz RBAC granular por recurso e operação

| Campo        | Valor                                                                 |
| ------------ | --------------------------------------------------------------------- |
| Issue        | TECH-03 (#105)                                                        |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                              |
| Versão       | 1.0.0                                                                 |
| Data         | 13/10/2026                                                            |
| Depende de   | [ADM-01 — perfis](perfis-e-permissoes.md), [ADR-0003](../adr/0003-limites-de-dominio.md) |
| Código       | `lib/domain/auth/rbac.ts` (fonte única) · testes em `rbac.test.ts`    |

## 1. Regras gerais

1. **Negar por padrão:** só é permitido o que está explicitamente na matriz. Papel nulo,
   desconhecido ou `pending` não tem nenhuma permissão (`can()` retorna `false`).
2. **O papel vem do servidor:** lido da tabela `profiles` a cada requisição/ação. Nada que vem do
   cliente (cookie editável, campo de formulário, query string) define papel.
3. **Três barreiras:** `proxy.ts` (sessão existe) → guarda no servidor `requirePermission()`
   (papel × recurso × ação) → RLS no banco (`has_permission()`).
4. **Toda Server Action e Route Handler** do painel chama a guarda antes de ler ou gravar.
5. Mudança nesta matriz = PR alterando `rbac.ts`, o seed SQL de `role_permissions` e este documento
   juntos (o teste de consistência falha se divergirem — ADM-03).

## 2. Matriz

Legenda: **V** visualizar · **C** criar · **E** editar · **P** publicar · **A** arquivar ·
**D** excluir · **X** exportar · **M** gerenciar papéis · **—** nenhuma.

| Recurso | `super_admin` | `admin` | `editor` | `viewer` | `pending` |
| ------- | :---: | :---: | :---: | :---: | :---: |
| `dashboard` | V | V | V | V | — |
| `page` (páginas e blocos institucionais) | VCEPAD | VCEPAD | VCEPA | V | — |
| `area` | VCEPAD | VCEPAD | VCEPA | V | — |
| `service` | VCEPAD | VCEPAD | VCEPA | V | — |
| `category` | VCEPAD | VCEPAD | VCEPA | V | — |
| `case` | VCEPAD | VCEPAD | VCEPA | V | — |
| `cta` | VCEPAD | VCEPAD | VCEPA | V | — |
| `media` | VCED | VCED | VCE | V | — |
| `settings` (contato, redes sociais) | VE | VE | V | V | — |
| `lead` | — | VEADX | — | — | — |
| `feedback` | — | VEAD | — | — | — |
| `user` | VCEM | VCE | — | — | — |
| `audit` | V | V | — | — | — |

Notas:

- `lead`/`feedback` → **E** significa alterar o status de atendimento (ex.: "respondido"), nunca o
  conteúdo enviado pelo visitante; **A**/**D** atendem a retenção (TECH-08).
- `user` → **C** convidar, **E** desativar/reativar, **M** atribuir papéis `admin`/`super_admin`.
  Regras adicionais em `canAssignRole()`: ninguém altera o próprio papel; `admin` só gerencia
  `editor`, `viewer` e `pending`.
- `super_admin` não lê dados pessoais de leads/feedbacks por padrão (minimização). Acesso
  emergencial exige atribuição temporária de `admin`, registrada na auditoria (TECH-10).

## 3. Mapeamento para o servidor

| Ponto de aplicação | Como verificar |
| ------------------ | -------------- |
| Página do painel | `await requirePermission("case", "view")` no topo do Server Component (redireciona/nega) |
| Server Action | `await requirePermission("case", "publish")` antes de validar/gravar; erro `FORBIDDEN` (403) |
| Route Handler | Mesmo guarda; resposta no envelope de erro de TECH-02 |
| Item de menu/botão | `can(role, recurso, ação)` apenas para esconder — nunca como proteção |
| Banco | Policies `using (public.has_permission('case','edit'))` nas tabelas de conteúdo (DB-02) |

## 4. Casos negativos obrigatórios (para QA-06 e executores)

| # | Cenário | Resultado esperado |
| - | ------- | ------------------ |
| N01 | Visitante anônimo acessa `/admin` | Redireciona para `/admin/login` |
| N02 | Visitante anônimo chama Server Action do painel | `UNAUTHENTICATED` (401), nada gravado |
| N03 | Conta `pending` acessa `/admin` | Tela "acesso pendente", sem dados |
| N04 | `editor` exclui serviço/case/mídia | `FORBIDDEN` (403) |
| N05 | `editor` abre listagem de leads ou feedbacks | 403 / item fora do menu |
| N06 | `editor` altera contato institucional ou redes sociais | 403 |
| N07 | `viewer` edita ou publica qualquer conteúdo | 403 |
| N08 | `super_admin` abre leads | 403 (minimização) |
| N09 | `admin` promove alguém a `admin`/`super_admin` | 403 |
| N10 | Qualquer papel altera o próprio papel | 403 |
| N11 | Cliente envia `role` forjado em cookie/formulário | Ignorado — papel vem de `profiles` |
| N12 | `select` direto na tabela de leads com chave anônima | 0 linhas (RLS) |
| N13 | Sessão expirada em ação de escrita | 401 e redirecionamento ao login, nada gravado |

N04–N10 estão automatizados em `lib/domain/auth/rbac.test.ts`; N01–N03, N11–N13 dependem do
servidor/banco e entram nos testes de ADM-03 e QA-06.
