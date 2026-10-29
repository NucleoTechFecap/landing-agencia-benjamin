# Segurança e privacidade

## Reporte de vulnerabilidade

Não publique uma falha em issue ou discussão pública. Use **Security → Advisories → Report a
vulnerability** para enviar um relato privado. A política está em
[`SECURITY.md`](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/SECURITY.md).

## Controles automatizados

- Dependabot alerts detecta dependências vulneráveis.
- Dependabot security updates e a configuração de version updates propõem atualizações em PRs.
- Secret scanning e push protection detectam e bloqueiam credenciais reconhecidas.
- CodeQL avalia problemas de segurança no código JavaScript/TypeScript.
- GitHub Actions executa os checks definidos em pull requests.

Alertas devem ser triados e corrigidos em PR; não os descarte sem justificativa registrada.

## Dados pessoais

Formulários captam dados para finalidades documentadas. Evite registrar payloads, endereços,
telefones ou tokens em logs. Dados reais de produção não devem ser copiados para desenvolvimento ou
homologação. Consulte `docs/seguranca/` e `docs/formularios/`.

## Acesso e segredos

Autorização é verificada no servidor e reforçada com RLS. Segredos são mantidos nos ambientes do
provedor, nunca em repositório. Em caso de exposição, faça a rotação no provedor e abra um relato
privado com o impacto, sem incluir o próprio segredo.
