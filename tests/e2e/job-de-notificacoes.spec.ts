/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : job-de-notificacoes.spec.ts
 Descrição    : Rota do job de reenvio de notificações, de ponta a ponta com o Postgres local.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (QA-05).
──────────────────────────────────────────────────────────────────────────────
*/

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { REQUIRES_SUPABASE, SERVICE_KEY, SUPABASE_URL, newSuffix, serviceClient } from "./painel-helpers";

/*
 * QA-05 (CA-16): a rota agendada que reenvia notificações, de ponta a ponta com o Postgres local. O notificador
 * é o `LogNotifier` (nenhum e-mail sai do ambiente): a entrega real depende de CON-10 e continua não executada.
 */
const CRON_SECRET = process.env.CRON_SECRET;
const JOB = "/api/internal/jobs/notificacoes";

test.describe("QA-05 · rota do job de reenvio @cms", () => {
  test.skip(!SUPABASE_URL || !SERVICE_KEY, REQUIRES_SUPABASE);
  test.skip(!CRON_SECRET, "Requer o CRON_SECRET do ambiente: rode `npm run test:e2e:cms`.");
  test.skip(({ isMobile }) => isMobile, "A resposta do servidor não depende do tamanho da tela.");

  let client: SupabaseClient;
  const created: string[] = [];

  test.beforeAll(() => {
    client = serviceClient();
  });

  test.afterAll(async () => {
    if (created.length) await client.from("form_submissions").delete().in("id", created);
  });

  /** Envio fictício, direto no banco, no estado que o job precisa encontrar. */
  async function seed(values: Record<string, unknown>) {
    const id = randomUUID();
    const { error } = await client.from("form_submissions").insert({
      id,
      protocol: `AB-${newSuffix().slice(0, 6).toUpperCase()}`,
      kind: "contact",
      category: "contact:geral",
      fingerprint: `job-${id}`,
      payload: {
        name: "Pessoa de Teste",
        email: "teste.e2e@exemplo.com",
        subject: "Assunto de teste",
        message: "Mensagem fictícia do teste do job de reenvio.",
        privacyConsent: true,
      },
      ...values,
    });
    if (error) throw error;
    created.push(id);
    return id;
  }

  const notificationOf = async (id: string) =>
    (
      await client
        .from("form_submissions")
        .select("notification_status, notification_attempts, status, payload")
        .eq("id", id)
        .single()
    ).data!;

  const runJob = async (request: APIRequestContext) => {
    const response = await request.get(JOB, { headers: { authorization: `Bearer ${CRON_SECRET}` } });
    expect(response.status()).toBe(200);
    return ((await response.json()) as { data: { retried: number } }).data.retried;
  };

  test("pendente é entregue uma vez, sem mudar o envio, e a segunda rodada não repete", async ({ request }) => {
    const id = await seed({ notification_status: "pending" });
    const before = await notificationOf(id);
    expect(await runJob(request)).toBeGreaterThanOrEqual(1);
    await expect.poll(async () => (await notificationOf(id)).notification_status).toBe("sent");
    const after = await notificationOf(id);
    expect(after.notification_attempts).toBe(before.notification_attempts + 1);
    expect(after.status).toBe("novo");
    expect(after.payload).toEqual(before.payload);

    await runJob(request);
    expect((await notificationOf(id)).notification_attempts).toBe(after.notification_attempts);
  });

  test("falha antiga é reenviada; falha recente espera o intervalo; a esgotada fica de fora", async ({ request }) => {
    // O intervalo é contado de `updated_at`, que o gatilho só toca em atualização.
    const longAgo = new Date(Date.now() - 7 * 24 * 3_600_000).toISOString();
    const old = await seed({ notification_status: "failed", notification_attempts: 1, updated_at: longAgo });
    const recent = await seed({ notification_status: "failed", notification_attempts: 1 });
    const exhausted = await seed({ notification_status: "failed", notification_attempts: 5, updated_at: longAgo });

    await runJob(request);
    await expect.poll(async () => (await notificationOf(old)).notification_status).toBe("sent");
    expect(await notificationOf(recent)).toMatchObject({ notification_status: "failed", notification_attempts: 1 });
    expect(await notificationOf(exhausted)).toMatchObject({ notification_status: "failed", notification_attempts: 5 });
  });
});
