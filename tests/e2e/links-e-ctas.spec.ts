/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : links-e-ctas.spec.ts
 Descrição    : Percorre as rotas públicas e confere cada link: destino, âncora, CTA circular e nova aba.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (INT-06).
──────────────────────────────────────────────────────────────────────────────
*/

import { randomBytes } from "node:crypto";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { seedSnapshot, siteSettings } from "@/content";
import { resolveCtaHref } from "@/lib/domain/content/integrity";
import { SERVICE_KEY, SUPABASE_URL, serviceClient } from "./painel-helpers";

/*
 * INT-06: percorre as rotas públicas e confere cada <a>. Interno tem de responder abaixo de 400, âncora
 * tem de existir, CTA não aponta para a própria página e externo abre em nova aba, avisa o leitor de tela
 * e vai para um destino conhecido. Nenhuma requisição sai para sites externos: o teste não depende de rede
 * nem de terceiros, e o endereço é conferido contra `content/site.ts`, ou contra o banco no build @cms.
 */
const ROUTES = [
  "/",
  "/sobre",
  "/areas",
  "/servicos",
  "/cases",
  "/contato",
  "/contato/projeto",
  "/contato/mensagem",
  "/feedback",
  "/privacidade",
];

/** Crédito do rodapé: fixo no código, fora do que o painel edita. */
const NUCLEOTECH_URL = "https://www.instagram.com/nucleotechfecap";

interface FoundLink {
  href: string | null;
  resolved: string;
  text: string;
  target: string;
  rel: string;
  zone: "header" | "main" | "footer" | "other";
  /** Filtro ou paginação: apontar para a própria página é o que eles fazem. */
  navigatesList: boolean;
  /** Chamada visível no cabeçalho ou no rodapé, ao contrário da lista de navegação. */
  chromeCta: boolean;
  /** Escondido nesta largura ou nesta página: não é uma chamada que a pessoa vê. */
  shown: boolean;
}

const collectLinks = (page: Page) =>
  page.locator("a").evaluateAll((anchors) =>
    (anchors as HTMLAnchorElement[]).map((anchor) => ({
      href: anchor.getAttribute("href"),
      resolved: anchor.href,
      text: anchor.textContent?.replace(/\s+/g, " ").trim() ?? "",
      target: anchor.target,
      rel: anchor.rel,
      zone: anchor.closest("header")
        ? "header"
        : anchor.closest("main")
          ? "main"
          : anchor.closest("footer")
            ? "footer"
            : "other",
      navigatesList: Boolean(anchor.closest('nav[aria-label^="Filtrar"], nav[aria-label*="aginação"]')),
      // Botão do cabeçalho e chamada do bloco de contato do rodapé; a lista de páginas é navegação, não CTA.
      chromeCta: Boolean(anchor.closest("header, footer")) && Boolean(anchor.closest("[data-magnetic], address")),
      shown: anchor.getClientRects().length > 0,
    })),
  ) as Promise<FoundLink[]>;

/** Respostas já conferidas nesta execução: o menu e o rodapé se repetem em toda página. */
const responses = new Map<string, number>();

async function statusOf(request: APIRequestContext, path: string) {
  const known = responses.get(path);
  if (known !== undefined) return known;
  const status = (await request.get(path)).status();
  responses.set(path, status);
  return status;
}

/** Destinos externos aceitos, com o texto do que os define: site.ts ou, com banco, o que está publicado. */
async function knownExternalUrls(): Promise<Set<string>> {
  const urls = new Set<string>([
    NUCLEOTECH_URL,
    ...Object.values(siteSettings.socials),
    siteSettings.contact.mapsUrl ?? "",
    ...seedSnapshot.cases.flatMap((item) => item.externalLinks.map((link) => link.url)),
  ]);
  if (SUPABASE_URL && SERVICE_KEY) {
    const client = serviceClient();
    const { data: settings } = await client.from("site_settings").select("socials, contact").maybeSingle();
    for (const url of Object.values((settings?.socials ?? {}) as Record<string, string>)) urls.add(url);
    const mapsUrl = (settings?.contact as { mapsUrl?: string } | null)?.mapsUrl;
    if (mapsUrl) urls.add(mapsUrl);
    const { data: cases } = await client.from("cases").select("external_links").eq("status", "published");
    for (const row of cases ?? []) {
      for (const link of row.external_links as { url: string }[]) urls.add(link.url);
    }
    const { data: ctas } = await client.from("ctas").select("target_url").eq("status", "published");
    for (const row of ctas ?? []) if (row.target_url) urls.add(row.target_url as string);
  }
  urls.delete("");
  return urls;
}

interface Problems {
  invalid: string[];
  broken: string[];
  anchors: string[];
  circular: string[];
  external: string[];
}

/** Confere todos os links da página aberta. Devolve as falhas, para o teste listar todas de uma vez. */
async function auditLinks(page: Page, request: APIRequestContext, known: Set<string>): Promise<Problems> {
  const here = new URL(page.url());
  const links = await collectLinks(page);
  expect(links.length, `${here.pathname} sem nenhum link`).toBeGreaterThan(0);
  const problems: Problems = { invalid: [], broken: [], anchors: [], circular: [], external: [] };

  for (const link of links) {
    const label = `"${link.text}" → ${link.href}`;
    if (!link.href || link.href === "#" || /^javascript:/i.test(link.href)) {
      problems.invalid.push(label);
      continue;
    }
    const url = new URL(link.resolved);
    if (url.protocol === "mailto:" || url.protocol === "tel:") continue;

    if (url.origin !== here.origin) {
      if (url.protocol !== "https:") problems.external.push(`${label}: sem https`);
      if (link.target !== "_blank") problems.external.push(`${label}: não abre em nova aba`);
      const rel = link.rel.split(/\s+/);
      if (!rel.includes("noopener") || !rel.includes("noreferrer")) {
        problems.external.push(`${label}: rel="${link.rel}"`);
      }
      if (!/nova aba/i.test(link.text)) problems.external.push(`${label}: rótulo não avisa da nova aba`);
      if (!known.has(link.href)) problems.external.push(`${label}: destino desconhecido`);
      continue;
    }

    if (link.target === "_blank" && !/nova aba/i.test(link.text)) {
      problems.external.push(`${label}: abre em nova aba sem avisar`);
    }

    const status = await statusOf(request, url.pathname + url.search);
    if (status >= 400) problems.broken.push(`${label}: ${status}`);

    const samePage = url.pathname === here.pathname && url.search === here.search;
    if (url.hash) {
      const id = decodeURIComponent(url.hash.slice(1));
      if (samePage) {
        if ((await page.locator(`[id="${id}"]`).count()) !== 1) problems.anchors.push(`${label}: âncora ausente`);
      } else {
        const destination = await page.context().newPage();
        await destination.goto(url.pathname + url.search);
        if (!(await destination.locator(`[id="${id}"]`).count())) problems.anchors.push(`${label}: âncora ausente`);
        await destination.close();
      }
      continue;
    }

    const counts = link.shown && (link.zone === "main" || link.chromeCta);
    if (counts && samePage && !link.navigatesList) problems.circular.push(`${here.pathname}: ${label}`);
  }
  return problems;
}

const NO_PROBLEMS: Problems = { invalid: [], broken: [], anchors: [], circular: [], external: [] };

test.describe("INT-06 · links e CTAs do site público", () => {
  test.setTimeout(120_000);

  for (const route of ROUTES) {
    test(`${route}: todos os links`, async ({ page, request }) => {
      await page.goto(route, { waitUntil: "networkidle" });
      expect(await auditLinks(page, request, await knownExternalUrls())).toEqual(NO_PROBLEMS);
    });
  }

  for (const [list, prefix] of [
    ["/servicos", "/servicos/"],
    ["/cases", "/cases/"],
  ] as const) {
    test(`${list}: cada detalhe tem os links certos`, async ({ page, request, isMobile }) => {
      test.skip(isMobile, "O conteúdo dos links é o mesmo: o celular é conferido nas páginas de lista.");
      test.setTimeout(240_000);
      const known = await knownExternalUrls();
      await page.goto(list, { waitUntil: "networkidle" });
      const details = [
        ...new Set(
          (await collectLinks(page))
            .map((link) => new URL(link.resolved).pathname)
            .filter((path) => path.startsWith(prefix) && path.length > prefix.length),
        ),
      ];
      expect(details.length).toBeGreaterThan(0);
      for (const detail of details) {
        await page.goto(detail, { waitUntil: "networkidle" });
        expect(await auditLinks(page, request, known), detail).toEqual(NO_PROBLEMS);
      }
    });
  }

  test("cada serviço leva ao formulário com ele mesmo escolhido", async ({ page, isMobile }) => {
    test.skip(isMobile, "A regra não depende do tamanho da tela.");
    test.setTimeout(240_000);
    await page.goto("/servicos", { waitUntil: "networkidle" });
    const slugs = [
      ...new Set(
        (await collectLinks(page))
          .map((link) => new URL(link.resolved).pathname)
          .filter((path) => path.startsWith("/servicos/"))
          .map((path) => path.slice("/servicos/".length)),
      ),
    ];
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      await page.goto(`/servicos/${slug}`, { waitUntil: "networkidle" });
      const cta = page.getByRole("main").getByRole("link", { name: "Quero este serviço" }).first();
      await expect(cta, slug).toHaveAttribute("href", `/contato?servico=${slug}#formulario`);
    }
    await page.goto(`/contato?servico=${slugs[0]}#formulario`, { waitUntil: "networkidle" });
    await expect(page.locator('select[name="serviceInterest"]')).toHaveValue(slugs[0]);
  });

  test("o botão de contato some em /contato e volta, visível, ao navegar para outra página", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "No celular o botão do cabeçalho já não aparece (LAY-02).");
    await page.goto("/contato", { waitUntil: "networkidle" });
    const cta = page.getByRole("banner").getByRole("link", { name: "Fale com a gente" });
    await expect(cta).toBeHidden();
    await page.getByRole("banner").getByRole("link", { name: "Sobre" }).click();
    await expect(page).toHaveURL(/\/sobre$/);
    await expect(cta).toBeVisible();
    await expect.poll(() => cta.evaluate((element) => getComputedStyle(element.parentElement!).opacity)).toBe("1");
    await cta.click();
    await expect(page).toHaveURL(/\/contato$/);
    await expect(cta).toBeHidden();
  });

  test("os CTAs da Home vão para o destino cadastrado", async ({ page, isMobile }) => {
    test.skip(isMobile, "A regra não depende do tamanho da tela.");
    test.skip(Boolean(SUPABASE_URL), "Com o banco, os CTAs são os publicados: vale a jornada @cms abaixo.");
    await page.goto("/", { waitUntil: "networkidle" });
    const ctas = seedSnapshot.ctas.filter((cta) => cta.placement.startsWith("home"));
    expect(ctas.length).toBeGreaterThan(0);
    for (const cta of ctas) {
      const expected = resolveCtaHref(cta.target, seedSnapshot).href;
      const links = page.getByRole("main").getByRole("link", { name: cta.label, exact: true });
      await expect(links.first(), cta.label).toHaveAttribute("href", expected);
    }
  });

  test("os domínios do site batem com content/site.ts", async () => {
    // A lista do teste é conferida contra a fonte: se alguém trocar um perfil, esta linha cobra a revisão.
    expect(new URL(siteSettings.socials.instagram!).host).toBe("www.instagram.com");
    expect(new URL(siteSettings.socials.tiktok!).host).toBe("www.tiktok.com");
    expect(new URL(siteSettings.socials.linkedin!).host).toBe("www.linkedin.com");
    expect(new URL(siteSettings.contact.mapsUrl!).host).toBe("www.google.com");
  });
});

test.describe("INT-06 · CTA publicado reflete no site sem redeploy @cms", () => {
  test.skip(!SUPABASE_URL || !SERVICE_KEY, "Requer o Supabase local: npm run test:e2e:cms");
  test.skip(!process.env.CONTENT_REVALIDATE_SECRET, "Requer o segredo da rota interna: npm run test:e2e:cms");
  test.skip(({ isMobile }) => isMobile, "A regra não depende do tamanho da tela.");
  test.setTimeout(60_000);

  const suffix = randomBytes(3).toString("hex");
  const client = () => serviceClient();
  const invalidate = async (request: APIRequestContext) => {
    const response = await request.post("/api/internal/revalidate", {
      headers: { authorization: `Bearer ${process.env.CONTENT_REVALIDATE_SECRET}` },
      data: { entity: "cta" },
    });
    expect(response.status()).toBe(200);
  };

  /** Recarrega a Home até o estado esperado: a tela já aberta não muda sozinha. */
  async function expectLink(page: Page, label: string, present: boolean) {
    await expect(async () => {
      await page.goto("/");
      const link = page.getByRole("main").getByRole("link", { name: label });
      await (present
        ? expect(link.first()).toBeVisible({ timeout: 800 })
        : expect(link).toHaveCount(0, { timeout: 800 }));
    }).toPass({ timeout: 20_000 });
  }

  test("interno e externo entram com o destino certo e saem ao arquivar", async ({ page, request }) => {
    const service = client();
    const published = { status: "published", published_at: "2026-10-01T12:00:00.000Z" };
    const internal = `Interno ${suffix}`;
    const external = `Externo ${suffix}`;
    const url = `https://exemplo.test/${suffix}`;
    const { data, error } = await service
      .from("ctas")
      .insert([
        {
          ...published,
          label: internal,
          placement: "home-highlight",
          target_kind: "internal",
          target_path: "/feedback",
        },
        { ...published, label: external, placement: "home-highlight", target_kind: "external", target_url: url },
      ])
      .select("id");
    if (error) throw error;
    const ids = data.map((row) => row.id as string);
    try {
      await invalidate(request);
      await expectLink(page, internal, true);
      const main = page.getByRole("main");
      await expect(main.getByRole("link", { name: internal })).toHaveAttribute("href", "/feedback");
      const outside = main.getByRole("link", { name: external });
      await expect(outside).toHaveAttribute("href", url);
      await expect(outside).toHaveAttribute("target", "_blank");
      await expect(outside).toHaveAttribute("rel", /noopener/);
      await expect(outside).toContainText("nova aba");

      await service.from("ctas").update({ status: "archived", archived_at: new Date().toISOString() }).in("id", ids);
      await invalidate(request);
      await expectLink(page, internal, false);
    } finally {
      await service.from("ctas").delete().in("id", ids);
      await invalidate(request);
    }
  });
});
