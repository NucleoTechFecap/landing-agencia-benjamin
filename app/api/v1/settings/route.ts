/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : route.ts
 Descrição    : Endpoint público de informações institucionais.

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

import { toSiteSettingsDTO } from "@/lib/domain/api/contracts";
import { getSiteSettings } from "@/lib/server/content/repository";
import { PUBLIC_CACHE_CONTROL, apiRoute, jsonOk } from "@/lib/server/http";

export const GET = apiRoute(async (_request, _context, requestId) => {
  const settings = await getSiteSettings();
  return jsonOk({ data: toSiteSettingsDTO(settings) }, { requestId, cacheControl: PUBLIC_CACHE_CONTROL });
});
