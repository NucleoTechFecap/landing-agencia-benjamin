# Começando

## Pré-requisitos

- **Node.js 22**, a versão do [`.nvmrc`](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/.nvmrc) (o mínimo aceito é 20.9).
- **npm** e **Git**.
- Opcional: **Docker** e a **Supabase CLI** (`npx supabase`), para o banco local.
- Opcional: **Google Chrome**, para os testes E2E (o Playwright usa o canal `chrome`).

## Só o site, sem banco

```bash
git clone https://github.com/NucleoTechFecap/landing-agencia-benjamin.git
cd landing-agencia-benjamin
nvm use                      # opcional: usa o Node do .nvmrc
npm ci                       # instala exatamente o package-lock.json
cp .env.example .env.local   # só nomes e valores fictícios
npm run dev                  # http://localhost:3000
```

Sem Supabase, o site usa o conteúdo versionado em `content/`, com o selo "Conteúdo provisório". Os
formulários gravam em memória e a notificação vai para o log. O painel `/admin` fica bloqueado.

## Com o banco local (painel, RLS e mídia)

```bash
npx supabase start          # sobe Postgres, Auth, Storage e Mailpit no Docker
npx supabase db reset       # aplica as migrations e o seed de desenvolvimento
npx supabase status -o env  # mostra API_URL, ANON_KEY e SERVICE_ROLE_KEY locais
```

Copie `API_URL` e `ANON_KEY` para `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no
`.env.local` e rode `npm run dev` de novo.

- **Seed:** `supabase/seed.sql` é gerado a partir de `content/` (`npm run seed:write`) e traz um
  rascunho, um item arquivado e uma mídia sem uso para testar a RLS. Não tem dado pessoal, conta nem
  senha.
- **Primeiro acesso ao painel:** crie a conta por convite com `scripts/provision-admin.mjs` (passo a
  passo em [`docs/operacao/administrador-inicial.md`](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/operacao/administrador-inicial.md)).
  O e-mail do convite chega no **Mailpit** local, em `http://127.0.0.1:54324`.
- Abra o app em **`http://localhost:3000`** (não em `127.0.0.1`): é o endereço configurado no Auth
  local, e o cookie de sessão do convite só vale nele.

## Comandos do dia a dia

| Comando | Para quê |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run verify` | Tudo o que o CI roda: cabeçalhos, formatação, tipos, lint, testes e build |
| `npm test` | Testes do Vitest |
| `npm run headers:write` | Acrescenta o cabeçalho padrão em arquivos novos |
| `npm run format` | Formata com o Prettier |

A lista completa de testes está em [[Testes e qualidade]]. Variáveis por ambiente estão em
[[Ambientes e variáveis]].

> Não copie variáveis da Vercel nem chaves de produção para a sua máquina. Para desenvolver, o banco
> local e o seed bastam.
