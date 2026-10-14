# Domínio oficial, DNS e HTTPS

| Campo        | Valor                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| Issue        | GO-03 (#193)                                                            |
| Responsável  | Vinícius Nishimura Reis (`@Vinishireis`)                                |
| Versão       | 1.0.0                                                                   |
| Data         | 13/10/2026                                                              |
| Depende de   | **CON-11** (Agência Benjamin define/adquire o domínio — ATA §4.9), GO-02 |
| Situação     | Roteiro pronto · **bloqueado** até o domínio ser informado              |

## 1. O que a Agência Benjamin precisa enviar (CON-11)

- [ ] Domínio oficial (ex.: `agenciabenjamin.com.br`) e se o site ficará no apex, em `www` ou subdomínio da FECAP.
- [ ] Quem administra o DNS (Registro.br, provedor da FECAP, Cloudflare…) e um contato técnico.
- [ ] Se o domínio já tem e-mail institucional (registros MX existentes **não** podem ser alterados).
- [ ] Autorização para criar os registros abaixo (ou acesso delegado ao NúcleoTech).

## 2. Registros DNS

### Site (Vercel)

| Host | Tipo | Valor | TTL |
| ---- | ---- | ----- | --- |
| `@` (apex) | A | `76.76.21.21` | 3600 |
| `www` | CNAME | `cname.vercel-dns.com.` | 3600 |

Domínio preferencial: `www` com redirecionamento 308 do apex (configurado na Vercel → Domains).
Se o domínio for subdomínio da FECAP (ex.: `benjamin.fecap.br`), usar apenas o CNAME.
Confirmar os valores exibidos pela Vercel no momento do cadastro do domínio (podem incluir um TXT
de verificação `_vercel`).

### E-mail transacional (Resend — remetente dos formulários)

| Host | Tipo | Valor |
| ---- | ---- | ----- |
| `resend._domainkey` (ou o indicado) | TXT (DKIM) | Valor gerado no painel da Resend |
| `send` (subdomínio de envio) | MX / TXT (SPF) | Valores gerados no painel da Resend |
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=mailto:<responsável>` (se ainda não existir) |

Usar um **subdomínio de envio** evita conflito com o e-mail institucional existente.

## 3. Passo a passo

1. Reduzir o TTL dos registros atuais para 300 s 24 h antes (se o domínio já aponta para outro site).
2. Vercel → Project → Settings → Domains → adicionar `www.<domínio>` e `<domínio>` (redirect).
3. Criar os registros da seção 2 no DNS.
4. Aguardar a verificação na Vercel; o certificado **TLS (Let's Encrypt)** é emitido e renovado automaticamente.
5. Resend → Domains → adicionar o domínio de envio, criar registros, aguardar "Verified".
6. Atualizar variáveis de produção: `NEXT_PUBLIC_SITE_URL=https://www.<domínio>`, `NOTIFICATION_FROM="Agência Benjamin <nao-responda@<domínio>>"`; redeploy.
7. Supabase Auth (produção): Site URL e Redirect URLs com o domínio; SMTP pelo domínio.
8. Google Search Console: verificar o domínio (TXT) e enviar `sitemap.xml` (QA-07).

## 4. Verificação (critério de aceite)

```bash
dig +short www.<domínio> CNAME          # cname.vercel-dns.com.
dig +short <domínio> A                  # 76.76.21.21
curl -sI https://<domínio> | head -3    # 308 → https://www.<domínio>/
curl -sI https://www.<domínio> | grep -i strict-transport-security
curl -s https://www.<domínio>/robots.txt   # Allow: / e Sitemap com o domínio oficial
```

- [ ] Domínio resolve para a produção e redireciona apex → `www` (ou o inverso decidido).
- [ ] Certificado válido (SSL Labs nota A ou superior) e HSTS presente.
- [ ] Canonical, Open Graph, sitemap e `llms.txt` usando o domínio oficial.
- [ ] E-mail de teste dos formulários entregue com SPF/DKIM válidos (cabeçalho `Authentication-Results`).

## 5. Rollback

Restaurar os registros anteriores (anotados antes da troca) — propagação conforme o TTL reduzido;
a URL `*.vercel.app` de produção continua funcionando durante qualquer janela de propagação.
