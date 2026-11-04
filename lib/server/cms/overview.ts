/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : overview.ts
 Descrição    : Monta a visão geral dos conteúdos do painel a partir de uma única leitura, respeitando o papel.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-18).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { can, type Action, type Resource, type Role } from "@/lib/domain/auth/rbac";
import { findIntegrityIssues } from "@/lib/domain/content/integrity";
import {
  assembleOverview,
  countByStatus,
  reviewNotes,
  type ContentOverview,
  type OverviewGroup,
} from "@/lib/domain/content/overview";
import type { ContentEntityType } from "@/lib/domain/content/types";
import { publishProblems } from "./content-service";
import { AREA, CASE, CATEGORY, PAGE, SERVICE, type CmsItem, type EntityDefinition } from "./entities";
import type { CmsSnapshot, CmsStore } from "./store";

type Permits = (resource: Resource, action: Action) => boolean;
type WarningsOf = (type: ContentEntityType, id: string) => string[];

/** Um grupo da tela: a entidade do CMS e como ela aparece na visão geral. */
function describeGroup<I extends { slug: string }, T extends CmsItem>(
  def: EntityDefinition<I, T>,
  label: string,
  titleOf: (item: T) => string,
) {
  return {
    resource: def.resource,
    build(snapshot: CmsSnapshot, now: Date, permits: Permits, warningsOf: WarningsOf): OverviewGroup {
      const canEdit = permits(def.resource, "edit");
      const items = def.list(snapshot).map((item) => ({
        // Só o que a tela usa: o conteúdo do item (blocos, galeria) não precisa sair daqui.
        id: item.id,
        title: titleOf(item),
        // Página não tem ordem própria: empata em zero e fica em ordem alfabética.
        order: "order" in item && typeof item.order === "number" ? item.order : 0,
        status: item.status,
        publishedAt: item.publishedAt,
        archivedAt: item.archivedAt,
        updatedAt: item.updatedAt,
        provisional: item.provisional,
        editHref: `${def.adminPath}/${item.id}`,
        groupLabel: label,
        canEdit,
        notes: reviewNotes(
          item,
          {
            // Arquivado não é avaliado: `reviewNotes` o deixa fora de qualquer forma.
            missing: item.status === "archived" ? [] : publishProblems(def, item, snapshot, now),
            warnings: warningsOf(def.type, item.id),
          },
          now,
        ),
      }));
      return { type: def.type, label, adminPath: def.adminPath, items, counts: countByStatus(items) };
    },
  };
}

const GROUPS = [
  describeGroup(PAGE, "Páginas", (page) => page.title),
  describeGroup(AREA, "Áreas de atuação", (area) => area.name),
  describeGroup(SERVICE, "Serviços", (service) => service.name),
  describeGroup(CATEGORY, "Categorias de cases", (category) => category.name),
  describeGroup(CASE, "Cases", (item) => item.title),
];

/**
 * Regra pura sobre o conteúdo já lido. A permissão de ver é por grupo: quem não pode ver um tipo de
 * conteúdo não recebe o grupo nem os itens dele na fila de revisão. As regras entre conteúdos
 * continuam avaliadas com o conteúdo inteiro, senão um item pareceria quebrado sem estar.
 */
export function buildContentOverview(snapshot: CmsSnapshot, permits: Permits, now: Date): ContentOverview {
  const warnings = new Map<string, string[]>();
  for (const issue of findIntegrityIssues(snapshot, now)) {
    if (issue.severity !== "warning") continue;
    const key = `${issue.entity.type}:${issue.entity.id}`;
    warnings.set(key, [...(warnings.get(key) ?? []), issue.message]);
  }
  const warningsOf: WarningsOf = (type, id) => warnings.get(`${type}:${id}`) ?? [];
  return assembleOverview(
    GROUPS.filter((group) => permits(group.resource, "view")).map((group) =>
      group.build(snapshot, now, permits, warningsOf),
    ),
  );
}

/**
 * Leitura da visão geral com a permissão aplicada aqui, no servidor. É uma leitura só do conteúdo
 * (`snapshot`), então o número de consultas não cresce com o número de itens. Falha de leitura sobe
 * como erro: mostrar uma lista vazia diria que não há nada para revisar sem saber se é verdade.
 */
export async function loadContentOverview(
  store: Pick<CmsStore, "snapshot">,
  role: Role | null | undefined,
  now: Date,
): Promise<ContentOverview> {
  const permits: Permits = (resource, action) => can(role, resource, action);
  if (!GROUPS.some((group) => permits(group.resource, "view"))) return assembleOverview([]);
  return buildContentOverview(await store.snapshot(), permits, now);
}
