/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : route.ts
 Descrição    : Endpoint público de cases com filtros e paginação.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-02).
──────────────────────────────────────────────────────────────────────────────
*/

import { caseQuerySchema, paginate, toCaseCardDTO } from "@/lib/domain/api/contracts";
import { listCases } from "@/lib/server/content/repository";
import { PUBLIC_CACHE_CONTROL, apiRoute, jsonOk, parseQuery } from "@/lib/server/http";

/** Cases publicados com filtros (categoria, serviço, área, cliente) e paginação. */
export const GET = apiRoute(async (request, _context, requestId) => {
  const { page, pageSize, ...filters } = parseQuery(request, caseQuerySchema);
  const cases = await listCases(filters);
  return jsonOk(paginate(cases.map(toCaseCardDTO), page, pageSize), { requestId, cacheControl: PUBLIC_CACHE_CONTROL });
});
