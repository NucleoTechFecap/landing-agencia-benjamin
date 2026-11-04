/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Scripts
 Arquivo      : test-restore.mjs
 Descrição    : Faz a cópia de um banco de teste e a restaura numa stack local nova, comparando tudo.

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

import { execFileSync, spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

/*
 * `npm run test:restore` (DB-10): percorre o procedimento de docs/operacao/backup-e-recuperacao.md
 * só com dados fictícios e só em máquina local. APAGA o banco local (db reset), como o
 * test:migrations, e para a stack do projeto durante o teste. Etapas:
 *   1. origem: seed, uma conta com senha, um envio de formulário, auditoria e dois arquivos;
 *   2. cópia: dump, arquivos do bucket, pacote criptografado; apaga o que não está cifrado;
 *   3. destino: stack nova em pasta temporária, só com as migrations, como um projeto recém-criado;
 *   4. restauração: decifra o pacote, restaura os dados e devolve os arquivos;
 *   5. conferência: linhas de todas as tabelas, arquivos, login, RLS e dados válidos e inválidos.
 */
const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const windows = process.platform === "win32";
const SOURCE_PROJECT = /^project_id\s*=\s*"([^"]+)"/m.exec(readFileSync(join(root, "supabase/config.toml"), "utf8"))[1];
const TARGET_PROJECT = "benjamin-restauracao";
const BUCKET = "media";
const FILES = [
  { path: "2026/11/imagem-ficticia.webp", contentType: "image/webp", bytes: randomBytes(2048) },
  { path: "2026/11/documento-ficticio.pdf", contentType: "application/pdf", bytes: randomBytes(4096) },
];
const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

const failures = [];
function check(what, ok, detail = "") {
  console.log(`  ${ok ? "✓" : "✗"} ${what}${!ok && detail ? `: ${detail}` : ""}`);
  if (!ok) failures.push(what);
}
function fail(message) {
  throw new Error(message);
}
const step = (title) => console.log(`\n▶ ${title}`);

/** O shell do Windows separa argumentos com espaço, e a pasta temporária pode ter um. */
const quoted = (arg) => (windows && /\s/.test(arg) ? `"${arg}"` : arg);
const npx = (args) => spawnSync("npx", args.map(quoted), { encoding: "utf8", shell: windows });

function supabase(workdir, ...args) {
  const result = npx(["supabase", ...args, ...(workdir ? ["--workdir", workdir] : [])]);
  if (result.status !== 0)
    fail(`supabase ${args.join(" ")} falhou:\n${`${result.stderr}${result.stdout}`.slice(-800)}`);
  return result.stdout;
}

/** Só aceita o Supabase local: a pasta temporária nunca é vinculada a um projeto remoto. */
function localStack(workdir) {
  const status = JSON.parse(
    execFileSync("npx", ["supabase", "status", "-o", "json", ...(workdir ? ["--workdir", quoted(workdir)] : [])], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      shell: windows,
    }),
  );
  if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(status.API_URL ?? ""))
    fail(`Recusado: ${status.API_URL} não é local.`);
  return { url: status.API_URL, anonKey: status.ANON_KEY, serviceRoleKey: status.SERVICE_ROLE_KEY };
}

function psql(project, input, extra = []) {
  const result = spawnSync(
    "docker",
    [
      "exec",
      "-i",
      `supabase_db_${project}`,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-qAt",
      ...extra,
    ],
    { input, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
  );
  return { ok: result.status === 0, out: result.stdout.trim(), err: result.stderr.trim() };
}

function query(project, sql) {
  const result = psql(project, sql);
  if (!result.ok) fail(`Consulta falhou: ${result.err}`);
  return result.out;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.error) fail(`${command} indisponível (${result.error.code}). No Windows, rode pelo Git Bash.`);
  if (result.status !== 0) fail(`${command} ${args[0]} falhou:\n${result.stderr.slice(-800)}`);
  return result.stdout;
}

const encrypt = (cwd, passphrase, input, output) =>
  run(
    "gpg",
    [
      "--batch",
      "--yes",
      "--pinentry-mode",
      "loopback",
      "--passphrase-fd",
      "0",
      "--symmetric",
      "--cipher-algo",
      "AES256",
      "--output",
      output,
      input,
    ],
    { cwd, input: passphrase },
  );
const decrypt = (cwd, passphrase, input, output) =>
  run(
    "gpg",
    ["--batch", "--yes", "--pinentry-mode", "loopback", "--passphrase-fd", "0", "--decrypt", "--output", output, input],
    { cwd, input: passphrase },
  );

/** Roda o script real da cópia, com as mesmas variáveis e argumentos do procedimento. */
function mediaBackup(stack, ...args) {
  run(process.execPath, [join(root, "scripts/backup-media.mjs"), ...args], {
    cwd: root,
    env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: stack.url, SUPABASE_SERVICE_ROLE_KEY: stack.serviceRoleKey },
  });
}

/** Número de linhas e hash de cada tabela do projeto, mais o que importa de auth e storage. */
const FINGERPRINT = `
create function pg_temp.impressao(p_table regclass, p_columns text default null) returns text language plpgsql as $f$
declare v_count bigint; v_hash text;
begin
  execute format($$select count(*), md5(coalesce(string_agg(x, '|' order by x), ''))
    from (select %s::text as x from %s t) s$$, coalesce(p_columns, 't'), p_table) into v_count, v_hash;
  return p_table::text || ' ' || v_count || ' ' || v_hash;
end $f$;
select pg_temp.impressao(format('public.%I', tablename)::regclass) from pg_tables where schemaname = 'public'
union all select pg_temp.impressao('auth.users', 'row(t.id, t.email, t.encrypted_password)')
union all select pg_temp.impressao('auth.identities', 'row(t.id, t.user_id, t.provider)')
union all select pg_temp.impressao('storage.buckets', 'row(t.id, t.public, t.file_size_limit, t.allowed_mime_types)')
union all select pg_temp.impressao('storage.objects', 'row(t.bucket_id, t.name)')
order by 1;`;

const STRUCTURE = `select 'gatilho de conta=' || (select count(*) from pg_trigger where tgname = 'on_auth_user_created')
  || ' políticas do bucket=' || (select count(*) from pg_policies where schemaname = 'storage' and policyname like 'media:%')
  || ' políticas de public=' || (select count(*) from pg_policies where schemaname = 'public')
  || ' tabelas sem RLS=' || (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity);`;

async function prepareSource(stack, account) {
  const admin = createClient(stack.url, stack.serviceRoleKey, clientOptions);
  const { data, error } = await admin.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
  });
  if (error) fail(`Conta de teste: ${error.message}`);
  account.id = data.user.id;
  query(
    SOURCE_PROJECT,
    `update public.profiles set role = 'editor', full_name = 'Conta de teste' where id = '${account.id}';`,
  );

  const { error: formError } = await admin.from("form_submissions").insert({
    id: randomUUID(),
    protocol: "TESTE-DB10",
    kind: "contact",
    category: "contact:geral",
    payload: { nome: "Pessoa Fictícia", email: "pessoa@teste.invalid" },
    fingerprint: randomBytes(16).toString("hex"),
  });
  if (formError) fail(`Envio de formulário: ${formError.message}`);

  const editor = createClient(stack.url, stack.anonKey, clientOptions);
  await editor.auth.signInWithPassword(account);
  const { error: auditError } = await editor.rpc("record_audit_event", {
    p_event: "content.updated",
    p_resource_type: "content",
    p_resource_id: null,
    p_outcome: "success",
    p_metadata: { entity: "service", slug: "teste-db10" },
  });
  if (auditError) fail(`Auditoria: ${auditError.message}`);

  // A cópia de um banco de produção leva a marcação junto, e o seed continua recusando o restaurado.
  query(SOURCE_PROJECT, "insert into public.ambiente_banco (ambiente) values ('producao');");

  for (const { path, contentType, bytes } of FILES) {
    const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, bytes, { contentType });
    if (uploadError) fail(`Envio de ${path}: ${uploadError.message}`);
  }
}

function makeBackup(stack, work, passphrase) {
  const copy = join(work, "copia");
  mkdirSync(join(copy, "banco"), { recursive: true });
  const dump = (name, ...flags) => supabase(null, "db", "dump", "-f", join(copy, "banco", name), ...flags);
  dump("schema.sql");
  dump("data.sql", "--use-copy", "--data-only", "-x", "storage.buckets_vectors", "-x", "storage.vector_indexes");
  mediaBackup(stack, "baixar", "--pasta", join(copy, "midia"));

  run("tar", ["-cf", "pacote.tar", "banco", "midia"], { cwd: copy });
  encrypt(copy, passphrase, "pacote.tar", "../pacote.tar.gpg");
  rmSync(copy, { recursive: true, force: true });
  check("só o pacote criptografado fica guardado", true);
  const head = readFileSync(join(work, "pacote.tar.gpg")).subarray(0, 4096).toString("latin1");
  check("o pacote não tem texto legível dos dados", !head.includes("COPY") && !head.includes("banco/"));
}

function createTarget(work) {
  const workdir = join(work, "destino");
  mkdirSync(join(workdir, "supabase"), { recursive: true });
  for (const folder of ["migrations", "tests", "templates"]) {
    cpSync(join(root, "supabase", folder), join(workdir, "supabase", folder), { recursive: true });
  }
  const config = readFileSync(join(root, "supabase/config.toml"), "utf8")
    .replace(/^project_id\s*=.*$/m, `project_id = "${TARGET_PROJECT}"`)
    .replace(/(\[db\.seed\][\s\S]*?^enabled\s*=\s*)true/m, "$1false");
  writeFileSync(join(workdir, "supabase/config.toml"), config);
  supabase(
    workdir,
    "start",
    "-x",
    "realtime,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor",
  );
  return workdir;
}

async function verify(target, account, beforeFingerprint, beforeStructure) {
  const admin = createClient(target.url, target.serviceRoleKey, clientOptions);
  const anon = createClient(target.url, target.anonKey, clientOptions);

  step("5. Conferência");
  const after = query(TARGET_PROJECT, FINGERPRINT);
  check("cada tabela tem as mesmas linhas e o mesmo conteúdo", after === beforeFingerprint);
  if (after !== beforeFingerprint) {
    const expected = new Set(beforeFingerprint.split("\n"));
    console.log(
      after
        .split("\n")
        .filter((line) => !expected.has(line))
        .map((line) => `    difere: ${line.split(" ")[0]}`)
        .join("\n"),
    );
  }
  check(
    "trigger de conta, políticas do bucket e RLS vieram das migrations",
    query(TARGET_PROJECT, STRUCTURE) === beforeStructure,
  );
  check(
    "a marcação de produção foi restaurada",
    query(TARGET_PROJECT, "select count(*) from public.ambiente_banco;") === "1",
  );

  for (const { path, bytes } of FILES) {
    const { data, error } = await admin.storage.from(BUCKET).download(path);
    check(`arquivo igual ao original: ${path}`, !error && Buffer.from(await data.arrayBuffer()).equals(bytes));
  }

  const editor = createClient(target.url, target.anonKey, clientOptions);
  const login = await editor.auth.signInWithPassword({ email: account.email, password: account.password });
  check("a conta antiga entra com a mesma senha", !login.error, login.error?.message);
  const { data: panel } = await editor.from("cases").select("id");
  const total = query(TARGET_PROJECT, "select count(*) from public.cases;");
  check("o editor vê os cases pelo painel, inclusive não publicados", String(panel?.length) === total);

  const { data: created, error: createdError } = await admin.auth.admin.createUser({
    email: `nova-${randomBytes(4).toString("hex")}@teste.local`,
    password: randomBytes(18).toString("base64url"),
    email_confirm: true,
  });
  check(
    "conta nova ganha perfil pendente",
    !createdError &&
      query(TARGET_PROJECT, `select role from public.profiles where id = '${created?.user?.id}';`) === "pending",
  );

  const { data: visible } = await anon.from("cases").select("id");
  const published = query(
    TARGET_PROJECT,
    "select count(*) from public.cases where status = 'published' and published_at <= now();",
  );
  check(
    "visitante vê só o que está publicado",
    String(visible?.length) === published && Number(published) < Number(total),
  );
  const { data: forms } = await anon.from("form_submissions").select("id");
  check("visitante não lê envios de formulário", !forms?.length);
  const { data: listed } = await anon.storage.from(BUCKET).list("2026/11");
  check("visitante não lista o bucket", !listed?.length);

  const slug = `area-db10-${randomBytes(3).toString("hex")}`;
  const valid = await editor.from("areas").insert({ slug, name: "Área de teste" });
  check("dado válido: editor cria rascunho", !valid.error, valid.error?.message);
  const invalid = await editor.from("areas").insert({ slug: "Slug Inválido", name: "Área de teste" });
  check("dado inválido: slug fora do formato é recusado", invalid.error?.code === "23514", invalid.error?.code);
  const forged = await editor
    .from("areas")
    .insert({ slug: `${slug}-2`, name: "Área de teste", status: "published", published_at: new Date().toISOString() });
  check("dado inválido: não nasce publicado", forged.error?.code === "42501", forged.error?.code);
  const denied = await anon.from("areas").insert({ slug: `${slug}-3`, name: "Área de teste" });
  check("visitante não grava", denied.error?.code === "42501", denied.error?.code);
  const refused = psql(TARGET_PROJECT, readFileSync(join(root, "supabase/seed.sql"), "utf8"));
  check("o seed recusa o banco restaurado", !refused.ok && refused.err.includes("Seed de desenvolvimento recusado"));
  const again = psql(TARGET_PROJECT, readFileSync(join(root, "supabase/restore/preparar-restauracao.sql"), "utf8"), [
    "--single-transaction",
    "-f",
    "-",
  ]);
  check("a preparação recusa um banco com dados", !again.ok && again.err.includes("Restauração recusada"));
}

async function main() {
  const source = localStack();
  const work = mkdtempSync(join(tmpdir(), "benjamin-restauracao-"));
  const passphrase = randomBytes(32).toString("base64url");
  const account = { email: "restauracao@teste.local", password: randomBytes(18).toString("base64url") };
  let targetDir = null;
  try {
    step("1. Origem: banco de teste com seed, conta, formulário, auditoria e arquivos");
    supabase(null, "db", "reset");
    await prepareSource(source, account);
    const beforeFingerprint = query(SOURCE_PROJECT, FINGERPRINT);
    const beforeStructure = query(SOURCE_PROJECT, STRUCTURE);
    console.log(`  ${beforeFingerprint.split("\n").length} tabelas conferidas; ${beforeStructure}`);

    step("2. Cópia: dump, bucket e pacote criptografado");
    makeBackup(source, work, passphrase);

    step("3. Destino: stack nova, só com as migrations");
    supabase(null, "stop");
    targetDir = createTarget(work);
    const target = localStack(targetDir);
    check(
      "o destino nasce sem contas e sem conteúdo",
      query(TARGET_PROJECT, "select (select count(*) from auth.users) + (select count(*) from public.cases);") === "0",
    );

    step("4. Restauração: decifra, restaura os dados e devolve os arquivos");
    const startedAt = Date.now();
    const recovered = join(work, "recuperada");
    mkdirSync(recovered);
    decrypt(work, passphrase, "pacote.tar.gpg", "recuperada/pacote.tar");
    run("tar", ["-xf", "pacote.tar"], { cwd: recovered });
    check(
      "senha errada não abre o pacote",
      spawnSync(
        "gpg",
        [
          "--batch",
          "--yes",
          "--pinentry-mode",
          "loopback",
          "--passphrase-fd",
          "0",
          "--decrypt",
          "--output",
          "errado.tar",
          "pacote.tar.gpg",
        ],
        { cwd: work, input: "senha-errada" },
      ).status !== 0,
    );

    const prepare = readFileSync(join(root, "supabase/restore/preparar-restauracao.sql"), "utf8");
    const data = readFileSync(join(recovered, "banco/data.sql"), "utf8");
    const restored = psql(TARGET_PROJECT, `${prepare}\n${data}`, ["--single-transaction", "-f", "-"]);
    if (!restored.ok) fail(`Restauração dos dados falhou:\n${restored.err.slice(-800)}`);
    check("os dados entram numa transação só", true);

    const admin = createClient(target.url, target.serviceRoleKey, clientOptions);
    const before = await admin.storage.from(BUCKET).download(FILES[0].path);
    check("sem devolver os arquivos, o banco restaurado não os tem", Boolean(before.error));
    mediaBackup(target, "enviar", "--pasta", join(recovered, "midia"), "--confirmar", new URL(target.url).host);
    console.log(`  tempo da restauração: ${Math.round((Date.now() - startedAt) / 1000)} s`);

    await verify(target, account, beforeFingerprint, beforeStructure);

    step("6. Testes do banco sobre os dados restaurados");
    // ambiente_banco.test.sql confere que a migration não marca o banco. A marcação já foi conferida.
    query(TARGET_PROJECT, "delete from public.ambiente_banco;");
    const pgtap = npx(["supabase", "test", "db", "--workdir", targetDir]);
    const summary = `${pgtap.stdout}${pgtap.stderr}`
      .split("\n")
      .filter((line) => /^Files=|^Result:/.test(line))
      .join(" ");
    check(
      `pgTAP ${summary}`,
      pgtap.status === 0,
      `${pgtap.stdout}${pgtap.stderr}`
        .split("\n")
        .filter((line) => /Failed|not ok|ERROR/.test(line))
        .slice(0, 8)
        .join(" | "),
    );
  } finally {
    step("7. Limpeza: remove o destino e a cópia e volta à stack do projeto");
    if (targetDir) npx(["supabase", "stop", "--no-backup", "--workdir", targetDir]);
    rmSync(work, { recursive: true, force: true });
    npx(["supabase", "start"]);
    npx(["supabase", "db", "reset"]);
  }
  if (failures.length) fail(`${failures.length} verificação(ões) falharam.`);
  console.log("\n✓ Cópia, restauração e conferência verificadas.");
}

main().catch((error) => {
  console.error(`\n✗ ${error.message}`);
  process.exitCode = 1;
});
