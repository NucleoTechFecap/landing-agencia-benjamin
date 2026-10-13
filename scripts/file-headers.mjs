#!/usr/bin/env node
/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Scripts
 Arquivo      : file-headers.mjs
 Descrição    : Valida e insere o cabeçalho padrão nos arquivos de código do projeto.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ARC-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

export const SYSTEM_NAME = "Agência Benjamin Landing Page";
export const DEVELOPER = "Vinícius Nishimura Reis";

const HASH_COMMENT_EXTENSIONS = new Set([".sh", ".yml", ".yaml", ".toml"]);
export const TARGET_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".sql",
  ...HASH_COMMENT_EXTENSIONS,
]);
const IGNORED_DIRS = new Set([".git", ".next", "node_modules", "coverage", "out", "build", "docs"]);
const IGNORED_FILES = new Set(["next-env.d.ts"]);

const MODULE_BY_ROOT = {
  app: "App",
  components: "Components",
  lib: "Lib",
  content: "Content",
  scripts: "Scripts",
  supabase: "Supabase",
  tests: "Tests",
};

/** Módulo exibido no cabeçalho, derivado da primeira pasta do caminho relativo. */
export function moduleFor(relativePath) {
  const [first] = relativePath.split(/[\\/]/);
  if (!relativePath.includes("/") && !relativePath.includes(sep)) return "Config";
  return MODULE_BY_ROOT[first] ?? first.charAt(0).toUpperCase() + first.slice(1);
}

export function formatDate(date = new Date()) {
  return date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

/** Indica se o conteúdo já possui o cabeçalho padrão do projeto. */
export function hasHeader(content) {
  return content.slice(0, 2500).includes(`Sistema      : ${SYSTEM_NAME}`);
}

export function buildHeader({ fileName, module, description, date }) {
  const eq = "═".repeat(80);
  const dash = "─".repeat(78);
  const lines = [
    eq,
    ` Sistema      : ${SYSTEM_NAME}`,
    ` Módulo       : ${module}`,
    ` Arquivo      : ${fileName}`,
    ` Descrição    : ${description}`,
    "",
    ` Desenvolvedor: ${DEVELOPER}`,
    "",
    ` Projeto      : ${SYSTEM_NAME}`,
    " Versão       : 1.0.0",
    ` Criado em    : ${date}`,
    ` Modificado em: ${date}`,
    eq,
    "",
    " Histórico",
    ` ${dash}`,
    " Data        Autor                     Descrição",
    ` ${dash}`,
    ` ${date} ${DEVELOPER}  Criação inicial / atualização.`,
    dash,
  ];
  if (HASH_COMMENT_EXTENSIONS.has(extname(fileName))) {
    return `${lines.map((line) => `# ${line}`.trimEnd()).join("\n")}\n`;
  }
  return `/*\n${lines.join("\n")}\n*/\n`;
}

/** Insere o cabeçalho preservando shebang na primeira linha. */
export function withHeader(content, header) {
  if (content.startsWith("#!")) {
    const [shebang, ...rest] = content.split("\n");
    return `${shebang}\n${header}\n${rest.join("\n").replace(/^\n+/, "")}`;
  }
  return `${header}\n${content.replace(/^\n+/, "")}`;
}

export function listTargetFiles(rootDir) {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      const stats = statSync(fullPath);
      if (stats.isDirectory()) {
        if (!IGNORED_DIRS.has(entry)) walk(fullPath);
      } else if (TARGET_EXTENSIONS.has(extname(entry)) && !IGNORED_FILES.has(entry)) {
        files.push(fullPath);
      }
    }
  };
  walk(rootDir);
  return files.sort();
}

function run() {
  const rootDir = process.cwd();
  const writeMode = process.argv.includes("--write");
  const missing = [];

  for (const file of listTargetFiles(rootDir)) {
    const content = readFileSync(file, "utf8");
    if (hasHeader(content)) continue;
    const relativePath = relative(rootDir, file);
    missing.push(relativePath);
    if (writeMode) {
      const header = buildHeader({
        fileName: basename(file),
        module: moduleFor(relativePath),
        description: "Descrever a responsabilidade deste arquivo.",
        date: formatDate(),
      });
      writeFileSync(file, withHeader(content, header));
    }
  }

  if (missing.length === 0) {
    console.log("Cabeçalhos: todos os arquivos estão no padrão.");
    return;
  }
  if (writeMode) {
    console.log(`Cabeçalho adicionado em ${missing.length} arquivo(s). Revise as descrições:`);
    missing.forEach((file) => console.log(`  - ${file}`));
    return;
  }
  console.error(`Arquivos sem o cabeçalho padrão (${missing.length}):`);
  missing.forEach((file) => console.error(`  - ${file}`));
  console.error("Execute `npm run headers:write` e ajuste a descrição gerada.");
  process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  run();
}
