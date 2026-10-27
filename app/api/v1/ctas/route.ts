/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : route.ts
 Descrição    : Endpoint público de chamadas para ação por local da página.

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

import { ctaQuerySchema, toCtaDTO } from "@/lib/domain/api/contracts";
import { listCtas } from "@/lib/server/content/repository";
import { PUBLIC_CACHE_CONTROL, apiRoute, jsonOk, parseQuery } from "@/lib/server/http";

export const GET = apiRoute(async (request, _context, requestId) => {
  const { placement } = parseQuery(request, ctaQuerySchema);
  const ctas = await listCtas(placement);
  return jsonOk({ data: ctas.map(toCtaDTO) }, { requestId, cacheControl: PUBLIC_CACHE_CONTROL });
});
