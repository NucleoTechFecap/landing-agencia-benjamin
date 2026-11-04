# Backup e recuperação do banco e dos arquivos

| Campo        | Valor                                                                         |
| ------------ | ----------------------------------------------------------------------------- |
| Issue        | DB-10 (#66)                                                                   |
| Responsável  | Vinícius Binda (`@VinnizzZ`) · backup: Murilo Ribeiro Vasconcellos            |
| Versão       | 1.0.0                                                                         |
| Data         | 04/11/2026                                                                    |
| Depende de   | [GO-02 — provisionamento](provisionamento-producao.md), [ADR-0005 — mídia](../adr/0005-armazenamento-de-midia.md), [TECH-08 — dados pessoais](../seguranca/ciclo-de-vida-dados-pessoais.md) |
| Código       | `scripts/backup-media.mjs`, `scripts/test-restore.mjs`, `supabase/restore/preparar-restauracao.sql` |

Este documento diz como copiar a produção, como recuperá-la e o que o plano gratuito deixa de cobrir.

## 1. Decisões em vigor (04/11/2026)

| Tema | Decisão |
| ---- | ------- |
| Plano do Supabase | **Free, por enquanto.** Reavaliar antes de receber dados reais em volume |
| Onde fica a cópia | Google Drive institucional, acessível só pela conta institucional do NúcleoTech |
| Perda máxima de dados | **7 dias**: uma cópia por semana, feita à mão |
| Tempo máximo de recuperação | **120 minutos** a partir da decisão de restaurar |
| Validação | Stack local nova, com dados fictícios (`npm run test:restore`) |

## 2. O que o plano Free muda

A documentação anterior contava com recursos do plano pago. Conferido em 03/11/2026: a organização
está no plano Free e `supabase backups list` não retorna nenhum backup.

| Antes se contava com | No Free | O que fazer |
| -------------------- | ------- | ------------ |
| Backup diário gerenciado | **Não existe.** Se a produção se perder, só resta a última cópia do Drive | Rotina semanal (§4), único backup real do projeto |
| Restaurar pelo painel do Supabase | Não disponível, nem restaurar em outro projeto | Restauração manual (§5) |
| Projeto sempre ativo | **Pausa com pouca atividade em 7 dias**. O aviso vai por e-mail ao dono do projeto. Pausado, painel e formulários param. Dá para retomar pelo painel por até 90 dias | Manter o e-mail do dono monitorado; ao receber o aviso, abrir o projeto no painel |
| Banco sem limite prático | Passou de **500 MB**, o banco fica só leitura | Conferir o uso na rotina semanal (hoje: cerca de 13 MB) |
| Tráfego sem limite prático | **10 GB** de banda por mês, somando banco, Storage e funções | Conferir o uso na rotina semanal |
| Mais de um ambiente | Um único projeto hoje; o limite de projetos gratuitos ativos também vale para o projeto de restauração | Confirmar no painel que há vaga antes de precisar dela |

**Risco aceito:** um incidente pode custar até 7 dias de conteúdo, envios de formulário e auditoria, e
mais se a rotina atrasar. Um envio de formulário perdido não volta, mesmo que o e-mail de aviso tenha
saído. O plano Pro traria backup diário por 7 dias e nenhuma pausa, mas a cópia dos arquivos continuaria
necessária: backup de banco não inclui arquivos do bucket.

Fontes: [Database Backups](https://supabase.com/docs/guides/platform/backups),
[Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing),
[Database Size](https://supabase.com/docs/guides/platform/database-size) e
[Egress](https://supabase.com/docs/guides/storage/serving/bandwidth).

## 3. O que a cópia cobre

| Item | Coberto? | Como |
| ---- | -------- | ---- |
| Conteúdo, permissões, formulários, auditoria e marcação de produção | Sim | `data.sql` |
| Contas (`auth.users`), com hash de senha | Sim | `data.sql`: a mesma senha continua valendo |
| Registro dos arquivos (`storage.objects`) | Sim | `data.sql` |
| Arquivos do bucket `media` | Sim | `backup-media.mjs`, com hash de cada arquivo |
| Estrutura do banco | Sim | As migrations do repositório; `schema.sql` fica como referência |
| Variáveis da Vercel e chaves do projeto | **Não** | Um projeto novo tem URL e chaves novas (§5, passo 6) |
| Configuração de Auth (URLs, modelos de e-mail, SMTP, cadastro público) | **Não** | Refazer conforme [GO-02](provisionamento-producao.md) e `supabase/templates` |
| Código, conteúdo versionado e arquivos de `public/` | Não precisa | Estão no repositório |

**Por que restaurar sobre as migrations.** O `schema.sql` não traz o trigger `on_auth_user_created` nem
as políticas `media:*` do Storage, porque `db dump` ignora os schemas `auth` e `storage`. Só com ele, uma
conta nova ficaria sem perfil e o bucket sem regras de acesso. As migrations trazem tudo isso.

**A cópia é sensível.** Ela contém dados pessoais e hashes de senha. Por isso:

- criptografar **antes** de enviar ao Drive e guardar a senha **fora** do Drive;
- nunca colocar na pasta do repositório (`backup-media.mjs` recusa), em chat, issue ou conta pessoal;
- nunca restaurar em desenvolvimento: dado de produção não vai para outro ambiente (ARC-06). O teste de
  restauração usa só dados fictícios;
- apagar da máquina tudo o que não estiver criptografado assim que terminar.

## 4. Rotina semanal de cópia

**Quando:** toda semana e, além disso, no mesmo dia e antes de aplicar migrations em produção.

**Quem:** responsável pelo banco. Backup: quem estiver designado na tabela do início.

**Precisa de:** Git Bash (traz `tar` e `gpg`), Docker aberto, CLI do Supabase 3.x vinculada à produção,
senha do banco e um arquivo de variáveis **fora do repositório** com `NEXT_PUBLIC_SUPABASE_URL` e
`SUPABASE_SERVICE_ROLE_KEY` de produção.

Rode pela raiz do repositório, sem ninguém publicando no painel. O dump vem antes dos arquivos: assim,
todo arquivo registrado no banco está na cópia.

```bash
COPIA="$HOME/agencia-benjamin-copia-$(date +%F)"
mkdir -p "$COPIA/banco"

npx supabase db dump --remote -f "$COPIA/banco/schema.sql"
npx supabase db dump --remote -f "$COPIA/banco/data.sql" --use-copy --data-only \
  -x storage.buckets_vectors -x storage.vector_indexes
node --env-file=<arquivo de variáveis> scripts/backup-media.mjs baixar --pasta "$COPIA/midia"

(cd "$COPIA" && tar -cf pacote.tar banco midia \
  && gpg --symmetric --cipher-algo AES256 --output "$COPIA.tar.gpg" pacote.tar)
```

Depois:

1. Entrar no Google Drive com a conta institucional do NúcleoTech e enviar `agencia-benjamin-copia-AAAA-MM-DD.tar.gpg`.
2. Conferir no Drive o nome e o tamanho do arquivo.
3. Apagar a cópia local: `rm -rf "$COPIA" "$COPIA.tar.gpg"`.
4. No painel do Supabase, conferir o uso do banco e da banda e se há aviso de pausa.
5. Registrar a data e quem fez na tabela do §7.

Se esta rotina atrasar, a perda possível passa de 7 dias. O atraso deve ser avisado à coordenação técnica.

## 5. Restauração

Use quando a produção se perdeu ou não pode ser recuperada de outro jeito. Para desfazer uma migration, veja
antes o [plano de rollback](release-e-rollback.md). Restaurar em um projeto novo substitui a produção, e o que
entrou depois da cópia se perde. Por isso, quem decide é a coordenação técnica, que comunica a Benjamin.

Meta: **120 minutos** a partir da decisão.

1. **Criar o projeto novo** na organização do NúcleoTech, na mesma região, e guardar a senha do banco.
2. **Aplicar as migrations** (nunca com `--include-seed`):
   ```bash
   npx supabase link --project-ref <ref-do-novo-projeto>
   npx supabase db push --remote
   ```
3. **Baixar e abrir a cópia**, pelo Drive institucional e fora do repositório:
   ```bash
   RECUPERADA="$HOME/agencia-benjamin-recuperada"
   mkdir -p "$RECUPERADA"
   gpg --decrypt --output "$RECUPERADA/pacote.tar" <arquivo>.tar.gpg
   (cd "$RECUPERADA" && tar -xf pacote.tar)
   ```
4. **Restaurar os dados**, numa transação só. A preparação recusa um banco que já tenha dados. A stack local
   precisa estar no ar, porque o comando usa o `psql` dela. Pegue a URL em **Connect → Session pooler**:
   ```bash
   cat supabase/restore/preparar-restauracao.sql "$RECUPERADA/banco/data.sql" \
     | docker exec -i supabase_db_landing-agencia-benjamin \
       psql "<url do banco>" --single-transaction -v ON_ERROR_STOP=1 -f -
   ```
5. **Devolver os arquivos**, com um arquivo de variáveis do projeto **novo**. O script confere o conteúdo:
   ```bash
   node --env-file=<variáveis do novo projeto> scripts/backup-media.mjs enviar \
     --pasta "$RECUPERADA/midia" --confirmar <ref-do-novo-projeto>.supabase.co
   ```
6. **Reconfigurar:** Auth conforme [GO-02](provisionamento-producao.md) (URLs, modelos, SMTP, cadastro público
   desligado) e as variáveis da Vercel com a URL e as chaves novas. Depois, publicar de novo e rodar
   `POST /api/internal/revalidate`.
7. **Reaplicar a retenção de dados pessoais antes de liberar o acesso** (TECH-08). A rotina ainda depende da
   DBX-05 e da aprovação dos prazos: enquanto isso, a coordenação técnica decide e registra como tratar os
   dados vencidos.
8. **Conferir antes de abrir:**
   - contagem por tabela contra o que era esperado da cópia;
   - login de uma conta real e leitura pelo painel;
   - uma imagem de case abrindo no site;
   - visitante vendo só o publicado;
   - formulário de teste gravando (apagar depois);
   - `select ambiente from public.ambiente_banco` retornando `producao`.
9. **Encerrar:** apagar `$RECUPERADA`, trocar a senha do banco e a chave de serviço se a origem do incidente
   puder envolvê-las, abrir a issue `[INCIDENTE]` e comunicar a Benjamin.

Se o `data.sql` falhar por tabela ou coluna que não existe, a versão de Auth ou Storage do projeto novo difere
da copiada: veja a [solução de problemas do Supabase](https://supabase.com/docs/guides/self-hosting/restore-from-platform#version-mismatches-between-platform-and-self-hosted).

**Projeto apenas pausado não precisa de restauração:** use **Resume project** no painel, com dados e configuração
preservados, por até 90 dias.

## 6. Como validar

```bash
npm run test:restore   # no Windows, pelo Git Bash
```

Só local e só com dados fictícios. **Apaga o banco local** e para a stack do projeto durante o teste. Ele percorre
os §4 e §5: cria um banco de teste, faz a cópia e o pacote criptografado, sobe uma stack nova em pasta temporária
só com as migrations, restaura e confere:

| Critério | O que é conferido |
| -------- | ----------------- |
| Integridade | Linhas e hash de cada tabela de `public`, `auth.users`, `auth.identities`, `storage.buckets` e `storage.objects`; hash de cada arquivo |
| Criptografia | O pacote não tem texto legível, e senha errada não abre |
| Arquivos | Sem o reenvio o arquivo não existe; depois dele, é idêntico ao original |
| Dados válidos | Editor cria rascunho; a conta antiga entra com a mesma senha; conta nova ganha perfil |
| Dados inválidos | Slug fora do formato e item nascendo publicado são recusados; visitante não grava |
| Visibilidade | Visitante vê só o publicado e não lê formulários nem lista o bucket |
| Proteções | O seed recusa o banco restaurado; a preparação recusa um banco com dados |
| Banco | Todos os testes pgTAP sobre os dados restaurados |

**O que este teste não cobre:**

- restauração em um projeto hospedado de verdade: conexão pelo pooler, permissão do `postgres` no Supabase hospedado
  e diferença de versão entre projetos;
- tempo real: o teste local leva segundos com poucos dados, e os 120 minutos incluem criar o projeto, reconfigurar e
  conferir. A meta ainda não foi cronometrada;
- envio e download pelo Google Drive.

## 7. Registro

| Data | O quê | Quem | Resultado |
| ---- | ----- | ---- | --------- |
| 04/11/2026 | `npm run test:restore` na `main` (`c576766`) | Vinícius Binda | Tudo verde: 22 tabelas conferidas, pgTAP `Files=9, Tests=214, Result: PASS` |
| 04/11/2026 | `npm run test:restore` com as migrations da DBX-04 (#372) | Vinícius Binda | Tudo verde: pgTAP `Files=10, Tests=262, Result: PASS` |
| — | **Primeira cópia real da produção** | — | Pendente |

## 8. Pendências

- [ ] **Primeira cópia real** da produção, seguindo o §4. Até ela existir, o item E10 do go/no-go segue pendente.
- [ ] **Onde guardar a senha da criptografia.** Não pode ser o Drive. A documentação cita um "cofre da equipe", sem dizer qual
      é. Sem essa senha, nenhuma cópia pode ser restaurada.
- [ ] **Quem acessa a conta institucional do Drive.** Com uma conta só, não dá para saber quem fez cada acesso: definir quem
      tem a senha, com autenticação em dois fatores.
- [ ] **Quantas cópias manter.** Segue a retenção da DBX-05, com prazos ainda sem aprovação. Sugestão a validar: as 4 mais
      recentes, apagando as demais do Drive e da lixeira.
- [ ] **Ensaio em projeto hospedado**, com os dados fictícios, para cobrir o que o §6 não cobre e cronometrar os 120 minutos.
