/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : publication-matrix.test.ts
 Descrição    : Matriz de estados × comandos × papéis para todas as entidades do CMS (QA-04).

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (QA-04).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import type { Role } from "@/lib/domain/auth/rbac";
import { checkInvariants, type PublicationCommand } from "@/lib/domain/content/publication";
import type { PublicationStatus } from "@/lib/domain/content/publication-status";
import type { AuditInput } from "../audit";
import type { ContentChange } from "../content/invalidate";
import { runContentCommand, type CmsDeps } from "./content-service";
import { AREA, CASE, CATEGORY, SERVICE, type CmsItem, type EntityDefinition } from "./entities";
import { createMemoryCmsStore, type MemoryTables } from "./memory-store";

/*
 * QA-04: cada comando de publicação, a partir de cada estado, para cada papel e entidade.
 * A expectativa está escrita à mão a partir da ADM-12/TECH-04 (tabela de transições) e da
 * matriz RBAC (TECH-03) — não é calculada pelo código testado.
 */
const NOW = new Date("2026-10-26T15:00:00.000Z");
const VERSION = "2026-10-20T00:00:00.000Z";
const ID = {
  area: "a0000000-0000-4000-8000-000000000001",
  service: "50000000-0000-4000-8000-000000000001",
  category: "c0000000-0000-4000-8000-000000000001",
  case: "ca000000-0000-4000-8000-000000000001",
  cover: "f0000000-0000-4000-8000-000000000001",
};

const VALID: Record<PublicationStatus, Partial<Record<PublicationCommand, PublicationStatus | "deleted">>> = {
  draft: { publish: "published", archive: "archived" },
  published: { unpublish: "draft", archive: "archived" },
  archived: { restore: "draft", delete: "deleted" },
};

/** Quem pode cada comando (matriz RBAC de conteúdo, TECH-03). */
const ALLOWED: Record<Exclude<PublicationCommand, "save">, readonly Role[]> = {
  publish: ["editor", "admin", "super_admin"],
  unpublish: ["editor", "admin", "super_admin"],
  archive: ["editor", "admin", "super_admin"],
  restore: ["editor", "admin", "super_admin"],
  delete: ["admin", "super_admin"],
};

const ROLES: Role[] = ["viewer", "editor", "admin", "super_admin"];
const STATUSES: PublicationStatus[] = ["draft", "published", "archived"];
const COMMANDS = Object.keys(ALLOWED) as Exclude<PublicationCommand, "save">[];

const control = (status: PublicationStatus) => ({
  status,
  provisional: false,
  published_at: status === "published" ? VERSION : null,
  archived_at: status === "archived" ? VERSION : null,
  updated_at: VERSION,
});
const live = control("published");

/** Base completa e publicada; só o item testado recebe o estado do cenário. */
function seed(target: string, status: PublicationStatus): Partial<MemoryTables> {
  const state = (id: string) => (id === target ? control(status) : live);
  return {
    areas: [
      {
        ...state(ID.area),
        id: ID.area,
        slug: "criacao",
        name: "Criação",
        summary: "Resumo da área.",
        description: "Descrição completa da área de criação.",
        highlights: [],
        icon: null,
        sort_order: 1,
      },
      // Segunda área publicada: despublicar/arquivar a primeira não deixa serviço sem área.
      {
        ...live,
        id: "a0000000-0000-4000-8000-000000000002",
        slug: "copywriting",
        name: "Copywriting",
        summary: "Resumo da área.",
        description: "Descrição completa da área de copy.",
        highlights: [],
        icon: null,
        sort_order: 2,
      },
    ],
    services: [
      {
        ...state(ID.service),
        id: ID.service,
        slug: "audiovisual",
        name: "Audiovisual",
        summary: "Vídeos e fotos.",
        description: "Roteiro, captação e edição de vídeos.",
        examples: [],
        icon: null,
        image_media_id: null,
        featured: false,
        sort_order: 1,
      },
      // Segundo serviço publicado na mesma área: arquivar o primeiro não deixa o case órfão.
      {
        ...live,
        id: "50000000-0000-4000-8000-000000000002",
        slug: "copywriting",
        name: "Copywriting",
        summary: "Textos.",
        description: "Textos e narrativas de marca.",
        examples: [],
        icon: null,
        image_media_id: null,
        featured: false,
        sort_order: 2,
      },
    ],
    service_areas: [
      { service_id: ID.service, area_id: ID.area },
      { service_id: ID.service, area_id: "a0000000-0000-4000-8000-000000000002" },
      { service_id: "50000000-0000-4000-8000-000000000002", area_id: ID.area },
      { service_id: "50000000-0000-4000-8000-000000000002", area_id: "a0000000-0000-4000-8000-000000000002" },
    ],
    case_categories: [
      { ...state(ID.category), id: ID.category, slug: "social", name: "Social", description: null, sort_order: 1 },
    ],
    cases: [
      {
        ...state(ID.case),
        id: ID.case,
        slug: "meridiano",
        title: "Meridiano",
        client_name: "Meridiano",
        // Categoria e área só têm dependente publicado quando o próprio case está publicado no cenário.
        category_id: target === ID.category ? null : ID.category,
        delivery_type: null,
        summary: "Resumo do case com mais de trinta caracteres.",
        challenge: null,
        solution: null,
        results: null,
        cover_media_id: ID.cover,
        external_links: [],
        reference_month: null,
        team: [],
        featured: false,
        sort_order: 1,
      },
    ],
    case_services: [
      { case_id: ID.case, service_id: ID.service },
      { case_id: ID.case, service_id: "50000000-0000-4000-8000-000000000002" },
    ],
    media_assets: [
      {
        id: ID.cover,
        path: "/brand/cases/fecap.webp",
        mime_type: "image/webp",
        width: 1200,
        height: 750,
        alt_text: "Capa",
        decorative: false,
      },
    ],
  };
}

const ENTITIES: [string, EntityDefinition<never, CmsItem>, string, keyof MemoryTables][] = [
  ["área", AREA as never, ID.area, "areas"],
  ["serviço", SERVICE as never, ID.service, "services"],
  ["categoria", CATEGORY as never, ID.category, "case_categories"],
  ["case", CASE as never, ID.case, "cases"],
];

const scenarios = ENTITIES.flatMap(([label, def, id, table]) =>
  STATUSES.flatMap((from) =>
    COMMANDS.flatMap((command) => ROLES.map((role) => ({ label, def, id, table, from, command, role }))),
  ),
);

describe("QA-04 — matriz de publicação (4 entidades × 15 transições × 4 papéis)", () => {
  it.each(scenarios)("$label: $from → $command como $role", async ({ def, id, table, from, command, role }) => {
    const { store, tables } = createMemoryCmsStore(seed(id, from));
    const audits: AuditInput[] = [];
    const changes: ContentChange[] = [];
    const deps: CmsDeps = {
      store,
      audit: async (input) => void audits.push(input),
      invalidate: (c) => void changes.push(c),
      now: () => NOW,
    };
    const run = runContentCommand(deps, { id: "u1", role }, def, { id, expectedUpdatedAt: VERSION }, command);
    const target = VALID[from][command];
    const rows = () => tables[table] as unknown as Record<string, unknown>[];

    if (!target) {
      await expect(run).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
    } else if (!ALLOWED[command].includes(role)) {
      await expect(run).rejects.toMatchObject({ code: "FORBIDDEN" });
    } else {
      await expect(run).resolves.toMatchObject({ status: target });
      if (target === "deleted") {
        expect(rows().some((row) => row.id === id)).toBe(false);
      } else {
        const row = rows().find((entry) => entry.id === id)!;
        expect(row.status).toBe(target);
        expect(
          checkInvariants({
            status: target,
            publishedAt: row.published_at as string | null,
            archivedAt: row.archived_at as string | null,
          }),
        ).toEqual([]);
      }
      expect(audits.map((entry) => entry.event)).toHaveLength(1);
      // Só mexe no cache quando o público é afetado (saiu ou entrou no site).
      expect(changes.length > 0).toBe(from === "published" || target === "published");
      return;
    }
    // Recusado: nada gravado, nada auditado, cache intacto.
    expect(rows().find((entry) => entry.id === id)?.status).toBe(from);
    expect(audits).toEqual([]);
    expect(changes).toEqual([]);
  });
});
