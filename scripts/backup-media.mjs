/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Scripts
 Arquivo      : backup-media.mjs
 Descrição    : Copia os arquivos do bucket media para uma pasta e os devolve a um projeto, conferindo o conteúdo.

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

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/*
 * Cópia dos arquivos do bucket (DB-10). Os backups e o dump do banco só guardam os metadados, e a
 * CLI não copia o bucket inteiro em todos os ambientes, por isso a API. Passo a passo:
 * docs/operacao/backup-e-recuperacao.md.
 *
 * Uso, com um arquivo de variáveis fora do repositório:
 *   node --env-file=<arquivo> scripts/backup-media.mjs baixar --pasta <pasta vazia>
 *   node --env-file=<arquivo> scripts/backup-media.mjs enviar --pasta <pasta> --confirmar <host do destino>
 */
export const BUCKET = "media";
export const MANIFEST = "manifesto.json";
const FILES_DIR = "arquivos";
const PAGE_SIZE = 1000;

export const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

/** Lê e valida os argumentos. Lança erro com mensagem amigável. */
export function parseArgs(argv, env) {
  const [command, ...rest] = argv;
  if (command !== "baixar" && command !== "enviar") throw new Error("Informe o comando: baixar ou enviar.");
  const args = {};
  for (let index = 0; index < rest.length; index += 2) args[rest[index].replace(/^--/, "")] = rest[index + 1];

  for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
    if (!env[key]) throw new Error(`Variável ${key} ausente.`);
  }
  if (!args.pasta) throw new Error("Informe --pasta.");
  const host = new URL(env.NEXT_PUBLIC_SUPABASE_URL).host;
  // Enviar sobrescreve arquivos: quem roda digita o destino, como no provision-admin.
  if (command === "enviar" && args.confirmar !== host) throw new Error(`Confirme o destino com --confirmar ${host}.`);
  return {
    command,
    folder: resolve(args.pasta),
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    key: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

/** A cópia tem arquivos do cliente: dentro do repositório, um `git add` a publicaria. */
export function assertOutsideRepo(folder, repoRoot) {
  const path = relative(repoRoot, folder);
  // Em outra unidade do Windows, relative() devolve um caminho absoluto.
  if (path === "" || (!isAbsolute(path) && path !== ".." && !path.startsWith(`..${sep}`))) {
    throw new Error("A pasta da cópia precisa ficar fora do repositório.");
  }
}

/** O caminho vem do bucket ou do manifesto: nunca pode escapar da pasta da cópia. */
export function assertSafeObjectPath(path) {
  if (!path || path.startsWith("/") || path.includes("\\") || path.split("/").includes("..")) {
    throw new Error(`Caminho de arquivo recusado: ${path}`);
  }
}

async function listAll(storage, prefix = "") {
  const objects = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await storage.list(prefix, { limit: PAGE_SIZE, offset });
    if (error) throw new Error(`Falha ao listar o bucket: ${error.message}`);
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      // Pasta não tem metadados; ela só existe enquanto houver arquivo dentro.
      if (item.metadata) objects.push({ path, contentType: item.metadata.mimetype });
      else objects.push(...(await listAll(storage, path)));
    }
    if (data.length < PAGE_SIZE) return objects;
  }
}

async function download(storage, path) {
  const { data, error } = await storage.download(path);
  if (error) throw new Error(`Falha ao baixar ${path}: ${error.message || error.name}`);
  return Buffer.from(await data.arrayBuffer());
}

async function backup(storage, folder) {
  if (existsSync(folder) && readdirSync(folder).length) throw new Error("A pasta da cópia precisa estar vazia.");
  const files = [];
  for (const { path, contentType } of await listAll(storage)) {
    assertSafeObjectPath(path);
    const bytes = await download(storage, path);
    const target = join(folder, FILES_DIR, ...path.split("/"));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, bytes);
    files.push({ path, contentType, size: bytes.length, sha256: sha256(bytes) });
  }
  mkdirSync(folder, { recursive: true });
  writeFileSync(
    join(folder, MANIFEST),
    JSON.stringify({ bucket: BUCKET, createdAt: new Date().toISOString(), files }, null, 2),
  );
  console.log(`${files.length} arquivo(s) copiado(s), com o manifesto em ${MANIFEST}.`);
}

async function restore(storage, folder) {
  const { files } = JSON.parse(readFileSync(join(folder, MANIFEST), "utf8"));
  for (const { path, contentType, sha256: expected } of files) {
    assertSafeObjectPath(path);
    const bytes = readFileSync(join(folder, FILES_DIR, ...path.split("/")));
    if (sha256(bytes) !== expected) throw new Error(`Cópia corrompida: ${path}`);
    const { error } = await storage.upload(path, bytes, { contentType, upsert: true });
    if (error) throw new Error(`Falha ao enviar ${path}: ${error.message}`);
    if (sha256(await download(storage, path)) !== expected)
      throw new Error(`Conteúdo diferente depois do envio: ${path}`);
  }
  console.log(`${files.length} arquivo(s) enviado(s) e conferido(s).`);
}

async function run() {
  const { command, folder, url, key } = parseArgs(process.argv.slice(2), process.env);
  assertOutsideRepo(folder, resolve(dirname(fileURLToPath(import.meta.url)), ".."));
  const { createClient } = await import("@supabase/supabase-js");
  const storage = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }).storage.from(
    BUCKET,
  );
  await (command === "baixar" ? backup : restore)(storage, folder);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
