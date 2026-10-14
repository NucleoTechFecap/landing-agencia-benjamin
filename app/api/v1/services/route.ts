/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : route.ts
 Descrição    : Endpoint público de serviços publicados.

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

import { serviceQuerySchema, toServiceDTO } from "@/lib/domain/api/contracts";
import { listAreas, listServices } from "@/lib/server/content/repository";
import { PUBLIC_CACHE_CONTROL, apiRoute, jsonOk, parseQuery } from "@/lib/server/http";

export const GET = apiRoute(async (request, _context, requestId) => {
  const query = parseQuery(request, serviceQuerySchema);
  const [services, areas] = await Promise.all([listServices({ featuredOnly: query.featured === "true" }), listAreas()]);
  return jsonOk(
    { data: services.map((service) => toServiceDTO(service, areas)) },
    { requestId, cacheControl: PUBLIC_CACHE_CONTROL },
  );
});
