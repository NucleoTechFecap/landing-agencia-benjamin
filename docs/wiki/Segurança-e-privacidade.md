# Segurança e privacidade

## Reportar uma vulnerabilidade

Não publique a falha em issue, PR ou discussão. Use **Security → Advisories → Report a
vulnerability** para um relato privado. Política:
[`SECURITY.md`](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/SECURITY.md).

## Controles da aplicação

| Controle | Como funciona |
| --- | --- |
| Autenticação do painel | Supabase Auth, só por convite; senha definida pela própria pessoa |
| Autorização | Papéis (`super_admin`, `admin`, `editor`, `viewer`, `pending`) checados no servidor e de novo pela RLS |
| Leitura pública | Três barreiras: RLS, filtro de status e data de publicação |
| Auditoria | `audit_log` somente inclusão, com quem fez o quê e quando, sem dado pessoal |
| Upload | Tipo conferido pelos bytes do arquivo, SVG recusado, limite de tamanho; listar o bucket exige permissão |
| Cabeçalhos | `nosniff`, `X-Frame-Options: DENY`, HSTS, `Referrer-Policy`, `Permissions-Policy` e `noindex` no painel |

A revisão de segurança mais recente (27/10/2026) está registrada em
[`docs/qualidade/revisao-de-prs.md`](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/qualidade/revisao-de-prs.md).

## Controles do repositório

- Dependabot (alertas e atualizações), secret scanning com push protection e CodeQL.
- Alerta se trata em PR; não se descarta sem justificativa registrada.

## Dados pessoais (LGPD)

Os formulários coletam só o necessário para responder, com finalidade, destinatário e retenção
documentados. Não registre payload, e-mail, telefone ou token em log. Dado real de produção não vai
para desenvolvimento nem para homologação.

Documentos: [tratamento de dados dos formulários](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/seguranca/tratamento-de-dados-formularios.md) ·
[ciclo de vida dos dados pessoais](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/seguranca/ciclo-de-vida-dados-pessoais.md) ·
[perfis e permissões](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/seguranca/perfis-e-permissoes.md) ·
[autenticação](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/seguranca/autenticacao.md) ·
[proteção de rotas](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/seguranca/protecao-de-rotas.md)

## Segredos

Segredos ficam só no gerenciador de cada provedor (Vercel, Supabase, Resend). Em caso de exposição,
faça a rotação no provedor e abra um relato privado com o impacto, sem incluir o segredo.
