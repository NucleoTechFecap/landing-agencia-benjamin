# Solução de problemas

## Instalação e build

**`npm ci` falha.** Confira o Node (`nvm use`, versão do `.nvmrc`), o acesso ao registry e se o
`package-lock.json` acompanha a mudança de dependências. Não troque `npm ci` por `npm install` no CI.

**Build falha por variável ausente.** Compare com `.env.example` e
[[Ambientes e variáveis]]. Use valores fictícios; nunca peça segredo em issue.

**`next build` não acha o pacote do Next numa worktree.** O Turbopack não aceita `node_modules`
ligado por link simbólico de fora do projeto. Rode `npm ci` na própria worktree.

## Supabase local

**`npx supabase start` falha ao baixar imagens** (erro de certificado ou de rede, comum em Wi-Fi com
portal de login). Suba sem os serviços de log e analytics:
`npx supabase start -x vector,logflare`.

**Link de convite ou de recuperação de senha cai no login ou em "link inválido".**
1. Abra o app em `http://localhost:3000`, não em `127.0.0.1`: o cookie de sessão só vale no endereço
   configurado no Auth local.
2. O link funciona uma única vez e vale 1 hora. Peça um convite novo se já o abriu.
3. Confirme que o Supabase subiu com os templates de `supabase/templates/` (`npx supabase stop` e
   `start` depois de mudar o `config.toml`).

**Senha recusada ao criar a conta.** A política exige no mínimo 12 caracteres, com letras e números.

## Painel e conteúdo

**"Arquivo maior que 4 MB" no envio de mídia.** É o limite do painel, porque a Vercel recusa
requisições acima de 4,5 MB. Reduza o arquivo (para imagens, exporte em WebP).

**O site mostra "Conteúdo provisório".** Sem Supabase o site usa `content/`; com Supabase, o item
ainda não foi aprovado pela Benjamin. O gate de release bloqueia conteúdo provisório; não remova o
gate para publicar.

**A alteração publicada não aparece na página.** Listas e API atualizam na hora; o detalhe pode
levar uma requisição. Se persistir, veja o log `content.cache.invalidated` e o
[ADR-0006](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/adr/0006-cache-e-invalidacao.md).

## Pull request e deploy

**PR bloqueado.** Corrija os checks falhos, aguarde a aprovação e resolva as conversas. Se um check
não aparecer, confira se o workflow rodou no último commit.

**Deploy falha ou o health check não responde.** Veja os logs do deploy, as variáveis do ambiente
certo e o status do provedor. Compare com o último deploy bom e, se for o caso, siga
[[Operação e incidentes]]. Não altere dados remotos para diagnosticar.

**Formulário falha em homologação ou produção.** Faltam variáveis obrigatórias: `NOTIFICATION_FROM`
(com domínio verificado no Resend), `RESEND_API_KEY`, `SUBMISSION_HASH_SECRET` ou um destinatário.
