# Operação e incidentes

## Depois de cada deploy

- Status do deploy na Vercel.
- `GET /api/v1/health` responde 200 com `"status": "ok"`.
- Home, um serviço, um case, contato e login do painel, conforme o que mudou.
- Logs de erro dos primeiros minutos, sem copiar dados pessoais para canais públicos.

## Rotinas de manutenção

Cada rotina recorrente é uma issue com a label
[`manutencao`](https://github.com/NucleoTechFecap/landing-agencia-benjamin/issues?q=label%3Amanutencao)
(MANUT-01 a MANUT-08). Cada execução é registrada num comentário da issue.

| Frequência | Rotina |
| --- | --- |
| Semanal | Notificações de formulário com falha · logs de erro da Vercel |
| Mensal | Retenção de dados pessoais · contas e papéis do painel · atualização de dependências |
| A cada minor do Next.js | Atualizar `next` e `eslint-config-next` juntos |
| Trimestral | Testar a restauração do backup |
| Semestral (e quando alguém com acesso sair) | Rotacionar segredos |

## Falha em produção

1. Registre horário, deploy ou commit, sintoma e impacto, sem dados sensíveis.
2. Avalie risco a dados, autenticação, formulários e disponibilidade.
3. Serviço degradado: volte o deploy na Vercel para o último estável.
4. **Não** reverta migration de improviso: use o rollback documentado com quem responde pelo banco,
   depois de avaliar backup e compatibilidade.
5. Estabilizado, registre causa, duração, impacto e correções.

## Quando escalar na hora

Exposição de dado pessoal, credencial comprometida, acesso indevido ao painel, falha na gravação de
pedidos de clientes ou site fora do ar: contate a coordenação técnica imediatamente. Vulnerabilidade
vai pelo canal privado de Security Advisory.

Documentos: [release e rollback](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/operacao/release-e-rollback.md) ·
[handoff e manutenção](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/operacao/handoff-e-manutencao.md) ·
[logs e erros (ADR-0004)](https://github.com/NucleoTechFecap/landing-agencia-benjamin/blob/main/docs/adr/0004-logs-e-tratamento-de-erros.md)
