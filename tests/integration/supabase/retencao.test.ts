/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : retencao.test.ts
 Descrição    : Integração: simulação, execução e proteções da retenção pela API real, com dados fictícios (DBX-05).

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

import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { deleteSubmission } from "@/lib/server/forms/inbox";
import {
  createSupabaseRetentionStore,
  executeRetention,
  simulateRetention,
} from "@/lib/server/forms/retention-service";
import {
  anonClient,
  createTestUser,
  deleteTestUsers,
  hasSupabaseTestEnv,
  serviceClient,
  testSuffix,
  type TestUser,
} from "./helpers";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

/*
 * A API real, com as funções e a RLS do banco. O teste aprova a execução por parâmetro, só aqui, no
 * Supabase local: em produção a trava de RETENTION_PENDING_INSTITUTIONAL_APPROVAL continua valendo.
 * O plano olha o banco local inteiro, por isso as contagens são comparadas por diferença.
 */
describe.runIf(hasSupabaseTestEnv)("retenção no Supabase (DBX-05)", () => {
  const suffix = testSuffix();
  const users: { admin?: TestUser; editor?: TestUser } = {};
  const ids = {
    leadOld: randomUUID(),
    leadRecent: randomUUID(),
    contactOld: randomUUID(),
    feedbackOld: randomUUID(),
    anonymousOld: randomUUID(),
    held: randomUUID(),
    archivedHeld: randomUUID(),
  };
  const OLD = "2020-01-01T00:00:00Z";
  const row = (
    id: string,
    kind: "lead" | "contact" | "feedback",
    payload: Record<string, unknown>,
    extra: Record<string, unknown> = {},
  ) => ({
    id,
    protocol: `AB-${suffix}`,
    kind,
    category: `${kind}:teste`,
    payload,
    fingerprint: `f-${id}`,
    ip_hash: `ip-${id}`,
    last_activity_at: OLD,
    // O insert em lote usa as mesmas colunas em todas as linhas: faltando, viria nulo.
    status: "novo",
    legal_hold: false,
    ...extra,
  });
  const read = async (id: string) =>
    (await serviceClient().from("form_submissions").select("*").eq("id", id).maybeSingle()).data;

  beforeAll(async () => {
    [users.admin, users.editor] = await Promise.all([
      createTestUser("admin", suffix),
      createTestUser("editor", suffix),
    ]);
    const { error } = await serviceClient()
      .from("form_submissions")
      .insert([
        row(ids.leadOld, "lead", { name: "Pessoa Fictícia", email: "pessoa@teste.invalid" }),
        row(ids.leadRecent, "lead", { name: "Pessoa Fictícia" }, { last_activity_at: new Date().toISOString() }),
        row(ids.contactOld, "contact", { name: "Pessoa Fictícia" }),
        row(ids.feedbackOld, "feedback", {
          name: "Pessoa Fictícia",
          email: "pessoa@teste.invalid",
          message: "Mensagem fictícia",
          allowContact: true,
        }),
        row(ids.anonymousOld, "feedback", { message: "Mensagem anônima" }),
        row(ids.held, "lead", { name: "Pessoa Fictícia" }, { legal_hold: true }),
        row(ids.archivedHeld, "lead", { name: "Pessoa Fictícia" }, { legal_hold: true, status: "arquivado" }),
      ]);
    if (error) throw new Error(error.message);
  });

  afterAll(async () => {
    const admin = serviceClient();
    await admin.from("form_submissions").update({ legal_hold: false }).eq("protocol", `AB-${suffix}`);
    await admin.from("form_submissions").delete().eq("protocol", `AB-${suffix}`);
    await deleteTestUsers(Object.values(users));
  });

  it("a simulação conta sem gravar nem devolver ids", async () => {
    const result = await simulateRetention(createSupabaseRetentionStore(serviceClient()));
    expect(Object.keys(result).sort()).toEqual(["kept", "toAnonymize", "toDelete"]);
    expect(result.toDelete).toBeGreaterThanOrEqual(3);
    expect(result.toAnonymize).toBeGreaterThanOrEqual(1);
    expect(await read(ids.leadOld)).not.toBeNull();
    expect((await read(ids.feedbackOld))?.anonymized_at).toBeNull();
  });

  it("os assuntos da retenção não trazem o conteúdo do envio", async () => {
    const { data } = await serviceClient().rpc("retention_subjects");
    const subject = (data as Record<string, unknown>[]).find((item) => item.id === ids.feedbackOld);
    expect(subject).toEqual({
      id: ids.feedbackOld,
      kind: "feedback",
      last_activity_at: expect.any(String),
      identified: true,
    });
  });

  it("sessão do painel e visitante não chamam as funções", async () => {
    const plan = {
      p_delete: [ids.leadOld],
      p_anonymize: [],
      p_planned_at: new Date().toISOString(),
      p_origin: "rotina",
    };
    expect((await users.admin!.client.rpc("apply_retention", plan)).error?.code).toBe("42501");
    expect((await anonClient().rpc("apply_retention", plan)).error?.code).toBe("42501");
    expect((await users.admin!.client.rpc("retention_subjects")).error?.code).toBe("42501");
    expect(await read(ids.leadOld)).not.toBeNull();
  });

  it("sem aprovação dos prazos, a execução é recusada e nada muda", async () => {
    await expect(executeRetention(createSupabaseRetentionStore(serviceClient()))).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(await read(ids.leadOld)).not.toBeNull();
  });

  it("o painel não exclui envio com retenção suspensa", async () => {
    const audit = vi.fn(async () => {});
    await expect(deleteSubmission({ db: users.admin!.client, audit }, "admin", ids.archivedHeld)).rejects.toMatchObject(
      { code: "CONFLICT", message: expect.stringMatching(/retenção suspensa/) },
    );
    expect(await read(ids.archivedHeld)).not.toBeNull();
  });

  it("aprovada, a rotina exclui e anonimiza só o vencido e registra só contagens", async () => {
    const result = await executeRetention(createSupabaseRetentionStore(serviceClient()), new Date(), true);
    expect(result.deleted).toBeGreaterThanOrEqual(3);
    expect(result.anonymized).toBeGreaterThanOrEqual(1);

    expect(await read(ids.leadOld)).toBeNull();
    expect(await read(ids.contactOld)).toBeNull();
    expect(await read(ids.anonymousOld)).toBeNull();
    expect(await read(ids.leadRecent)).not.toBeNull();
    expect(await read(ids.held)).not.toBeNull();

    const feedback = await read(ids.feedbackOld);
    expect(feedback?.payload).toEqual({ message: "Mensagem fictícia", allowContact: false });
    expect(feedback).toMatchObject({ ip_hash: null, fingerprint: "anonimizado" });
    expect(feedback?.anonymized_at).not.toBeNull();

    const { data } = await serviceClient()
      .from("audit_log")
      .select("resource_id, actor_id, metadata")
      .eq("event", "retention.executed")
      .order("id", { ascending: false })
      .limit(1)
      .single();
    expect(data).toMatchObject({ resource_id: null, actor_id: null, metadata: { origin: "rotina" } });
    expect(JSON.stringify(data)).not.toContain(ids.leadOld);
  });

  it("mudar o status conta como andamento; o painel não muda retenção suspensa", async () => {
    const before = (await read(ids.held))?.last_activity_at;
    await serviceClient().from("form_submissions").update({ notification_attempts: 2 }).eq("id", ids.held);
    expect((await read(ids.held))?.last_activity_at).toBe(before);
    await serviceClient().from("form_submissions").update({ status: "em_atendimento" }).eq("id", ids.held);
    expect((await read(ids.held))?.last_activity_at).not.toBe(before);

    const { error } = await users
      .admin!.client.from("form_submissions")
      .update({ legal_hold: false })
      .eq("id", ids.held);
    expect(error?.code).toBe("42501");
    expect((await read(ids.held))?.legal_hold).toBe(true);
  });
});
