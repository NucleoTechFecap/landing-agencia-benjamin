/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : blocks.ts
 Descrição    : Catálogo de tipos de bloco das páginas editáveis e validação do conteúdo.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-03).
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 01/11/2026 Vinícius Nishimura Reis  Seção Nosso time como bloco opcional (SOB-03).
 04/11/2026 Vinícius Nishimura Reis  Foto do time só do bucket de mídia e só imagem (TECH-13, #369).
 04/11/2026 Vinícius Nishimura Reis  Páginas livres e blocos descritos por campos (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import { z } from "zod";
import { isCatalogSlug } from "./catalog";
import {
  choice,
  fieldsSchema,
  isValidLinkHref,
  lines,
  list,
  mediaSrc,
  optionalIcon,
  optionalImage,
  optionalLink,
  optionalText,
  requiredImage,
  text as textField,
  tone,
  type FieldDef,
} from "./fields";
import { aboutSchema, manifestoSchema } from "./settings-schema";
import { isValidSlug } from "./slug";
import { SECTION_TONE_NAMES } from "./tones";

/*
 * Páginas do CMS (tabelas pages/blocks, DB-01). Uma página cujo slug coincide com uma rota pública
 * acrescenta blocos depois das seções fixas daquela rota (ex.: "sobre" → /sobre). Os demais slugs são
 * páginas livres, servidas por app/(site)/[slug]: o conteúdo inteiro delas vem dos blocos.
 */
export const PAGE_ROUTES = {
  home: "/",
  sobre: "/sobre",
  areas: "/areas",
  servicos: "/servicos",
  cases: "/cases",
  contato: "/contato",
  feedback: "/feedback",
  privacidade: "/privacidade",
} as const;

export type RoutedPageSlug = keyof typeof PAGE_ROUTES;

/** Como cada rota aparece no painel. */
export const PAGE_ROUTE_LABELS: Readonly<Record<RoutedPageSlug, string>> = {
  home: "Home",
  sobre: "Sobre",
  areas: "Áreas de atuação",
  servicos: "Serviços",
  cases: "Cases",
  contato: "Contato",
  feedback: "Feedback",
  privacidade: "Privacidade",
};

export const ROUTED_PAGE_SLUGS = Object.keys(PAGE_ROUTES) as RoutedPageSlug[];

/** Endereços que uma página livre não pode usar: já têm dono no site ou são arquivos especiais. */
export const RESERVED_PAGE_SLUGS: ReadonlySet<string> = new Set([
  ...Object.keys(PAGE_ROUTES),
  "admin",
  "api",
  "apple-icon",
  "favicon",
  "icon",
  "llms",
  "manifest",
  "opengraph-image",
  "robots",
  "sitemap",
  "twitter-image",
]);

/** Página livre: tem endereço próprio e o conteúdo inteiro vem dos blocos. */
export const isFreePageSlug = (slug: string): boolean =>
  isValidSlug(slug) && !RESERVED_PAGE_SLUGS.has(slug) && !isCatalogSlug(slug);

/** Rota pública em que a página aparece, ou `null` quando ela não é uma página (menu, rodapé e modelos). */
export function pagePath(slug: string): string | null {
  if (Object.hasOwn(PAGE_ROUTES, slug)) return PAGE_ROUTES[slug as RoutedPageSlug];
  return isFreePageSlug(slug) ? `/${slug}` : null;
}

const FILL_IN = "Preencha este campo.";
const text = (max: number) =>
  z.string({ error: FILL_IN }).trim().min(1, FILL_IN).max(max, `Use no máximo ${max} caracteres.`);
const optionalTitle = text(120).optional();
/** Cor de fundo da seção; sem ela, o site alterna os tons claros. */
const optionalTone = z.enum(SECTION_TONE_NAMES).optional();

const toneField = (value: (typeof SECTION_TONE_NAMES)[number] = "nyanza") => tone("Cor de fundo", value);

/*
 * Blocos das páginas livres, descritos por campos (fields.ts): o formulário e a validação saem daqui.
 * Só texto puro, links com destino seguro e imagens da biblioteca.
 */
export const BLOCK_FIELDS = {
  hero: {
    etiqueta: optionalText("Etiqueta acima do título", "", { max: 80 }),
    titulo: textField("Título", "", { max: 160 }),
    texto: optionalText("Texto", "", { rows: 3, max: 600 }),
    icone: optionalIcon("Ícone"),
    botao: optionalLink("Botão principal", null),
    botao2: optionalLink("Botão secundário", null),
    fundo: toneField("verde"),
  },
  "media-text": {
    titulo: optionalText("Título", "", { max: 120 }),
    paragrafos: lines("Parágrafos", [], { hint: "Um parágrafo por linha." }),
    imagem: requiredImage("Imagem"),
    lado: choice("Lado da imagem", "direita", [
      { value: "direita", label: "À direita do texto" },
      { value: "esquerda", label: "À esquerda do texto" },
    ]),
    botao: optionalLink("Botão", null),
    fundo: toneField(),
  },
  image: {
    imagem: requiredImage("Imagem"),
    legenda: optionalText("Legenda", "", { max: 200 }),
    fundo: toneField(),
  },
  cards: {
    titulo: optionalText("Título", "", { max: 120 }),
    descricao: optionalText("Descrição", "", { rows: 2, max: 300 }),
    itens: list(
      "Cartões",
      {
        icone: optionalIcon("Ícone"),
        imagem: optionalImage("Imagem", null),
        titulo: textField("Título", "", { max: 120 }),
        texto: optionalText("Texto", "", { rows: 2, max: 600 }),
        link: optionalLink("Link", null),
      },
      [],
      { itemLabel: "Cartão", minItems: 1, maxItems: 12 },
    ),
    fundo: toneField(),
  },
  gallery: {
    titulo: optionalText("Título", "", { max: 120 }),
    imagens: list("Imagens", { imagem: requiredImage("Imagem") }, [], {
      itemLabel: "Imagem",
      minItems: 1,
      maxItems: 24,
    }),
    fundo: toneField(),
  },
  faq: {
    titulo: optionalText("Título", "", { max: 120 }),
    itens: list(
      "Perguntas",
      {
        pergunta: textField("Pergunta", "", { max: 200 }),
        resposta: textField("Resposta", "", { rows: 3, max: 1200 }),
      },
      [],
      { itemLabel: "Pergunta", minItems: 1, maxItems: 20 },
    ),
    fundo: toneField(),
  },
  buttons: {
    titulo: optionalText("Título", "", { max: 120 }),
    texto: optionalText("Texto", "", { rows: 2, max: 300 }),
    itens: list(
      "Botões",
      {
        label: textField("Texto do botão", "", { max: 60 }),
        href: textField("Destino", "", {
          max: 500,
          format: "href",
          hint: "Uma página do site (/contato) ou um link https.",
        }),
      },
      [],
      { itemLabel: "Botão", minItems: 1, maxItems: 4 },
    ),
    fundo: toneField("lima"),
  },
} as const satisfies Record<string, Readonly<Record<string, FieldDef>>>;

export type FieldBlockType = keyof typeof BLOCK_FIELDS;

export const isFieldBlock = (type: string): type is FieldBlockType => Object.hasOwn(BLOCK_FIELDS, type);

/*
 * Conteúdo de cada tipo de bloco. Só texto puro e listas: o site nunca renderiza HTML
 * vindo do banco (evita XSS); quebras de parágrafo viram itens do array.
 */
export const BLOCK_SCHEMAS = {
  /** Título opcional e parágrafos. */
  "rich-text": z.object({
    title: optionalTitle,
    fundo: optionalTone,
    paragraphs: z.array(text(1200)).min(1, "Escreva ao menos um parágrafo.").max(12, "Use no máximo 12 parágrafos."),
  }),
  /** Lista de destaques (ex.: proposta de valor, diferenciais). */
  list: z.object({
    title: optionalTitle,
    fundo: optionalTone,
    items: z
      .array(z.object({ title: text(120), text: text(600).optional() }))
      .min(1, "Inclua ao menos um item.")
      .max(12, "Use no máximo 12 itens."),
  }),
  /** "Nosso time" (SOB-03). Foto exige autorização de uso de imagem da pessoa. */
  team: z.object({
    title: optionalTitle,
    fundo: optionalTone,
    members: z
      .array(
        z.object({
          name: text(80),
          role: text(80).optional(),
          photo: z.object({ src: mediaSrc, alt: text(160) }).optional(),
        }),
      )
      .min(1, "Inclua ao menos uma pessoa.")
      .max(40, "Use no máximo 40 pessoas."),
  }),
  /** Faixa de chamada para ação com destino interno conhecido ou link https. */
  cta: z.object({
    title: text(120),
    text: text(300).optional(),
    label: text(40),
    href: z
      .string()
      .max(500)
      .refine(isValidLinkHref, "Use uma página do site (/contato), um link https, mailto: ou tel:."),
    fundo: optionalTone,
  }),
  /*
   * Textos que têm seção fixa no site: publicados, tomam o lugar do valor de site_settings
   * (RF-01). Vivem em página para o editor (page:edit) poder alterar, com rascunho e publicação;
   * site_settings só aceita settings:edit e grava direto no ar.
   */
  manifesto: manifestoSchema.omit({ provisional: true }),
  about: aboutSchema.omit({ provisional: true }),
  hero: fieldsSchema(BLOCK_FIELDS.hero),
  "media-text": fieldsSchema(BLOCK_FIELDS["media-text"]),
  image: fieldsSchema(BLOCK_FIELDS.image),
  cards: fieldsSchema(BLOCK_FIELDS.cards),
  gallery: fieldsSchema(BLOCK_FIELDS.gallery),
  faq: fieldsSchema(BLOCK_FIELDS.faq),
  buttons: fieldsSchema(BLOCK_FIELDS.buttons),
} as const;

export type BlockType = keyof typeof BLOCK_SCHEMAS;
export const BLOCK_TYPES = Object.keys(BLOCK_SCHEMAS) as BlockType[];

export type BlockContent<T extends BlockType> = z.infer<(typeof BLOCK_SCHEMAS)[T]>;

export type PageBlock = {
  [T in BlockType]: { id: string; type: T; content: BlockContent<T>; order: number };
}[BlockType];

/** Como cada tipo aparece no painel. */
export const BLOCK_LABELS: Readonly<Record<BlockType, string>> = {
  "rich-text": "Texto",
  list: "Lista de destaques",
  team: "Nosso time",
  cta: "Chamada para ação",
  manifesto: "Manifesto (topo da Home)",
  about: "Sobre a Benjamin",
  hero: "Abertura com título e botões",
  "media-text": "Texto com imagem",
  image: "Imagem",
  cards: "Cartões",
  gallery: "Galeria de imagens",
  faq: "Perguntas frequentes",
  buttons: "Botões",
};

/** Blocos que substituem uma seção fixa: só valem na página daquela seção, um por página. */
const SECTION_BLOCK_PAGES: Partial<Record<BlockType, RoutedPageSlug>> = { manifesto: "home", about: "sobre" };

export const isSectionBlock = (type: BlockType): boolean => Object.hasOwn(SECTION_BLOCK_PAGES, type);

/** Motivo para o tipo não poder entrar na página, ou `null` quando pode. */
export function blockRestriction(type: BlockType, slug: string, blocks: readonly PageBlock[]): string | null {
  if (type === "hero" && !isFreePageSlug(slug)) {
    return "A abertura só existe nas páginas novas: as demais já têm a própria, editável em Textos e imagens.";
  }
  const section = SECTION_BLOCK_PAGES[type];
  if (!section) return null;
  if (section !== slug) return `O bloco "${BLOCK_LABELS[type]}" só existe na página ${PAGE_ROUTE_LABELS[section]}.`;
  return blocks.some((block) => block.type === type) ? `Esta página já tem o bloco "${BLOCK_LABELS[type]}".` : null;
}

/** Tipos que ainda podem ser acrescentados à página. */
export const addableBlockTypes = (slug: string, blocks: readonly PageBlock[]): BlockType[] =>
  pagePath(slug) === null ? [] : BLOCK_TYPES.filter((type) => blockRestriction(type, slug, blocks) === null);

export function isBlockType(value: unknown): value is BlockType {
  return typeof value === "string" && Object.hasOwn(BLOCK_SCHEMAS, value);
}

export type ParsedBlock = { ok: true; block: PageBlock } | { ok: false; problem: string };

/** Valida um bloco vindo do banco. Tipo desconhecido ou conteúdo inválido não é exibido. */
export function parseBlock(raw: { id: string; type: string; content: unknown; order: number }): ParsedBlock {
  if (!isBlockType(raw.type)) return { ok: false, problem: `Tipo de bloco desconhecido: ${raw.type}.` };
  const result = BLOCK_SCHEMAS[raw.type].safeParse(raw.content);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join(".") || issue.message).join(", ");
    return { ok: false, problem: `Bloco ${raw.type} inválido (${fields}).` };
  }
  return { ok: true, block: { id: raw.id, type: raw.type, content: result.data, order: raw.order } as PageBlock };
}
