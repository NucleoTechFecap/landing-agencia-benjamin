/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : integrity.ts
 Descrição    : Regras de integridade, impacto de arquivamento e fallback de links do conteúdo.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-05).
──────────────────────────────────────────────────────────────────────────────
*/

import { validateSlug } from "./slug";
import type { CmsWarning } from "./cms-form";
import type { ContentEntityType, ContentSnapshot, CtaTarget, MediaRef, Publishable } from "./types";
import { isPubliclyVisible } from "./visibility";

/** Rotas públicas conhecidas: CTAs internos só podem apontar para elas (TECH-05). */
export const PUBLIC_ROUTE_PREFIXES = [
  "/",
  "/sobre",
  "/areas",
  "/servicos",
  "/cases",
  "/contato",
  "/feedback",
  "/privacidade",
];

/** Destino usado quando o alvo de um link deixa de estar visível (arquivado/excluído). */
export const FALLBACK_PATHS = {
  service: "/servicos",
  case: "/cases",
  area: "/areas",
  contact: "/contato",
} as const;

export const FEATURED_LIMITS = { services: 6, cases: 6 } as const;

export type IssueSeverity = "error" | "warning";

export interface IntegrityIssue {
  code: string;
  severity: IssueSeverity;
  entity: { type: ContentEntityType; id: string };
  message: string;
}

export function isValidInternalPath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  const pathname = path.split(/[?#]/)[0];
  return PUBLIC_ROUTE_PREFIXES.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isValidExternalUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Executa todas as regras de integridade sobre o conteúdo. Erros impedem publicar;
 * avisos são exibidos no CMS mas o site continua íntegro (usa fallback).
 */
export function findIntegrityIssues(snapshot: ContentSnapshot, now: Date = new Date()): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];
  const push = (code: string, severity: IssueSeverity, type: ContentEntityType, id: string, message: string) =>
    issues.push({ code, severity, entity: { type, id }, message });

  const areaIds = new Set(snapshot.areas.map((area) => area.id));
  const serviceIds = new Set(snapshot.services.map((service) => service.id));
  const categoryIds = new Set(snapshot.categories.map((category) => category.id));
  const caseIds = new Set(snapshot.cases.map((item) => item.id));
  const visible = (item?: Pick<Publishable, "status" | "publishedAt">) => Boolean(item && isPubliclyVisible(item, now));

  // R01/R02 — slugs válidos e únicos por tipo de entidade.
  const slugged: Array<[ContentEntityType, { id: string; slug: string }[]]> = [
    ["area", snapshot.areas],
    ["service", snapshot.services],
    ["category", snapshot.categories],
    ["case", snapshot.cases],
  ];
  for (const [type, items] of slugged) {
    const seen = new Map<string, string>();
    for (const item of items) {
      const problem = validateSlug(item.slug);
      if (problem) push("R01", "error", type, item.id, `Slug "${item.slug}" inválido (${problem}).`);
      const other = seen.get(item.slug);
      if (other) push("R02", "error", type, item.id, `Slug "${item.slug}" já usado por ${other}.`);
      seen.set(item.slug, item.id);
    }
  }

  // R03/R04/R05 — serviço pertence a pelo menos uma área existente.
  for (const service of snapshot.services) {
    if (service.areaIds.length === 0) push("R03", "error", "service", service.id, "Serviço sem área de atuação.");
    for (const id of service.areaIds) {
      if (!areaIds.has(id)) push("R04", "error", "service", service.id, `Área inexistente: ${id}.`);
    }
    const hasVisibleArea = service.areaIds.some((id) => visible(snapshot.areas.find((area) => area.id === id)));
    if (visible(service) && !hasVisibleArea) {
      push("R05", "warning", "service", service.id, "Serviço publicado sem área publicada.");
    }
    if (visible(service)) checkMedia("service", service.id, service.image ? [service.image] : [], push);
  }

  // R04/R06/R07 — case publicado exige categoria e ao menos um serviço visíveis.
  for (const item of snapshot.cases) {
    if (!categoryIds.has(item.categoryId))
      push("R04", "error", "case", item.id, `Categoria inexistente: ${item.categoryId}.`);
    for (const id of item.serviceIds) {
      if (!serviceIds.has(id)) push("R04", "error", "case", item.id, `Serviço inexistente: ${id}.`);
    }
    if (!visible(item)) continue;
    if (!visible(snapshot.categories.find((category) => category.id === item.categoryId))) {
      push("R06", "error", "case", item.id, "Case publicado com categoria não publicada.");
    }
    if (!item.serviceIds.some((id) => visible(snapshot.services.find((service) => service.id === id)))) {
      push("R07", "error", "case", item.id, "Case publicado sem serviço publicado relacionado.");
    }
    checkMedia("case", item.id, [...(item.cover ? [item.cover] : []), ...item.gallery], push);
    for (const link of item.externalLinks) {
      if (!isValidExternalUrl(link.url)) push("R09", "error", "case", item.id, `Link externo inválido: ${link.url}.`);
    }
  }

  // R04/R08/R09/R10 — CTAs.
  for (const cta of snapshot.ctas) {
    const target = cta.target;
    if (target.kind === "internal" && !isValidInternalPath(target.path)) {
      push("R10", "error", "cta", cta.id, `Caminho interno desconhecido: ${target.path}.`);
    }
    if (target.kind === "external" && !isValidExternalUrl(target.url)) {
      push("R09", "error", "cta", cta.id, `Link externo deve usar https: ${target.url}.`);
    }
    const reference = referencedId(target);
    if (reference) {
      const exists =
        reference.type === "service"
          ? serviceIds.has(reference.id)
          : reference.type === "case"
            ? caseIds.has(reference.id)
            : areaIds.has(reference.id);
      if (!exists) push("R04", "error", "cta", cta.id, `Destino inexistente: ${reference.type} ${reference.id}.`);
      else if (visible(cta) && !resolveCtaHref(target, snapshot, now).isTargetVisible) {
        push("R08", "warning", "cta", cta.id, "Destino não publicado: o site usará o link de fallback.");
      }
    }
  }

  // R11 — limites de destaque na Home.
  const featuredServices = snapshot.services.filter((service) => service.featured && visible(service));
  if (featuredServices.length > FEATURED_LIMITS.services) {
    push(
      "R11",
      "warning",
      "service",
      featuredServices[0].id,
      `Mais de ${FEATURED_LIMITS.services} serviços em destaque.`,
    );
  }
  const featuredCases = snapshot.cases.filter((item) => item.featured && visible(item));
  if (featuredCases.length > FEATURED_LIMITS.cases) {
    push("R11", "warning", "case", featuredCases[0].id, `Mais de ${FEATURED_LIMITS.cases} cases em destaque.`);
  }

  return issues;
}

function checkMedia(
  type: ContentEntityType,
  id: string,
  media: MediaRef[],
  push: (code: string, severity: IssueSeverity, type: ContentEntityType, id: string, message: string) => void,
) {
  // R12 — imagem publicada precisa de texto alternativo (acessibilidade, RNF-03).
  for (const item of media) {
    if (!item.alt.trim()) push("R12", "error", type, id, `Imagem sem texto alternativo: ${item.src}.`);
  }
}

function referencedId(target: CtaTarget): { type: "service" | "case" | "area"; id: string } | null {
  switch (target.kind) {
    case "service":
      return { type: "service", id: target.serviceId };
    case "case":
      return { type: "case", id: target.caseId };
    case "area":
      return { type: "area", id: target.areaId };
    case "contact":
      return target.serviceId ? { type: "service", id: target.serviceId } : null;
    default:
      return null;
  }
}

export interface ResolvedLink {
  href: string;
  external: boolean;
  /** Falso quando o alvo não está visível e o link caiu no fallback. */
  isTargetVisible: boolean;
}

/** Resolve o destino de um CTA garantindo que nunca aponte para página inexistente. */
export function resolveCtaHref(target: CtaTarget, snapshot: ContentSnapshot, now: Date = new Date()): ResolvedLink {
  switch (target.kind) {
    case "internal":
      return isValidInternalPath(target.path)
        ? { href: target.path, external: false, isTargetVisible: true }
        : { href: "/", external: false, isTargetVisible: false };
    case "external":
      return isValidExternalUrl(target.url)
        ? { href: target.url, external: true, isTargetVisible: true }
        : { href: "/", external: false, isTargetVisible: false };
    case "service": {
      const service = snapshot.services.find((item) => item.id === target.serviceId);
      return service && isPubliclyVisible(service, now)
        ? { href: `/servicos/${service.slug}`, external: false, isTargetVisible: true }
        : { href: FALLBACK_PATHS.service, external: false, isTargetVisible: false };
    }
    case "case": {
      const item = snapshot.cases.find((caseItem) => caseItem.id === target.caseId);
      return item && isPubliclyVisible(item, now)
        ? { href: `/cases/${item.slug}`, external: false, isTargetVisible: true }
        : { href: FALLBACK_PATHS.case, external: false, isTargetVisible: false };
    }
    case "area": {
      const area = snapshot.areas.find((item) => item.id === target.areaId);
      return area && isPubliclyVisible(area, now)
        ? { href: `/areas#${area.slug}`, external: false, isTargetVisible: true }
        : { href: FALLBACK_PATHS.area, external: false, isTargetVisible: false };
    }
    case "contact": {
      const service = target.serviceId ? snapshot.services.find((item) => item.id === target.serviceId) : undefined;
      const serviceVisible = Boolean(service && isPubliclyVisible(service, now));
      return {
        href: serviceVisible ? `/contato?servico=${service!.slug}#formulario` : `${FALLBACK_PATHS.contact}#formulario`,
        external: false,
        isTargetVisible: !target.serviceId || serviceVisible,
      };
    }
  }
}

export interface ImpactReport {
  /** Impedem a operação. */
  blockers: string[];
  /** Exibidos para confirmação; o site segue íntegro via fallback. */
  warnings: CmsWarning[];
}

/**
 * Avalia o impacto de arquivar (ou excluir) um item antes de executar (TECH-05):
 * nenhuma operação pode deixar página publicada quebrada.
 */
export function assessRemovalImpact(
  type: ContentEntityType,
  id: string,
  snapshot: ContentSnapshot,
  now: Date = new Date(),
): ImpactReport {
  const report: ImpactReport = { blockers: [], warnings: [] };
  const visibleCases = snapshot.cases.filter((item) => isPubliclyVisible(item, now));
  const visibleServices = snapshot.services.filter((item) => isPubliclyVisible(item, now));
  const ctasPointing = snapshot.ctas.filter((cta) => {
    const reference = referencedId(cta.target);
    return reference?.type === type && reference.id === id && isPubliclyVisible(cta, now);
  });

  if (type === "category") {
    const affected = visibleCases.filter((item) => item.categoryId === id);
    if (affected.length) report.blockers.push(`${affected.length} case(s) publicado(s) usam esta categoria.`);
  }

  if (type === "area") {
    const orphaned = visibleServices.filter(
      (service) =>
        service.areaIds.includes(id) &&
        !service.areaIds.some(
          (other) => other !== id && snapshot.areas.some((area) => area.id === other && isPubliclyVisible(area, now)),
        ),
    );
    if (orphaned.length) {
      report.blockers.push(
        `${orphaned.length} serviço(s) publicado(s) ficariam sem área: ${orphaned.map((s) => s.name).join(", ")}.`,
      );
    }
  }

  if (type === "service") {
    const dependentCases = visibleCases.filter((item) => item.serviceIds.includes(id));
    const wouldOrphan = dependentCases.filter(
      (item) =>
        !item.serviceIds.some((other) => other !== id && visibleServices.some((service) => service.id === other)),
    );
    if (wouldOrphan.length) {
      report.blockers.push(
        `${wouldOrphan.length} case(s) publicado(s) ficariam sem serviço: ${wouldOrphan.map((c) => c.title).join(", ")}.`,
      );
    } else if (dependentCases.length) {
      report.warnings.push("case-services-hidden");
    }
  }

  if (ctasPointing.length) {
    report.warnings.push("ctas-fallback");
  }
  return report;
}
