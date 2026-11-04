/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : leads-no-painel.test.ts
 Descrição    : Autorização de leitura de dados pessoais: contas reais por papel, RLS real e API REST direta.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (SEG-04).
──────────────────────────────────────────────────────────────────────────────
*/

import { randomBytes, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AUDIT_EVENTS } from "@/lib/domain/audit/events";
import { INBOX_PAGE_SIZE, kindsAllowed, parseInboxQuery } from "@/lib/domain/forms/inbox";
import { SUBMISSION_KINDS } from "@/lib/domain/forms/schemas";
import type { AuditInput } from "@/lib/server/audit";
import {
  changeSubmissionStatus,
  countFailedNotifications,
  deleteSubmission,
  getSubmission,
  listSubmissions,
  type InboxDeps,
} from "@/lib/server/forms/inbox";
import {
  anonClient,
  createTestUser,
  deleteTestUsers,
  hasSupabaseTestEnv,
  must,
  serviceClient,
  supabaseTestEnv,
  type TestUser,
} from "./helpers";

/*
 * Nenhum dado daqui é real. Toda linha carrega um marcador: se ele aparecer numa resposta de quem
 * não deveria ler, o teste falha, mesmo que a resposta venha em formato inesperado.
 */
const DENIED_ROLES = ["pending", "viewer", "editor", "super_admin"] as const;

describe.runIf(hasSupabaseTestEnv)("dados pessoais no painel: quem lê e quem altera (SEG-04)", () => {
  const suffix = randomBytes(4).toString("hex");
  const marker = `marcador-${suffix}`;
  const email = `pessoa-${suffix}@exemplo.test`;
  const leadCategory = `lead:seg04-${suffix}`;
  const pagedCategory = `lead:paginas-${suffix}`;
  const ids = { lead: randomUUID(), contact: randomUUID(), feedback: randomUUID() };
  const created: string[] = [];
  const denied = {} as Record<(typeof DENIED_ROLES)[number], TestUser>;
  let admin: TestUser;

  const service = () => serviceClient();
  const auditFor =
    (client: SupabaseClient) =>
    async (input: AuditInput): Promise<void> => {
      const { error } = await client.rpc("record_audit_event", {
        p_event: input.event,
        p_resource_type: AUDIT_EVENTS[input.event].resourceType,
        p_resource_id: input.resourceId ?? null,
        p_outcome: input.outcome ?? "success",
        p_metadata: input.metadata ?? {},
      });
      if (error) throw new Error(`${error.code}: ${error.message}`);
    };
  const depsFor = (user: TestUser): InboxDeps => ({ db: user.client, audit: auditFor(user.client) });
  const tokenOf = async (user: TestUser) => (await user.client.auth.getSession()).data.session!.access_token;

  const row = (overrides: Record<string, unknown>) => {
    const id = (overrides.id as string) ?? randomUUID();
    created.push(id);
    return {
      id,
      protocol: `AB-${id.slice(0, 6).toUpperCase()}`,
      kind: "lead",
      category: leadCategory,
      payload: { name: "Pessoa Fictícia", email, message: marker },
      fingerprint: `seg04-${suffix}-${id}`,
      ip_hash: `hash-ip-${suffix}`,
      source_path: "//evil.com",
      // Em insert de várias linhas, o PostgREST grava nulo no que faltar em alguma delas.
      notification_status: "pending",
      notification_attempts: 0,
      created_at: new Date().toISOString(),
      ...overrides,
    };
  };

  const statusOf = async (id: string) =>
    (await must(service().from("form_submissions").select("status").eq("id", id).single<{ status: string }>())).status;

  /** Requisição direta à API REST, como faria quem tem só a chave pública ou um token. */
  const rest = (
    path: string,
    init: { method?: string; token?: string; body?: unknown; apikey?: string | null } = {},
  ) => {
    const url = new URL(`/rest/v1/${path}`, supabaseTestEnv.url);
    const headers: Record<string, string> = { "Content-Type": "application/json", Prefer: "return=representation" };
    if (init.apikey !== null) headers.apikey = init.apikey ?? supabaseTestEnv.anonKey!;
    if (init.token) headers.Authorization = `Bearer ${init.token}`;
    return fetch(url, {
      method: init.method ?? "GET",
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  };

  beforeAll(async () => {
    admin = await createTestUser("admin", `seg04-${suffix}`);
    for (const role of DENIED_ROLES) denied[role] = await createTestUser(role, `seg04-${suffix}`);
    await must(
      service()
        .from("form_submissions")
        .insert([
          row({ id: ids.lead, notification_status: "failed", notification_attempts: 5 }),
          row({
            id: ids.contact,
            kind: "contact",
            category: `contact:seg04-${suffix}`,
            notification_status: "sent",
          }),
          row({
            id: ids.feedback,
            kind: "feedback",
            category: `feedback:seg04-${suffix}`,
            notification_status: "skipped",
            payload: { message: marker, profile: "aluno" },
          }),
          ...Array.from({ length: 45 }, (_, index) =>
            row({
              category: pagedCategory,
              created_at: new Date(Date.UTC(2026, 9, 1, 0, 0, index)).toISOString(),
            }),
          ),
        ]),
    );
  }, 60_000);

  afterAll(async () => {
    await service().from("form_submissions").delete().in("id", created);
    await deleteTestUsers([admin, ...Object.values(denied)]);
  });

  describe("admin autorizado", () => {
    it("lista os três tipos, cada um pelo seu filtro", async () => {
      for (const [kind, category] of [
        ["lead", leadCategory],
        ["contact", `contact:seg04-${suffix}`],
        ["feedback", `feedback:seg04-${suffix}`],
      ] as const) {
        const inbox = await listSubmissions(admin.client, { page: 1, kind, category }, SUBMISSION_KINDS);
        expect(inbox.items.map((item) => item.id)).toEqual([ids[kind]]);
      }
    });

    it("a lista traz o nome, mas não o conteúdo, os hashes nem a origem", async () => {
      const { items } = await listSubmissions(admin.client, { page: 1, category: leadCategory }, SUBMISSION_KINDS);
      expect(items[0]).toMatchObject({
        name: "Pessoa Fictícia",
        notificationStatus: "failed",
        notificationAttempts: 5,
      });
      const text = JSON.stringify(items);
      for (const hidden of [email, marker, `hash-ip-${suffix}`, "fingerprint", "evil.com"]) {
        expect(text).not.toContain(hidden);
      }
    });

    it("feedback anônimo aparece sem nome", async () => {
      const { items } = await listSubmissions(
        admin.client,
        { page: 1, category: `feedback:seg04-${suffix}` },
        SUBMISSION_KINDS,
      );
      expect(items[0].name).toBeNull();
    });

    it("o detalhe traz o conteúdo, sem hash de IP nem impressão digital", async () => {
      const record = await getSubmission(admin.client, ids.lead);
      expect(record).toMatchObject({ id: ids.lead, sourcePath: "//evil.com", notificationStatus: "failed" });
      expect(record?.payload).toMatchObject({ email, message: marker });
      const text = JSON.stringify(record);
      expect(text).not.toContain(`hash-ip-${suffix}`);
      expect(text).not.toContain(`seg04-${suffix}-`);
    });

    it("pagina no servidor: as páginas somadas têm tudo, em ordem e sem repetir", async () => {
      const seen: string[] = [];
      for (const page of [1, 2, 3]) {
        const inbox = await listSubmissions(admin.client, { page, category: pagedCategory }, SUBMISSION_KINDS);
        expect(inbox).toMatchObject({ total: 45, page, totalPages: 3 });
        expect(inbox.items).toHaveLength(page < 3 ? INBOX_PAGE_SIZE : 5);
        seen.push(...inbox.items.map((item) => item.createdAt));
      }
      expect(new Set(seen).size).toBe(45);
      expect(seen).toEqual([...seen].sort().reverse());
    });

    it("página além do fim mostra a última, sem erro (PGRST103 de verdade)", async () => {
      const inbox = await listSubmissions(admin.client, { page: 9_999, category: pagedCategory }, SUBMISSION_KINDS);
      expect(inbox).toMatchObject({ page: 3, totalPages: 3, total: 45 });
      expect(inbox.items).toHaveLength(5);
    });

    it("filtra por status e por situação da notificação", async () => {
      const failed = await listSubmissions(
        admin.client,
        { page: 1, category: leadCategory, notification: "failed" },
        SUBMISSION_KINDS,
      );
      expect(failed.total).toBe(1);
      const sent = await listSubmissions(
        admin.client,
        { page: 1, category: leadCategory, notification: "sent" },
        SUBMISSION_KINDS,
      );
      expect(sent.total).toBe(0);
      const archived = await listSubmissions(
        admin.client,
        { page: 1, category: leadCategory, status: "arquivado" },
        SUBMISSION_KINDS,
      );
      expect(archived.total).toBe(0);
      await expect(countFailedNotifications(admin.client, SUBMISSION_KINDS)).resolves.toBeGreaterThanOrEqual(1);
    });

    it("altera o status e registra na trilha, sem conteúdo", async () => {
      const id = randomUUID();
      await must(
        service()
          .from("form_submissions")
          .insert(row({ id, kind: "feedback" })),
      );
      await expect(
        changeSubmissionStatus(depsFor(admin), "admin", { id, status: "lido", currentStatus: "novo" }),
      ).resolves.toEqual({ changed: true });
      expect(await statusOf(id)).toBe("lido");

      const events = await must(
        service()
          .from("audit_log")
          .select("event, resource_type, actor_id, actor_role, metadata")
          .eq("resource_id", id),
      );
      expect(events).toEqual([
        {
          event: "lead.status_changed",
          resource_type: "lead",
          actor_id: admin.id,
          actor_role: "admin",
          metadata: { kind: "feedback", fromStatus: "novo", toStatus: "lido" },
        },
      ]);
      expect(JSON.stringify(events)).not.toContain(marker);
    });

    it("recusa status fora do fluxo do tipo, mesmo que o banco aceitasse", async () => {
      const id = randomUUID();
      await must(service().from("form_submissions").insert(row({ id })));
      await expect(
        changeSubmissionStatus(depsFor(admin), "admin", { id, status: "lido", currentStatus: "novo" }),
      ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
      expect(await statusOf(id)).toBe("novo");
    });

    it("duas pessoas com a tela aberta: a segunda recebe conflito", async () => {
      const id = randomUUID();
      await must(service().from("form_submissions").insert(row({ id })));
      const change = { id, status: "em_atendimento", currentStatus: "novo" };
      await changeSubmissionStatus(depsFor(admin), "admin", change);
      await expect(
        changeSubmissionStatus(depsFor(admin), "admin", { ...change, status: "respondido" }),
      ).rejects.toMatchObject({ code: "CONFLICT" });
      expect(await statusOf(id)).toBe("em_atendimento");
    });

    it("não altera nenhuma outra coluna (42501), nem junto com o status", async () => {
      for (const patch of [
        { payload: {} },
        { kind: "feedback" },
        { category: "lead:outro" },
        { protocol: "AB-FORJADO" },
        { source_path: "/forjado" },
        { ip_hash: "forjado" },
        { fingerprint: "forjado" },
        { notification_status: "sent" },
        { notification_attempts: 0 },
        { last_notification_error: "forjado" },
        { created_at: new Date().toISOString() },
        { status: "em_atendimento", payload: {} },
      ]) {
        const { error } = await admin.client.from("form_submissions").update(patch).eq("id", ids.contact);
        expect(error?.code, JSON.stringify(patch)).toBe("42501");
      }
      const [unchanged] = await must(
        service().from("form_submissions").select("status, payload, kind, notification_status").eq("id", ids.contact),
      );
      expect(unchanged).toMatchObject({ status: "novo", kind: "contact", notification_status: "sent" });
      expect(unchanged.payload).toMatchObject({ message: marker });
    });

    it("status fora da lista do banco é recusado pela constraint (23514)", async () => {
      const { error } = await admin.client
        .from("form_submissions")
        .update({ status: "aprovado" })
        .eq("id", ids.contact);
      expect(error?.code).toBe("23514");
    });

    it("não cria envio pelo painel (42501)", async () => {
      const { error } = await admin.client.from("form_submissions").insert({
        id: randomUUID(),
        protocol: "AB-FORJADO",
        kind: "lead",
        category: "lead:nao-sei",
        payload: {},
        fingerprint: `forjado-${suffix}`,
      });
      expect(error?.code).toBe("42501");
    });

    it("só exclui depois de arquivar, e a trilha fica", async () => {
      const id = randomUUID();
      await must(service().from("form_submissions").insert(row({ id })));
      await expect(deleteSubmission(depsFor(admin), "admin", id)).rejects.toMatchObject({ code: "CONFLICT" });

      await changeSubmissionStatus(depsFor(admin), "admin", { id, status: "arquivado", currentStatus: "novo" });
      await deleteSubmission(depsFor(admin), "admin", id);

      expect(await must(service().from("form_submissions").select("id").eq("id", id))).toEqual([]);
      const events = await must(
        service().from("audit_log").select("event, outcome, metadata").eq("resource_id", id).order("id"),
      );
      expect(events.map((event) => event.event)).toEqual(["lead.status_changed", "lead.deleted"]);
      expect(events[1]).toMatchObject({ outcome: "success", metadata: { kind: "lead" } });
    });
  });

  describe.each(DENIED_ROLES)("%s não lê nem altera", (role) => {
    /* Os serviços recebem todos os tipos de propósito: é a prova de que a RLS segura mesmo sem a guarda. */
    it("a matriz não dá acesso à tela", () => {
      expect(kindsAllowed(role, "view")).toEqual([]);
      expect(kindsAllowed(role, "edit")).toEqual([]);
      expect(kindsAllowed(role, "delete")).toEqual([]);
    });

    it("lista, conta e detalhe voltam vazios, mesmo sem a guarda da aplicação", async () => {
      const { client } = denied[role];
      const inbox = await listSubmissions(client, { page: 1 }, SUBMISSION_KINDS);
      expect(inbox).toMatchObject({ items: [], total: 0 });
      await expect(countFailedNotifications(client, SUBMISSION_KINDS)).resolves.toBe(0);
      for (const id of Object.values(ids)) await expect(getSubmission(client, id)).resolves.toBeNull();
    });

    it("com o papel forjado na aplicação, o banco ainda esconde a linha", async () => {
      const deps = depsFor(denied[role]);
      await expect(
        changeSubmissionStatus(deps, "admin", { id: ids.contact, status: "arquivado", currentStatus: "novo" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(deleteSubmission(deps, "admin", ids.contact)).rejects.toMatchObject({ code: "NOT_FOUND" });
      expect(await statusOf(ids.contact)).toBe("novo");
    });

    it("update e delete diretos não afetam nenhuma linha", async () => {
      const { client } = denied[role];
      const updated = await must(
        client.from("form_submissions").update({ status: "arquivado" }).in("id", Object.values(ids)).select("id"),
      );
      expect(updated).toEqual([]);
      const deleted = await must(client.from("form_submissions").delete().in("id", Object.values(ids)).select("id"));
      expect(deleted).toEqual([]);
      for (const id of Object.values(ids)) expect(await statusOf(id)).toBe("novo");
    });

    it("a API REST com o token da conta não devolve dado nenhum", async () => {
      const token = await tokenOf(denied[role]);
      const response = await rest(`form_submissions?select=*&id=eq.${ids.lead}`, { token });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([]);
      const count = await fetch(new URL("/rest/v1/form_submissions?select=id", supabaseTestEnv.url), {
        method: "HEAD",
        headers: { apikey: supabaseTestEnv.anonKey!, Authorization: `Bearer ${token}`, Prefer: "count=exact" },
      });
      expect(count.headers.get("content-range")).toBe("*/0");
    });

    it("a trilha recusa eventos de dados pessoais vindos deste papel (42501)", async () => {
      for (const event of ["lead.viewed", "lead.status_changed", "feedback.viewed", "lead.deleted"] as const) {
        await expect(auditFor(denied[role].client)({ event })).rejects.toThrow("42501");
      }
    });
  });

  describe("conta desativada", () => {
    it("um admin desativado perde a leitura na hora, com o mesmo token", async () => {
      const former = await createTestUser("admin", `seg04-desativado-${suffix}`);
      try {
        await expect(getSubmission(former.client, ids.lead)).resolves.not.toBeNull();
        await must(service().from("profiles").update({ active: false }).eq("id", former.id));
        await expect(getSubmission(former.client, ids.lead)).resolves.toBeNull();
        const inbox = await listSubmissions(former.client, { page: 1 }, SUBMISSION_KINDS);
        expect(inbox.total).toBe(0);
      } finally {
        await deleteTestUsers([former]);
      }
    });
  });

  describe("visitante e API REST direta", () => {
    it("cliente anônimo não lê, não altera, não exclui e não grava (42501)", async () => {
      const client = anonClient();
      const read = await client.from("form_submissions").select("*");
      expect(read.error?.code).toBe("42501");
      expect(read.data).toBeNull();
      const update = await client.from("form_submissions").update({ status: "arquivado" }).eq("id", ids.lead);
      expect(update.error?.code).toBe("42501");
      const remove = await client.from("form_submissions").delete().eq("id", ids.lead);
      expect(remove.error?.code).toBe("42501");
      expect(await statusOf(ids.lead)).toBe("novo");
    });

    it("os serviços com o cliente anônimo respondem 403, sem detalhe do banco", async () => {
      const error = await listSubmissions(anonClient(), { page: 1 }, SUBMISSION_KINDS).catch((caught) => caught);
      expect(error).toMatchObject({ code: "FORBIDDEN", status: 403 });
      expect(error.message).toBe("Você não tem permissão para esta operação.");
      await expect(getSubmission(anonClient(), ids.lead)).rejects.toMatchObject({ code: "FORBIDDEN" });
    });

    it.each([
      ["GET", "form_submissions?select=*"],
      ["GET", `form_submissions?select=payload&id=eq.${"00000000-0000-4000-8000-000000000000"}`],
      ["GET", "form_submissions?select=id&limit=1"],
      ["PATCH", "form_submissions?status=eq.novo"],
      ["DELETE", "form_submissions?status=eq.novo"],
      ["POST", "form_submissions"],
    ])("chave anônima em %s %s é recusada, sem dado", async (method, path) => {
      const body = method === "PATCH" ? { status: "arquivado" } : method === "POST" ? { id: randomUUID() } : undefined;
      const response = await rest(path, { method, body });
      expect(response.status).toBe(401);
      const text = await response.text();
      expect(text).toContain("42501");
      expect(text).not.toContain(marker);
      expect(text).not.toContain(email);
    });

    it("sem chave nenhuma, o gateway recusa", async () => {
      const response = await rest("form_submissions?select=*", { apikey: null });
      expect(response.status).toBe(401);
      expect(await response.text()).not.toContain(marker);
    });

    it("token inválido é recusado, sem dado", async () => {
      const response = await rest("form_submissions?select=*", { token: "token.invalido.aqui" });
      expect(response.status).toBe(401);
      expect(await response.text()).not.toContain(marker);
    });

    it("a chave anônima não encontra a tabela pelo GraphQL", async () => {
      const response = await fetch(new URL("/graphql/v1", supabaseTestEnv.url), {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: supabaseTestEnv.anonKey! },
        body: JSON.stringify({ query: "{ form_submissionsCollection { edges { node { id payload } } } }" }),
      });
      const text = await response.text();
      expect(text).not.toContain(marker);
      expect(text).not.toContain(email);
      expect(text).not.toContain('"edges"');
    });
  });

  describe("entrada malformada", () => {
    it.each([
      "form_submissions?id=eq.nao-e-uuid",
      "form_submissions?select=coluna_que_nao_existe",
      "form_submissions?or=(",
      "form_submissions?limit=-1",
      "form_submissions?offset=-1",
      "form_submissions?status=in.(novo",
      "form_submissions?order=coluna_que_nao_existe",
      "form_submissions?payload->>email=like.*",
    ])("API REST: %s nunca devolve dado a quem não pode ler", async (path) => {
      for (const token of [undefined, await tokenOf(denied.editor)]) {
        const response = await rest(path, { token });
        const text = await response.text();
        expect(text).not.toContain(marker);
        expect(text).not.toContain(email);
        expect(text).not.toContain(`hash-ip-${suffix}`);
      }
    });

    it("id inválido no detalhe não chega ao banco nem gera erro", async () => {
      for (const id of ["nao-e-uuid", "1", "' or 1=1 --", `${ids.lead}'`, "", "../etc/passwd"]) {
        await expect(getSubmission(admin.client, id)).resolves.toBeNull();
      }
    });

    it("id inválido na mudança de status vira 404", async () => {
      await expect(
        changeSubmissionStatus(depsFor(admin), "admin", { id: "nao-e-uuid", status: "lido", currentStatus: "novo" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(deleteSubmission(depsFor(admin), "admin", "nao-e-uuid")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("id bem formado que não existe também vira 404", async () => {
      await expect(getSubmission(admin.client, randomUUID())).resolves.toBeNull();
      await expect(
        changeSubmissionStatus(depsFor(admin), "admin", { id: randomUUID(), status: "lido", currentStatus: "novo" }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("filtros e página malformados caem na lista sem filtro, sem erro", async () => {
      const query = parseInboxQuery(
        { pagina: "-1", tipo: "orcamento", status: "eq.novo", categoria: `lead:a),kind.eq.feedback`, notificacao: "x" },
        SUBMISSION_KINDS,
      );
      expect(query).toEqual({ page: 1 });
      const inbox = await listSubmissions(admin.client, query, SUBMISSION_KINDS);
      expect(inbox.page).toBe(1);
      expect(inbox.items.length).toBeGreaterThan(0);
    });

    it("status malformado na mudança é recusado antes do banco", async () => {
      await expect(
        changeSubmissionStatus(depsFor(admin), "admin", {
          id: ids.contact,
          status: "novo'; drop table form_submissions; --",
          currentStatus: "novo",
        }),
      ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
      expect(await statusOf(ids.contact)).toBe("novo");
    });
  });
});
