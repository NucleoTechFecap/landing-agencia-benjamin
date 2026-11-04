/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : acesso-indevido-painel.spec.ts
 Descrição    : Rotas e Server Actions do painel sem sessão, com papel insuficiente e com credencial forjada.

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

import { readdirSync } from "node:fs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { expect, request as apiRequest, test, type APIRequestContext, type APIResponse } from "@playwright/test";
import { PUBLIC_ADMIN_PATHS } from "@/lib/domain/auth/redirect";
import {
  ANON_KEY,
  actionBody,
  encodeSessionCookie,
  newSession,
  noScriptBody,
  panelActionsFromBuild,
  rawRequest,
  sessionCookies,
  sessionFromCookie,
  type Fields,
  type RawResponse,
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
  type PanelRole,
} from "./painel-helpers";

/*
 * QA-06: tentativas de chegar ao painel sem permissão. Sem depender de ordem: cada worker prepara a
 * própria massa, e os testes só leem o que ela guarda. As listas de rotas e de Server Actions saem do
 * sistema de arquivos e do manifesto do build, para uma rota nova não escapar.
 */
/** O que só existe dentro do painel: nenhum destes textos pode chegar a quem não entrou. */
const PANEL_MARKS = ["Módulos do painel", "Bem-vindo", "Visão geral", "Leads e feedbacks", "Biblioteca de mídia"];

/** Autorização por escrito de quais rotas abrem sem sessão: rota nova aqui é decisão, não acidente. */
const AUTHORIZED_PUBLIC_ROUTES = ["/admin/auth/callback", "/admin/login", "/admin/recuperar-senha"];

/** Rotas de `app/admin`, deduzidas dos arquivos `page.tsx` e `route.ts`, sem os grupos entre parênteses. */
function adminRoutesFromDisk(): string[] {
  const routes = (readdirSync("app/admin", { recursive: true }) as string[])
    .map((file) => file.replace(/\\/g, "/"))
    .filter((file) => /(^|\/)(page\.tsx|route\.ts)$/.test(file))
    .map((file) => {
      const folders = file
        .split("/")
        .slice(0, -1)
        .filter((segment) => !/^\(.*\)$/.test(segment));
      return ["/admin", ...folders].join("/");
    });
  return [...new Set(routes)].sort();
}

const ADMIN_ROUTES = adminRoutesFromDisk();
const PROTECTED_ROUTES = ADMIN_ROUTES.filter((route) => !AUTHORIZED_PUBLIC_ROUTES.includes(route));

/** Valores de id: existente em formato, malformado, injeção, travessia, nulo e enorme. */
const ID_SAMPLES = [
  "00000000-0000-4000-8000-000000000000",
  "nao-e-uuid",
  "%27%20OR%201%3D1--",
  "..%2F..%2Fetc%2Fpasswd",
  "%00",
  "x".repeat(1500),
];

const panelMarksIn = (body: string) => PANEL_MARKS.filter((mark) => body.includes(mark));

function expectLoginRedirect(response: RawResponse, label: string) {
  expect(response.status, label).toBe(307);
  const location = new URL(response.headers.location ?? "", "http://base.local");
  expect(location.origin, label).toBe("http://base.local");
  expect(location.pathname, label).toBe("/admin/login");
  expect(panelMarksIn(response.body), label).toEqual([]);
}

// A tag leva estes testes também à bateria com o Supabase: sem ele, o proxy nega por padrão e a sessão nem é lida.
test.describe("QA-06 · rotas do painel sem sessão @cms", () => {
  test.skip(({ isMobile }) => isMobile, "A resposta do servidor não depende do tamanho da tela.");

  test("o sistema de arquivos ainda tem as rotas que este arquivo espera", () => {
    expect(ADMIN_ROUTES.length).toBeGreaterThan(25);
    expect(ADMIN_ROUTES).toContain("/admin");
    expect(ADMIN_ROUTES).toContain("/admin/leads/[id]");
    expect(ADMIN_ROUTES).toContain("/admin/paginas/[id]/blocos/[blocoId]");
  });

  test("só login, recuperação e o retorno do e-mail abrem sem sessão", () => {
    expect([...PUBLIC_ADMIN_PATHS].sort()).toEqual(AUTHORIZED_PUBLIC_ROUTES);
    expect(ADMIN_ROUTES.filter((route) => AUTHORIZED_PUBLIC_ROUTES.includes(route))).toEqual(AUTHORIZED_PUBLIC_ROUTES);
  });

  for (const route of PROTECTED_ROUTES) {
    test(`${route} leva ao login, com qualquer id`, async ({ baseURL }) => {
      const paths = route.includes("[")
        ? ID_SAMPLES.map((sample) => route.replace(/\[[^\]]+\]/g, sample))
        : [route, `${route}?id=1&next=https://invasor.test`];
      for (const path of paths) expectLoginRedirect(await rawRequest(baseURL!, path), path.slice(0, 120));
    });
  }

  test("a pré-busca e a navegação do Next também não entregam nada", async ({ baseURL }) => {
    const variants: Record<string, string>[] = [
      { RSC: "1" },
      { RSC: "1", "Next-Router-Prefetch": "1" },
      { RSC: "1", "Next-Router-Prefetch": "1", "Next-Router-Segment-Prefetch": "/_tree" },
      { Accept: "text/x-component" },
    ];
    for (const route of ["/admin", "/admin/leads", "/admin/conteudos"]) {
      for (const headers of variants) {
        expectLoginRedirect(await rawRequest(baseURL!, route, { headers }), `${route} ${JSON.stringify(headers)}`);
      }
      expectLoginRedirect(await rawRequest(baseURL!, `${route}?_rsc=abc123`), `${route}?_rsc`);
    }
  });

  test("cabeçalhos forjados não pulam a barreira (CVE-2025-29927 e parecidos)", async ({ baseURL }) => {
    const forged: Record<string, string>[] = [
      { "x-middleware-subrequest": "proxy:proxy:proxy:proxy:proxy" },
      { "x-middleware-subrequest": "middleware:middleware:middleware:middleware:middleware" },
      { "x-middleware-subrequest": "src/proxy:src/proxy:src/proxy:src/proxy:src/proxy" },
      { "x-invoke-path": "/admin/leads", "x-invoke-query": "{}" },
      { "x-matched-path": "/admin/leads" },
      { "x-nextjs-data": "1" },
      { "x-forwarded-for": "127.0.0.1", "x-real-ip": "127.0.0.1" },
      { "x-user-role": "admin", cookie: "role=admin; user_role=admin" },
    ];
    for (const headers of forged) {
      expectLoginRedirect(await rawRequest(baseURL!, "/admin/leads", { headers }), JSON.stringify(headers));
    }
  });

  test("outros métodos HTTP também vão para o login", async ({ baseURL }) => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]) {
      expectLoginRedirect(await rawRequest(baseURL!, "/admin/leads", { method }), method);
    }
  });

  /** Nenhuma destas escritas pode abrir o painel: o resultado é login ou não encontrado, nunca 200 com conteúdo. */
  for (const path of [
    "/admin/",
    "//admin",
    "/admin//leads",
    "/ADMIN",
    "/Admin/leads",
    "/%61dmin",
    "/%61dmin/leads",
    "/admin/%6ceads",
    "/admin%2Fleads",
    "/admin/(painel)",
    "/admin/(painel)/leads",
    "/admin/%28painel%29/leads",
    "/admin.rsc",
    "/admin/leads.rsc",
    "/admin/leads.segments/_tree.segment.rsc",
    "/admin/login/../leads",
    "/admin/login/..%2Fleads",
    "/admin/login/%2e%2e/leads",
    "/admin/login%2F..%2Fleads",
    "/admin/recuperar-senha/..%2Fleads",
    "/admin/auth/callback/..%2F..%2Fleads",
    "/admin/./leads",
    "/./admin/leads",
    "/admin/leads%00",
    "/admin/leads;x=1",
    "/admin/leads/",
    "/_next/data/x/admin/leads.json",
    "/_next/static/../../admin/leads",
    "/admin/previa/servico/00000000-0000-4000-8000-000000000000.rsc",
    "/admin/login/..%2Fprevia%2Fservico%2F00000000-0000-4000-8000-000000000000",
    "/admin/ctas.rsc",
    "/admin/midia/00000000-0000-4000-8000-000000000000.rsc",
  ]) {
    test(`escrita alternativa não abre o painel: ${path}`, async ({ baseURL }) => {
      let response = await rawRequest(baseURL!, path);
      // Barra final e afins: segue o redirecionamento de normalização, sem sair do site.
      for (let hop = 0; hop < 3 && [301, 308].includes(response.status); hop += 1) {
        const next = new URL(response.headers.location ?? "/", baseURL);
        expect(next.origin).toBe(new URL(baseURL!).origin);
        response = await rawRequest(baseURL!, next.pathname + next.search);
      }
      expect(panelMarksIn(response.body)).toEqual([]);
      if (response.status === 307) {
        // O Next responde à rota de dados do Pages Router com a raiz do site: não abre nada.
        const location = new URL(response.headers.location ?? "", baseURL);
        expect(["/admin/login", "/"], path).toContain(location.pathname);
      } else {
        expect(response.status, path).toBeGreaterThanOrEqual(400);
      }
    });
  }

  test("no navegador, um envio específico termina na tela de login, com o retorno guardado", async ({ page }) => {
    const id = "00000000-0000-4000-8000-000000000000";
    await page.goto(`/admin/leads/${id}`);
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fleads%2F/);
    await expect(page.getByRole("heading", { level: 1, name: /Painel da Benjamin/ })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Módulos do painel" })).toHaveCount(0);
  });

  test("o retorno do e-mail, com destino externo, não sai do site", async ({ baseURL }) => {
    for (const next of ["https://invasor.test/", "//invasor.test/", "/\\invasor.test", "javascript:alert(1)"]) {
      const query = new URLSearchParams({ token_hash: "token-falso", type: "recovery", next }).toString();
      const response = await rawRequest(baseURL!, `/admin/auth/callback?${query}`);
      expect(response.status, next).toBeGreaterThanOrEqual(300);
      expect(response.status, next).toBeLessThan(400);
      const location = new URL(response.headers.location ?? "", baseURL);
      expect(location.origin, next).toBe(new URL(baseURL!).origin);
      expect(location.pathname, next).toBe("/admin/login");
    }
  });
});

test.describe("QA-06 · login com destino externo @cms", () => {
  test.skip(!SUPABASE_URL || !SERVICE_KEY, REQUIRES_SUPABASE);
  test.skip(({ isMobile }) => isMobile, "O destino não depende do tamanho da tela.");

  for (const next of ["https://invasor.test/", "//invasor.test/admin", "/admin@invasor.test"]) {
    test(`depois do login, ${next} não tira ninguém do site`, async ({ page }) => {
      const client = serviceClient();
      const account = await createAccount(client, "viewer", newSuffix());
      try {
        await page.goto(`/admin/login?next=${encodeURIComponent(next)}`);
        await expect(page.locator("form")).toHaveCount(1);
        await page.getByLabel("E-mail").fill(account.email);
        await page.getByLabel("Senha").fill(account.password);
        await page.getByRole("button", { name: "Entrar" }).click();
        await page.waitForURL((url) => url.pathname !== "/admin/login");
        expect(new URL(page.url()).hostname).toBe("localhost");
      } finally {
        await deleteAccounts(client, [account]);
      }
    });
  }
});

interface Mass {
  suffix: string;
  media: string;
  area: string;
  areaDraft: string;
  areaArchived: string;
  service: string;
  serviceDraft: string;
  serviceArchived: string;
  category: string;
  categoryDraft: string;
  categoryArchived: string;
  case: string;
  caseDraft: string;
  caseArchived: string;
  page: string;
  pageDraft: string;
  pageArchived: string;
  block: string;
  cta: string;
  ctaDraft: string;
  ctaArchived: string;
  /** Sem uso em nenhum conteúdo: é o que o painel deixa editar e excluir (ADM-09). */
  mediaFree: string;
  mediaDisposable: string;
  leadNew: string;
  leadArchived: string;
}

const PAST = "2026-10-01T12:00:00.000Z";
const TEXT = {
  summary: "Resumo usado no teste de acesso indevido.",
  description: "Descrição usada no teste de acesso indevido, com o tamanho mínimo para publicar.",
};

const WATCHED_COLUMNS: Record<string, (keyof Mass)[]> = {
  areas: ["area", "areaDraft", "areaArchived"],
  services: ["service", "serviceDraft", "serviceArchived"],
  case_categories: ["category", "categoryDraft", "categoryArchived"],
  cases: ["case", "caseDraft", "caseArchived"],
  pages: ["page", "pageDraft", "pageArchived"],
  blocks: ["block"],
  ctas: ["cta", "ctaDraft", "ctaArchived"],
  media_assets: ["media", "mediaFree", "mediaDisposable"],
  form_submissions: ["leadNew", "leadArchived"],
};

async function seedMass(client: SupabaseClient, suffix: string): Promise<Mass> {
  const insert = async (table: string, values: Record<string, unknown>) => {
    const { data, error } = await client.from(table).insert(values).select("id").single();
    if (error) throw new Error(`${table}: ${error.message}`);
    return data.id as string;
  };
  const link = async (table: string, values: Record<string, unknown>) => {
    const { error } = await client.from(table).insert(values);
    if (error) throw new Error(`${table}: ${error.message}`);
  };
  const publish = async (table: string, id: string) => {
    const { error } = await client.from(table).update({ status: "published", published_at: PAST }).eq("id", id);
    if (error) throw new Error(`${table}: ${error.message}`);
  };
  const published = { status: "published", published_at: PAST };
  const archived = { status: "archived", published_at: PAST, archived_at: PAST };

  const media = await insert("media_assets", {
    path: `/brand/cases/meridiano-acesso-${suffix}.webp`,
    mime_type: "image/webp",
    width: 1200,
    height: 750,
    alt_text: `Imagem do teste de acesso ${suffix}`,
  });
  const area = await insert("areas", { ...published, ...TEXT, slug: `acesso-area-${suffix}`, name: `Área ${suffix}` });
  const areaDraft = await insert("areas", {
    ...TEXT,
    slug: `acesso-area-rascunho-${suffix}`,
    name: `Área rascunho ${suffix}`,
  });
  const areaArchived = await insert("areas", {
    ...archived,
    ...TEXT,
    slug: `acesso-area-arquivada-${suffix}`,
    name: `Área arquivada ${suffix}`,
  });

  const serviceValues = (slug: string, name: string) => ({ ...TEXT, slug, name, image_media_id: media });
  const service = await insert("services", serviceValues(`acesso-servico-${suffix}`, `Serviço ${suffix}`));
  await link("service_areas", { service_id: service, area_id: area });
  await publish("services", service);
  const serviceDraft = await insert(
    "services",
    serviceValues(`acesso-servico-rascunho-${suffix}`, `Serviço rascunho ${suffix}`),
  );
  await link("service_areas", { service_id: serviceDraft, area_id: area });
  const serviceArchived = await insert("services", {
    ...archived,
    ...serviceValues(`acesso-servico-arquivado-${suffix}`, `Serviço arquivado ${suffix}`),
  });

  const category = await insert("case_categories", {
    ...published,
    slug: `acesso-categoria-${suffix}`,
    name: `Categoria ${suffix}`,
  });
  const categoryDraft = await insert("case_categories", {
    slug: `acesso-categoria-rascunho-${suffix}`,
    name: `Categoria rascunho ${suffix}`,
  });
  const categoryArchived = await insert("case_categories", {
    ...archived,
    slug: `acesso-categoria-arquivada-${suffix}`,
    name: `Categoria arquivada ${suffix}`,
  });

  const caseValues = (slug: string, title: string) => ({
    slug,
    title,
    client_name: "Cliente fictício",
    category_id: category,
    summary: "Resumo do case usado no teste de acesso indevido.",
    cover_media_id: media,
  });
  const caseId = await insert("cases", caseValues(`acesso-case-${suffix}`, `Case ${suffix}`));
  await link("case_services", { case_id: caseId, service_id: service });
  await publish("cases", caseId);
  const caseDraft = await insert("cases", caseValues(`acesso-case-rascunho-${suffix}`, `Case rascunho ${suffix}`));
  await link("case_services", { case_id: caseDraft, service_id: service });
  const caseArchived = await insert("cases", {
    ...archived,
    ...caseValues(`acesso-case-arquivado-${suffix}`, `Case arquivado ${suffix}`),
  });

  const page = await insert("pages", { ...published, slug: `acesso-pagina-${suffix}`, title: `Página ${suffix}` });
  const pageDraft = await insert("pages", {
    slug: `acesso-pagina-rascunho-${suffix}`,
    title: `Página rascunho ${suffix}`,
  });
  const pageArchived = await insert("pages", {
    ...archived,
    slug: `acesso-pagina-arquivada-${suffix}`,
    title: `Página arquivada ${suffix}`,
  });
  const blockContent = { title: `Bloco ${suffix}`, paragraphs: ["Parágrafo do teste de acesso indevido."] };
  const block = await insert("blocks", { page_id: page, type: "rich-text", sort_order: 0, content: blockContent });
  // Página sem bloco não pode ser publicada: o controle de "publicar" depende deste.
  await insert("blocks", { page_id: pageDraft, type: "rich-text", sort_order: 0, content: blockContent });

  // Rodapé: a posição não aparece na Home, para a massa não atrapalhar as jornadas em paralelo.
  const ctaValues = (label: string) => ({
    label,
    placement: "footer",
    target_kind: "internal",
    target_path: "/feedback",
  });
  const cta = await insert("ctas", { ...published, ...ctaValues(`CTA ${suffix}`) });
  const ctaDraft = await insert("ctas", ctaValues(`CTA rascunho ${suffix}`));
  const ctaArchived = await insert("ctas", { ...archived, ...ctaValues(`CTA arquivado ${suffix}`) });
  const looseMedia = (name: string) =>
    insert("media_assets", {
      path: `/brand/cases/${name}-${suffix}.webp`,
      mime_type: "image/webp",
      width: 1200,
      height: 750,
      alt_text: `Imagem sem uso ${suffix}`,
    });
  const mediaFree = await looseMedia("solta");
  const mediaDisposable = await looseMedia("descartavel");

  const lead = (status: string) =>
    insert("form_submissions", {
      id: crypto.randomUUID(),
      protocol: `AB-${newSuffix().slice(0, 6).toUpperCase()}`,
      kind: "lead",
      category: "lead:outro",
      status,
      fingerprint: `acesso-${status}-${suffix}`,
      notification_status: "sent",
      payload: { name: "Pessoa de Teste", email: "teste.e2e@exemplo.com", privacyConsent: true },
    });
  return {
    suffix,
    media,
    area,
    areaDraft,
    areaArchived,
    service,
    serviceDraft,
    serviceArchived,
    category,
    categoryDraft,
    categoryArchived,
    case: caseId,
    caseDraft,
    caseArchived,
    page,
    pageDraft,
    pageArchived,
    block,
    cta,
    ctaDraft,
    ctaArchived,
    mediaFree,
    mediaDisposable,
    leadNew: await lead("novo"),
    leadArchived: await lead("arquivado"),
  };
}

async function removeMass(client: SupabaseClient, mass: Mass | undefined) {
  if (!mass) return;
  for (const table of ["ctas", "blocks", "pages", "cases", "services", "case_categories", "areas", "media_assets"]) {
    const ids = (WATCHED_COLUMNS[table] ?? []).map((key) => mass[key]);
    await client.from(table).delete().in("id", ids);
  }
  await client.from("form_submissions").delete().in("id", [mass.leadNew, mass.leadArchived]);
  for (const table of ["areas", "services", "case_categories", "cases", "pages"]) {
    await client.from(table).delete().like("slug", `%invasao-%${mass.suffix}%`);
  }
  await client.from("ctas").delete().eq("label", `Invasao ${mass.suffix}`);
}

/** Estado completo das linhas da massa: qualquer gravação muda `updated_at`, mesmo sem mudar o texto. */
async function snapshotOf(client: SupabaseClient, mass: Mass) {
  const rows: Record<string, unknown> = {};
  for (const [table, keys] of Object.entries(WATCHED_COLUMNS)) {
    const { data, error } = await client
      .from(table)
      .select("*")
      .in(
        "id",
        keys.map((key) => mass[key]),
      )
      .order("id");
    if (error) throw new Error(`${table}: ${error.message}`);
    rows[table] = data;
  }
  for (const table of ["areas", "services", "case_categories", "cases", "pages"]) {
    const { data } = await client.from(table).select("id").like("slug", `%invasao-%${mass.suffix}%`);
    rows[`${table}: criados`] = data;
  }
  const { data: ctas } = await client.from("ctas").select("id").eq("label", `Invasao ${mass.suffix}`);
  rows["ctas: criados"] = ctas;
  const { data: blocks } = await client.from("blocks").select("id").eq("page_id", mass.page);
  rows["blocks: da página"] = blocks;
  const { data: media } = await client.from("media_assets").select("id").like("path", `%invasao%${mass.suffix}%`);
  rows["media_assets: criados"] = media;
  const { data: settings } = await client.from("site_settings").select("id").like("tagline", `%${mass.suffix}%`);
  rows["site_settings: alteradas"] = settings;
  return rows;
}

async function versionOf(client: SupabaseClient, table: string, id: string) {
  const { data, error } = await client.from(table).select("updated_at").eq("id", id).single();
  if (error) throw new Error(`${table}: ${error.message}`);
  return data.updated_at as string;
}

type Denied = "pending" | "viewer" | "editor" | "super_admin" | "desativado";

const CONTENT_DENIED: Denied[] = ["pending", "desativado", "viewer"];
const DELETE_DENIED: Denied[] = ["pending", "desativado", "viewer", "editor"];
const SETTINGS_DENIED: Denied[] = ["pending", "desativado", "viewer", "editor"];
const INBOX_DENIED: Denied[] = ["pending", "desativado", "viewer", "editor", "super_admin"];

interface Attempt {
  label: string;
  action: string;
  denied: Denied[];
  /** Tela que traz a Server Action no build: é para ela que o navegador envia. */
  path: (mass: Mass) => string;
  fields: (mass: Mass, client: SupabaseClient) => Promise<Fields>;
  /** Corpo do controle, quando o da recusa não pode ser gravado de verdade. */
  controlFields?: (mass: Mass, client: SupabaseClient) => Promise<Fields>;
  withState?: boolean;
  /** Prova de que o mesmo pedido, com o papel certo, grava. Sem isto, a recusa poderia ser de formato. */
  control: (mass: Mass, client: SupabaseClient, response: APIResponse) => Promise<void>;
}

interface Entity {
  key: "area" | "service" | "category" | "case" | "page" | "cta";
  table: string;
  save: string;
  command: string;
  base: string;
  newPath: string;
  labelColumn: "name" | "title" | "label";
  values: (mass: Mass, label: string, slug: string) => Fields;
}

/** Na ordem em que o painel permite arquivar: quem depende vem antes de quem é usado. */
const ENTITIES: Entity[] = [
  {
    key: "case",
    table: "cases",
    save: "saveCase",
    command: "caseCommand",
    base: "/admin/cases",
    newPath: "/admin/cases/novo",
    labelColumn: "title",
    values: (mass, label, slug) => ({
      title: label,
      slug,
      client: "Cliente fictício",
      categoryId: mass.category,
      serviceIds: [mass.service],
      summary: "Resumo do case usado no teste de acesso indevido.",
      coverId: mass.media,
    }),
  },
  {
    key: "service",
    table: "services",
    save: "saveService",
    command: "serviceCommand",
    base: "/admin/servicos",
    newPath: "/admin/servicos/novo",
    labelColumn: "name",
    values: (mass, label, slug) => ({ name: label, slug, ...TEXT, areaIds: [mass.area], imageId: mass.media }),
  },
  {
    key: "category",
    table: "case_categories",
    save: "saveCategory",
    command: "categoryCommand",
    base: "/admin/categorias",
    newPath: "/admin/categorias/nova",
    labelColumn: "name",
    values: (_mass, label, slug) => ({ name: label, slug }),
  },
  {
    key: "area",
    table: "areas",
    save: "saveArea",
    command: "areaCommand",
    base: "/admin/areas",
    newPath: "/admin/areas/nova",
    labelColumn: "name",
    values: (_mass, label, slug) => ({ name: label, slug, ...TEXT }),
  },
  // CTA não tem endereço próprio: o criado é achado pelo texto do botão.
  {
    key: "cta",
    table: "ctas",
    save: "saveCta",
    command: "ctaCommand",
    base: "/admin/ctas",
    newPath: "/admin/ctas/novo",
    labelColumn: "label",
    values: (_mass, label) => ({ label, placement: "footer", targetKind: "internal", targetPath: "/feedback" }),
  },
  {
    key: "page",
    table: "pages",
    save: "savePage",
    command: "pageCommand",
    base: "/admin/paginas",
    newPath: "/admin/paginas/nova",
    labelColumn: "title",
    values: (_mass, label, slug) => ({ title: label, slug }),
  },
];

const statusOf = async (client: SupabaseClient, table: string, id: string) =>
  (await client.from(table).select("status").eq("id", id).maybeSingle()).data?.status as string | undefined;

function contentAttempts(entity: Entity): Attempt[] {
  const { key, table, save, command, base, newPath, labelColumn } = entity;
  const live = (mass: Mass) => mass[key];
  const draft = (mass: Mass) => mass[`${key}Draft`];
  const archived = (mass: Mass) => mass[`${key}Archived`];
  const slugOf = async (client: SupabaseClient, id: string) =>
    key === "cta" ? "" : ((await client.from(table).select("slug").eq("id", id).single()).data!.slug as string);
  const expectStatus = async (client: SupabaseClient, id: string, status: string) =>
    expect(await statusOf(client, table, id), `${table} ${status}`).toBe(status);

  return [
    {
      label: `${save}: criar`,
      action: save,
      denied: CONTENT_DENIED,
      path: () => newPath,
      fields: async (mass) => entity.values(mass, `Invasao ${mass.suffix}`, `invasao-${key}-${mass.suffix}`),
      control: async (mass, client) => {
        const created = client.from(table).select("id");
        const { data } = await (key === "cta"
          ? created.eq("label", `Invasao ${mass.suffix}`)
          : created.eq("slug", `invasao-${key}-${mass.suffix}`));
        expect(data, `${save} criou`).toHaveLength(1);
      },
    },
    {
      label: `${save}: editar`,
      action: save,
      denied: CONTENT_DENIED,
      path: (mass) => `${base}/${live(mass)}`,
      fields: async (mass, client) => ({
        id: live(mass),
        expectedUpdatedAt: await versionOf(client, table, live(mass)),
        ...entity.values(mass, `Invasao ${mass.suffix}`, await slugOf(client, live(mass))),
      }),
      control: async (mass, client) => {
        const { data } = await client.from(table).select(labelColumn).eq("id", live(mass)).single();
        expect((data as unknown as Record<string, string>)[labelColumn], `${save} editou`).toBe(
          `Invasao ${mass.suffix}`,
        );
      },
    },
    {
      label: `${command}: publicar`,
      action: command,
      denied: CONTENT_DENIED,
      path: (mass) => `${base}/${draft(mass)}`,
      fields: async (mass, client) => ({
        id: draft(mass),
        expectedUpdatedAt: await versionOf(client, table, draft(mass)),
        command: "publish",
      }),
      control: async (mass, client) => expectStatus(client, draft(mass), "published"),
    },
    {
      label: `${command}: despublicar`,
      action: command,
      denied: CONTENT_DENIED,
      path: (mass) => `${base}/${draft(mass)}`,
      fields: async (mass, client) => ({
        id: draft(mass),
        expectedUpdatedAt: await versionOf(client, table, draft(mass)),
        command: "unpublish",
      }),
      control: async (mass, client) => expectStatus(client, draft(mass), "draft"),
    },
    {
      label: `${command}: arquivar`,
      action: command,
      denied: CONTENT_DENIED,
      path: (mass) => `${base}/${draft(mass)}`,
      fields: async (mass, client) => ({
        id: draft(mass),
        expectedUpdatedAt: await versionOf(client, table, draft(mass)),
        command: "archive",
      }),
      control: async (mass, client) => expectStatus(client, draft(mass), "archived"),
    },
    {
      label: `${command}: restaurar`,
      action: command,
      denied: CONTENT_DENIED,
      path: (mass) => `${base}/${archived(mass)}`,
      fields: async (mass, client) => ({
        id: archived(mass),
        expectedUpdatedAt: await versionOf(client, table, archived(mass)),
        command: "restore",
      }),
      control: async (mass, client) => expectStatus(client, archived(mass), "draft"),
    },
    {
      label: `${command}: excluir`,
      action: command,
      denied: DELETE_DENIED,
      path: (mass) => `${base}/${draft(mass)}`,
      fields: async (mass, client) => ({
        id: draft(mass),
        expectedUpdatedAt: await versionOf(client, table, draft(mass)),
        command: "delete",
      }),
      control: async (mass, client) => expect(await statusOf(client, table, draft(mass))).toBeUndefined(),
    },
  ];
}

const expectFlight = async (response: APIResponse, text: string) => expect(await response.text()).toContain(text);

const OTHER_ATTEMPTS: Attempt[] = [
  {
    label: "saveBlockAction: novo bloco",
    action: "saveBlockAction",
    denied: CONTENT_DENIED,
    path: (mass) => `/admin/paginas/${mass.page}`,
    fields: async (mass, client) => ({
      id: mass.page,
      expectedUpdatedAt: await versionOf(client, "pages", mass.page),
      type: "rich-text",
      title: `Invasao ${mass.suffix}`,
      paragraphs: "Parágrafo gravado pelo teste de acesso indevido.",
    }),
    control: async (mass, client) => {
      const { data } = await client.from("blocks").select("id").eq("page_id", mass.page);
      expect(data!.length, "bloco criado").toBeGreaterThan(1);
    },
  },
  {
    label: "blockCommand: excluir bloco",
    action: "blockCommand",
    denied: CONTENT_DENIED,
    path: (mass) => `/admin/paginas/${mass.page}`,
    fields: async (mass, client) => ({
      id: mass.page,
      expectedUpdatedAt: await versionOf(client, "pages", mass.page),
      blockId: mass.block,
      operation: "excluir",
    }),
    control: async (mass, client) => {
      const { data } = await client.from("blocks").select("id").eq("id", mass.block);
      expect(data, "bloco excluído").toEqual([]);
    },
  },
  {
    label: "saveSettings",
    action: "saveSettings",
    denied: SETTINGS_DENIED,
    path: () => "/admin/configuracoes",
    fields: async (mass, client) => {
      const { data } = await client.from("site_settings").select("*").single();
      return {
        tagline: `Invasao ${mass.suffix}`,
        description: data!.description as string,
        email: "",
        phone: "",
        address: "Endereço fictício do teste, 123",
        mapsUrl: "",
        instagram: "",
        tiktok: "",
        linkedin: "",
        expectedUpdatedAt: data!.updated_at as string,
      };
    },
    // Controle sem gravar: os mesmos valores passam pela guarda e chegam a "sem alteração". Gravar de verdade
    // atrapalharia as jornadas em paralelo, e o conflito com uma delas também prova que a guarda foi vencida.
    controlFields: async (_mass, client) => {
      const { data } = await client.from("site_settings").select("*").single();
      const contact = (data!.contact ?? {}) as Record<string, string | undefined>;
      const socials = (data!.socials ?? {}) as Record<string, string | undefined>;
      return {
        tagline: data!.tagline as string,
        description: data!.description as string,
        email: contact.email ?? "",
        phone: contact.phone ?? "",
        address: contact.address ?? "",
        mapsUrl: contact.mapsUrl ?? "",
        instagram: socials.instagram ?? "",
        tiktok: socials.tiktok ?? "",
        linkedin: socials.linkedin ?? "",
        expectedUpdatedAt: data!.updated_at as string,
      };
    },
    control: async (_mass, _client, response) => {
      const outcome = `${response.headers()["x-action-redirect"] ?? ""} ${await response.text()}`;
      expect(outcome).toMatch(/ok=sem-alteracao|"CONFLICT"/);
    },
  },
  {
    label: "changeSubmissionStatusAction",
    action: "changeSubmissionStatusAction",
    denied: INBOX_DENIED,
    path: (mass) => `/admin/leads/${mass.leadNew}`,
    fields: async (mass) => ({ id: mass.leadNew, status: "em_atendimento", currentStatus: "novo" }),
    control: async (mass, client) =>
      expect(await statusOf(client, "form_submissions", mass.leadNew)).toBe("em_atendimento"),
  },
  {
    label: "deleteSubmissionAction",
    action: "deleteSubmissionAction",
    denied: INBOX_DENIED,
    path: (mass) => `/admin/leads/${mass.leadArchived}`,
    fields: async (mass) => ({ id: mass.leadArchived }),
    control: async (mass, client) =>
      expect(await statusOf(client, "form_submissions", mass.leadArchived)).toBeUndefined(),
  },
  {
    label: "requestMediaUpload",
    action: "requestMediaUpload",
    withState: false,
    denied: CONTENT_DENIED,
    path: () => "/admin/midia",
    fields: async (mass) => ({
      name: `invasao-${mass.suffix}.png`,
      type: "image/png",
      size: "1024",
      alt: "Imagem do teste de acesso indevido",
    }),
    control: async (_mass, _client, response) => expectFlight(response, '"ready"'),
  },
  {
    label: "finishMediaUpload",
    action: "finishMediaUpload",
    denied: CONTENT_DENIED,
    path: () => "/admin/midia",
    fields: async (mass) => ({
      path: `2026/11/invasao-${mass.suffix}.png`,
      name: `invasao-${mass.suffix}.png`,
      type: "image/png",
      alt: "Imagem do teste de acesso indevido",
    }),
    // O arquivo não existe no bucket: passar da guarda é chegar à conferência dos bytes.
    control: async (_mass, _client, response) => expect(await response.text()).not.toContain("FORBIDDEN"),
  },
  {
    label: "saveMediaDetails",
    action: "saveMediaDetails",
    denied: CONTENT_DENIED,
    path: (mass) => `/admin/midia/${mass.mediaFree}`,
    fields: async (mass, client) => ({
      id: mass.mediaFree,
      expectedUpdatedAt: await versionOf(client, "media_assets", mass.mediaFree),
      alt: `Invasao ${mass.suffix}`,
    }),
    control: async (mass, client) => {
      const { data } = await client.from("media_assets").select("alt_text").eq("id", mass.mediaFree).single();
      expect(data!.alt_text).toBe(`Invasao ${mass.suffix}`);
    },
  },
  {
    label: "deleteMediaAsset",
    action: "deleteMediaAsset",
    denied: DELETE_DENIED,
    path: (mass) => `/admin/midia/${mass.mediaDisposable}`,
    fields: async (mass) => ({ id: mass.mediaDisposable }),
    control: async (mass, client) => {
      const { data } = await client.from("media_assets").select("id").eq("id", mass.mediaDisposable);
      expect(data, "arquivo excluído").toEqual([]);
    },
  },
];

const ATTEMPTS: Attempt[] = [...ENTITIES.flatMap(contentAttempts), ...OTHER_ATTEMPTS];

/** Ações de autenticação não têm recurso a proteger: têm verificação própria, mais abaixo. */
const AUTH_ACTIONS = new Set(["signIn", "signOut", "requestPasswordReset", "updatePassword"]);

test.describe("QA-06 · Server Actions e prévia do painel @cms", () => {
  test.skip(!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY, REQUIRES_SUPABASE);
  test.skip(({ isMobile }) => isMobile, "A autorização não depende do tamanho da tela.");
  test.setTimeout(120_000);

  let client: SupabaseClient;
  let mass: Mass;
  let actions: Map<string, string>;
  const accounts: Partial<Record<Denied | "admin", Account>> = {};
  const sessions: Partial<Record<Denied | "admin", APIRequestContext>> = {};
  let anonymous: APIRequestContext;

  test.beforeAll(async ({ baseURL }) => {
    client = serviceClient();
    actions = panelActionsFromBuild();
    const suffix = newSuffix();
    mass = await seedMass(client, suffix);
    anonymous = await apiRequest.newContext({ baseURL });
    const roles: [Denied | "admin", PanelRole][] = [
      ["admin", "admin"],
      ["super_admin", "super_admin"],
      ["editor", "editor"],
      ["viewer", "viewer"],
      ["pending", "pending"],
      ["desativado", "admin"],
    ];
    for (const [name, role] of roles) {
      const account = await createAccount(client, role, `${suffix}${name === "desativado" ? "d" : ""}`);
      accounts[name] = account;
      sessions[name] = await newSession(baseURL!, account);
      if (name === "desativado") await client.from("profiles").update({ active: false }).eq("id", account.id);
    }
  });

  test.afterAll(async () => {
    for (const session of [...Object.values(sessions), anonymous]) await session?.dispose();
    if (!client) return;
    await removeMass(client, mass);
    await deleteAccounts(client, Object.values(accounts));
  });

  const post = (
    context: APIRequestContext,
    baseURL: string,
    attempt: Attempt,
    path: string,
    fields: Fields,
    headers: Record<string, string> = {},
  ) =>
    context.post(path, {
      multipart: actionBody(fields, attempt.withState !== false),
      maxRedirects: 0,
      headers: { "Next-Action": actions.get(attempt.action)!, Accept: "text/x-component", Origin: baseURL, ...headers },
    });

  test("toda Server Action de app/admin está nesta verificação", () => {
    const listed = new Set(ATTEMPTS.map((attempt) => attempt.action));
    const inBuild = [...actions.keys()].filter((name) => !AUTH_ACTIONS.has(name));
    expect(inBuild.length).toBeGreaterThan(15);
    expect(inBuild.filter((name) => !listed.has(name))).toEqual([]);
    expect([...listed].filter((name) => !inBuild.includes(name))).toEqual([]);
  });

  for (const role of ["pending", "desativado", "viewer", "editor", "super_admin"] as const) {
    test(`${role}: nenhuma ação proibida grava, e a resposta é FORBIDDEN`, async ({ baseURL }) => {
      const before = await snapshotOf(client, mass);
      const failures: Record<string, unknown> = {};
      for (const attempt of ATTEMPTS.filter((item) => item.denied.includes(role))) {
        const fields = await attempt.fields(mass, client);
        const response = await post(sessions[role]!, baseURL!, attempt, attempt.path(mass), fields);
        const body = await response.text();
        if (!body.includes("FORBIDDEN") || /node_modules|\.next\/|\bat \S+ \(|PGRST|permission denied/.test(body)) {
          failures[attempt.label] = { status: response.status(), body: body.slice(0, 200) };
        }
      }
      expect(failures).toEqual({});
      expect(await snapshotOf(client, mass)).toEqual(before);
    });
  }

  test("sem JavaScript, o mesmo pedido do leitor é recusado do mesmo jeito", async ({ baseURL }) => {
    const before = await snapshotOf(client, mass);
    const failures: Record<string, unknown> = {};
    for (const attempt of ATTEMPTS.filter((item) => item.withState !== false && item.denied.includes("viewer"))) {
      const fields = await attempt.fields(mass, client);
      const response = await sessions.viewer!.post(attempt.path(mass), {
        multipart: noScriptBody(actions.get(attempt.action)!, fields),
        maxRedirects: 0,
        headers: { Origin: baseURL! },
      });
      if (response.status() >= 300 && response.status() < 400) failures[attempt.label] = response.status();
    }
    expect(failures).toEqual({});
    expect(await snapshotOf(client, mass)).toEqual(before);
  });

  test("sem sessão, nada grava: nem na tela da ação, nem por uma rota pública", async ({ baseURL }) => {
    const before = await snapshotOf(client, mass);
    const failures: Record<string, unknown> = {};
    for (const attempt of ATTEMPTS) {
      const fields = await attempt.fields(mass, client);
      const direct = await post(anonymous, baseURL!, attempt, attempt.path(mass), fields);
      if (direct.status() !== 307) failures[`${attempt.label}: na tela`] = direct.status();
      for (const route of ["/", "/contato", "/admin/login"]) {
        const forwarded = await post(anonymous, baseURL!, attempt, route, fields);
        const body = await forwarded.text();
        if (panelMarksIn(body).length || /"status":"(ready|ok)"/.test(body)) {
          failures[`${attempt.label}: por ${route}`] = forwarded.status();
        }
        if (attempt.withState !== false) {
          const noScript = await anonymous.post(route, {
            multipart: noScriptBody(actions.get(attempt.action)!, fields),
            maxRedirects: 0,
            headers: { Origin: baseURL! },
          });
          // Sucesso de Server Action sem JavaScript termina em redirecionamento para o painel.
          const location = noScript.headers().location ?? "";
          if (location.startsWith("/admin") && !location.startsWith("/admin/login")) {
            failures[`${attempt.label}: sem JavaScript por ${route}`] = location;
          }
        }
      }
    }
    expect(failures).toEqual({});
    expect(await snapshotOf(client, mass)).toEqual(before);
  });

  test("sem sessão, trocar a senha por uma rota pública não chega a lugar nenhum", async ({ baseURL }) => {
    const attempt: Attempt = {
      label: "updatePassword",
      action: "updatePassword",
      denied: [],
      path: () => "/admin/login",
      fields: async () => ({}),
      control: async () => undefined,
    };
    const fields = { password: "Senha-nova-123456", confirmation: "Senha-nova-123456" };
    const response = await post(anonymous, baseURL!, attempt, "/admin/login", fields);
    expect(await response.text()).toContain("Link expirado");
  });

  test("N11: papel forjado em cookie, formulário ou cabeçalho é ignorado", async ({ baseURL }) => {
    const forged = await newSession(baseURL!, accounts.viewer!, [
      { name: "role", value: "admin" },
      { name: "user_role", value: "admin" },
      { name: "app_role", value: "super_admin" },
    ]);
    const before = await snapshotOf(client, mass);
    try {
      for (const attempt of ATTEMPTS.filter((item) => item.denied.includes("viewer"))) {
        const fields = {
          ...(await attempt.fields(mass, client)),
          role: "admin",
          user_role: "admin",
          actor_role: "admin",
        };
        const response = await post(forged, baseURL!, attempt, attempt.path(mass), fields, {
          "x-user-role": "admin",
          "x-role": "admin",
        });
        expect(await response.text(), attempt.label).toContain("FORBIDDEN");
      }
    } finally {
      await forged.dispose();
    }
    expect(await snapshotOf(client, mass)).toEqual(before);
  });

  test("N11: token alterado no cookie cai no login, sem gravar", async ({ baseURL }) => {
    const cookies = await sessionCookies(accounts.viewer!);
    const session = sessionFromCookie(cookies[0].value);
    const [head, payload, signature] = session.access_token.split(".");
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const tampered = Buffer.from(JSON.stringify({ ...claims, role: "service_role", user_role: "admin" })).toString(
      "base64url",
    );
    const value = encodeSessionCookie({
      ...session,
      access_token: `${head}.${tampered}.${signature}`,
      refresh_token: "invalido",
    });
    const context = await apiRequest.newContext({
      baseURL,
      storageState: { cookies: [{ ...cookies[0], value }], origins: [] },
    });
    const before = await snapshotOf(client, mass);
    try {
      const attempt = ATTEMPTS.find((item) => item.label === "saveArea: editar")!;
      const response = await post(context, baseURL!, attempt, attempt.path(mass), await attempt.fields(mass, client));
      expect(response.status()).toBe(307);
      expect(response.headers().location).toMatch(/^\/admin\/login/);
      const screen = await context.get("/admin/areas", { maxRedirects: 0 });
      expect(screen.status()).toBe(307);
    } finally {
      await context.dispose();
    }
    expect(await snapshotOf(client, mass)).toEqual(before);
  });

  test("N13: sessão encerrada no servidor cai no login ao tentar gravar, sem gravar", async ({ baseURL }) => {
    // Conta própria: encerrar a sessão aqui não pode derrubar os outros testes.
    const account = await createAccount(client, "admin", `${mass.suffix}x${newSuffix().slice(0, 3)}`);
    const cookies = await sessionCookies(account);
    const context = await apiRequest.newContext({ baseURL, storageState: { cookies, origins: [] } });
    const attempt = ATTEMPTS.find((item) => item.label === "saveArea: editar")!;
    try {
      const open = await context.get("/admin/areas", { maxRedirects: 0 });
      expect(open.status(), "sessão válida abre o painel").toBe(200);

      const { access_token: token } = sessionFromCookie(cookies[0].value);
      const { error } = await client.auth.admin.signOut(token, "global");
      expect(error).toBeNull();

      const before = await snapshotOf(client, mass);
      const response = await post(context, baseURL!, attempt, attempt.path(mass), await attempt.fields(mass, client));
      expect(response.status()).toBe(307);
      expect(response.headers().location).toMatch(/^\/admin\/login/);
      expect(await snapshotOf(client, mass)).toEqual(before);
    } finally {
      await context.dispose();
      await deleteAccounts(client, [account]);
    }
  });

  test("CSRF: origem de outro site é recusada, mesmo com a sessão do administrador", async ({ baseURL }) => {
    const before = await snapshotOf(client, mass);
    const attempt = ATTEMPTS.find((item) => item.label === "saveArea: editar")!;
    const response = await post(
      sessions.admin!,
      baseURL!,
      attempt,
      attempt.path(mass),
      await attempt.fields(mass, client),
      { Origin: "https://invasor.test" },
    );
    expect(response.status()).toBe(500);
    expect(await response.text()).not.toMatch(/node_modules|\.next\/server|\bat \S+ \(/);
    expect(await snapshotOf(client, mass)).toEqual(before);
  });

  test("a recusa fica na trilha de auditoria, sem o conteúdo do pedido", async ({ baseURL }) => {
    const account = await createAccount(client, "viewer", `${mass.suffix}t${newSuffix().slice(0, 3)}`);
    const session = await newSession(baseURL!, account);
    try {
      const attempt = ATTEMPTS.find((item) => item.label === "saveArea: editar")!;
      const fields = await attempt.fields(mass, client);
      await post(session, baseURL!, attempt, attempt.path(mass), fields);
      const { data } = await client
        .from("audit_log")
        .select("event, outcome, metadata")
        .eq("actor_id", account.id)
        .eq("event", "access.denied");
      expect(data).toHaveLength(1);
      expect(data![0]).toMatchObject({ outcome: "denied", metadata: { resource: "area", action: "edit" } });
      expect(JSON.stringify(data)).not.toContain(mass.suffix);
    } finally {
      await session.dispose();
      await deleteAccounts(client, [account]);
    }
  });

  test.describe("prévia protegida (ADM-14)", () => {
    /** Texto de cada item oculto da massa, por endereço de prévia: é o que não pode sair para quem não pode ler. */
    const previews = (mass: Mass) => [
      { path: `/admin/previa/servico/${mass.serviceDraft}`, text: `Serviço rascunho ${mass.suffix}` },
      { path: `/admin/previa/servico/${mass.serviceArchived}`, text: `Serviço arquivado ${mass.suffix}` },
      { path: `/admin/previa/case/${mass.caseDraft}`, text: `Case rascunho ${mass.suffix}` },
      { path: `/admin/previa/case/${mass.caseArchived}`, text: `Case arquivado ${mass.suffix}` },
      { path: `/admin/previa/pagina/${mass.pageDraft}`, text: `Página rascunho ${mass.suffix}` },
      { path: `/admin/previa/pagina/${mass.pageArchived}`, text: `Página arquivada ${mass.suffix}` },
    ];
    const VARIANTS: Record<string, string>[] = [
      {},
      { RSC: "1" },
      { RSC: "1", "Next-Router-Prefetch": "1" },
      { Accept: "text/x-component" },
    ];

    test("sem sessão, nenhuma prévia entrega o item", async ({ baseURL }) => {
      for (const { path, text } of previews(mass)) {
        for (const headers of VARIANTS) {
          const response = await rawRequest(baseURL!, path, { headers });
          expect(response.status, path).toBe(307);
          expect(response.headers.location, path).toMatch(/^\/admin\/login/);
          expect(response.body.includes(text), `${path} ${JSON.stringify(headers)}`).toBe(false);
        }
      }
    });

    for (const role of ["pending", "desativado"] as const) {
      test(`${role}, com sessão válida, não lê rascunho nem arquivado`, async () => {
        for (const { path, text } of previews(mass)) {
          for (const headers of VARIANTS) {
            const response = await sessions[role]!.get(path, { headers, maxRedirects: 0 });
            expect((await response.text()).includes(text), `${path} ${JSON.stringify(headers)}`).toBe(false);
          }
          // Seguindo o desvio, a tela é o aviso de acesso pendente, sem o conteúdo.
          const landed = await sessions[role]!.get(path);
          expect((await landed.text()).includes(text), path).toBe(false);
        }
      });
    }

    test("controle: quem tem leitura vê o item, para a recusa acima valer", async () => {
      for (const role of ["viewer", "editor", "admin"] as const) {
        for (const { path, text } of previews(mass)) {
          const response = await sessions[role]!.get(path);
          expect(response.status(), `${role} ${path}`).toBe(200);
          expect(await response.text(), `${role} ${path}`).toContain(text);
        }
      }
    });

    test("tipo fora da lista, id de outro tipo e id malformado não abrem nada", async () => {
      const editor = sessions.editor!;
      for (const [path, text] of [
        [`/admin/previa/lead/${mass.leadNew}`, "teste.e2e@exemplo.com"],
        [`/admin/previa/profiles/${accounts.admin!.id}`, accounts.admin!.email],
        [`/admin/previa/area/${mass.areaDraft}`, `Área rascunho ${mass.suffix}`],
        [`/admin/previa/cta/${mass.ctaDraft}`, `CTA rascunho ${mass.suffix}`],
        [`/admin/previa/__proto__/${mass.caseDraft}`, `Case rascunho ${mass.suffix}`],
        [`/admin/previa/servico/${mass.caseDraft}`, `Case rascunho ${mass.suffix}`],
        [`/admin/previa/case/${mass.serviceDraft}`, `Serviço rascunho ${mass.suffix}`],
        [`/admin/previa/case/%27%20OR%201%3D1--`, `Case rascunho ${mass.suffix}`],
      ] as const) {
        const response = await editor.get(path);
        const body = await response.text();
        expect(body.includes(text), path).toBe(false);
        expect(body, path).not.toMatch(/node_modules|\.next\/server|PGRST\d|invalid input syntax/);
      }
    });

    test("a resposta da prévia não fica em cache, e visitante não a recebe depois", async ({ baseURL }) => {
      const [{ path, text }] = previews(mass);
      const opened = await sessions.editor!.get(path);
      expect(await opened.text()).toContain(text);
      expect(opened.headers()["cache-control"] ?? "").toMatch(/no-store|private/);
      expect(opened.headers()["x-robots-tag"] ?? "").toContain("noindex");
      expect(opened.headers()["x-nextjs-cache"]).not.toBe("HIT");
      const after = await rawRequest(baseURL!, path);
      expect(after.status).toBe(307);
      expect(after.body.includes(text)).toBe(false);
    });

    test("com a prévia aberta, o rascunho não sai por /api/v1 nem por URL pública", async ({ baseURL }) => {
      // Abre todas antes: se a prévia alimentasse o cache público, o texto apareceria nas leituras abaixo.
      for (const { path, text } of previews(mass)) {
        expect(await (await sessions.editor!.get(path)).text(), path).toContain(text);
      }
      const texts = previews(mass).map(({ text }) => text);
      const { suffix } = mass;
      const expectNothing = (body: string, label: string) => {
        for (const text of texts) expect(body.includes(text), `${label}: ${text}`).toBe(false);
      };
      for (const path of [
        `/servicos/acesso-servico-rascunho-${suffix}`,
        `/servicos/acesso-servico-arquivado-${suffix}`,
        `/cases/acesso-case-rascunho-${suffix}`,
        `/cases/acesso-case-arquivado-${suffix}`,
        `/api/v1/services/acesso-servico-rascunho-${suffix}`,
        `/api/v1/services/acesso-servico-arquivado-${suffix}`,
        `/api/v1/cases/acesso-case-rascunho-${suffix}`,
        `/api/v1/cases/acesso-case-arquivado-${suffix}`,
        `/api/v1/pages/acesso-pagina-rascunho-${suffix}`,
        `/api/v1/pages/acesso-pagina-arquivada-${suffix}`,
      ]) {
        const response = await rawRequest(baseURL!, path);
        expect(response.status, path).toBe(404);
        expectNothing(response.body, path);
      }
      for (const path of [
        "/",
        "/servicos",
        "/cases",
        "/sitemap.xml",
        "/llms.txt",
        "/llms-full.txt",
        "/api/v1/services?pageSize=50",
        "/api/v1/cases?pageSize=50",
      ]) {
        const response = await rawRequest(baseURL!, path);
        expect(response.status, path).toBe(200);
        expectNothing(response.body, path);
      }
    });
  });

  test.describe("controle: com o papel certo, o mesmo pedido grava", () => {
    // Massa própria, porque aqui as ações valem de verdade.
    let own: Mass;

    test.beforeAll(async () => {
      own = await seedMass(client, newSuffix());
    });

    test.afterAll(async () => {
      await removeMass(client, own);
    });

    for (const attempt of ATTEMPTS) {
      test(`administrador: ${attempt.label}`, async ({ baseURL }) => {
        // Os testes desta massa têm uma ordem natural: o rascunho é publicado, despublicado, arquivado e excluído.
        // Cada um prepara o estado de que precisa, para rodar sozinho.
        await prepareState(client, own, attempt);
        const fields = await (attempt.controlFields ?? attempt.fields)(own, client);
        const response = await post(sessions.admin!, baseURL!, attempt, attempt.path(own), fields);
        expect(response.status(), attempt.label).toBeLessThan(400);
        expect(await response.text()).not.toContain("FORBIDDEN");
        await attempt.control(own, client, response);
      });
    }
  });
});

/** Deixa a linha alvo no estado de que o comando precisa, sem depender da ordem dos testes. */
async function prepareState(client: SupabaseClient, mass: Mass, attempt: Attempt) {
  const entity = ENTITIES.find((item) => item.command === attempt.action);
  if (!entity) return;
  const id = attempt.label.endsWith("restaurar") ? mass[`${entity.key}Archived`] : mass[`${entity.key}Draft`];
  const target = attempt.label.endsWith("publicar")
    ? attempt.label.endsWith("despublicar")
      ? { status: "published", published_at: PAST, archived_at: null }
      : { status: "draft", published_at: null, archived_at: null }
    : attempt.label.endsWith("excluir") || attempt.label.endsWith("restaurar")
      ? { status: "archived", published_at: PAST, archived_at: PAST }
      : { status: "published", published_at: PAST, archived_at: null };
  await client.from(entity.table).update(target).eq("id", id);
}
