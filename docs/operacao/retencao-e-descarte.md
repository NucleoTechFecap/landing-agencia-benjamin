# Retenção, recuperação e descarte de dados pessoais

| Campo        | Valor                                                                         |
| ------------ | ----------------------------------------------------------------------------- |
| Issue        | DBX-05 (#116)                                                                 |
| Responsável  | Vinícius Binda (`@VinnizzZ`)                                                  |
| Versão       | 1.0.0                                                                         |
| Data         | 04/11/2026                                                                    |
| Depende de   | [TECH-08 — ciclo de vida](../seguranca/ciclo-de-vida-dados-pessoais.md), [DB-10 — backup](backup-e-recuperacao.md), [SEG-01 — tratamento de dados](../seguranca/tratamento-de-dados-formularios.md) |
| Código       | `lib/domain/forms/retention.ts`, `lib/server/forms/retention-service.ts`, `app/api/internal/jobs/retencao/route.ts` |
| Migration    | `supabase/migrations/20261104000100_dbx05_retencao_formularios.sql`           |

> **Os prazos abaixo são propostas, não decisões aprovadas.** A validação institucional é da SEG-02 (#96). Até lá, a
> rotina só simula: a execução recusa rodar enquanto `RETENTION_PENDING_INSTITUTIONAL_APPROVAL` for `true`, e nenhum
> registro real é apagado por ela. Este documento não é parecer jurídico.

## 1. Decisões em vigor (04/11/2026)

| Tema | Decisão |
| ---- | ------- |
| Concluir antes da SEG-02 | Sim: rotina, banco e runbook prontos, com a exclusão por prazo travada até a aprovação |
| Como a rotina roda | Rota interna protegida por `CRON_SECRET`, chamada à mão uma vez por mês e depois de restaurar uma cópia |
| Retenção suspensa (`legal_hold`) | SQL executado por pessoa autorizada (§2), sem tela no painel |
| Exclusões a pedido do titular | Lista só com os ids, no Drive institucional, reaplicada depois de restaurar (§6) |
| Quem pode restaurar e acessar dados reais | Os nomes do §2 |

## 2. Quem pode restaurar e acessar dados reais

- Flávio Santos
- Jenifer Barreto
- Lucas Bernardo
- Vinícius Binda
- Vinícius Nishimura Reis
- Vinícius Cardoso de Lima

Só essas pessoas podem restaurar uma cópia, abrir o pacote do Drive ou rodar SQL em `form_submissions` na produção.
Os e-mails ficam fora deste documento porque o repositório é público.

Esta lista **não muda a rotina do painel**: ler leads e feedbacks continua sendo do papel `admin`, da Benjamin
([matriz RBAC](../seguranca/matriz-rbac.md)). Quem está aqui só olha dado real quando a tarefa exige, e não copia dado para
fora do pacote criptografado. Ao sair alguém do projeto, troque as credenciais do §9.

A conta do Drive é uma só, então o Drive não diz qual dessas pessoas fez cada acesso: registre restaurações e consultas a
dados reais na issue do incidente, sem dados pessoais.

## 3. O que é retido, por quanto tempo e como sai

Prazo contado do último andamento: criação do envio ou mudança de status. Tentativa de notificação não conta.

| Dado | Prazo proposto | Ao vencer | Como | Situação |
| ---- | -------------- | --------- | ---- | -------- |
| Lead | 12 meses | Excluir | Rotina (§4) | ⏳ SEG-02 |
| Contato | 6 meses | Excluir | Rotina (§4) | ⏳ SEG-02 |
| Feedback identificado | 12 meses | Anonimizar | Rotina (§4) | ⏳ SEG-02 |
| Feedback anônimo ou anonimizado | 24 meses | Excluir | Rotina (§4) | ⏳ SEG-02 |
| Envio com `legal_hold` | Suspenso | Manter | §7 | Pronto |
| E-mail de notificação | Mesmo prazo do envio | Excluir | À mão, na caixa dos destinatários | ⏳ SEG-02; sem rotina |
| Trilha de auditoria (`audit_log`) | 24 meses | Não definido | **Sem rotina:** a tabela não aceita exclusão, nem por `service_role` | ⏳ SEG-02; precisa de issue antes de 2028 |
| Contas do painel | Enquanto houver vínculo | Excluir | [Administrador inicial](administrador-inicial.md); o `actor_id` da auditoria fica nulo | ⏳ Sem prazo definido |
| Logs da Vercel | Retenção do plano | Expiram | Automático; sem dados pessoais (ARC-09) | Pronto |
| Cópias no Drive | Sugestão: 4 mais recentes | Excluir, inclusive da lixeira | À mão, na rotina semanal | ⏳ SEG-02 |
| Lista de eliminados (§6) | Enquanto houver cópia anterior à eliminação | Remover a linha | À mão | Pronto |

**Anonimizar** remove nome e e-mail do `payload`, desliga o retorno e apaga `ip_hash`, `fingerprint` e
`last_notification_error`. Perfil, nota e mensagem ficam. **Limite:** a mensagem é texto livre e pode identificar quem
escreveu; essa regra também está na validação da SEG-02.

**As cópias guardam dados por mais tempo.** Um dado excluído continua nas cópias feitas antes, até elas saírem do Drive.
O pacote é criptografado e não dá para editar: por isso a §6 e a §8. O aviso de privacidade ainda não menciona as
cópias nem os 24 meses do feedback anônimo: pontos levados à SEG-02.

## 4. Rotina mensal

Uma vez por mês, por uma pessoa do §2. A rota só responde com contagens, nunca com ids ou conteúdo.

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<endereço do site>/api/internal/jobs/retencao
# {"data":{"toDelete":0,"toAnonymize":0,"kept":12}, ...}
```

Registre a data e as contagens na issue de manutenção. Depois da aprovação da SEG-02, um PR altera os prazos, se for o
caso, e `RETENTION_PENDING_INSTITUTIONAL_APPROVAL` em `lib/domain/forms/retention.ts`. A partir daí, execute com:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" -d '{"confirmar":"executar"}' \
  https://<endereço do site>/api/internal/jobs/retencao
# {"data":{"deleted":3,"anonymized":1,"skipped":0}, ...}
```

Faça uma cópia ([DB-10 §4](backup-e-recuperacao.md)) antes da primeira execução real. Não há como desfazer: a exclusão e a
anonimização são definitivas, e `apply_retention` registra `retention.executed` só com as contagens. `skipped` conta
envio com retenção suspensa ou com andamento depois de o plano ser feito, que ficam para a próxima rodada.

**Enquanto a Vercel não estiver ligada ao Supabase**, a rota responde 503: hoje não há envios a tratar. A rotina ainda não
é agendada de propósito. O agendamento só faz sentido depois da aprovação e pede uma decisão sobre rodar sem ninguém olhando.

## 5. Pedidos de titulares

O canal e o responsável dependem da SEG-02. O protocolo informado pelo titular localiza o envio no painel (FORM-09).

| Pedido | Como atender |
| ------ | ------------ |
| Eliminar | `admin` arquiva e exclui no painel, apaga o e-mail de notificação e **no mesmo dia** informa o id a uma pessoa do §2, que o inclui na lista (§6) |
| Revogar consentimento (feedback) | Pessoa do §2 anonimiza por SQL (abaixo) e inclui o id na lista, se ele não puder voltar identificado |
| Corrigir | Ainda sem fluxo: `admin` altera só o status (TECH-06). Pendente na SEG-02 |

```sql
-- Anonimizar um feedback agora, sem esperar o prazo
select * from public.apply_retention('{}'::uuid[], array['<id>']::uuid[], now(), 'titular');
```

## 6. Lista de envios eliminados

Restaurar uma cópia traz de volta o que foi eliminado depois dela. A rotina só resolve o que venceu: um pedido do titular
precisa desta lista.

- **Onde:** `eliminacoes-titulares.csv`, no Drive institucional, fora do pacote criptografado.
- **O que tem:** só `id,data`. Nunca nome, e-mail, protocolo ou motivo.
- **Quando atualizar:** no dia da exclusão (§5). A exclusão feita pela rotina não entra: ela é reaplicada pela própria rotina.

Toda semana, junto da cópia, confira se nenhuma exclusão ficou de fora:

```sql
select resource_id, occurred_at::date from public.audit_log
where event in ('lead.deleted', 'feedback.deleted') and outcome = 'success'
order by occurred_at desc;
```

Sem essa conferência, o que for eliminado e não entrar na lista volta numa restauração. É o risco que sobra entre uma
exclusão e o registro dela.

## 7. Retenção suspensa (`legal_hold`)

Para envio que virou contrato ou tem pedido judicial. Por SQL, por uma pessoa do §2, com o motivo decidido pela coordenação.
Com a suspensão, a rotina ignora o envio e **ninguém exclui, nem pelo painel, nem por SQL direto** (erro `BJ004`).

```sql
update public.form_submissions set legal_hold = true where id = '<id>';    -- suspender
update public.form_submissions set legal_hold = false where id = '<id>';   -- retomar
select id, kind, last_activity_at from public.form_submissions where legal_hold;   -- conferir
```

Registre data, quem fez e o id na issue do caso, sem dados pessoais: esta alteração não gera evento de auditoria.

## 8. Depois de restaurar uma cópia

Faz parte do [passo 7 da restauração](backup-e-recuperacao.md), **antes de liberar o acesso**:

1. Reaplicar a lista do §6, com os ids posteriores à data da cópia:
   ```sql
   select * from public.apply_retention(array['<id>', '<id>']::uuid[], '{}'::uuid[], now(), 'titular');
   ```
   `skipped` deve ser zero, ou corresponder a id já ausente ou com retenção suspensa.
2. Rodar a simulação do §4 no projeto restaurado. Enquanto os prazos não forem aprovados, a coordenação técnica decide e
   registra como tratar o que aparecer vencido. Depois da aprovação, executar.
3. Registrar na issue do incidente o que foi feito, só com contagens.

## 9. Credenciais

| Credencial | Onde fica | Quem usa | Troca |
| ---------- | --------- | -------- | ----- |
| `CRON_SECRET` | Vercel | Rota de retenção e reenvio de notificações | [ARC-05 §4](../ambientes/variaveis-de-ambiente.md), e ao sair alguém do §2 |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel e arquivo fora do repositório, só durante a cópia | Servidor e `backup-media.mjs` | Idem, e depois de restaurar |
| Senha do banco | Cofre da equipe ⏳ | CLI e restauração | Idem, e depois de restaurar |
| Conta do Drive | Cofre da equipe ⏳ | Cópias e lista de eliminados | Ao sair alguém do §2 |
| Senha da criptografia | Cofre da equipe ⏳; nunca no Drive | Abrir as cópias | Ao sair alguém do §2; não abre as cópias antigas, então guarde a anterior até elas saírem |

Nenhuma delas vai para o repositório, issue, chat ou log. O "cofre da equipe" é citado na documentação, mas ainda não foi
definido: é a mesma pendência da [DB-10](backup-e-recuperacao.md).

## 10. Como validar

```bash
npx supabase db reset && npx supabase test db   # retencao_formularios.test.sql
npm run test:supabase                           # tests/integration/supabase/retencao.test.ts
npm run test:restore                            # restauração com a lista de eliminados (no Windows, pelo Git Bash)
```

Só em banco local, com dados fictícios. O teste aprova a execução por parâmetro, só no Supabase local: a trava continua
valendo fora dele. **Nenhum registro real foi apagado para validar este documento.**

## 11. Pendências

**Levar à SEG-02 (#96):**

- [ ] Prazos do §3, incluindo a trilha de auditoria e as cópias do Drive.
- [ ] Aviso de privacidade: cópias, feedback anônimo e o limite da anonimização em texto livre.
- [ ] Canal e responsável por pedidos de titulares, e o fluxo de correção.

**Do NúcleoTech:**

- [ ] Definir o cofre da equipe (§9).
- [ ] Criar `eliminacoes-titulares.csv` no Drive, junto da primeira cópia real.
- [ ] Issue da rotina mensal e issue da retenção da trilha de auditoria, que não aceita exclusão.
- [ ] Confirmar a troca da chave de serviço exposta durante os testes de produção.
