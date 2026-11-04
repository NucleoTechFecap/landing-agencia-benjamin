/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : route.ts
 Descrição    : Rota interna da retenção dos envios de formulário: simula por padrão e executa só com confirmação.

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinicius Binda             Criação inicial (DBX-05).
──────────────────────────────────────────────────────────────────────────────
*/

import { z } from "zod";
import { getServerEnv } from "@/lib/config/server-env";
import { AppError } from "@/lib/server/errors";
import {
  createSupabaseRetentionStore,
  executeRetention,
  simulateRetention,
  type RetentionStore,
} from "@/lib/server/forms/retention-service";
import { apiRoute, jsonOk } from "@/lib/server/http";
import { hasBearerSecret } from "@/lib/server/internal-auth";
import { logger } from "@/lib/server/logger";
import { getServiceClient } from "@/lib/server/supabase/admin";

const executeSchema = z.object({ confirmar: z.literal("executar") });

/** Chamada à mão, uma vez por mês e depois de restaurar uma cópia (docs/operacao/retencao-e-descarte.md). */
function authorizedStore(request: Request): RetentionStore {
  if (!hasBearerSecret(request.headers.get("authorization"), getServerEnv().CRON_SECRET)) {
    throw new AppError("UNAUTHENTICATED");
  }
  const client = getServiceClient();
  if (!client) throw new AppError("SERVICE_UNAVAILABLE", { internal: { reason: "supabase_not_configured" } });
  return createSupabaseRetentionStore(client);
}

/** Simulação: só contagens, sem gravar nada. */
export const GET = apiRoute(async (request, _context, requestId) => {
  const result = await simulateRetention(authorizedStore(request));
  logger.info("jobs.retention.simulated", { requestId, ...result });
  return jsonOk({ data: result }, { requestId });
});

/** Execução: exige `{ "confirmar": "executar" }` e recusa enquanto os prazos não forem aprovados. */
export const POST = apiRoute(async (request, _context, requestId) => {
  const store = authorizedStore(request);
  if (!executeSchema.safeParse(await request.json().catch(() => null)).success) {
    throw new AppError("BAD_REQUEST", { message: 'Confirme com { "confirmar": "executar" }.' });
  }
  const result = await executeRetention(store);
  logger.info("jobs.retention.executed", { requestId, ...result });
  return jsonOk({ data: result }, { requestId });
});
