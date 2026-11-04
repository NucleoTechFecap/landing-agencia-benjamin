/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : acesso-indevido-dados.spec.ts
 Descrição    : Rotas internas, API REST e Storage vistos de fora, conteúdo oculto, erros e busca por segredos.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (QA-06).
──────────────────────────────────────────────────────────────────────────────
*/

import { createHmac } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  ANON_KEY,
  actionBody,
  newSession,
  panelActionsFromBuild,
  rawRequest,
  sessionCookies,
  sessionFromCookie,
} from "./acesso-helpers";
import {
  REQUIRES_SUPABASE,
  SERVICE_KEY,
  SUPABASE_URL,
  createAccount,
  deleteAccounts,
  newSuffix,
  serviceClient,
  type Account,
} from "./painel-helpers";

/*
 * QA-06: proteção de dados vista de fora do painel. Rotas internas, API REST e Storage do Supabase com a
 * chave pública, conteúdo fora do ar por URL direta, corpo das respostas de erro e busca por segredos no
 * que é entregue ao navegador. Nenhum teste imprime valor de chave: as falhas citam só o nome da variável.
 */
const REVALIDATE_SECRET = process.env.CONTENT_REVALIDATE_SECRET;
const CRON_SECRET = process.env.CRON_SECRET;
const PAST = "2026-10-01T12:00:00.000Z";
const FUTURE = "2099-01-01T12:00:00.000Z";

/** O que nunca deveria aparecer no corpo de uma resposta. */
const INTERNAL_DETAILS =
  /node_modules|\.next\/(server|cache)|\/home\/|\/var\/task|\bat [\w.$<>]+ \(|webpack-internal|PGRST\d|SQLSTATE|duplicate key|relation "|permission denied for|service_role|SUPABASE_|CRON_SECRET|RESEND_|SUBMISSION_HASH|CONTENT_REVALIDATE|ECONNREFUSED|TypeError|ReferenceError|ZodError|"issues":/;

/** Valor de todo segredo conhecido neste ambiente, com o nome: é o nome que aparece se o teste falhar. */
const SECRET_VALUES: Record<string, string | undefined> = {
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? SERVICE_KEY,
  CONTENT_REVALIDATE_SECRET: REVALIDATE_SECRET,
  CRON_SECRET,
  SUBMISSION_HASH_SECRET: process.env.SUBMISSION_HASH_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
};

function expectNoInternals(body: string, label: string) {
  expect(INTERNAL_DETAILS.exec(body)?.[0] ?? null, label).toBeNull();
  for (const [name, value] of Object.entries(SECRET_VALUES)) {
    if (value) expect(body.includes(value), `${label}: ${name}`).toBe(false);
  }
}

/** Funções com `use cache`: o Next as registra como Server Actions, com o id só no manifesto do servidor. */
function cacheFunctionIds(): string[] {
  const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as {
    node: Record<string, { exportedName: string }>;
  };
  return Object.entries(manifest.node)
    .filter(([, action]) => action.exportedName.startsWith("$$RSC_SERVER_CACHE"))
    .map(([id]) => id);
}

const restUrl = (path: string) => new URL(`/rest/v1/${path}`, SUPABASE_URL);
const anonHeaders = () => ({ apikey: ANON_KEY!, Authorization: `Bearer ${ANON_KEY}` });

/** Tabelas sem nenhum privilégio para a chave anônima. */
const PRIVATE_TABLES = ["ambiente_banco", "audit_log", "form_submissions", "profiles", "role_permissions"];
/** Tabelas com leitura pública só do que está no ar, e sem coluna de estado própria. */
const FILTERED_RELATIONS = ["blocks", "case_media", "case_services", "media_assets", "service_areas", "slug_redirects"];
/** Tabelas com `status`: a chave anônima só pode ver `published` com data já vencida. */
const STATUS_TABLES = ["areas", "case_categories", "cases", "ctas", "pages", "services"];
const PUBLIC_TABLES = ["site_settings"];

/** Rascunho, arquivado e agendado de cada tipo, com o mesmo sufixo nos textos: achar o sufixo é vazamento. */
interface HiddenMass {
  suffix: string;
  ids: Record<string, string[]>;
  slugs: Record<"areas" | "services" | "cases" | "pages" | "case_categories", string[]>;
  block: string;
  orphanMedia: string;
}

const STATES = [
  { kind: "rascunho", values: { status: "draft" } },
  { kind: "arquivado", values: { status: "archived", published_at: PAST, archived_at: PAST } },
  { kind: "agendado", values: { status: "published", published_at: FUTURE } },
] as const;

async function seedHidden(client: SupabaseClient, suffix: string): Promise<HiddenMass> {
  const insert = async (table: string, values: Record<string, unknown>) => {
    const { data, error } = await client.from(table).insert(values).select("id").single();
    if (error) throw new Error(`${table}: ${error.message}`);
    return data.id as string;
  };
  const ids: Record<string, string[]> = {
    areas: [],
    services: [],
    case_categories: [],
    cases: [],
    pages: [],
    ctas: [],
    blocks: [],
    media_assets: [],
  };
  const slugs: HiddenMass["slugs"] = { areas: [], services: [], cases: [], pages: [], case_categories: [] };
  const text = { summary: "Resumo oculto do teste.", description: "Descrição oculta usada no teste de acesso." };
  for (const { kind, values } of STATES) {
    const slugOf = (name: keyof HiddenMass["slugs"], prefix: string) => {
      const slug = `oculto-${prefix}-${kind}-${suffix}`;
      slugs[name].push(slug);
      return slug;
    };
    const media = await insert("media_assets", {
      path: `/brand/oculto-${kind}-${suffix}.webp`,
      mime_type: "image/webp",
      alt_text: `Oculta ${kind} ${suffix}`,
    });
    ids.media_assets.push(media);
    ids.areas.push(
      await insert("areas", { ...values, ...text, slug: slugOf("areas", "area"), name: `Oculta ${kind} ${suffix}` }),
    );
    ids.services.push(
      await insert("services", {
        ...values,
        ...text,
        slug: slugOf("services", "servico"),
        name: `Oculto ${kind} ${suffix}`,
        image_media_id: media,
      }),
    );
    ids.case_categories.push(
      await insert("case_categories", {
        ...values,
        slug: slugOf("case_categories", "categoria"),
        name: `Oculta ${kind} ${suffix}`,
      }),
    );
    ids.cases.push(
      await insert("cases", {
        ...values,
        slug: slugOf("cases", "case"),
        title: `Oculto ${kind} ${suffix}`,
        client_name: `Cliente oculto ${suffix}`,
        category_id: ids.case_categories.at(-1),
        summary: "Resumo oculto do case, com tamanho suficiente.",
        cover_media_id: media,
      }),
    );
    const pageId = await insert("pages", {
      ...values,
      slug: slugOf("pages", "pagina"),
      title: `Oculta ${kind} ${suffix}`,
    });
    ids.pages.push(pageId);
    ids.blocks.push(
      await insert("blocks", {
        page_id: pageId,
        type: "rich-text",
        sort_order: 0,
        content: { title: `Oculto ${suffix}`, paragraphs: [`Parágrafo oculto ${suffix}.`] },
      }),
    );
    ids.ctas.push(
      await insert("ctas", {
        ...values,
        label: `Oculto ${kind} ${suffix}`.slice(0, 40),
        placement: "footer",
        target_kind: "internal",
        target_path: "/cases",
      }),
    );
    const { error } = await client
      .from("service_areas")
      .insert({ service_id: ids.services.at(-1), area_id: ids.areas.at(-1) });
    if (error) throw new Error(error.message);
    const { error: linkError } = await client
      .from("case_services")
      .insert({ case_id: ids.cases.at(-1), service_id: ids.services.at(-1) });
    if (linkError) throw new Error(linkError.message);
    const { error: galleryError } = await client
      .from("case_media")
      .insert({ case_id: ids.cases.at(-1), media_id: media });
    if (galleryError) throw new Error(galleryError.message);
  }
  const orphanMedia = await insert("media_assets", {
    path: `/brand/oculto-solta-${suffix}.webp`,
    mime_type: "image/webp",
    alt_text: `Solta ${suffix}`,
  });
  ids.media_assets.push(orphanMedia);
  return { suffix, ids, slugs, block: ids.blocks[0], orphanMedia };
}

async function removeHidden(client: SupabaseClient, mass: HiddenMass | undefined) {
  if (!mass) return;
  for (const table of ["ctas", "pages", "cases", "case_categories", "services", "areas", "media_assets"]) {
    await client.from(table).delete().in("id", mass.ids[table]);
  }
}

test.describe("QA-06 · rotas internas @cms", () => {
  test.skip(({ isMobile }) => isMobile, "A resposta do servidor não depende do tamanho da tela.");

  const WRONG_CREDENTIALS: Record<string, string>[] = [
    {},
    { authorization: "" },
    { authorization: "Bearer" },
    { authorization: "Bearer " },
    { authorization: "Bearer segredo-errado" },
    { authorization: `Bearer ${"x".repeat(48)}` },
    { authorization: "bearer segredo-errado" },
    { authorization: "Basic dXN1YXJpbzpzZW5oYQ==" },
    { "x-api-key": "segredo-errado" },
    { cookie: "CRON_SECRET=segredo-errado" },
  ];

  for (const [route, method] of [
    ["/api/internal/revalidate", "POST"],
    ["/api/internal/jobs/notificacoes", "GET"],
  ] as const) {
    test(`${route}: 401 sem token e com token errado, sem expor nada`, async ({ baseURL }) => {
      for (const headers of WRONG_CREDENTIALS) {
        const label = `${route} ${Object.keys(headers).join() || "sem credencial"}`;
        const response = await rawRequest(baseURL!, route, {
          method,
          headers: { "content-type": "application/json", ...headers },
          body: method === "POST" ? JSON.stringify({ entity: "settings" }) : undefined,
        });
        expect(response.status, label).toBe(401);
        expect(response.headers["cache-control"], label).toBe("no-store");
        const body = JSON.parse(response.body) as { error: { code: string; message: string } };
        expect(body.error.code, label).toBe("UNAUTHENTICATED");
        expectNoInternals(response.body, label);
      }
    });

    test(`${route}: token na URL não vale`, async ({ baseURL }) => {
      for (const query of ["token=segredo", "secret=segredo", "authorization=Bearer%20segredo"]) {
        const response = await rawRequest(baseURL!, `${route}?${query}`, { method });
        expect(response.status, query).toBe(401);
      }
    });
  }

  test("o método errado não executa nada", async ({ baseURL }) => {
    expect((await rawRequest(baseURL!, "/api/internal/revalidate")).status).toBe(405);
    expect((await rawRequest(baseURL!, "/api/internal/jobs/notificacoes", { method: "POST" })).status).toBe(405);
  });
});

test.describe("QA-06 · rotas internas com o token certo @cms", () => {
  test.skip(!REVALIDATE_SECRET || !CRON_SECRET, "Requer os segredos do ambiente: rode `npm run test:e2e:cms`.");
  test.skip(({ isMobile }) => isMobile, "A resposta do servidor não depende do tamanho da tela.");

  for (const [label, body] of [
    ["JSON quebrado", "{"],
    ["vazio", ""],
    ["lista", "[]"],
    ["texto", '"settings"'],
    ["entidade desconhecida", JSON.stringify({ entity: "profiles" })],
    ["slug com travessia", JSON.stringify({ entity: "case", slug: "../../etc/passwd" })],
    ["slug enorme", JSON.stringify({ entity: "case", slug: "a".repeat(5000) })],
    ["objeto no lugar de texto", JSON.stringify({ entity: { $ne: null } })],
    ["protótipo", '{"__proto__":{"admin":true},"entity":"x"}'],
  ] as const) {
    test(`corpo inválido (${label}): 400 com mensagem fixa`, async ({ baseURL }) => {
      const response = await rawRequest(baseURL!, "/api/internal/revalidate", {
        method: "POST",
        headers: { authorization: `Bearer ${REVALIDATE_SECRET}`, "content-type": "application/json" },
        body,
      });
      expect(response.status).toBe(400);
      const parsed = JSON.parse(response.body) as { error: { code: string; message: string; fieldErrors?: unknown } };
      expect(parsed.error.code).toBe("BAD_REQUEST");
      expect(parsed.error.message).toBe("Corpo inválido.");
      expect(parsed.error.fieldErrors).toBeUndefined();
      expectNoInternals(response.body, label);
    });
  }

  test("controle: com o token certo e corpo válido, invalida e não devolve dado", async ({ baseURL }) => {
    const response = await rawRequest(baseURL!, "/api/internal/revalidate", {
      method: "POST",
      headers: { authorization: `Bearer ${REVALIDATE_SECRET}`, "content-type": "application/json" },
      body: JSON.stringify({ entity: "settings" }),
    });
    expect(response.status).toBe(200);
    expect(JSON.parse(response.body).data.invalidated.length).toBeGreaterThan(0);
  });

  test("o token de uma rota não abre a outra", async ({ baseURL }) => {
    const job = await rawRequest(baseURL!, "/api/internal/jobs/notificacoes", {
      headers: { authorization: `Bearer ${REVALIDATE_SECRET}` },
    });
    expect(job.status).toBe(401);
    const revalidate = await rawRequest(baseURL!, "/api/internal/revalidate", {
      method: "POST",
      headers: { authorization: `Bearer ${CRON_SECRET}`, "content-type": "application/json" },
      body: JSON.stringify({ entity: "settings" }),
    });
    expect(revalidate.status).toBe(401);
  });
});

test.describe("QA-06 · API REST do Supabase vista de fora @cms", () => {
  test.skip(!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY, REQUIRES_SUPABASE);
  test.skip(({ isMobile }) => isMobile, "A resposta do banco não depende do tamanho da tela.");

  let client: SupabaseClient;
  let mass: HiddenMass;

  test.beforeAll(async () => {
    client = serviceClient();
    mass = await seedHidden(client, newSuffix());
  });

  test.afterAll(async () => {
    await removeHidden(client, mass);
  });

  const asAnon = (path: string, init: RequestInit = {}) =>
    fetch(restUrl(path), { ...init, headers: { ...anonHeaders(), ...init.headers } });

  test("toda tabela e função exposta está classificada aqui", async () => {
    const response = await fetch(restUrl(""), {
      headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    const { paths } = (await response.json()) as { paths: Record<string, unknown> };
    const tables = Object.keys(paths)
      .filter((path) => path !== "/" && !path.startsWith("/rpc/"))
      .map((path) => path.slice(1))
      .sort();
    expect(tables).toEqual([...PRIVATE_TABLES, ...FILTERED_RELATIONS, ...STATUS_TABLES, ...PUBLIC_TABLES].sort());
  });

  test("a descrição pública da API só mostra o que a chave anônima já lê", async () => {
    const { paths } = (await (await asAnon("")).json()) as { paths: Record<string, unknown> };
    const listed = Object.keys(paths).map((path) => path.slice(1));
    for (const table of PRIVATE_TABLES) expect(listed, table).not.toContain(table);
    for (const name of ["rpc/assign_role", "rpc/set_profile_active", "rpc/record_audit_event", "rpc/save_case"]) {
      expect(listed, name).not.toContain(name);
    }
  });

  for (const table of PRIVATE_TABLES) {
    test(`${table}: a chave anônima recebe 401, sem nenhuma linha`, async () => {
      const response = await asAnon(`${table}?select=*&limit=1`);
      expect(response.status).toBe(401);
      const body = (await response.json()) as { code: string };
      expect(body.code).toBe("42501");
      expect(Array.isArray(body)).toBe(false);
    });
  }

  for (const table of STATUS_TABLES) {
    test(`${table}: a chave anônima só lê o que está publicado`, async () => {
      const response = await asAnon(`${table}?select=*`);
      expect(response.status).toBe(200);
      const rows = (await response.json()) as { id: string; status: string; published_at: string }[];
      const now = Date.now();
      for (const row of rows) {
        expect(row.status, row.id).toBe("published");
        expect(new Date(row.published_at).getTime(), row.id).toBeLessThanOrEqual(now);
      }
      const hidden = await asAnon(`${table}?select=id&id=in.(${mass.ids[table].join(",")})`);
      expect(await hidden.json()).toEqual([]);
      for (const status of ["draft", "archived"]) {
        expect(await (await asAnon(`${table}?select=id&status=eq.${status}`)).json(), status).toEqual([]);
      }
      const future = await asAnon(`${table}?select=id&published_at=gt.${encodeURIComponent(new Date().toISOString())}`);
      expect(await future.json()).toEqual([]);
    });
  }

  test("blocks: nada de páginas fora do ar", async () => {
    const response = await asAnon(`blocks?select=id&id=in.(${mass.ids.blocks.join(",")})`);
    expect(await response.json()).toEqual([]);
    const pages = await asAnon(`blocks?select=id&page_id=in.(${mass.ids.pages.join(",")})`);
    expect(await pages.json()).toEqual([]);
  });

  test("media_assets: imagem só de conteúdo oculto, ou sem uso, não aparece", async () => {
    const response = await asAnon(`media_assets?select=id&id=in.(${mass.ids.media_assets.join(",")})`);
    expect(await response.json()).toEqual([]);
    expect(await (await asAnon(`media_assets?select=id&path=like.*${mass.suffix}*`)).json()).toEqual([]);
  });

  for (const [table, column, owner] of [
    ["service_areas", "service_id", "services"],
    ["case_services", "case_id", "cases"],
    ["case_media", "case_id", "cases"],
    ["slug_redirects", "entity_id", "cases"],
  ] as const) {
    test(`${table}: vínculos de conteúdo oculto não aparecem`, async () => {
      const response = await asAnon(`${table}?select=*&${column}=in.(${mass.ids[owner].join(",")})`);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual([]);
    });
  }

  test("a leitura por embutido (join) não atravessa a RLS", async () => {
    const response = await asAnon(`cases?select=id,category:case_categories(id,status)&slug=like.*${mass.suffix}*`);
    expect(await response.json()).toEqual([]);
    const blocks = await asAnon(`pages?select=id,blocks(id)&slug=like.*${mass.suffix}*`);
    expect(await blocks.json()).toEqual([]);
    const profiles = await asAnon("cases?select=id,profiles(full_name)&limit=1");
    expect(profiles.ok).toBe(false);
  });

  test("site_settings: público, sem coluna de dado interno", async () => {
    const rows = (await (await asAnon("site_settings?select=*")).json()) as Record<string, unknown>[];
    expect(rows.length).toBeLessThanOrEqual(1);
    for (const column of Object.keys(rows[0] ?? {})) {
      expect(column, column).not.toMatch(/secret|token|password|senha|api_?key|_key$/i);
    }
  });

  for (const table of [...PRIVATE_TABLES, ...STATUS_TABLES, ...FILTERED_RELATIONS, ...PUBLIC_TABLES]) {
    test(`${table}: a chave anônima não grava`, async () => {
      const { definitions } = (await (
        await fetch(restUrl(""), { headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}` } })
      ).json()) as { definitions: Record<string, { properties: Record<string, unknown> }> };
      // Coluna que existe na tabela: com uma inexistente, a recusa seria de formato e nada provaria.
      const column = Object.keys(definitions[table].properties).at(-1)!;
      const headers = { "content-type": "application/json", Prefer: "return=representation" };
      const filter = `${column}=not.is.null`;
      const body = JSON.stringify({ [column]: null });
      for (const [operation, response] of [
        ["insert", await asAnon(table, { method: "POST", headers, body })],
        ["update", await asAnon(`${table}?${filter}`, { method: "PATCH", headers, body })],
        ["delete", await asAnon(`${table}?${filter}`, { method: "DELETE", headers })],
      ] as const) {
        expect(response.status, operation).toBe(401);
        expect(((await response.json()) as { code: string }).code, operation).toBe("42501");
      }
    });
  }

  for (const [name, args] of [
    ["assign_role", { p_target: "00000000-0000-4000-8000-000000000000", p_role: "admin" }],
    ["set_profile_active", { p_target: "00000000-0000-4000-8000-000000000000", p_active: true }],
    ["record_audit_event", { p_event: "auth.login.succeeded", p_resource_type: "user" }],
    ["save_case", { p_id: null, p_expected_updated_at: null, p_values: {}, p_service_ids: [], p_gallery_ids: [] }],
    ["save_service", { p_id: null, p_expected_updated_at: null, p_values: {}, p_area_ids: [] }],
  ] as const) {
    test(`rpc/${name}: a chave anônima não executa`, async () => {
      const response = await asAnon(`rpc/${name}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(args),
      });
      expect(response.status).toBe(401);
    });
  }

  test("as funções abertas à chave anônima não revelam nada", async () => {
    const call = async (name: string, args: object) =>
      (
        await asAnon(`rpc/${name}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(args),
        })
      ).json();
    // Sem sessão, o papel é o de quem não tem acesso nenhum.
    expect(await call("current_app_role", {})).toBe("pending");
    expect(await call("has_permission", { p_resource: "lead", p_action: "view" })).toBe(false);
    for (const slug of mass.slugs.cases) {
      expect(await call("resolve_public_slug", { p_entity: "case", p_slug: slug }), slug).toBeNull();
    }
    for (const slug of mass.slugs.services) {
      expect(await call("resolve_public_slug", { p_entity: "service", p_slug: slug }), slug).toBeNull();
    }
  });

  test("token forjado não vira service_role", async () => {
    const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const claims = { role: "service_role", iss: "supabase", exp: Math.floor(Date.now() / 1000) + 3600 };
    const unsigned = `${base64url({ alg: "none", typ: "JWT" })}.${base64url(claims)}.`;
    const body = `${base64url({ alg: "HS256", typ: "JWT" })}.${base64url(claims)}`;
    const wrongKey = `${body}.${createHmac("sha256", "chave-que-nao-e-a-do-projeto").update(body).digest("base64url")}`;
    for (const token of [unsigned, wrongKey, "nao-e-um-token"]) {
      const response = await fetch(restUrl("form_submissions?select=id&limit=1"), {
        headers: { apikey: ANON_KEY!, Authorization: `Bearer ${token}` },
      });
      expect(response.status).toBe(401);
    }
  });

  test("a API GraphQL não está disponível", async () => {
    const response = await fetch(new URL("/graphql/v1", SUPABASE_URL), {
      method: "POST",
      headers: { ...anonHeaders(), "content-type": "application/json" },
      body: JSON.stringify({ query: "{ __schema { types { name } } }" }),
    });
    expect(await response.text()).not.toContain("form_submissions");
  });
});

test.describe("QA-06 · contas autenticadas na API REST @cms", () => {
  test.skip(!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY, REQUIRES_SUPABASE);
  test.skip(({ isMobile }) => isMobile, "A resposta do banco não depende do tamanho da tela.");

  let client: SupabaseClient;
  const accounts: Partial<Record<"admin" | "editor" | "viewer" | "pending" | "alvo", Account>> = {};
  const tokens: Partial<Record<"admin" | "editor" | "viewer" | "pending", string>> = {};

  test.beforeAll(async () => {
    client = serviceClient();
    const suffix = newSuffix();
    for (const role of ["admin", "editor", "viewer", "pending"] as const) {
      accounts[role] = await createAccount(client, role, suffix);
      tokens[role] = sessionFromCookie((await sessionCookies(accounts[role]!))[0].value).access_token;
    }
    accounts.alvo = await createAccount(client, "editor", `${suffix}a`);
  });

  test.afterAll(async () => {
    await deleteAccounts(client, Object.values(accounts));
  });

  const asUser = (role: keyof typeof tokens, path: string, init: RequestInit = {}) =>
    fetch(restUrl(path), {
      ...init,
      headers: {
        apikey: ANON_KEY!,
        Authorization: `Bearer ${tokens[role]}`,
        "content-type": "application/json",
        ...init.headers,
      },
    });

  const rpc = (role: keyof typeof tokens, name: string, args: object) =>
    asUser(role, `rpc/${name}`, { method: "POST", body: JSON.stringify(args) });

  const roleOf = async (id: string) =>
    (await client.from("profiles").select("role").eq("id", id).single()).data?.role as string;

  for (const role of ["editor", "viewer", "pending"] as const) {
    test(`${role}: não lê envios, trilha, matriz nem o perfil dos outros`, async () => {
      expect(await (await asUser(role, "form_submissions?select=id")).json(), "envios").toEqual([]);
      expect(await (await asUser(role, "audit_log?select=id")).json(), "trilha").toEqual([]);
      const matrix = await asUser(role, "role_permissions?select=*");
      expect(matrix.status, "matriz").toBe(403);
      const profiles = (await (await asUser(role, "profiles?select=id")).json()) as { id: string }[];
      expect(profiles.map((profile) => profile.id)).toEqual([accounts[role]!.id]);
    });

    test(`${role}: rascunhos seguem fora, a não ser que o papel permita`, async () => {
      const rows = (await (await asUser(role, "cases?select=status&status=neq.published")).json()) as unknown[];
      if (role === "pending") expect(rows).toEqual([]);
    });
  }

  test("N10: ninguém muda o próprio papel, nem pela tabela nem pela função", async () => {
    for (const role of ["admin", "editor", "viewer", "pending"] as const) {
      const account = accounts[role]!;
      const direct = await asUser(role, `profiles?id=eq.${account.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ role: "super_admin", active: true }),
      });
      expect(direct.ok ? await direct.json() : [], `${role} pela tabela`).toEqual([]);
      const viaRpc = await rpc(role, "assign_role", { p_target: account.id, p_role: "super_admin" });
      expect(viaRpc.ok, `${role} pela função`).toBe(false);
      expect(await roleOf(account.id), role).toBe(role);
    }
  });

  test("N09: admin não promove ninguém a admin; editor e leitor não mudam papel de ninguém", async () => {
    const target = accounts.alvo!.id;
    for (const next of ["admin", "super_admin"]) {
      const response = await rpc("admin", "assign_role", { p_target: target, p_role: next });
      expect(response.ok, `admin promove a ${next}`).toBe(false);
    }
    for (const role of ["editor", "viewer", "pending"] as const) {
      const response = await rpc(role, "assign_role", { p_target: target, p_role: "viewer" });
      expect(response.ok, role).toBe(false);
    }
    expect(await roleOf(target)).toBe("editor");
    const body = await (await rpc("viewer", "assign_role", { p_target: target, p_role: "viewer" })).text();
    expect(body).not.toMatch(/\bat \S+ \(|\/home\//);
  });

  test("controle: admin rebaixa um editor, como a regra permite", async () => {
    const target = accounts.alvo!.id;
    const response = await rpc("admin", "assign_role", { p_target: target, p_role: "viewer" });
    expect(response.ok).toBe(true);
    expect(await roleOf(target)).toBe("viewer");
    await client.from("profiles").update({ role: "editor" }).eq("id", target);
  });

  test("a trilha de auditoria não aceita evento forjado nem alteração", async () => {
    const forged = await rpc("viewer", "record_audit_event", {
      p_event: "lead.viewed",
      p_resource_type: "lead",
      p_resource_id: "00000000-0000-4000-8000-000000000000",
      p_outcome: "success",
      p_metadata: {},
      p_request_id: "forjado",
    });
    expect(forged.ok).toBe(false);
    const changed = await asUser("admin", "audit_log?id=not.is.null", {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ outcome: "alterado" }),
    });
    expect(changed.ok).toBe(false);
    const removed = await asUser("admin", "audit_log?id=not.is.null", {
      method: "DELETE",
      headers: { Prefer: "return=representation" },
    });
    expect(removed.ok).toBe(false);
  });
});

test.describe("QA-06 · Storage @cms", () => {
  test.skip(!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY, REQUIRES_SUPABASE);
  test.skip(({ isMobile }) => isMobile, "A resposta do Storage não depende do tamanho da tela.");

  const PNG = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64",
  );
  let client: SupabaseClient;
  let editor: Account;
  let editorToken: string;
  let viewer: Account;
  let viewerToken: string;
  let suffix: string;
  const sent: string[] = [];

  test.beforeAll(async () => {
    client = serviceClient();
    suffix = newSuffix();
    editor = await createAccount(client, "editor", suffix);
    viewer = await createAccount(client, "viewer", suffix);
    editorToken = sessionFromCookie((await sessionCookies(editor))[0].value).access_token;
    viewerToken = sessionFromCookie((await sessionCookies(viewer))[0].value).access_token;
    const path = `qa06/${suffix}/existente.png`;
    const { error } = await client.storage.from("media").upload(path, PNG, { contentType: "image/png" });
    if (error) throw error;
    sent.push(path);
  });

  test.afterAll(async () => {
    if (sent.length) await client.storage.from("media").remove(sent);
    await deleteAccounts(client, [editor, viewer]);
  });

  const upload = (token: string, path: string, contentType: string, body: Uint8Array | string) =>
    fetch(new URL(`/storage/v1/object/media/${path}`, SUPABASE_URL), {
      method: "POST",
      headers: { apikey: ANON_KEY!, Authorization: `Bearer ${token}`, "content-type": contentType },
      body: typeof body === "string" ? body : new Blob([body as BlobPart]),
    });

  const list = (token: string, prefix: string) =>
    fetch(new URL("/storage/v1/object/list/media", SUPABASE_URL), {
      method: "POST",
      headers: { apikey: ANON_KEY!, Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ prefix, limit: 100 }),
    });

  test("o bucket não lista para a chave anônima, embora o arquivo exista", async () => {
    for (const prefix of ["", "qa06", `qa06/${suffix}`]) {
      expect(await (await list(ANON_KEY!, prefix)).json(), prefix).toEqual([]);
    }
    // Controle: com a service role, o mesmo pedido enxerga o arquivo.
    const control = (await (await list(SERVICE_KEY!, `qa06/${suffix}`)).json()) as { name: string }[];
    expect(control.map((item) => item.name)).toEqual(["existente.png"]);
  });

  test("a chave anônima não envia, não substitui e não apaga", async () => {
    const created = await upload(ANON_KEY!, `qa06/${suffix}/anonimo.png`, "image/png", PNG);
    expect(created.ok, "envio").toBe(false);
    const replaced = await fetch(new URL(`/storage/v1/object/media/${sent[0]}`, SUPABASE_URL), {
      method: "PUT",
      headers: { ...anonHeaders(), "content-type": "image/png" },
      body: new Blob([PNG as BlobPart]),
    });
    expect(replaced.ok, "substituição").toBe(false);
    await fetch(new URL(`/storage/v1/object/media/${sent[0]}`, SUPABASE_URL), {
      method: "DELETE",
      headers: anonHeaders(),
    });
    const control = (await (await list(SERVICE_KEY!, `qa06/${suffix}`)).json()) as { name: string }[];
    expect(control.map((item) => item.name)).toContain("existente.png");
  });

  test("o leitor não envia para o bucket", async () => {
    const response = await upload(viewerToken, `qa06/${suffix}/leitor.png`, "image/png", PNG);
    expect(response.ok).toBe(false);
  });

  for (const [name, type, body] of [
    ["pagina.html", "text/html", "<script>alert(1)</script>"],
    ["vetor.svg", "image/svg+xml", "<svg xmlns='http://www.w3.org/2000/svg' onload='alert(1)'/>"],
    ["programa.exe", "application/x-msdownload", "MZ"],
    ["script.js", "text/javascript", "alert(1)"],
    ["dados.json", "application/json", "{}"],
    ["pacote.zip", "application/zip", "PK"],
    ["sem-tipo", "application/octet-stream", "x"],
  ] as const) {
    test(`tipo proibido é recusado pelo bucket, mesmo com permissão: ${type}`, async () => {
      const path = `qa06/${suffix}/${name}`;
      const response = await upload(editorToken, path, type, body);
      if (response.ok) sent.push(path);
      expect(response.ok).toBe(false);
      // O Storage responde 400 com o código real no corpo.
      const refusal = (await response.json()) as { statusCode: string; error: string };
      expect(refusal).toMatchObject({ statusCode: "415", error: "invalid_mime_type" });
      expect(JSON.stringify(refusal)).not.toMatch(/\bat \S+ \(|\/home\//);
    });
  }

  test("o bucket respeita o tipo declarado, sem conferir o conteúdo: quem confere é o servidor do painel", async () => {
    // Registro da limitação (arquivo renomeado): a assinatura é conferida em `finalizeMediaUpload`.
    const path = `qa06/${suffix}/disfarce.png`;
    const response = await upload(editorToken, path, "image/png", "<script>alert(1)</script>");
    if (response.ok) sent.push(path);
    expect(response.ok).toBe(true);
  });

  test("controle: o editor envia uma imagem de verdade", async () => {
    const path = `qa06/${suffix}/editor.png`;
    const response = await upload(editorToken, path, "image/png", PNG);
    if (response.ok) sent.push(path);
    expect(response.status).toBe(200);
  });
});

test.describe("QA-06 · conteúdo fora do ar por URL direta @cms", () => {
  test.skip(!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY, REQUIRES_SUPABASE);
  test.skip(({ isMobile }) => isMobile, "A resposta do servidor não depende do tamanho da tela.");

  let client: SupabaseClient;
  let mass: HiddenMass;

  test.beforeAll(async ({ baseURL }) => {
    client = serviceClient();
    mass = await seedHidden(client, newSuffix());
    // O cache público é lido de novo a partir daqui: se a RLS deixasse passar, o sufixo apareceria.
    if (REVALIDATE_SECRET) {
      for (const entity of ["area", "service", "category", "case", "cta", "page"]) {
        await rawRequest(baseURL!, "/api/internal/revalidate", {
          method: "POST",
          headers: { authorization: `Bearer ${REVALIDATE_SECRET}`, "content-type": "application/json" },
          body: JSON.stringify({ entity }),
        });
      }
    }
  });

  test.afterAll(async () => {
    await removeHidden(client, mass);
  });

  /**
   * O texto do item, nunca o endereço: o Next repete no corpo o caminho pedido, e quem pediu já o conhecia.
   * Todo item oculto da massa tem o sufixo depois de "Oculto <estado>", "Oculta <estado>" ou "Cliente oculto".
   */
  const expectHidden = (body: string, label: string) =>
    expect(new RegExp(`(Ocult[oa] \\w+|Cliente oculto|Parágrafo oculto|Oculto) ${mass.suffix}`).test(body), label).toBe(
      false,
    );

  for (const route of ["cases", "servicos"] as const) {
    test(`/${route}/<oculto>: 404 de verdade, também na navegação do Next`, async ({ baseURL }) => {
      const slugs = route === "cases" ? mass.slugs.cases : mass.slugs.services;
      for (const slug of slugs) {
        const variants: Record<string, string>[] = [{}, { RSC: "1" }, { RSC: "1", "Next-Router-Prefetch": "1" }];
        for (const headers of variants) {
          const response = await rawRequest(baseURL!, `/${route}/${slug}`, { headers });
          expect(response.status, `${slug} ${JSON.stringify(headers)}`).toBe(404);
          expectHidden(response.body, slug);
        }
        const rsc = await rawRequest(baseURL!, `/${route}/${slug}.rsc`);
        expect(rsc.status, `${slug}.rsc`).toBe(404);
        expectHidden(rsc.body, `${slug}.rsc`);
      }
    });
  }

  test("nenhuma rota de /api/v1 devolve conteúdo oculto, deduzidas dos arquivos", async ({ baseURL }) => {
    const routes = (readdirSync("app/api/v1", { recursive: true }) as string[])
      .map((file) => file.replace(/\\/g, "/"))
      .filter((file) => file.endsWith("route.ts"))
      .map((file) => `/api/v1/${file.replace(/\/?route\.ts$/, "")}`);
    expect(routes.length).toBeGreaterThanOrEqual(11);

    const slugsByFolder: Record<string, string[]> = {
      areas: mass.slugs.areas,
      cases: mass.slugs.cases,
      services: mass.slugs.services,
      pages: mass.slugs.pages,
    };
    for (const route of routes) {
      if (route.includes("[slug]")) {
        const folder = route.split("/")[3];
        expect(slugsByFolder[folder], route).toBeDefined();
        for (const slug of slugsByFolder[folder]) {
          const response = await rawRequest(baseURL!, route.replace("[slug]", slug));
          expect(response.status, `${route} ${slug}`).toBe(404);
          expectHidden(response.body, `${route} ${slug}`);
          expectNoInternals(response.body, `${route} ${slug}`);
        }
      } else {
        const response = await rawRequest(baseURL!, `${route}?pageSize=50`);
        expect(response.status, route).toBeLessThan(500);
        expectHidden(response.body, route);
        expectNoInternals(response.body, route);
      }
    }
  });

  test("sitemap, llms e filtros não citam nada oculto", async ({ baseURL }) => {
    const [service] = mass.slugs.services;
    const [category] = mass.slugs.case_categories;
    const [area] = mass.slugs.areas;
    for (const path of [
      "/sitemap.xml",
      "/llms.txt",
      "/llms-full.txt",
      "/servicos",
      "/cases",
      "/areas",
      "/",
      `/cases?categoria=${category}`,
      `/cases?servico=${service}`,
      `/cases?area=${area}`,
      `/contato?servico=${service}`,
      `/contato/projeto?servico=${service}`,
    ]) {
      const response = await rawRequest(baseURL!, path);
      expect(response.status, path).toBe(200);
      expectHidden(response.body, path);
    }
  });

  test("função `use cache` chamada direto por POST só devolve o que está no ar", async ({ baseURL }) => {
    // Quem tiver o id do manifesto chama a função sem passar pela página (achado A-04): a RLS segura mesmo assim.
    const ids = cacheFunctionIds();
    expect(ids.length).toBeGreaterThan(0);
    const slugs = [...mass.slugs.cases, ...mass.slugs.services, ...mass.slugs.areas, ...mass.slugs.pages];
    const argumentLists = [[], [{}], [{ featuredOnly: false }], ...slugs.map((slug) => [slug])];
    for (const id of ids) {
      for (const args of argumentLists) {
        const response = await rawRequest(baseURL!, "/", {
          method: "POST",
          headers: { "next-action": id, origin: baseURL!, accept: "text/x-component" },
          body: JSON.stringify(args),
        });
        expectHidden(response.body, `${id} ${JSON.stringify(args)}`);
        expectNoInternals(response.body, id);
      }
    }
  });

  test("a imagem de compartilhamento de item oculto é a mesma de um endereço que não existe", async ({ baseURL }) => {
    const manifest = JSON.parse(readFileSync(".next/app-path-routes-manifest.json", "utf8")) as Record<string, string>;
    const imageRoute = (folder: string) =>
      Object.values(manifest).find((route) => route.startsWith(`/${folder}/[slug]/opengraph-image`));
    for (const [folder, slugs] of [
      ["cases", mass.slugs.cases],
      ["servicos", mass.slugs.services],
    ] as const) {
      const route = imageRoute(folder);
      expect(route, folder).toBeDefined();
      const image = async (slug: string) =>
        fetch(new URL(route!.replace("[slug]", slug), baseURL)).then(async (response) =>
          Buffer.from(await response.arrayBuffer()).toString("base64"),
        );
      const generic = await image("endereco-que-nao-existe");
      for (const slug of slugs) expect((await image(slug)) === generic, slug).toBe(true);
    }
  });
});

test.describe("QA-06 · item que sai do ar some na hora, com cache cheio @cms", () => {
  test.skip(!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY || !REVALIDATE_SECRET, REQUIRES_SUPABASE);
  test.skip(({ isMobile }) => isMobile, "A resposta do servidor não depende do tamanho da tela.");
  test.setTimeout(90_000);

  let client: SupabaseClient;
  let admin: Account;
  let session: APIRequestContext;
  let actions: Map<string, string>;

  test.beforeAll(async ({ baseURL }) => {
    client = serviceClient();
    actions = panelActionsFromBuild();
    admin = await createAccount(client, "admin", newSuffix());
    session = await newSession(baseURL!, admin);
  });

  test.afterAll(async () => {
    await session?.dispose();
    await deleteAccounts(client, [admin]);
  });

  async function seedLive(suffix: string) {
    const insert = async (table: string, values: Record<string, unknown>) => {
      const { data, error } = await client.from(table).insert(values).select("id").single();
      if (error) throw new Error(`${table}: ${error.message}`);
      return data.id as string;
    };
    const published = { status: "published", published_at: PAST };
    const text = { summary: "Resumo do item do teste.", description: "Descrição do item usado neste teste de cache." };
    const media = await insert("media_assets", {
      path: `/brand/cases/meridiano-cache-${suffix}.webp`,
      mime_type: "image/webp",
      alt_text: `Capa ${suffix}`,
    });
    const area = await insert("areas", { ...published, ...text, slug: `cache-area-${suffix}`, name: `Área ${suffix}` });
    const service = await insert("services", { ...text, slug: `cache-servico-${suffix}`, name: `Serviço ${suffix}` });
    await client.from("service_areas").insert({ service_id: service, area_id: area });
    await client.from("services").update(published).eq("id", service);
    const category = await insert("case_categories", {
      ...published,
      slug: `cache-categoria-${suffix}`,
      name: `Categoria ${suffix}`,
    });
    const caseId = await insert("cases", {
      slug: `cache-case-${suffix}`,
      title: `Case ${suffix}`,
      client_name: "Cliente fictício",
      category_id: category,
      summary: "Resumo do case usado neste teste de cache.",
      cover_media_id: media,
    });
    await client.from("case_services").insert({ case_id: caseId, service_id: service });
    await client.from("cases").update(published).eq("id", caseId);
    return { media, area, service, category, caseId };
  }

  async function removeLive(ids: Awaited<ReturnType<typeof seedLive>>) {
    await client.from("cases").delete().eq("id", ids.caseId);
    await client.from("case_categories").delete().eq("id", ids.category);
    await client.from("services").delete().eq("id", ids.service);
    await client.from("areas").delete().eq("id", ids.area);
    await client.from("media_assets").delete().eq("id", ids.media);
  }

  const archive = async (baseURL: string, action: string, path: string, table: string, id: string) => {
    const { data } = await client.from(table).select("updated_at").eq("id", id).single();
    const response = await session.post(path, {
      multipart: actionBody({ id, expectedUpdatedAt: data!.updated_at as string, command: "archive" }),
      maxRedirects: 0,
      headers: { "Next-Action": actions.get(action)!, Accept: "text/x-component", Origin: baseURL },
    });
    expect(response.status()).toBeLessThan(400);
    expect((await client.from(table).select("status").eq("id", id).single()).data?.status).toBe("archived");
  };

  /** Publica no banco, invalida e confere: a visita deixa detalhe e API no cache do `use cache`. */
  async function warm(baseURL: string, paths: string[]) {
    for (const entity of ["service", "case"]) {
      await rawRequest(baseURL, "/api/internal/revalidate", {
        method: "POST",
        headers: { authorization: `Bearer ${REVALIDATE_SECRET}`, "content-type": "application/json" },
        body: JSON.stringify({ entity }),
      });
    }
    for (const path of paths) {
      await expect
        .poll(async () => (await rawRequest(baseURL, path)).status, { message: path, timeout: 20_000 })
        .toBe(200);
    }
  }

  test("arquivado pelo painel: detalhe, API e listas param de mostrar, sem redeploy", async ({ baseURL }) => {
    const suffix = newSuffix();
    const ids = await seedLive(suffix);
    const caseSlug = `cache-case-${suffix}`;
    const serviceSlug = `cache-servico-${suffix}`;
    try {
      await warm(baseURL!, [
        `/cases/${caseSlug}`,
        `/servicos/${serviceSlug}`,
        `/api/v1/cases/${caseSlug}`,
        `/api/v1/services/${serviceSlug}`,
      ]);
      await archive(baseURL!, "caseCommand", `/admin/cases/${ids.caseId}`, "cases", ids.caseId);
      await archive(baseURL!, "serviceCommand", `/admin/servicos/${ids.service}`, "services", ids.service);

      for (const path of [
        `/cases/${caseSlug}`,
        `/servicos/${serviceSlug}`,
        `/api/v1/cases/${caseSlug}`,
        `/api/v1/services/${serviceSlug}`,
      ]) {
        const response = await rawRequest(baseURL!, path);
        expect(response.status, path).toBe(404);
        expect(response.body.includes(`Case ${suffix}`), path).toBe(false);
      }
      for (const path of ["/api/v1/cases?pageSize=50", "/api/v1/services?pageSize=50"]) {
        const response = await rawRequest(baseURL!, path);
        expect(response.body.includes(suffix), path).toBe(false);
      }
    } finally {
      await removeLive(ids);
    }
  });

  test("arquivado direto no banco, sem invalidar: o proxy já responde 404 no detalhe", async ({ baseURL }) => {
    const suffix = newSuffix();
    const ids = await seedLive(suffix);
    const caseSlug = `cache-case-${suffix}`;
    try {
      await warm(baseURL!, [`/cases/${caseSlug}`]);
      await client
        .from("cases")
        .update({ status: "archived", archived_at: new Date().toISOString() })
        .eq("id", ids.caseId);
      const response = await rawRequest(baseURL!, `/cases/${caseSlug}`);
      expect(response.status).toBe(404);
      expect(response.body.includes(`Case ${suffix}`)).toBe(false);
    } finally {
      await removeLive(ids);
    }
  });
});

test.describe("QA-06 · erro não vaza detalhe interno @cms", () => {
  test.skip(({ isMobile }) => isMobile, "A resposta do servidor não depende do tamanho da tela.");

  for (const [label, path, status] of [
    ["400 página fora do intervalo", "/api/v1/cases?page=-1", 400],
    ["400 pageSize absurdo", "/api/v1/cases?pageSize=999999", 400],
    ["400 imagem sem endereço", "/_next/image", 400],
    ["400 imagem externa", "/_next/image?url=https%3A%2F%2Finvasor.test%2Fa.png&w=64&q=75", 400],
    ["401 rota interna", "/api/internal/jobs/notificacoes", 401],
    ["404 API", "/api/v1/services/nao-existe", 404],
    ["404 API com travessia", "/api/v1/pages/..%2F..%2Fetc%2Fpasswd", 404],
    ["404 página", "/rota-que-nao-existe", 404],
    ["404 detalhe", "/cases/nao-existe", 404],
    ["404 detalhe malformado", "/cases/%27%20OR%201%3D1--", 404],
    ["404 arquivo interno", "/_next/static/nao-existe.js", 404],
  ] as const) {
    test(`${label}`, async ({ baseURL }) => {
      const response = await rawRequest(baseURL!, path);
      expect(response.status).toBe(status);
      expectNoInternals(response.body, label);
    });
  }

  test("405 em método não aceito pela API pública", async ({ baseURL }) => {
    for (const method of ["POST", "PUT", "DELETE"]) {
      const response = await rawRequest(baseURL!, "/api/v1/services", { method });
      expect(response.status, method).toBe(405);
      expectNoInternals(response.body, method);
    }
  });

  test("500 e 4xx de Server Action malformada não trazem pilha nem caminho", async ({ baseURL }) => {
    const attempts: { label: string; headers: Record<string, string>; body?: string }[] = [
      { label: "origem de outro site", headers: { "next-action": "a".repeat(42), origin: "https://invasor.test" } },
      { label: "id inexistente", headers: { "next-action": "a".repeat(42), origin: baseURL! } },
      { label: "id estranho", headers: { "next-action": "../../etc/passwd", origin: baseURL! } },
      {
        label: "corpo quebrado",
        headers: {
          "next-action": "a".repeat(42),
          origin: baseURL!,
          "content-type": "multipart/form-data; boundary=x",
        },
        body: "--x\r\nquebrado",
      },
    ];
    for (const route of ["/", "/contato", "/admin/login"]) {
      for (const { label, headers, body } of attempts) {
        const response = await rawRequest(baseURL!, route, { method: "POST", headers, body });
        expect(response.status, `${route} ${label}`).toBeGreaterThanOrEqual(400);
        expectNoInternals(response.body, `${route} ${label}`);
      }
    }
  });

  test("cabeçalho Host de outro site não muda redirecionamento nem conteúdo", async ({ baseURL }) => {
    const response = await rawRequest(baseURL!, "/admin/leads", { headers: { host: "invasor.test" } });
    expect(response.status).toBe(307);
    expect(response.headers.location ?? "").toMatch(/^\/admin\/login/);
    const forwarded = await rawRequest(baseURL!, "/admin/leads", { headers: { "x-forwarded-host": "invasor.test" } });
    expect(forwarded.headers.location ?? "").not.toContain("invasor.test");
  });
});

// Com a tag, a busca roda também no build com as chaves reais do ambiente local, procurando o valor delas.
test.describe("QA-06 · arquivos e segredos no que é entregue ao navegador @cms", () => {
  test.skip(({ isMobile }) => isMobile, "O conteúdo entregue não depende do tamanho da tela.");

  /** Nomes de variáveis que só existem no servidor (`NEXT_PUBLIC_*` é público por definição). */
  const SECRET_NAMES = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "E2E_SUPABASE_SERVICE_ROLE_KEY",
    "RESEND",
    "CRON_SECRET",
    "SUBMISSION_HASH_SECRET",
    "CONTENT_REVALIDATE_SECRET",
  ];

  function filesUnder(root: string): string[] {
    if (!existsSync(root)) return [];
    return (readdirSync(root, { recursive: true }) as string[])
      .map((file) => join(root, file))
      .filter((file) => statSync(file).isFile());
  }

  /** Só o nome do segredo e o arquivo: um teste que imprime o valor seria ele mesmo o vazamento. */
  function secretsIn(label: string, content: string): string[] {
    const hits = SECRET_NAMES.filter((name) => content.includes(name)).map((name) => `${label}: nome ${name}`);
    for (const [name, value] of Object.entries(SECRET_VALUES)) {
      if (value && content.includes(value)) hits.push(`${label}: valor de ${name}`);
    }
    if (/"role"\s*:\s*"service_role"/.test(content)) hits.push(`${label}: claim service_role`);
    return hits;
  }

  const scanFiles = (files: string[]) =>
    files.flatMap((file) => secretsIn(file, readFileSync(file).toString("latin1")));

  test("public/ não traz segredo nem arquivo de configuração", () => {
    const files = filesUnder("public");
    expect(files.length).toBeGreaterThan(0);
    expect(scanFiles(files)).toEqual([]);
    expect(files.filter((file) => /\.env|\.pem$|\.key$|\.sql$|\.git\b|\.bak$|\.dump$/.test(file))).toEqual([]);
  });

  test(".next/static não traz segredo nem mapa de código", () => {
    const files = filesUnder(".next/static");
    expect(files.length).toBeGreaterThan(10);
    expect(scanFiles(files)).toEqual([]);
    expect(files.filter((file) => file.endsWith(".map"))).toEqual([]);
  });

  test("o id das funções `use cache` não chega ao navegador", () => {
    const ids = cacheFunctionIds();
    expect(ids.length).toBeGreaterThan(0);
    const delivered = [
      ...filesUnder(".next/static"),
      ...filesUnder(".next/server/app").filter((file) => /\.(html|rsc)$/.test(file)),
    ];
    const contents = delivered.map((file) => readFileSync(file).toString("latin1"));
    expect(ids.filter((id) => contents.some((content) => content.includes(id)))).toEqual([]);
  });

  test("HTML e RSC pré-renderizados não trazem segredo", () => {
    const files = filesUnder(".next/server/app").filter((file) => /\.(html|rsc|meta|body)$/.test(file));
    expect(files.length).toBeGreaterThan(10);
    expect(scanFiles(files)).toEqual([]);
  });

  test("HTML entregue nas rotas públicas não traz segredo", async ({ baseURL }) => {
    for (const path of [
      "/",
      "/sobre",
      "/areas",
      "/servicos",
      "/cases",
      "/contato",
      "/feedback",
      "/privacidade",
      "/admin/login",
    ]) {
      const response = await rawRequest(baseURL!, path);
      expect(response.status, path).toBe(200);
      expect(secretsIn(path, response.body), path).toEqual([]);
    }
  });

  test("todo JavaScript que uma página carrega, seguido pelo navegador, não traz segredo", async ({ page }) => {
    const hits: string[] = [];
    const pending: Promise<void>[] = [];
    page.on("response", (response) => {
      if (!/\.js(\?|$)/.test(response.url())) return;
      pending.push(
        response
          .text()
          .then((text) => void hits.push(...secretsIn(new URL(response.url()).pathname, text)))
          .catch(() => undefined),
      );
    });
    for (const route of ["/", "/contato", "/admin/login"]) await page.goto(route, { waitUntil: "networkidle" });
    await Promise.all(pending);
    expect(pending.length).toBeGreaterThan(0);
    expect(hits).toEqual([]);
  });

  for (const path of [
    "/.env",
    "/.env.local",
    "/.env.example",
    "/.git/config",
    "/.git/HEAD",
    "/package.json",
    "/package-lock.json",
    "/next.config.ts",
    "/tsconfig.json",
    "/vercel.json",
    "/README.md",
    "/AGENTS.md",
    "/proxy.ts",
    "/.next/BUILD_ID",
    "/.next/server/server-reference-manifest.json",
    "/_next/server/server-reference-manifest.json",
    "/_next/static/../../.env",
    "/_next/static/..%2F..%2F.env",
    "/supabase/config.toml",
    "/supabase/seed.sql",
    "/scripts/provision-admin.mjs",
    "/lib/config/server-env.ts",
    "/backup.sql",
    "/.vercel/project.json",
  ]) {
    test(`arquivo do projeto não é servido: ${path}`, async ({ baseURL }) => {
      const response = await rawRequest(baseURL!, path);
      expect(response.status).toBeGreaterThanOrEqual(400);
      expectNoInternals(response.body, path);
    });
  }
});
