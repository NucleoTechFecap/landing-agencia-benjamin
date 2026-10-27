/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : route.ts
 Descrição    : Endpoint público de detalhe de área com os serviços vinculados.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-04).
──────────────────────────────────────────────────────────────────────────────
*/

import { toAreaDetailDTO } from "@/lib/domain/api/contracts";
import { isValidSlug } from "@/lib/domain/content/slug";
import { getAreaDetail } from "@/lib/server/content/repository";
import { AppError } from "@/lib/server/errors";
import { PUBLIC_CACHE_CONTROL, apiRoute, jsonOk } from "@/lib/server/http";

export const GET = apiRoute<RouteContext<"/api/v1/areas/[slug]">>(async (_request, context, requestId) => {
  const { slug } = await context.params;
  const detail = isValidSlug(slug) ? await getAreaDetail(slug) : null;
  if (!detail) throw new AppError("NOT_FOUND", { message: "Área não encontrada." });
  return jsonOk({ data: toAreaDetailDTO(detail) }, { requestId, cacheControl: PUBLIC_CACHE_CONTROL });
});
