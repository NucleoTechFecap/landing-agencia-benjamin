# Roteiro de reprodução do ambiente com seed (ARC-11)

| Campo        | Valor                                                                          |
| ------------ | ------------------------------------------------------------------------------ |
| Issue        | ARC-11 (#52)                                                                   |
| Para quem    | Integrante que **não** preparou o seed e vai subir o ambiente do zero          |
| Tempo        | Cerca de 20 minutos, mais o download das imagens do Docker na primeira vez     |
| O que valida | Critério da issue: "um segundo integrante consegue reproduzir a partir da documentação" |

Siga os passos na ordem, usando só o que está escrito aqui e na página
[Começando](../wiki/Começando.md). Se precisar perguntar algo ou adivinhar um passo, anote na tabela
do fim: isso é uma falha da documentação, mesmo que você tenha conseguido continuar.

Tudo acontece na sua máquina. Em nenhum momento use chaves ou dados de produção. **Não registre
senhas nem chaves** no resultado.

## 1. Antes de começar

- Git, Docker Desktop **aberto** e Node na versão do `.nvmrc`.
- Portas `54321` a `54324` livres. Se outro projeto Supabase estiver rodando na sua máquina, pare-o
  primeiro com `npx supabase stop`, na pasta dele.

## 2. Instalar

```bash
git clone https://github.com/NucleoTechFecap/landing-agencia-benjamin.git
cd landing-agencia-benjamin
npm ci
cp .env.example .env.local      # no PowerShell: Copy-Item .env.example .env.local
```

## 3. Subir o banco com o seed

```bash
npx supabase start
npx supabase db reset
npx supabase test db
```

**Esperado:**

- O `db reset` mostra `Seeding data from supabase/seed.sql...` e termina sem erro.
- O `test db` termina com `Result: PASS`.

Confira os dados no Studio local (`http://127.0.0.1:54323`, **SQL Editor**):

```sql
select 'areas' tabela, count(*) from public.areas union all
select 'services', count(*) from public.services union all
select 'case_categories', count(*) from public.case_categories union all
select 'cases', count(*) from public.cases union all
select 'case_media', count(*) from public.case_media union all
select 'ctas', count(*) from public.ctas union all
select 'media_assets', count(*) from public.media_assets union all
select 'pages', count(*) from public.pages union all
select 'blocks', count(*) from public.blocks union all
select 'site_settings', count(*) from public.site_settings;
```

**Esperado:** 6 áreas, 10 serviços, 3 categorias, 5 cases, 2 itens de galeria, 5 CTAs, 4 mídias,
2 páginas, 5 blocos e 1 configuração.

## 4. Criar as contas de teste

```bash
npm run seed:users
```

**Esperado:** quatro linhas no terminal, uma por papel (`admin`, `editor`, `viewer` e `pending`), com
e-mail `@teste.local` e uma senha gerada na hora. Deixe o terminal aberto ou guarde as senhas só até
o fim do teste. Elas não ficam salvas em lugar nenhum; rodar o comando de novo gera outras.

## 5. Ligar o site ao banco local

```bash
npx supabase status -o env
```

Copie os valores para o `.env.local`:

| Saída do comando | Variável no `.env.local`        |
| ---------------- | ------------------------------- |
| `API_URL`        | `NEXT_PUBLIC_SUPABASE_URL`      |
| `ANON_KEY`       | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

```bash
npm run dev
```

Se o comando parar logo depois de `Ready` com um aviso de vulnerabilidade do Next.js, rode de novo.
É um aviso conhecido, e a segunda execução continua normalmente.

Abra **`http://localhost:3000`**, não `127.0.0.1`: o cookie de sessão só vale no primeiro endereço.

## 6. Conferir o site

| Endereço                             | Esperado                                                  |
| ------------------------------------ | --------------------------------------------------------- |
| `/cases`                             | Editora, Cafeteria e Instituto Exemplo, todos fictícios   |
| `/cases/editora-exemplo`             | Página do case, com galeria e "Pessoa Fictícia A" no time |
| `/cases/Editora-Exemplo`             | Redireciona para `/cases/editora-exemplo`                 |
| `/cases/case-ficticio-em-rascunho`   | 404 (rascunho)                                            |
| `/cases/case-ficticio-agendado`      | 404 (agendado para o futuro)                              |
| `/cases/meridiano`                   | 404 (cliente real, fora do seed)                          |
| `/servicos/audiovisual`              | Página do serviço                                         |
| `/servicos/servico-ficticio-arquivado` | 404 (arquivado)                                         |
| `/areas`                             | Depois das áreas: blocos "Bloco de texto fictício", "Lista fictícia", "Time fictício" e "Chamada fictícia" |

## 7. Conferir o painel

Entre em `/admin/login` com cada conta do passo 4:

| Conta     | Esperado                                                                    |
| --------- | --------------------------------------------------------------------------- |
| `admin`   | Painel aberto. Em **Cases**, 5 itens, incluindo rascunho e agendado, e o botão de novo case |
| `editor`  | Igual ao `admin` em **Cases**. Consegue editar um case e salvar             |
| `viewer`  | Vê os 5 cases, mas sem o botão de novo case                                 |
| `pending` | Continua na tela de login, com o aviso de que a conta ainda não tem acesso liberado |

## 8. Conferir a trava de produção

```bash
npm run test:migrations
```

**Atenção:** este comando apaga o banco local várias vezes, e as contas do passo 4 somem junto.

**Esperado:** a etapa 2 mostra `✓ banco marcado como produção recusa o seed sem inserir nada`, e o
final mostra `✓ Instalação limpa, seed, upgrade e reversão verificados.`

## 9. Registrar o resultado

Preencha e anexe à issue #52. Sem senhas, sem chaves.

| Campo                                             | Resultado |
| ------------------------------------------------- | --------- |
| Nome e data                                       |           |
| Sistema operacional, versão do Node e do Docker   |           |
| Commit testado (`git rev-parse --short HEAD`)     |           |

| Passo                  | Funcionou? | Precisou de ajuda ou adivinhou algo? O quê? |
| ---------------------- | ---------- | ------------------------------------------- |
| 2. Instalar            |            |                                             |
| 3. Banco e seed        |            |                                             |
| 4. Contas de teste     |            |                                             |
| 5. Ligar o site        |            |                                             |
| 6. Site                |            |                                             |
| 7. Painel              |            |                                             |
| 8. Trava de produção   |            |                                             |

O critério está cumprido quando todos os passos funcionam sem ajuda de quem preparou o seed. O que
faltou na documentação vira correção antes de fechar a issue.
