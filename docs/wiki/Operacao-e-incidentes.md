# Operação e incidentes

## Verificação após deployment

- Confirme o status do deployment no provedor.
- Acesse `/api/v1/health` e confirme resposta HTTP 200 e estado `ok`.
- Verifique home, cases, formulário de contato e login administrativo conforme a mudança.
- Observe logs de erro e alertas de segurança sem copiar dados pessoais para canais públicos.

## Falha em produção

1. Registre horário, deployment/commit afetado, sintoma e impacto sem incluir dados sensíveis.
2. Avalie se há risco a dados, autenticação, formulários ou disponibilidade.
3. Se o serviço estiver degradado, use o rollback de aplicação no provedor para o deployment
   anterior conhecido e estável.
4. Não reverta migrations de forma improvisada. Consulte o rollback documentado e avalie backup,
   compatibilidade e impacto nos dados com responsável pelo banco.
5. Depois da estabilização, registre causa, duração, impacto e ações corretivas em issue restrita ao
   que pode ser divulgado.

## Critérios de escalonamento

Exposição de dados pessoais, credencial comprometida, acesso indevido ao painel, falha na gravação
de leads ou indisponibilidade ampla requer contato imediato com a coordenação técnica. Para uma
vulnerabilidade, utilize o canal privado de Security Advisory.

O procedimento detalhado de publicação e reversão está em
[`docs/operacao/release-e-rollback.md`](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/operacao/release-e-rollback.md).
