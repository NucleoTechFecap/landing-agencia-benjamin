/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : route.ts
 Descrição    : Endpoint público de detalhe de serviço com cases relacionados.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-02).
 29/10/2026 Vinicius Binda             Endereço antigo ou com maiúsculas responde 301 (DB-08).
 04/11/2026 Vinícius Nishimura Reis  Slug fora do formato não alcança o cache do conteúdo (DB-09).
──────────────────────────────────────────────────────────────────────────────
*/

import { toCaseCardDTO, toServiceDTO } from "@/lib/domain/api/contracts";
import { isValidSlug } from "@/lib/domain/content/slug";
import { resolveDetailSlug } from "@/lib/server/content/published-slugs";
import { getServiceDetail } from "@/lib/server/content/repository";
import { AppError } from "@/lib/server/errors";
import { PUBLIC_CACHE_CONTROL, apiRoute, jsonOk, movedPermanently } from "@/lib/server/http";

export const GET = apiRoute<RouteContext<"/api/v1/services/[slug]">>(async (request, context, requestId) => {
  const { slug } = await context.params;
  // Slug fora do formato nem chega ao cache. Maiúsculas seguem para o 301 de resolveDetailSlug.
  const detail = isValidSlug(slug) ? await getServiceDetail(slug) : null;
  if (!detail) {
    const resolution = await resolveDetailSlug("servicos", slug);
    if (resolution.status === "moved") {
      return movedPermanently(request, `/api/v1/services/${resolution.slug}`, requestId);
    }
    throw new AppError("NOT_FOUND", { message: "Serviço não encontrado." });
  }
  return jsonOk(
    { data: { ...toServiceDTO(detail.service, detail.areas), cases: detail.cases.map(toCaseCardDTO) } },
    { requestId, cacheControl: PUBLIC_CACHE_CONTROL },
  );
});
