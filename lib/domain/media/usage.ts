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
 Modificado em: 12/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-09).
 12/11/2026 Codex                     Amplia gestão editorial e segurança do painel.
──────────────────────────────────────────────────────────────────────────────
*/

import { PUBLICATION_STATUS_LABELS, type PublicationStatus } from "@/lib/domain/content/publication-status";
import type { ContentSnapshot, Page } from "@/lib/domain/content/types";

/** O que identifica um arquivo da biblioteca nos dois tipos de referência do conteúdo. */
export interface MediaIdentity {
  id: string;
  src: string;
  /** Chave do bucket ou caminho em /public (começa com "/"). */
  path: string;
}

export type MediaUsagePlace = "imagem" | "capa" | "galeria" | "foto do time" | "imagem do bloco";

export interface MediaUsage {
  entity: "service" | "case" | "page";
  id: string;
  slug: string;
  name: string;
  status: PublicationStatus;
  place: MediaUsagePlace;
}

const ENTITY_LABELS: Record<MediaUsage["entity"], string> = { service: "Serviço", case: "Case", page: "Página" };

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
  content: Pick<ContentSnapshot, "services" | "cases"> & { pages: Page[] },
): MediaUsage[] {
  const isPhoto = (src: string) => src === asset.src || (!asset.path.startsWith("/") && src.endsWith(`/${asset.path}`));
  const usage: MediaUsage[] = [];

  for (const service of content.services) {
    if (service.image?.id === asset.id) {
      const { id, slug, name, status } = service;
      usage.push({ entity: "service", id, slug, name, status, place: "imagem" });
    }
  }
  for (const item of content.cases) {
    const base = { entity: "case" as const, id: item.id, slug: item.slug, name: item.title, status: item.status };
    if (item.cover?.id === asset.id) usage.push({ ...base, place: "capa" });
    if (item.gallery.some((photo) => photo.id === asset.id)) usage.push({ ...base, place: "galeria" });
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
    if (page.blocks.some((block) => block.type === "image" && block.content.image.id === asset.id)) {
      const { id, slug, title: name, status } = page;
      usage.push({ entity: "page", id, slug, name, status, place: "imagem do bloco" });
    }
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
  return usage.status === "published" || usage.place === "foto do time" || usage.place === "imagem do bloco";
}
