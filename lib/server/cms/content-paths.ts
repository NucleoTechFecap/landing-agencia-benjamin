/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : content-paths.ts
 Descrição    : Páginas publicadas com pré-render parcial, aquecidas depois de uma alteração geral.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (editor do site).
 04/11/2026 Vinícius Nishimura Reis  Leitura que falha não impede a invalidação do que já foi gravado.
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { isFreePageSlug } from "@/lib/domain/content/blocks";
import { logger } from "../logger";
import type { CmsStore } from "./store";

/**
 * A primeira visita a uma destas páginas depois de invalidar ainda viria da versão anterior (ADR-0006).
 * Tema, menu e textos gerais aparecem em todas elas. O limite por alteração fica em invalidate.ts.
 * A lista só aquece o cache, e quem chama já gravou: se a leitura falhar, as etiquetas expiram mesmo assim.
 */
export async function livePaths(deps: { store: CmsStore }): Promise<string[]> {
  const snapshot = await deps.store.snapshot().catch((error: unknown) => {
    logger.warn("content.cache.live_paths_failed", { error });
    return null;
  });
  if (!snapshot) return [];
  const { services, cases, pages } = snapshot;
  const live = <T extends { status: string; slug: string }>(items: readonly T[], base: string) =>
    items.filter((item) => item.status === "published").map((item) => `${base}/${item.slug}`);
  return [
    ...live(services, "/servicos"),
    ...live(cases, "/cases"),
    ...live(
      pages.filter((page) => isFreePageSlug(page.slug)),
      "",
    ),
  ];
}
