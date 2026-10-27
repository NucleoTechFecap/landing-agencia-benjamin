/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Content
 Arquivo      : itens-do-mvp.test.ts
 Descrição    : Conformidade dos itens de conteúdo do MVP (áreas, serviços e categorias) com o site e o CMS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (SOB-08).
 26/10/2026 Vinícius Nishimura Reis  Item Criação (SOB-09).
 26/10/2026 Vinícius Nishimura Reis  Item Assessoria de Imprensa (SOB-10).
 26/10/2026 Vinícius Nishimura Reis  Item Produção de Conteúdo (SERV-06).
 26/10/2026 Vinícius Nishimura Reis  Item Copywriting (SERV-07).
 26/10/2026 Vinícius Nishimura Reis  Item Design e Identidade Visual (SERV-08).
──────────────────────────────────────────────────────────────────────────────
*/

import { validateServiceForPublish } from "../lib/domain/content/service-schema";
import { resolveCtaHref } from "../lib/domain/content/integrity";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateAreaForPublish } from "../lib/domain/content/area-schema";
import { isBrandIcon } from "../lib/domain/content/icons";
import { isValidSlug } from "../lib/domain/content/slug";
import { isPubliclyVisible, visibleSorted } from "../lib/domain/content/visibility";
import { seedSnapshot } from "./index";

/*
 * Um bloco por item das tasks de conteúdo (SOB-08…10, SERV-06…11, CASE-08…10). Cada item é
 * conferido como o site e o painel o usam: publicável pelas regras do CMS, ícone oficial,
 * relações (área ↔ serviços, serviço ↔ cases, categoria ↔ cases), CTA de contato e mídia
 * sem link quebrado. O texto é provisório até a aprovação da Benjamin (CON-05) e as fichas
 * em docs/conteudo dizem o que falta aprovar.
 */
const { areas, services, cases } = seedSnapshot;

/** Ids do conteúdo versionado não são UUID: as relações são conferidas à parte. */
const withoutIds = <T extends { areaIds?: string[] }>(item: T) => ({ ...item, areaIds: undefined });

function checkArea(slug: string, expected: { order: number; services: string[]; provisional: boolean }) {
  describe(`área ${slug}`, () => {
    const area = areas.find((item) => item.slug === slug)!;

    it("existe, está publicada e na posição combinada", () => {
      expect(area).toBeDefined();
      expect(isPubliclyVisible(area)).toBe(true);
      expect(
        visibleSorted(areas, (item) => item.name)
          .map((item) => item.slug)
          .indexOf(slug) + 1,
      ).toBe(expected.order);
    });

    it("cumpre as regras de publicação do painel (ADM-07) e usa ícone oficial", () => {
      expect(validateAreaForPublish(area)).toEqual([]);
      expect(isValidSlug(area.slug)).toBe(true);
      expect(isBrandIcon(area.icon)).toBe(true);
    });

    it("lista os serviços que nascem dela", () => {
      const linked = visibleSorted(
        services.filter((service) => service.areaIds.includes(area.id)),
        (service) => service.name,
      );
      expect(linked.map((service) => service.slug)).toEqual(expected.services);
    });

    it(
      expected.provisional ? "segue provisória até a aprovação (CON-05)" : "está aprovada (sem selo provisório)",
      () => {
        expect(Boolean(area.provisional)).toBe(expected.provisional);
      },
    );
  });
}

function checkService(
  slug: string,
  expected: { areas: string[]; cases: string[]; featured: boolean; provisional: boolean },
) {
  describe(`serviço ${slug}`, () => {
    const service = services.find((item) => item.slug === slug)!;

    it("existe, está publicado e cumpre as regras de publicação do painel (ADM-06)", () => {
      expect(service).toBeDefined();
      expect(isPubliclyVisible(service)).toBe(true);
      expect(validateServiceForPublish(withoutIds(service)).filter((problem) => !problem.startsWith("Áreas"))).toEqual(
        [],
      );
      expect(isBrandIcon(service.icon)).toBe(true);
      expect(service.featured).toBe(expected.featured);
    });

    it("pertence às áreas combinadas, todas publicadas", () => {
      const linked = areas.filter((area) => service.areaIds.includes(area.id));
      expect(linked.map((area) => area.slug).sort()).toEqual([...expected.areas].sort());
      expect(linked.every((area) => isPubliclyVisible(area))).toBe(true);
    });

    it("o CTA de contato leva ao formulário com o serviço pré-selecionado", () => {
      expect(resolveCtaHref({ kind: "contact", serviceId: service.id }, seedSnapshot)).toEqual({
        href: `/contato?servico=${slug}#formulario`,
        external: false,
        isTargetVisible: true,
      });
    });

    it("mostra os cases relacionados", () => {
      const related = cases.filter((item) => item.serviceIds.includes(service.id) && isPubliclyVisible(item));
      expect(related.map((item) => item.slug)).toEqual(expected.cases);
    });

    it("não tem mídia quebrada", () => {
      if (!service.image) return;
      expect(service.image.alt.trim()).not.toBe("");
      expect(existsSync(join(process.cwd(), "public", service.image.src))).toBe(true);
    });

    it(expected.provisional ? "segue provisório até a aprovação (CON-05)" : "está aprovado", () => {
      expect(Boolean(service.provisional)).toBe(expected.provisional);
    });
  });
}

describe("itens de conteúdo do MVP", () => {
  checkArea("copywriting", {
    order: 4,
    // Na ordem em que aparecem em /areas (campo "ordem" do serviço).
    services: ["estrategia-digital", "producao-de-conteudo", "copywriting"],
    provisional: true,
  });
  checkArea("criacao", {
    order: 5,
    services: ["producao-de-conteudo", "design-e-identidade-visual", "audiovisual"],
    provisional: true,
  });
  checkArea("assessoria-de-imprensa", {
    order: 6,
    services: ["assessoria-de-imprensa"],
    provisional: true,
  });
  checkService("producao-de-conteudo", {
    areas: ["copywriting", "social-media", "criacao"],
    cases: ["aventura-de-construir"],
    featured: true,
    provisional: true,
  });
  checkService("copywriting", {
    areas: ["copywriting"],
    cases: ["aventura-de-construir"],
    featured: false,
    provisional: true,
  });
  checkService("design-e-identidade-visual", {
    areas: ["criacao"],
    cases: ["meridiano"],
    featured: true,
    provisional: true,
  });
});
