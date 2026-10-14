/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : route.ts
 Descrição    : Endpoint autenticado para invalidar o cache público por webhook ou operação manual.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-09).
 13/10/2026 Vinícius Nishimura Reis  Autenticação compartilhada das rotas internas (GO-02).
──────────────────────────────────────────────────────────────────────────────
*/

import { z } from "zod";
import { getServerEnv } from "@/lib/config/server-env";
import { SLUG_PATTERN } from "@/lib/domain/content/slug";
import { invalidateContentFromRoute } from "@/lib/server/content/invalidate";
import { AppError } from "@/lib/server/errors";
import { apiRoute, jsonOk } from "@/lib/server/http";
import { hasBearerSecret } from "@/lib/server/internal-auth";

const slug = z.string().regex(SLUG_PATTERN).max(80).optional();
const bodySchema = z.object({
  entity: z.enum(["settings", "area", "service", "category", "case", "cta"]),
  slug,
  previousSlug: slug,
});

/**
 * Invalidação de cache para fontes externas ao painel (webhook do Supabase em alteração
 * de conteúdo, rotina ou correção manual). O painel usa updateTag nas Server Actions.
 */
export const POST = apiRoute(async (request, _context, requestId) => {
  if (!hasBearerSecret(request.headers.get("authorization"), getServerEnv().CONTENT_REVALIDATE_SECRET)) {
    throw new AppError("UNAUTHENTICATED");
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw new AppError("BAD_REQUEST", { message: "Corpo inválido." });
  const tags = invalidateContentFromRoute(parsed.data);
  return jsonOk({ data: { invalidated: tags } }, { requestId });
});
