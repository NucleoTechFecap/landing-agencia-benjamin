/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Supabase
 Arquivo      : 20261109000100_db06_integridade_dos_envios.sql
 Descrição    : O banco recusa envio de formulário com forma inválida, mesmo vindo do servidor.

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 09/11/2026
 Modificado em: 09/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 09/11/2026 Vinicius Binda           Criação inicial (DB-06).
──────────────────────────────────────────────────────────────────────────────
*/

-- Quem grava os envios é o servidor, com service_role, que passa por cima da RLS. Até aqui o banco só
-- conferia `kind`, `status` e `notification_status`: um lead com conteúdo vazio, categoria de outro
-- tipo ou protocolo qualquer entrava. A validação continua na aplicação (`lib/domain/forms/schemas.ts`);
-- isto é a segunda barreira, para o que escapar dela, um script de manutenção ou o SQL Editor.
--
-- Regra de ouro: o banco NUNCA é mais rígido que a aplicação. Um envio que passou na validação e foi
-- recusado aqui vira erro de atendimento para o visitante (SERVICE_UNAVAILABLE), e o pedido se perde.
-- Por isso cada regra repete o que o código grava, e `lib/server/forms/forms-sql.test.ts` confere as duas
-- camadas: protocolo de `protocolFromId`, categoria de `routeSubmission`, origem de `technicalFieldsSchema`.
--
-- Ficam de fora de propósito:
--   - Campos obrigatórios do conteúdo de cada tipo: o mapa de campos aguarda a Agência Benjamin (FORM-01).
--     `payload` é jsonb justamente para isso: mudar campo muda o Zod, não o banco.
--   - Status por tipo: as etapas de atendimento também estão pendentes (TECH-06 §7).
--   - Formato de `fingerprint` e `ip_hash`: são detalhe do HMAC escolhido em `deps.ts`, nunca aparecem
--     para ninguém e podem mudar de algoritmo sem migration.
--   - Origem com `//`: a aplicação aceita, e o painel a mostra como texto, nunca como link.
--
-- Num banco com envios, o `add constraint` confere as linhas existentes e falha inteiro se alguma não
-- servir. Conferência prévia, só leitura: docs/banco/dicionario-de-dados.md §13.

alter table public.form_submissions
  -- Conteúdo é sempre um objeto (`stripTechnical`). O teto fica bem acima do maior envio possível
  -- (cerca de 20 KB com 3.000 caracteres que o JSON escapa em 6 bytes) e só barra gravação descontrolada.
  add constraint form_submissions_payload_object
    check (jsonb_typeof(payload) = 'object'),
  add constraint form_submissions_payload_size
    check (octet_length(payload::text) <= 65536),
  -- `<kind>:<slug>`, com o prefixo do próprio tipo: "lead:audiovisual", "contact:imprensa",
  -- "feedback:aluno". Mesmo formato e limite de SLUG_PATTERN/SLUG_MAX_LENGTH, sem a lista de reservados
  -- nem o mínimo de 3 caracteres de `is_valid_slug`: o serviço de interesse não passa por elas.
  add constraint form_submissions_category_format
    check (
      category ~ '^[a-z]+:[a-z0-9]+(-[a-z0-9]+)*$'
      and split_part(category, ':', 1) = kind
      and char_length(category) <= char_length(kind) + 1 + 80
    ),
  -- `protocolFromId`: "AB-" e os 6 primeiros dígitos hexadecimais do id, em maiúsculas. Não é único (o
  -- id é a chave): uma colisão viraria `23505`, tratada como envio repetido, e o lead se perderia.
  add constraint form_submissions_protocol_format
    check (protocol ~ '^AB-[0-9A-F]{6}$'),
  -- Mesmo limite e formato de `sourcePath` em `technicalFieldsSchema`. Envio sem JavaScript grava nulo.
  add constraint form_submissions_source_path_format
    check (source_path is null or (char_length(source_path) <= 200 and source_path ~ '^/\S*$')),
  add constraint form_submissions_notification_attempts
    check (notification_attempts >= 0),
  -- `deliverNotification` corta a mensagem do provedor em 200 caracteres.
  add constraint form_submissions_notification_error_length
    check (last_notification_error is null or char_length(last_notification_error) <= 200);

comment on constraint form_submissions_category_format on public.form_submissions is
  '<kind>:<slug>, com o prefixo do próprio tipo (DB-06). Mesmo formato de routeSubmission.';
comment on constraint form_submissions_protocol_format on public.form_submissions is
  'AB- e 6 hexadecimais maiúsculos, como protocolFromId (DB-06). Não é único.';
