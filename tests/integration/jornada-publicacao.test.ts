/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : jornada-publicacao.test.ts
 Descrição    : Teste integrado da jornada de publicação no CMS (J2).

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-12).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it, vi } from "vitest";
import { can } from "@/lib/domain/auth/rbac";
import { mvpSnapshot } from "@/lib/domain/content/__fixtures__/snapshot";
import { validateCaseForPublish } from "@/lib/domain/content/case-schema";
import { assessRemovalImpact, findIntegrityIssues, resolveCtaHref } from "@/lib/domain/content/integrity";
import { transition } from "@/lib/domain/content/publication";
import { isPubliclyVisible } from "@/lib/domain/content/visibility";

vi.mock("next/cache", () => ({ updateTag: vi.fn(), revalidateTag: vi.fn() }));
const { tagsForChange } = await import("@/lib/server/content/invalidate");

/**
 * J2 — usuário administrativo → editar → publicar → verificar site (TECH-12),
 * integrando RBAC, schema do case, máquina de estados, integridade, visibilidade e cache.
 */
describe("J2 · editor publica um case novo e ele aparece no site", () => {
  const now = new Date("2026-10-20T15:00:00.000Z");

  it("rascunho → publicado → visível, íntegro e com cache invalidado", () => {
    const snapshot = mvpSnapshot();
    const draft = {
      ...snapshot.cases[0],
      id: "case-novo",
      slug: "campanha-nova",
      title: "Campanha nova",
      status: "draft" as const,
      publishedAt: null,
      cover: { src: "/brand/cases/fecap.webp", alt: "Capa da campanha" },
      summary: "Campanha de lançamento com conteúdo para redes e imprensa.",
    };
    snapshot.cases.push(draft);

    // Rascunho não aparece publicamente.
    expect(isPubliclyVisible(draft, now)).toBe(false);
    expect(can("editor", "case", "publish")).toBe(true);

    const result = transition(
      { status: draft.status, publishedAt: draft.publishedAt, archivedAt: null },
      "publish",
      { role: "editor", resource: "case", now, validateForPublish: () => validateCaseForPublish(draft, now) },
    );
    expect(result.ok).toBe(true);
    if (!result.ok || !("publishedAt" in result.next)) return;
    Object.assign(draft, result.next);

    expect(isPubliclyVisible(draft, now)).toBe(true);
    expect(findIntegrityIssues(snapshot, now).filter((issue) => issue.severity === "error")).toEqual([]);
    expect(tagsForChange({ entity: "case", slug: draft.slug })).toContain("content:case:campanha-nova");
  });

  it("negativo: viewer não publica e case incompleto não vai ao ar", () => {
    const state = { status: "draft" as const, publishedAt: null, archivedAt: null };
    expect(transition(state, "publish", { role: "viewer", resource: "case", now, validateForPublish: () => [] })).toMatchObject({
      ok: false,
      error: { code: "FORBIDDEN" },
    });
    const incomplete = transition(state, "publish", {
      role: "editor",
      resource: "case",
      now,
      validateForPublish: () => validateCaseForPublish({ title: "Sem dados", slug: "sem-dados" }, now),
    });
    expect(incomplete).toMatchObject({ ok: false, error: { code: "VALIDATION_FAILED" } });
  });

  it("arquivar case: some do site e CTAs usam fallback", () => {
    const snapshot = mvpSnapshot();
    const report = assessRemovalImpact("case", "meridiano", snapshot, now);
    expect(report.blockers).toEqual([]);
    snapshot.cases.find((item) => item.id === "meridiano")!.status = "archived";
    expect(resolveCtaHref({ kind: "case", caseId: "meridiano" }, snapshot, now).href).toBe("/cases");
  });
});
