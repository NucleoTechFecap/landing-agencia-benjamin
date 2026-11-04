/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : preparar-restauracao.sql
 Descrição    : Prepara um projeto novo, já com as migrations, para receber o data.sql de uma cópia.

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinicius Binda             Criação inicial (DB-10).
──────────────────────────────────────────────────────────────────────────────
*/

-- Roda na mesma transação do data.sql (docs/operacao/backup-e-recuperacao.md §5). As migrations já
-- gravam a matriz de permissões e o bucket, e a cópia traz os dois de novo: sem esta limpeza, o
-- COPY falha por chave repetida.

-- Nunca roda sobre um banco em uso: projeto novo não tem conta, conteúdo nem envio de formulário.
do $$
begin
  if exists (select 1 from auth.users)
     or exists (select 1 from public.cases)
     or exists (select 1 from public.services)
     or exists (select 1 from public.form_submissions) then
    raise exception 'Restauração recusada: este banco já tem dados. Use um projeto novo.';
  end if;
end;
$$;

-- Dispara nenhum trigger até o fim da transação: o dump já traz o resultado deles (perfil de cada
-- conta, carimbos, endereços antigos), e repeti-los duplicaria ou alteraria dados.
set local session_replication_role = replica;

truncate public.role_permissions;
delete from storage.buckets where id = 'media';
