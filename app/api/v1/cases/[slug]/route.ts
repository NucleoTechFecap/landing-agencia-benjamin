/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : route.ts
 Descrição    : Endpoint público de detalhe de case.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 29/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-02).
 29/10/2026 Vinicius Binda             Endereço antigo ou com maiúsculas responde 301 (DB-08).
──────────────────────────────────────────────────────────────────────────────
*/

import { toCaseDetailDTO } from "@/lib/domain/api/contracts";
import { resolveDetailSlug } from "@/lib/server/content/published-slugs";
import { getCaseDetail } from "@/lib/server/content/repository";
import { AppError } from "@/lib/server/errors";
import { PUBLIC_CACHE_CONTROL, apiRoute, jsonOk, movedPermanently } from "@/lib/server/http";

export const GET = apiRoute<RouteContext<"/api/v1/cases/[slug]">>(async (request, context, requestId) => {
  const { slug } = await context.params;
  const detail = await getCaseDetail(slug);
  if (!detail) {
    const resolution = await resolveDetailSlug("cases", slug);
    if (resolution.status === "moved") return movedPermanently(request, `/api/v1/cases/${resolution.slug}`, requestId);
    throw new AppError("NOT_FOUND", { message: "Case não encontrado." });
  }
  return jsonOk({ data: toCaseDetailDTO(detail) }, { requestId, cacheControl: PUBLIC_CACHE_CONTROL });
});
