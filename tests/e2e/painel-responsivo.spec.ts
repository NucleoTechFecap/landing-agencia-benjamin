/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : painel-responsivo.spec.ts
 Descrição    : Todas as telas do painel em 360, 768 e 1280 px: sem rolagem lateral, com toque e teclado (ADM-16).

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-16).
 04/11/2026 Vinícius Nishimura Reis  Telas de leads e feedbacks (FORM-09).
──────────────────────────────────────────────────────────────────────────────
*/

import { readdirSync } from "node:fs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import {
  REQUIRES_SUPABASE,
  SERVICE_KEY,
  SUPABASE_URL,
  createAccount,
  deleteAccounts,
  login,
  newSuffix,
  saveEvidence,
  serviceClient,
  type Account,
} from "./painel-helpers";

/** Celular, tablet e desktop (ADM-16). */
const WIDTHS = [360, 768, 1280] as const;
/** WCAG 2.5.8 (AA): 24 px para qualquer alvo. Botões e campos do painel ficam na recomendação de 44 px. */
const MIN_TARGET = 24;
const MIN_CONTROL = 44;

const PAST = "2026-10-01T12:00:00.000Z";

interface Audit {
  scrollWidth: number;
  clientWidth: number;
  /** Elementos que passam da borda direita da janela. */
  outside: string[];
  /** Áreas com rolagem lateral própria: tabela que estoura esconde o estado do item no celular. */
  scrollers: string[];
  /** Alvos de toque abaixo do mínimo. */
  smallTargets: string[];
}

/** Roda na página. Ignora o que não aparece (rotas guardadas pelo Next e textos só para leitor de tela). */
function auditPage({ minTarget, minControl }: { minTarget: number; minControl: number }): Audit {
  const describe = (element: Element) => {
    const text = element.textContent?.trim().slice(0, 40) ?? "";
    const className = typeof element.className === "string" ? element.className.slice(0, 60) : "";
    return `<${element.tagName.toLowerCase()} class="${className}"> ${text}`;
  };
  const shown = (element: Element) => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return box.width > 1 && box.height > 1 && style.visibility !== "hidden" && style.display !== "none";
  };
  const width = document.documentElement.clientWidth;
  const all = [...document.body.querySelectorAll("*")].filter(shown);

  const outside = all
    .filter((element) => {
      if (element.closest("svg")) return false;
      return element.getBoundingClientRect().right > width + 1;
    })
    .map(describe);

  const scrollers = all
    .filter((element) => {
      const { overflowX } = getComputedStyle(element);
      return (overflowX === "auto" || overflowX === "scroll") && element.scrollWidth > element.clientWidth + 1;
    })
    .map(describe);

  const inlineInText = (element: Element) =>
    getComputedStyle(element).display === "inline" &&
    (element.parentElement?.textContent?.trim().length ?? 0) > (element.textContent?.trim().length ?? 0);
  const smallTargets = all
    .filter((element) => element.matches("a[href], button, summary, select, textarea, input:not([type=hidden])"))
    .filter((element) => {
      const { height, width: targetWidth } = element.getBoundingClientRect();
      if (element.matches("input[type=checkbox], input[type=radio]")) {
        // O rótulo também marca a caixa: o alvo é a soma dos dois.
        const boxes = [element, ...((element as HTMLInputElement).labels ?? [])].map((part) =>
          part.getBoundingClientRect(),
        );
        return Math.max(...boxes.map((box) => box.bottom)) - Math.min(...boxes.map((box) => box.top)) < minTarget;
      }
      // Link no meio do texto é exceção da própria WCAG 2.5.8.
      if (element.matches("a") && inlineInText(element)) return false;
      const min = element.matches("button, summary, select, textarea, input") ? minControl : minTarget;
      return height < min || targetWidth < minTarget;
    })
    .map((element) => `${Math.round(element.getBoundingClientRect().height)}px ${describe(element)}`);

  return {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: width,
    outside: outside.slice(0, 5),
    scrollers: scrollers.slice(0, 5),
    smallTargets: smallTargets.slice(0, 10),
  };
}

test.describe("Painel · todas as telas em 360, 768 e 1280 px @cms", () => {
  // Sem modo serial: cada worker prepara a própria massa, e uma tela que falha não esconde as demais.
  test.skip(!SUPABASE_URL || !SERVICE_KEY, REQUIRES_SUPABASE);
  // A largura é definida aqui, tela por tela: no projeto "mobile" o resultado seria o mesmo.
  test.skip(({ isMobile }) => isMobile, "As larguras são definidas pelo próprio teste.");

  // Com testes em paralelo, o mesmo worker pode rodar o beforeAll mais de uma vez: cada rodada usa um
  // sufixo novo, porque o endereço de item publicado continua reservado depois de excluído.
  let suffix = "";
  // Sem espaços e no limite do campo: é o que estoura layout quando falta quebra de linha.
  const long = (prefix: string, size = 120) => `${prefix}-${suffix}-`.padEnd(size, "x");
  const ids = {
    page: "",
    block: "",
    area: "",
    areaArchived: "",
    service: "",
    serviceArchived: "",
    category: "",
    categoryArchived: "",
    case: "",
    caseArchived: "",
    media: "",
    submission: "",
    submissionArchived: "",
  };
  const accounts: { admin?: Account; viewer?: Account } = {};
  const contexts: BrowserContext[] = [];
  const pages: { admin?: Page; viewer?: Page; visitor?: Page } = {};
  let client: SupabaseClient;

  const insert = async (table: string, values: Record<string, unknown>) => {
    const { data, error } = await client.from(table).insert(values).select("id").single();
    if (error) throw new Error(`${table}: ${error.message}`);
    return data.id as string;
  };

  const published = { status: "published", published_at: PAST };
  const archived = { status: "archived", archived_at: PAST, published_at: PAST };

  test.beforeAll(async ({ browser }, testInfo) => {
    suffix = newSuffix();
    client = serviceClient();
    accounts.admin = await createAccount(client, "admin", suffix);
    accounts.viewer = await createAccount(client, "viewer", suffix);

    ids.media = await insert("media_assets", {
      path: `e2e/responsivo-${suffix}.webp`,
      mime_type: "image/webp",
      width: 1200,
      height: 750,
      alt_text: long("Texto-alternativo", 160),
    });

    ids.area = await insert("areas", {
      ...published,
      provisional: true,
      slug: `responsivo-${suffix}`,
      name: long("Area"),
      summary: "Resumo da área usada na verificação de responsividade.",
      description: "Descrição da área usada na verificação de responsividade do painel.",
      highlights: [long("Destaque", 80), "Outro destaque"],
    });
    ids.areaArchived = await insert("areas", {
      ...archived,
      slug: `responsivo-arquivada-${suffix}`,
      name: long("Area-arquivada"),
      summary: "Resumo da área arquivada.",
      description: "Descrição da área arquivada na verificação de responsividade.",
    });
    ids.service = await insert("services", {
      slug: `responsivo-${suffix}`,
      name: long("Servico"),
      image_media_id: ids.media,
    });
    ids.serviceArchived = await insert("services", {
      ...archived,
      slug: `responsivo-arquivado-${suffix}`,
      name: long("Servico-arquivado"),
      summary: "Resumo do serviço arquivado.",
      description: "Descrição do serviço arquivado na verificação de responsividade.",
    });
    const { error: linkError } = await client
      .from("service_areas")
      .insert({ service_id: ids.service, area_id: ids.area });
    if (linkError) throw linkError;
    ids.category = await insert("case_categories", {
      ...published,
      slug: `responsivo-${suffix}`,
      name: long("Categoria"),
    });
    ids.categoryArchived = await insert("case_categories", {
      ...archived,
      slug: `responsivo-arquivada-${suffix}`,
      name: long("Categoria-arquivada"),
    });
    ids.case = await insert("cases", {
      slug: `responsivo-${suffix}`,
      title: long("Case"),
      client_name: long("Cliente", 120),
      category_id: ids.category,
      summary: "Curto.",
      cover_media_id: ids.media,
      external_links: [{ label: long("Rotulo", 60), url: `https://exemplo.test/${long("caminho", 100)}` }],
      team: [long("Pessoa", 60)],
    });
    ids.caseArchived = await insert("cases", {
      ...archived,
      slug: `responsivo-arquivado-${suffix}`,
      title: long("Case-arquivado"),
      client_name: "Cliente fictício",
      summary: "Resumo do case arquivado na verificação de responsividade.",
    });
    ids.page = await insert("pages", {
      slug: `responsivo-${suffix}`,
      title: long("Pagina"),
      description: long("Descricao", 300),
      provisional: true,
    });
    ids.block = await insert("blocks", {
      page_id: ids.page,
      type: "rich-text",
      sort_order: 0,
      content: { title: long("Titulo-do-bloco", 120), paragraphs: [long("Paragrafo", 400)] },
    });
    await insert("blocks", {
      page_id: ids.page,
      type: "list",
      sort_order: 1,
      content: { items: [{ title: long("Item", 120), text: long("Texto", 300) }] },
    });
    await insert("blocks", {
      page_id: ids.page,
      type: "cta",
      sort_order: 2,
      content: {
        title: long("Chamada", 120),
        label: long("Botao", 40),
        href: `https://exemplo.test/${long("destino", 200)}`,
      },
    });
    await insert("blocks", {
      page_id: ids.page,
      type: "team",
      sort_order: 3,
      content: { members: [{ name: long("Nome", 80), role: long("Cargo", 80) }] },
    });

    // Nos limites dos formulários, sem espaços. O id não tem valor padrão: vem do navegador no envio real.
    const submission = (status: string, name: string) =>
      insert("form_submissions", {
        id: crypto.randomUUID(),
        protocol: `AB-${newSuffix().slice(0, 6).toUpperCase()}`,
        kind: "lead",
        category: `lead:${long("servico-fora-do-site", 80)}`,
        status,
        fingerprint: `responsivo-${status}-${suffix}`,
        source_path: `/${long("origem", 190)}`,
        notification_status: "failed",
        notification_attempts: 5,
        payload: {
          name: long(name),
          email: long("e-mail", 254),
          company: long("Empresa"),
          projectDescription: long("Descricao", 3000),
          privacyConsent: true,
        },
      });
    ids.submission = await submission("novo", "Nome");
    ids.submissionArchived = await submission("arquivado", "Nome-arquivado");

    const baseURL = testInfo.project.use.baseURL;
    const open = async () => {
      const context = await browser.newContext({ baseURL, locale: "pt-BR" });
      contexts.push(context);
      return context.newPage();
    };
    pages.admin = await open();
    await login(pages.admin, accounts.admin);
    pages.viewer = await open();
    await login(pages.viewer, accounts.viewer);
    pages.visitor = await open();
  });

  test.afterAll(async () => {
    for (const context of contexts.splice(0)) await context.close();
    if (!client) return;
    await client.from("cases").delete().in("id", [ids.case, ids.caseArchived].filter(Boolean));
    await client
      .from("pages")
      .delete()
      .eq("id", ids.page || "00000000-0000-4000-8000-000000000000");
    await client.from("services").delete().in("id", [ids.service, ids.serviceArchived].filter(Boolean));
    await client.from("case_categories").delete().in("id", [ids.category, ids.categoryArchived].filter(Boolean));
    await client.from("areas").delete().in("id", [ids.area, ids.areaArchived].filter(Boolean));
    await client
      .from("media_assets")
      .delete()
      .eq("id", ids.media || "00000000-0000-4000-8000-000000000000");
    await client.from("form_submissions").delete().in("id", [ids.submission, ids.submissionArchived].filter(Boolean));
    await deleteAccounts(client, Object.values(accounts));
  });

  const newBlock = (type: string) => `/admin/paginas/${ids.page}/blocos/novo?tipo=${type}`;

  /** Abre a tela, confere que é ela mesma (e não um erro ou desvio) e mede nas três larguras. */
  async function audit(page: Page, label: string, path: () => string, heading: RegExp) {
    await page.goto(path());
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    // Abre o que começa recolhido: a lista de arquivados também precisa caber.
    await page
      .locator("details")
      .evaluateAll((all) => all.forEach((item) => ((item as HTMLDetailsElement).open = true)));

    const failures: Record<string, unknown> = {};
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 800 });
      // Duas trocas de quadro: a medida espera o layout da largura nova.
      await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
      const result = await page.evaluate(auditPage, { minTarget: MIN_TARGET, minControl: MIN_CONTROL });
      const { scrollWidth, clientWidth, outside, scrollers, smallTargets } = result;
      if (scrollWidth > clientWidth) failures[`${width}: rolagem lateral`] = { scrollWidth, clientWidth, outside };
      if (scrollers.length) failures[`${width}: área com rolagem própria`] = scrollers;
      if (width === 360 && smallTargets.length) failures[`${width}: alvo pequeno`] = smallTargets;
      await saveEvidence(page, `${label}-${width}`);
    }
    expect(failures).toEqual({});
  }

  /** Uma tela: `route` é a pasta em app/admin (sem o grupo), e `path` só existe quando a URL depende da massa. */
  const screen = (
    label: string,
    route: string,
    heading: RegExp,
    path = () => `/admin/${route}`.replace(/\/$/, ""),
  ) => ({
    label,
    route,
    heading,
    path,
  });

  // Tela nova em app/admin entra aqui, em uma linha: o último teste do arquivo falha enquanto faltar.
  const ADMIN_ROUTES = [
    screen("inicio", "", /Bem-vindo/),
    screen("visao-geral", "conteudos", /Visão geral/),
    screen("configuracoes", "configuracoes", /Contato, links e redes sociais/),
    screen("paginas", "paginas", /Páginas e textos/),
    screen("pagina-nova", "paginas/nova", /Criar conteúdo: Contato/, () => "/admin/paginas/nova?rota=contato"),
    screen("pagina-editar", "paginas/[id]", /^Pagina-/, () => `/admin/paginas/${ids.page}`),
    screen("bloco-novo-texto", "paginas/[id]/blocos/novo", /Novo bloco: Texto/, () => newBlock("rich-text")),
    screen("bloco-novo-lista", "paginas/[id]/blocos/novo", /Novo bloco: Lista/, () => newBlock("list")),
    screen("bloco-novo-time", "paginas/[id]/blocos/novo", /Novo bloco: Nosso time/, () => newBlock("team")),
    screen("bloco-novo-cta", "paginas/[id]/blocos/novo", /Novo bloco: Chamada/, () => newBlock("cta")),
    screen(
      "bloco-editar",
      "paginas/[id]/blocos/[blocoId]",
      /Editar bloco: Texto/,
      () => `/admin/paginas/${ids.page}/blocos/${ids.block}`,
    ),
    screen("areas", "areas", /Áreas de atuação/),
    screen("area-nova", "areas/nova", /Nova área/),
    screen("area-editar", "areas/[id]", /^Area-/, () => `/admin/areas/${ids.area}`),
    screen("area-arquivada", "areas/[id]", /^Area-arquivada/, () => `/admin/areas/${ids.areaArchived}`),
    screen("servicos", "servicos", /Serviços/),
    screen("servico-novo", "servicos/novo", /Novo serviço/),
    screen("servico-editar", "servicos/[id]", /^Servico-/, () => `/admin/servicos/${ids.service}`),
    screen("categorias", "categorias", /Categorias de cases/),
    screen("categoria-nova", "categorias/nova", /Nova categoria/),
    screen("categoria-editar", "categorias/[id]", /^Categoria-/, () => `/admin/categorias/${ids.category}`),
    screen("cases", "cases", /Cases/),
    screen("case-novo", "cases/novo", /Novo case/),
    screen("case-editar", "cases/[id]", /^Case-/, () => `/admin/cases/${ids.case}`),
    screen("midia", "midia", /Biblioteca de mídia/),
    screen("leads", "leads", /Leads e feedbacks/),
    screen("lead-detalhe", "leads/[id]", /^AB-/, () => `/admin/leads/${ids.submission}`),
    screen("lead-arquivado", "leads/[id]", /^AB-/, () => `/admin/leads/${ids.submissionArchived}`),
    screen("sem-permissao", "sem-permissao", /Sem permissão/),
    screen("acesso-pendente", "acesso-pendente", /Acesso pendente/),
    screen("nova-senha", "nova-senha", /Defina sua senha/),
  ];
  const PUBLIC_ROUTES = [
    screen("login", "login", /Painel da Benjamin/),
    screen("recuperar-senha", "recuperar-senha", /senha/i),
  ];

  for (const route of ADMIN_ROUTES) {
    test(`administrador: ${route.label}`, async () => {
      await audit(pages.admin!, `admin-${route.label}`, route.path, route.heading);
    });
  }

  // O leitor vê as mesmas telas sem os botões de escrita, com os formulários desabilitados.
  const VIEWER_ROUTES = ADMIN_ROUTES.filter((route) =>
    [
      "inicio",
      "visao-geral",
      "paginas",
      "pagina-editar",
      "areas",
      "servico-editar",
      "cases",
      "case-editar",
      "midia",
    ].includes(route.label),
  );
  for (const route of VIEWER_ROUTES) {
    test(`leitor: ${route.label}`, async () => {
      await audit(pages.viewer!, `leitor-${route.label}`, route.path, route.heading);
    });
  }

  for (const route of PUBLIC_ROUTES) {
    test(`sem sessão: ${route.label}`, async () => {
      await audit(pages.visitor!, `visitante-${route.label}`, route.path, route.heading);
    });
  }

  test("toda tela de app/admin está na verificação de largura", () => {
    const pages = (readdirSync("app/admin", { recursive: true }) as string[])
      .map((file) => file.replace(/\\/g, "/"))
      .filter((file) => file.endsWith("page.tsx"))
      .map((file) => file.replace("(painel)/", "").replace(/\/?page\.tsx$/, ""));
    const listed = [...ADMIN_ROUTES, ...PUBLIC_ROUTES].map((route) => route.route);
    expect(pages.filter((route) => !listed.includes(route))).toEqual([]);
    expect(listed.filter((route) => !pages.includes(route))).toEqual([]);
  });

  test("teclado alcança todos os controles da tela, com foco visível, em 360 px", async () => {
    const page = pages.admin!;
    await page.setViewportSize({ width: 360, height: 800 });
    for (const path of [
      "/admin/conteudos",
      `/admin/paginas/${ids.page}`,
      `/admin/cases/${ids.case}`,
      "/admin/midia",
      "/admin/cases",
      "/admin/leads",
      `/admin/leads/${ids.submissionArchived}`,
    ]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("button", { name: "Sair" })).toBeEnabled();

      const expected = await page.evaluate(() =>
        [...document.querySelectorAll("a[href], button, summary, select, textarea, input:not([type=hidden])")]
          .filter((element) => {
            const box = element.getBoundingClientRect();
            // Conteúdo de <details> fechado só entra na ordem de foco depois de abrir, pelo próprio <summary>.
            const collapsed = element.closest("details:not([open])") && !element.matches("summary");
            return box.width > 1 && box.height > 1 && !element.matches(":disabled") && !collapsed;
          })
          .map((element, index) => {
            element.setAttribute("data-teclado", String(index));
            return String(index);
          }),
      );
      const reached = new Set<string>();
      const outlines: string[] = [];
      for (let press = 0; press < expected.length + 5 && reached.size < expected.length; press += 1) {
        await page.keyboard.press("Tab");
        const focused = await page.evaluate(async () => {
          const element = document.activeElement;
          if (!element) return null;
          // Lê depois das transições: no meio delas, o anel ainda aparece em campo que já perdeu o foco.
          await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
          const style = getComputedStyle(element);
          // Ícone de calendário do campo de mês: o foco fica dentro do controle nativo, e quem desenha o
          // contorno é o navegador, em parte que o estilo calculado do campo não mostra.
          const nativePart = element.matches(":focus-within") && !element.matches(":focus");
          return {
            mark: element.getAttribute("data-teclado"),
            // Campos têm anel de foco (box-shadow); os demais, o contorno global de :focus-visible.
            visible: nativePart || style.outlineStyle !== "none" || style.boxShadow !== "none",
            name: `${element.tagName} ${element.getAttribute("name") ?? element.textContent?.trim().slice(0, 30)}`,
          };
        });
        if (!focused?.mark) continue;
        reached.add(focused.mark);
        if (!focused.visible) outlines.push(focused.name);
      }
      expect([...reached].sort(), `controles fora do alcance do teclado em ${path}`).toEqual([...expected].sort());
      expect(outlines, `foco sem contorno em ${path}`).toEqual([]);
    }
  });
});
