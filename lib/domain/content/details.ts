/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : details.ts
 Descrição    : Monta o detalhe de serviço e de case a partir do conteúdo: o que o visitante vê junto do item.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-14).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Area, CaseCategory, CaseStudy, ContentSnapshot, Service } from "./types";
import { isPubliclyVisible, visibleSorted } from "./visibility";

export interface CaseCard extends CaseStudy {
  categoryName: string;
  categorySlug: string;
}

export interface CaseDetail {
  item: CaseStudy;
  category: CaseCategory | null;
  services: Service[];
  areas: Area[];
}

export interface ServiceDetail {
  service: Service;
  areas: Area[];
  cases: CaseCard[];
}

export function toCaseCards(snapshot: ContentSnapshot, items: CaseStudy[], now: Date): CaseCard[] {
  return items.map((item) => {
    const category = snapshot.categories.find((entry) => entry.id === item.categoryId && isPubliclyVisible(entry, now));
    return { ...item, categoryName: category?.name ?? "", categorySlug: category?.slug ?? "" };
  });
}

/**
 * Áreas e cases do serviço. Quem chama decide se o serviço pode ser mostrado: o site só passa item
 * publicado, e a prévia passa também rascunho. Os vínculos seguem a regra pública nos dois casos,
 * para a prévia mostrar o que o visitante veria.
 */
export function serviceDetailOf(snapshot: ContentSnapshot, service: Service, now: Date): ServiceDetail {
  const areas = visibleSorted(
    snapshot.areas.filter((area) => service.areaIds.includes(area.id)),
    (area) => area.name,
    now,
  );
  const relatedCases = visibleSorted(
    snapshot.cases.filter((item) => item.serviceIds.includes(service.id)),
    (item) => item.title,
    now,
  );
  return { service, areas, cases: toCaseCards(snapshot, relatedCases, now) };
}

/** Categoria, serviços e áreas do case, com a mesma regra de `serviceDetailOf`. */
export function caseDetailOf(snapshot: ContentSnapshot, item: CaseStudy, now: Date): CaseDetail {
  const services = visibleSorted(
    snapshot.services.filter((service) => item.serviceIds.includes(service.id)),
    (service) => service.name,
    now,
  );
  const areaIds = new Set(services.flatMap((service) => service.areaIds));
  return {
    item,
    category:
      snapshot.categories.find((category) => category.id === item.categoryId && isPubliclyVisible(category, now)) ??
      null,
    services,
    areas: visibleSorted(
      snapshot.areas.filter((area) => areaIds.has(area.id)),
      (area) => area.name,
      now,
    ),
  };
}

/** "Outros serviços" do detalhe. */
export const pickOtherServices = (services: readonly Service[], id: string): Service[] =>
  services.filter((item) => item.id !== id).slice(0, 4);

/** "Mais cases" da mesma categoria no detalhe. */
export const pickRelatedCases = (cases: readonly CaseCard[], id: string): CaseCard[] =>
  cases.filter((entry) => entry.id !== id).slice(0, 3);
