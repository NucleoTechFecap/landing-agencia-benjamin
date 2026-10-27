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
──────────────────────────────────────────────────────────────────────────────
*/

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
const { areas, services } = seedSnapshot;

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
});
