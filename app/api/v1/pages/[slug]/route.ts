/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : route.ts
 Descrição    : Endpoint público de página editável e seus blocos.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { toPageDTO } from "@/lib/domain/api/contracts";
import { isValidSlug } from "@/lib/domain/content/slug";
import { getPage } from "@/lib/server/content/repository";
import { AppError } from "@/lib/server/errors";
import { PUBLIC_CACHE_CONTROL, apiRoute, jsonOk } from "@/lib/server/http";

export const GET = apiRoute<RouteContext<"/api/v1/pages/[slug]">>(async (_request, context, requestId) => {
  const { slug } = await context.params;
  // Slug fora do formato nem chega ao cache: não existe página com ele.
  const page = isValidSlug(slug) ? await getPage(slug) : null;
  if (!page) throw new AppError("NOT_FOUND", { message: "Página não encontrada." });
  return jsonOk({ data: toPageDTO(page) }, { requestId, cacheControl: PUBLIC_CACHE_CONTROL });
});
