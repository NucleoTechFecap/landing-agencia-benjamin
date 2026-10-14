/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : route.ts
 Descrição    : Job agendado de reenvio de notificações de formulário pendentes.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (GO-02).
──────────────────────────────────────────────────────────────────────────────
*/

import { getServerEnv } from "@/lib/config/server-env";
import { AppError } from "@/lib/server/errors";
import { getSubmissionDeps } from "@/lib/server/forms/deps";
import { retryPendingNotifications } from "@/lib/server/forms/submission-service";
import { apiRoute, jsonOk } from "@/lib/server/http";
import { hasBearerSecret } from "@/lib/server/internal-auth";
import { logger } from "@/lib/server/logger";

/**
 * Job agendado (Vercel Cron) que reenvia notificações de formulário pendentes ou com
 * falha, respeitando o backoff (TECH-07). Protegido por `CRON_SECRET`.
 */
export const GET = apiRoute(async (request, _context, requestId) => {
  if (!hasBearerSecret(request.headers.get("authorization"), getServerEnv().CRON_SECRET)) {
    throw new AppError("UNAUTHENTICATED");
  }
  const result = await retryPendingNotifications(getSubmissionDeps());
  logger.info("jobs.notifications.retried", { requestId, ...result });
  return jsonOk({ data: result }, { requestId });
});
