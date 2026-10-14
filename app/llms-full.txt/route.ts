/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : route.ts
 Descrição    : Rota /llms-full.txt com o conteúdo completo publicado.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (SEO da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import { buildLlmsFullTxt } from "@/lib/server/llms";

/** /llms-full.txt — conteúdo completo publicado, em Markdown, para assistentes de IA. */
export async function GET() {
  return new Response(await buildLlmsFullTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
