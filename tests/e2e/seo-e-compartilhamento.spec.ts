/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : seo-e-compartilhamento.spec.ts
 Descrição    : Metadados, preview de compartilhamento e acesso negado nas rotas públicas.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 01/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  SEO e compartilhamento das páginas públicas (SEG-09).
──────────────────────────────────────────────────────────────────────────────
*/

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * SEO básico e preview de compartilhamento das páginas públicas (SEG-09). Roda sobre o build com
 * o conteúdo versionado. O domínio dos metadados vem de NEXT_PUBLIC_SITE_URL, que pode não ser o
 * do teste: por isso a imagem é buscada pelo caminho, não pela URL completa.
 */
test.describe("SEO e compartilhamento", () => {
  test.skip(({ isMobile }) => isMobile, "Os metadados não dependem do tamanho da tela.");

  /** Sem esperar: a página já carregou, e meta ausente deve falhar na hora, apontando a rota. */
  const meta = async (page: Page, selector: string) => {
    const tag = page.locator(selector).first();
    return (await tag.count()) ? tag.getAttribute("content") : null;
  };
  const pathOf = (url: string) => new URL(url, "http://base.local").pathname + new URL(url, "http://base.local").search;

  const sitemapPaths = async (request: APIRequestContext) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
  };

  test("cada rota do sitemap tem título, descrição, canonical e preview com imagem válida", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const paths = await sitemapPaths(request);
    expect(paths).toEqual(expect.arrayContaining(["/", "/sobre", "/areas", "/servicos", "/cases", "/contato"]));
    expect(new Set(paths).size).toBe(paths.length);

    const titles = new Map<string, string>();
    for (const path of paths) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);

      const title = await page.title();
      expect(title.trim(), `${path}: título`).not.toBe("");
      expect(titles.get(title), `${path}: título repetido`).toBeUndefined();
      titles.set(title, path);

      expect((await meta(page, 'meta[name="description"]'))?.trim(), `${path}: descrição`).toBeTruthy();
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(pathOf(canonical!), `${path}: canonical`).toBe(path);

      expect(await meta(page, 'meta[property="og:title"]'), `${path}: og:title`).toBeTruthy();
      expect(await meta(page, 'meta[property="og:description"]'), `${path}: og:description`).toBeTruthy();
      expect(pathOf((await meta(page, 'meta[property="og:url"]'))!), `${path}: og:url`).toBe(path);
      expect(await meta(page, 'meta[name="twitter:card"]'), `${path}: twitter:card`).toBe("summary_large_image");

      for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
        const image = await meta(page, selector);
        expect(image, `${path}: ${selector}`).toBeTruthy();
        const file = await request.get(pathOf(image!));
        expect(file.status(), `${path}: ${image}`).toBe(200);
        expect(file.headers()["content-type"], `${path}: ${image}`).toMatch(/^image\//);
      }

      for (const script of await page.locator('script[type="application/ld+json"]').allTextContents()) {
        expect(() => JSON.parse(script), `${path}: JSON-LD`).not.toThrow();
      }
    }
  });

  test("fora de produção nada é indexado", async ({ page, request }) => {
    expect(await (await request.get("/robots.txt")).text()).toMatch(/Disallow: \/\s/);
    await page.goto("/");
    expect(await meta(page, 'meta[name="robots"]')).toContain("noindex");
  });

  test("o sitemap não lista painel, API nem conteúdo fora do ar", async ({ request }) => {
    const paths = await sitemapPaths(request);
    expect(paths.filter((path) => /^\/(admin|api)/.test(path))).toEqual([]);
    expect(paths.filter((path) => path.includes("rascunho") || path.includes("arquivad"))).toEqual([]);
  });

  test("página inexistente responde 404 e não pede indexação", async ({ page }) => {
    const response = await page.goto("/pagina-que-nao-existe");
    expect(response?.status()).toBe(404);
    expect(await meta(page, 'meta[name="robots"]')).toContain("noindex");
  });

  test("rotas internas recusam quem não tem credencial, sem expor detalhes", async ({ request }) => {
    const attempts: Record<string, string>[] = [{}, { authorization: "Bearer segredo-errado" }];
    for (const headers of attempts) {
      const response = await request.post("/api/internal/revalidate", { headers, data: { entity: "settings" } });
      expect(response.status()).toBe(401);
      const body = await response.text();
      expect(body).not.toMatch(/stack|supabase|secret|segredo/i);
    }
  });

  test("entrada malformada não expõe dados", async ({ request }) => {
    for (const slug of ["..%2F..%2Fetc%2Fpasswd", "%27%20OR%201%3D1", "ADMIN", "a"]) {
      const response = await request.get(`/api/v1/pages/${slug}`);
      expect(response.status(), slug).toBe(404);
      expect(await response.text(), slug).not.toMatch(/stack|postgres|supabase|select /i);
    }
  });
});
