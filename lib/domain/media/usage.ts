/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : usage.ts
 Descrição    : Onde um arquivo da biblioteca de mídia é usado no conteúdo.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-09).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

import { PUBLICATION_STATUS_LABELS, type PublicationStatus } from "@/lib/domain/content/publication-status";
import type { ContentSnapshot, Page } from "@/lib/domain/content/types";
import type { SiteTheme } from "@/lib/domain/content/theme";

/** O que identifica um arquivo da biblioteca nos dois tipos de referência do conteúdo. */
export interface MediaIdentity {
  id: string;
  src: string;
  /** Chave do bucket ou caminho em /public (começa com "/"). */
  path: string;
}

export type MediaUsagePlace = "imagem" | "capa" | "galeria" | "foto do time" | "compartilhamento" | "aparência";

export interface MediaUsage {
  entity: "service" | "case" | "page" | "theme";
  id: string;
  slug: string;
  name: string;
  status: PublicationStatus;
  place: MediaUsagePlace;
}

const ENTITY_LABELS: Record<MediaUsage["entity"], string> = {
  service: "Serviço",
  case: "Case",
  page: "Página",
  theme: "Site",
};

/** Endereços de imagem em qualquer profundidade de um conteúdo guardado em JSON. */
function imageSources(value: unknown, found: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((item) => imageSources(item, found));
  else if (typeof value === "object" && value !== null) {
    const { src } = value as { src?: unknown };
    if (typeof src === "string") found.push(src);
    Object.values(value).forEach((item) => imageSources(item, found));
  }
  return found;
}

const UUID_PREFIX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i;

/** Nome do arquivo sem a pasta e sem o UUID que o caminho do Storage leva. */
export function mediaDisplayName(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1).replace(UUID_PREFIX, "");
}

/**
 * Todos os usos do arquivo, em qualquer estado. Capa, galeria e imagem de serviço também são
 * protegidas por FK no banco; a foto do bloco "Nosso time" fica em JSON e só esta busca a enxerga.
 */
export function findMediaUsage(
  asset: MediaIdentity,
  content: Pick<ContentSnapshot, "services" | "cases"> & { pages: Page[]; theme?: SiteTheme },
): MediaUsage[] {
  const isPhoto = (src: string) => src === asset.src || (!asset.path.startsWith("/") && src.endsWith(`/${asset.path}`));
  const usage: MediaUsage[] = [];

  for (const service of content.services) {
    if (service.image?.id === asset.id) {
      const { id, slug, name, status } = service;
      usage.push({ entity: "service", id, slug, name, status, place: "imagem" });
    }
    if (service.seo?.ogImage && isPhoto(service.seo.ogImage.src)) {
      const { id, slug, name, status } = service;
      usage.push({ entity: "service", id, slug, name, status, place: "compartilhamento" });
    }
  }
  for (const item of content.cases) {
    const base = { entity: "case" as const, id: item.id, slug: item.slug, name: item.title, status: item.status };
    if (item.cover?.id === asset.id) usage.push({ ...base, place: "capa" });
    if (item.gallery.some((photo) => photo.id === asset.id)) usage.push({ ...base, place: "galeria" });
    if (item.seo?.ogImage && isPhoto(item.seo.ogImage.src)) usage.push({ ...base, place: "compartilhamento" });
  }
  for (const page of content.pages) {
    const inTeam = page.blocks.some(
      (block) =>
        block.type === "team" &&
        block.content.members.some((member) => member.photo !== undefined && isPhoto(member.photo.src)),
    );
    if (inTeam) {
      const { id, slug, title: name, status } = page;
      usage.push({ entity: "page", id, slug, name, status, place: "foto do time" });
    }
    // Campos e blocos descritos por catálogo guardam a imagem em JSON: o banco não protege com FK.
    const otherBlocks = page.blocks.filter((block) => block.type !== "team").map((block) => block.content);
    if (imageSources([otherBlocks, page.fields?.values]).some(isPhoto)) {
      const { id, slug, title: name, status } = page;
      usage.push({ entity: "page", id, slug, name, status, place: "imagem" });
    }
    if (page.seo?.ogImage && isPhoto(page.seo.ogImage.src)) {
      const { id, slug, title: name, status } = page;
      usage.push({ entity: "page", id, slug, name, status, place: "compartilhamento" });
    }
  }
  if (imageSources(content.theme?.images).some(isPhoto)) {
    usage.push({ entity: "theme", id: "site", slug: "", name: "Aparência", status: "published", place: "aparência" });
  }
  return usage;
}

/** Texto do uso, para as listas do painel. */
export function describeMediaUsage(usage: MediaUsage): string {
  return `${ENTITY_LABELS[usage.entity]} "${usage.name}": ${usage.place} (${PUBLICATION_STATUS_LABELS[usage.status].toLowerCase()})`;
}

/**
 * Onde a imagem não pode ficar sem texto alternativo: conteúdo publicado (R12) e foto do time, cujo
 * bloco recusa foto sem texto ao salvar.
 */
export function usageRequiresAlt(usage: MediaUsage): boolean {
  return usage.status === "published" || usage.place === "foto do time";
}
