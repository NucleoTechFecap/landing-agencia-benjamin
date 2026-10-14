/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : route.ts
 Descrição    : Endpoint de verificação de disponibilidade da API.

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

import { API_VERSION } from "@/lib/domain/api/contracts";

/** Verificação de disponibilidade usada no smoke test e no monitoramento (GO-01). */
export function GET() {
  return Response.json(
    { data: { status: "ok", service: "agencia-benjamin", apiVersion: API_VERSION } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
