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
 Modificado em: 12/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-09).
 13/10/2026 Vinícius Nishimura Reis  Autenticação compartilhada das rotas internas (GO-02).
 26/10/2026 Vinícius Nishimura Reis  Tags e invalidação de páginas do CMS (DB-03).
 04/11/2026 Vinícius Nishimura Reis  Segunda expiração em requisição própria, antes de aquecer (TECH-13, #369).
 12/11/2026 Codex                     Inclui invalidação do blog (FUT-10).
 12/11/2026 Codex                     Amplia gestão editorial e segurança do painel.
──────────────────────────────────────────────────────────────────────────────
*/

import { z } from "zod";
import { getServerEnv } from "@/lib/config/server-env";
import { SLUG_PATTERN } from "@/lib/domain/content/slug";
import { MAX_WARMED_PATHS, expireSecondPass, invalidateContentFromRoute } from "@/lib/server/content/invalidate";
import { AppError } from "@/lib/server/errors";
import { apiRoute, jsonOk } from "@/lib/server/http";
import { hasBearerSecret } from "@/lib/server/internal-auth";

const slug = z.string().regex(SLUG_PATTERN).max(80).optional();
const bodySchema = z.object({
  entity: z.enum(["settings", "area", "service", "category", "case", "cta", "page", "blog"]),
  slug,
  previousSlug: slug,
  /** Páginas de detalhe a aquecer: só caminhos do próprio site, com formato conhecido. */
  relatedPaths: z
    .array(z.string().regex(/^\/(servicos|cases|blog|paginas)\/[a-z0-9]+(-[a-z0-9]+)*$/))
    .max(MAX_WARMED_PATHS)
    .optional(),
  /** Marca a segunda expiração do próprio site (invalidate.ts): não agenda outra. */
  secondPass: z.literal(true).optional(),
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
  const { secondPass, ...change } = parsed.data;
  const tags = secondPass ? expireSecondPass(change) : invalidateContentFromRoute(change);
  return jsonOk({ data: { invalidated: tags } }, { requestId });
});
