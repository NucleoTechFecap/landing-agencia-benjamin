/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : robots.test.ts
 Descrição    : Testes das regras de robots por ambiente.

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

import { describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({ isIndexable: true, siteUrl: "https://agencia.exemplo" }));
vi.mock("@/lib/config/public-env", () => env);

const { default: robots } = await import("./robots");

describe("robots (SEG-09)", () => {
  it("produção: indexa o site, nunca o painel nem as APIs internas, e aponta o sitemap", () => {
    env.isIndexable = true;
    expect(robots()).toEqual({
      rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/internal"] }],
      sitemap: "https://agencia.exemplo/sitemap.xml",
      host: "https://agencia.exemplo",
    });
  });

  it("demais ambientes: bloqueia tudo e não divulga o sitemap", () => {
    env.isIndexable = false;
    expect(robots()).toEqual({ rules: [{ userAgent: "*", disallow: "/" }] });
  });
});
