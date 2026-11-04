/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : block-input.ts
 Descrição    : Tradução entre o formulário de blocos e o conteúdo salvo.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

import type { BlockType, PageBlock } from "./blocks";

/** Pessoa do bloco "Nosso time" como vem do formulário; a foto é escolhida na biblioteca. */
export interface TeamMemberInput {
  name: string;
  role: string;
  photoId: string;
}

/** Campos enviados pelo formulário de bloco. Cada tipo usa só os seus. */
export interface BlockFormInput {
  fields: Readonly<Record<string, string>>;
  paragraphs: readonly string[];
  items: readonly string[];
  members: readonly TeamMemberInput[];
}

const present = (value: string | undefined) => value?.trim() || undefined;

/** Lista do formulário: uma linha por item, no formato "Título | texto" (texto opcional). */
export function parseItemLines(lines: readonly string[]): { title: string; text?: string }[] {
  return lines.map((line) => {
    const [title = "", ...rest] = line.split("|");
    const text = present(rest.join("|"));
    return { title: title.trim(), ...(text ? { text } : {}) };
  });
}

export const formatItemLines = (items: readonly { title: string; text?: string }[]): string =>
  items.map((item) => (item.text ? `${item.title} | ${item.text}` : item.title)).join("\n");

/** Linhas totalmente em branco são ignoradas; as demais seguem para a validação. */
export const filledMembers = (members: readonly TeamMemberInput[]): TeamMemberInput[] =>
  members.filter((member) => member.name.trim() || member.role.trim() || member.photoId);

/**
 * Conteúdo do bloco a partir do formulário, ainda sem validar (BLOCK_SCHEMAS decide). Campo em
 * branco vira ausente, para opcional continuar opcional. No "Nosso time", `photoId` ainda
 * precisa ser trocado pela imagem da biblioteca: só o servidor conhece a mídia.
 */
export function blockContentFromForm(type: BlockType, { fields, paragraphs, items, members }: BlockFormInput) {
  const field = (name: string) => present(fields[name]);
  switch (type) {
    case "rich-text":
      return { title: field("title"), fundo: field("fundo"), paragraphs };
    case "list":
      return { title: field("title"), fundo: field("fundo"), items: parseItemLines(items) };
    case "team":
      return {
        title: field("title"),
        fundo: field("fundo"),
        members: filledMembers(members).map((member) => ({
          name: member.name,
          role: present(member.role),
          photoId: member.photoId,
        })),
      };
    case "cta":
      return {
        title: field("title"),
        text: field("text"),
        label: field("label"),
        href: field("href"),
        fundo: field("fundo"),
      };
    case "manifesto":
      return { title: field("title"), paragraphs };
    case "about":
      return {
        title: field("title"),
        intro: field("intro"),
        valueProposition: field("valueProposition"),
        howWeWork: field("howWeWork"),
        fecapRelation: field("fecapRelation"),
      };
    default:
      // Os blocos descritos por campos são lidos em readFields, com a biblioteca de mídia.
      return {};
  }
}

const background = ({ fundo }: { fundo?: string }): Record<string, string> => (fundo ? { fundo } : {});

/** Valores salvos do bloco, no formato dos campos do formulário. */
export function blockFormValues(block: PageBlock): Record<string, string> {
  switch (block.type) {
    case "rich-text":
      return {
        title: block.content.title ?? "",
        ...background(block.content),
        paragraphs: block.content.paragraphs.join("\n"),
      };
    case "list":
      return {
        title: block.content.title ?? "",
        ...background(block.content),
        items: formatItemLines(block.content.items),
      };
    case "team":
      return { title: block.content.title ?? "", ...background(block.content) };
    case "cta":
      return {
        title: block.content.title,
        text: block.content.text ?? "",
        label: block.content.label,
        href: block.content.href,
        ...background(block.content),
      };
    case "manifesto":
      return { title: block.content.title, paragraphs: block.content.paragraphs.join("\n") };
    case "about":
      return { ...block.content };
    default:
      return {};
  }
}

const SUMMARY_LENGTH = 90;
const shorten = (value: string) =>
  value.length > SUMMARY_LENGTH ? `${value.slice(0, SUMMARY_LENGTH).trimEnd()}…` : value;

/** Uma linha que identifica o bloco na lista do painel. */
export function blockSummary(block: PageBlock): string {
  switch (block.type) {
    case "rich-text":
      return shorten(block.content.title ?? block.content.paragraphs[0]);
    case "list":
      return shorten(block.content.title ?? `${block.content.items.length} item(ns)`);
    case "team":
      return shorten(block.content.title ?? `${block.content.members.length} pessoa(s)`);
    case "cta":
      return shorten(`${block.content.title} → ${block.content.href}`);
    case "manifesto":
    case "about":
      return shorten(block.content.title);
    case "hero":
      return shorten(block.content.titulo);
    case "media-text":
      return shorten(block.content.titulo || block.content.paragrafos[0] || "Texto com imagem");
    case "image":
      return shorten(block.content.legenda || block.content.imagem.alt || "Imagem");
    case "cards":
      return shorten(block.content.titulo || `${block.content.itens.length} cartão(ões)`);
    case "gallery":
      return shorten(block.content.titulo || `${block.content.imagens.length} imagem(ns)`);
    case "faq":
      return shorten(block.content.titulo || `${block.content.itens.length} pergunta(s)`);
    case "buttons":
      return shorten(block.content.titulo || `${block.content.itens.length} botão(ões)`);
  }
}
