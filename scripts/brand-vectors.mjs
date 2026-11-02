/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Scripts
 Arquivo      : brand-vectors.mjs
 Descrição    : Gera os SVGs de ícones, stickers e redes sociais a partir dos arquivos .ai da marca.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 02/11/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 02/11/2026 Vinícius Nishimura Reis  Criação inicial (marca em vetor).
──────────────────────────────────────────────────────────────────────────────
*/

// Uso: node scripts/brand-vectors.mjs
// Requer Inkscape e o módulo Python `scour` (ver assets/brand/README.md).
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BRAND = "assets/brand";
const PUBLIC = "public/brand";

const ICON_COLORS = ["verde-claro", "verde", "lima", "laranja", "rosa", "azul"];
const STAR_8_COLORS = ["nyanza", "verde", "lima", "laranja", "rosa", "azul"];
const STICKER_COLORS = ["verde", "lima", "laranja", "rosa", "azul"];

// Grade de assets.ai: 11 linhas com dois blocos de 6 ícones. `null` não é publicado
// ("Café V1", a xícara com fumaça, não faz parte das exportações oficiais do pacote).
const ICON_ROWS = [
  ["rp-golfinho-v1", "pp-galo-v1"],
  ["rp-golfinho-v2", "pp-galo-v2"],
  ["calendario", "megafone"],
  ["like", "salvo"],
  ["enviado", "comentario"],
  ["chapeu", "hermes"],
  ["coracao", "estrela"],
  ["raio", "estrela-8-pontas"],
  ["interrogacao", "exclamacao"],
  ["seta", "seta-curva"],
  ["xicara", null],
];

// Páginas de stickers-drop-01.ai. As páginas 6 e 12 estão vazias.
const STICKER_PAGES = {
  benja: [1, 2, 3, 4, 5],
  "poupa-meu-tempo": [7, 8, 9, 10, 11],
  "fofoca-aceitas": [13, 14, 15, 16, 17],
  "publi-amigos-v1": [19, 20, 21, 22, 23],
  rplovers: [25, 26, 27, 28, 29],
  "publi-amigos-v2": [31, 32, 33, 34, 35],
  pokkk: [37, 38, 39, 40, 41],
  "ta-no-briefing": [18, 24, 30, 36, 42],
};

// Páginas de icons-wpp.ai usadas nos links de redes sociais.
const SOCIAL_PAGES = { instagram: 8, tiktok: 9, linkedin: 10 };
const WHATSAPP_BACKGROUND = "#24d139";

const workDir = mkdtempSync(join(tmpdir(), "brand-vectors-"));

function importPage(pdf, page, ...extraArgs) {
  const output = join(workDir, `page-${page}.svg`);
  execFileSync(
    "inkscape",
    [
      "--pdf-poppler",
      `--pages=${page}`,
      pdf,
      "--export-type=svg",
      "--export-plain-svg",
      ...extraArgs,
      `--export-filename=${output}`,
    ],
    { stdio: "ignore" },
  );
  return readFileSync(output, "utf8");
}

function optimize(source, output) {
  const input = join(workDir, "input.svg");
  writeFileSync(input, source);
  execFileSync(
    "python3",
    [
      "-m",
      "scour.scour",
      "-i",
      input,
      "-o",
      output,
      "--enable-viewboxing",
      "--enable-id-stripping",
      "--enable-comment-stripping",
      "--shorten-ids",
      "--remove-metadata",
      "--strip-xml-prolog",
      "--set-precision=5",
      "--create-groups",
      "--no-line-breaks",
    ],
    { stdio: "ignore" },
  );
}

const attribute = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

/** rgb(10%, 20%, 30%) do poppler → #1a334d. */
function toHex(color) {
  const channels = color?.match(/rgb\(([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)%\)/);
  if (!channels) return color;
  const hex = channels.slice(1, 4).map((value) =>
    Math.round((Number(value) * 255) / 100)
      .toString(16)
      .padStart(2, "0"),
  );
  return `#${hex.join("")}`;
}

/** Caminhos de primeiro nível da página (depois de <defs>), na ordem de desenho. */
function parsePaths(svg) {
  const body = svg.slice(svg.indexOf("</defs>"));
  return [...body.matchAll(/<path\b[^>]*?\/>/gs)].map(([tag]) => {
    const matrix = attribute(tag, "transform")
      ?.match(/matrix\(([^)]+)\)/)?.[1]
      .split(/[\s,]+/)
      .map(Number);
    const segments = [...attribute(tag, "d").matchAll(/([MLCZ])([^MLCZ]*)/g)].map(([, command, args]) => ({
      command,
      values: args.trim() ? args.trim().split(/\s+/).map(Number) : [],
    }));
    if (matrix) {
      const [a, b, c, d, e, f] = matrix;
      for (const { values } of segments) {
        for (let i = 0; i < values.length; i += 2) {
          const [x, y] = [values[i], values[i + 1]];
          values[i] = a * x + c * y + e;
          values[i + 1] = b * x + d * y + f;
        }
      }
    }
    const strokeWidth = Number(attribute(tag, "stroke-width") ?? 0) * (matrix ? Math.hypot(matrix[0], matrix[1]) : 1);
    const path = {
      segments,
      fill: toHex(attribute(tag, "fill")),
      stroke: toHex(attribute(tag, "stroke")),
      strokeWidth,
      linecap: attribute(tag, "stroke-linecap"),
      linejoin: attribute(tag, "stroke-linejoin"),
      miterlimit: attribute(tag, "stroke-miterlimit"),
    };
    return { ...path, box: pathBox(path) };
  });
}

/** Extremos de uma Bézier cúbica em um eixo, para a caixa não sobrar além do desenho. */
function cubicExtremes(p0, p1, p2, p3) {
  const a = -p0 + 3 * p1 - 3 * p2 + p3;
  const b = 2 * (p0 - 2 * p1 + p2);
  const c = p1 - p0;
  const roots =
    Math.abs(a) < 1e-9
      ? Math.abs(b) < 1e-9
        ? []
        : [-c / b]
      : [
          (-b + Math.sqrt(Math.max(b * b - 4 * a * c, 0))) / (2 * a),
          (-b - Math.sqrt(Math.max(b * b - 4 * a * c, 0))) / (2 * a),
        ];
  const at = (t) => (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3;
  return [p0, p3, ...roots.filter((t) => t > 0 && t < 1).map(at)];
}

function pathBox({ segments, stroke, strokeWidth }) {
  const xs = [];
  const ys = [];
  let current = [0, 0];
  for (const { command, values } of segments) {
    if (command === "C") {
      for (let i = 0; i < values.length; i += 6) {
        const [x1, y1, x2, y2, x, y] = values.slice(i, i + 6);
        xs.push(...cubicExtremes(current[0], x1, x2, x));
        ys.push(...cubicExtremes(current[1], y1, y2, y));
        current = [x, y];
      }
    } else if (values.length) {
      for (let i = 0; i < values.length; i += 2) {
        xs.push(values[i]);
        ys.push(values[i + 1]);
        current = [values[i], values[i + 1]];
      }
    }
  }
  const pad = stroke && stroke !== "none" ? strokeWidth / 2 : 0;
  return { x0: Math.min(...xs) - pad, y0: Math.min(...ys) - pad, x1: Math.max(...xs) + pad, y1: Math.max(...ys) + pad };
}

/** Agrupa intervalos sobrepostos em um eixo: cada grupo é uma linha ou coluna da grade. */
function groupByAxis(items, start, end) {
  const sorted = [...items].sort((a, b) => a.box[start] - b.box[start]);
  const groups = [];
  for (const item of sorted) {
    const last = groups.at(-1);
    if (last && item.box[start] <= last.end) {
      last.items.push(item);
      last.end = Math.max(last.end, item.box[end]);
    } else {
      groups.push({ items: [item], end: item.box[end] });
    }
  }
  return groups.map((group) => group.items);
}

const round = (value) => Number(value.toFixed(2));

/** Monta um SVG recortado no desenho, com o lado maior em 1000 unidades (precisão independe da prancheta). */
function buildSvg(paths) {
  const x0 = Math.min(...paths.map((path) => path.box.x0));
  const y0 = Math.min(...paths.map((path) => path.box.y0));
  const x1 = Math.max(...paths.map((path) => path.box.x1));
  const y1 = Math.max(...paths.map((path) => path.box.y1));
  const scale = 1000 / Math.max(x1 - x0, y1 - y0);
  const shapes = paths.map((path) => {
    const d = path.segments
      .map(({ command, values }) => {
        const points = values.map((value, index) => round((value - (index % 2 ? y0 : x0)) * scale));
        return `${command}${points.join(" ")}`;
      })
      .join("");
    const attributes = [`d="${d}"`, `fill="${path.fill ?? "none"}"`];
    if (path.stroke && path.stroke !== "none") {
      attributes.push(`stroke="${path.stroke}"`, `stroke-width="${round(path.strokeWidth * scale)}"`);
      if (path.linecap) attributes.push(`stroke-linecap="${path.linecap}"`);
      if (path.linejoin) attributes.push(`stroke-linejoin="${path.linejoin}"`);
      if (path.miterlimit) attributes.push(`stroke-miterlimit="${path.miterlimit}"`);
    }
    return `<path ${attributes.join(" ")}/>`;
  });
  const [width, height] = [round((x1 - x0) * scale), round((y1 - y0) * scale)];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${shapes.join("")}</svg>`;
}

function generateIcons() {
  const output = join(PUBLIC, "icons");
  mkdirSync(output, { recursive: true });
  const paths = parsePaths(importPage(join(BRAND, "icones/illustrator/assets.ai"), 1));
  const rows = groupByAxis(paths, "y0", "y1");
  if (rows.length !== ICON_ROWS.length)
    throw new Error(`assets.ai: ${rows.length} linhas, esperava ${ICON_ROWS.length}`);
  let total = 0;
  rows.forEach((row, rowIndex) => {
    const cells = groupByAxis(row, "x0", "x1");
    if (cells.length !== 12)
      throw new Error(`assets.ai: linha ${rowIndex + 1} com ${cells.length} ícones, esperava 12`);
    cells.forEach((cell, cellIndex) => {
      const family = ICON_ROWS[rowIndex][Math.floor(cellIndex / 6)];
      if (!family) return;
      const colors = family === "estrela-8-pontas" ? STAR_8_COLORS : ICON_COLORS;
      // Reordena para a ordem de desenho original: o agrupamento por eixo perde a sobreposição.
      const ordered = paths.filter((path) => cell.includes(path));
      optimize(buildSvg(ordered), join(output, `${family}-${colors[cellIndex % 6]}.svg`));
      total += 1;
    });
  });
  return total;
}

function generateStickers() {
  const output = join(PUBLIC, "stickers");
  mkdirSync(output, { recursive: true });
  const source = join(BRAND, "stickers/illustrator/stickers-drop-01.ai");
  let total = 0;
  for (const [name, pages] of Object.entries(STICKER_PAGES)) {
    pages.forEach((page, index) => {
      optimize(importPage(source, page, "--export-area-drawing"), join(output, `${name}-${STICKER_COLORS[index]}.svg`));
      total += 1;
    });
  }
  return total;
}

function generateSocial() {
  const output = join(PUBLIC, "social");
  mkdirSync(output, { recursive: true });
  const source = join(BRAND, "whatsapp/illustrator/icons-wpp.ai");
  for (const [name, page] of Object.entries(SOCIAL_PAGES)) {
    // A prancheta traz fundo verde com textura: ficam só os caminhos do ícone.
    const paths = parsePaths(importPage(source, page)).filter((path) => path.fill !== WHATSAPP_BACKGROUND);
    optimize(buildSvg(paths), join(output, `${name}.svg`));
  }
  return Object.keys(SOCIAL_PAGES).length;
}

try {
  console.log(`Ícones: ${generateIcons()}`);
  console.log(`Stickers: ${generateStickers()}`);
  console.log(`Redes sociais: ${generateSocial()}`);
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
