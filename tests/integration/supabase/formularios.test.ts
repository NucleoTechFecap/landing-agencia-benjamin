/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : formularios.test.ts
 Descrição    : Do envio à consulta no painel, com armazenamento, Auth e RLS reais.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 02/11/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 02/11/2026 Vinícius Nishimura Reis  Criação inicial (TECH-06).
──────────────────────────────────────────────────────────────────────────────
*/

import { createHmac, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { processSubmission, type SubmissionDeps } from "@/lib/server/forms/submission-service";
import { SupabaseSubmissionStore } from "@/lib/server/forms/supabase-store";
import { DuplicateSubmissionError, type OutgoingEmail } from "@/lib/server/forms/types";
import {
  anonClient,
  createTestUser,
  deleteTestUsers,
  hasSupabaseTestEnv,
  must,
  serviceClient,
  testSuffix,
  type TestUser,
} from "./helpers";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

describe.runIf(hasSupabaseTestEnv)("formulários no Supabase (TECH-06)", () => {
  const suffix = testSuffix();
  const ids = { lead: randomUUID(), contact: randomUUID(), feedback: randomUUID() };
  const created: string[] = Object.values(ids);
  const sent: OutgoingEmail[] = [];
  const startedAt = String(Date.now() - 60_000);
  let store: SupabaseSubmissionStore;
  let deps: SubmissionDeps;
  let admin: TestUser;
  const others: Partial<Record<"super_admin" | "editor" | "viewer" | "pending", TestUser>> = {};

  beforeAll(async () => {
    store = new SupabaseSubmissionStore(serviceClient());
    deps = {
      store,
      notifier: { send: async (email) => void sent.push(email) },
      recipients: {
        LEAD_NOTIFICATION_TO: ["comercial@benjamin.test"],
        CONTACT_NOTIFICATION_TO: ["institucional@benjamin.test"],
        FEEDBACK_NOTIFICATION_TO: [],
      },
      hmac: (value) => createHmac("sha256", `segredo-${suffix}`).update(value).digest("hex"),
      now: () => new Date(),
      siteUrl: "https://benjamin.test",
    };
    admin = await createTestUser("admin", `form-${suffix}`);
    for (const role of ["super_admin", "editor", "viewer", "pending"] as const) {
      others[role] = await createTestUser(role, `form-${suffix}`);
    }

    const context = { requestId: `req-${suffix}`, ip: null };
    const person = { name: "Pessoa Teste", email: `pessoa-${suffix}@empresa.test`, privacyConsent: "on" };
    const results = [
      await processSubmission(
        "lead",
        {
          ...person,
          submissionId: ids.lead,
          startedAt,
          serviceInterest: "audiovisual",
          projectDescription: `Vídeo institucional para o lançamento ${suffix}.`,
        },
        context,
        deps,
      ),
      await processSubmission(
        "contact",
        {
          ...person,
          submissionId: ids.contact,
          startedAt,
          subject: "imprensa",
          message: `Gostaria de uma entrevista ${suffix}.`,
        },
        context,
        deps,
      ),
      await processSubmission(
        "feedback",
        {
          submissionId: ids.feedback,
          startedAt,
          profile: "aluno",
          message: `A palestra foi ótima ${suffix}.`,
          privacyConsent: "on",
        },
        context,
        deps,
      ),
    ];
    for (const result of results) expect(result).toMatchObject({ status: "success", duplicate: false });
  });

  afterAll(async () => {
    await serviceClient().from("form_submissions").delete().in("id", created);
    await deleteTestUsers([admin, ...Object.values(others)]);
  });

  it("grava cada tipo com sua categoria e notifica o destinatário certo", async () => {
    const rows = await must(
      serviceClient()
        .from("form_submissions")
        .select("id, kind, category, status, notification_status")
        .in("id", created),
    );
    expect(rows).toHaveLength(3);
    const byId = new Map((rows ?? []).map((row) => [row.id, row]));
    expect(byId.get(ids.lead)).toMatchObject({ kind: "lead", category: "lead:audiovisual", status: "novo" });
    expect(byId.get(ids.contact)).toMatchObject({ kind: "contact", category: "contact:imprensa", status: "novo" });
    expect(byId.get(ids.feedback)).toMatchObject({ kind: "feedback", category: "feedback:aluno", status: "novo" });
    for (const row of rows ?? []) expect(row.notification_status).toBe("sent");
    expect(sent.map((email) => email.to[0])).toEqual([
      "comercial@benjamin.test",
      "institucional@benjamin.test",
      "comercial@benjamin.test",
    ]);
  });

  it("admin consulta os três tipos e altera só o status", async () => {
    const rows = await must(admin.client.from("form_submissions").select("id, kind").in("id", created));
    expect((rows ?? []).map((row) => row.kind).sort()).toEqual(["contact", "feedback", "lead"]);

    const updated = await must(
      admin.client.from("form_submissions").update({ status: "em_atendimento" }).eq("id", ids.lead).select("status"),
    );
    expect(updated).toEqual([{ status: "em_atendimento" }]);

    for (const patch of [{ payload: {} }, { kind: "feedback" }, { notification_status: "sent" }]) {
      const { error } = await admin.client.from("form_submissions").update(patch).eq("id", ids.contact);
      expect(error?.code).toBe("42501");
    }
  });

  it("super_admin, editor, viewer e pendente não consultam nem alteram", async () => {
    for (const user of Object.values(others)) {
      const rows = await must(user.client.from("form_submissions").select("id").in("id", created));
      expect(rows).toEqual([]);
      const updated = await must(
        user.client.from("form_submissions").update({ status: "arquivado" }).eq("id", ids.contact).select("id"),
      );
      expect(updated).toEqual([]);
    }
    const unchanged = await must(serviceClient().from("form_submissions").select("status").eq("id", ids.contact));
    expect(unchanged).toEqual([{ status: "novo" }]);
  });

  it("visitante com a chave anônima não lê nem grava (42501)", async () => {
    const read = await anonClient().from("form_submissions").select("id").in("id", created);
    expect(read.error?.code).toBe("42501");
    const write = await anonClient().from("form_submissions").insert({
      id: randomUUID(),
      protocol: "AB-ANON",
      kind: "lead",
      category: "lead:nao-sei",
      payload: {},
      fingerprint: suffix,
    });
    expect(write.error?.code).toBe("42501");
  });

  it("corrida do mesmo submissionId vira DuplicateSubmissionError, não um segundo registro", async () => {
    const original = await store.findById(ids.lead);
    await expect(store.insert(original!)).rejects.toBeInstanceOf(DuplicateSubmissionError);
  });

  it("fila de reenvio traz quem falhou e ainda tem tentativas, e deixa os esgotados de fora", async () => {
    const base = { kind: "lead", category: "lead:nao-sei", payload: {}, notification_status: "failed" };
    const retryable = randomUUID();
    const exhausted = randomUUID();
    created.push(retryable, exhausted);
    await must(
      serviceClient()
        .from("form_submissions")
        .insert([
          { ...base, id: retryable, protocol: "AB-RETRY", fingerprint: `retry-${suffix}`, notification_attempts: 4 },
          { ...base, id: exhausted, protocol: "AB-ESGOT", fingerprint: `esgot-${suffix}`, notification_attempts: 5 },
        ]),
    );

    const backlog = (await store.listNotificationBacklog(1000)).map((record) => record.id);
    expect(backlog).toContain(retryable);
    expect(backlog).not.toContain(exhausted);
  });
});
