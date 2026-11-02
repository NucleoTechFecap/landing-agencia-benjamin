/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : site-footer.test.ts
 Descrição    : Testes do rodapé: redes sociais, contato e endereço.

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
 01/11/2026 Vinícius Nishimura Reis  Endereço sem mapa e redes vazias no rodapé (LAY-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { siteSettings } from "@/content";
import type { SiteSettings } from "@/lib/domain/content/types";
import { SiteFooter } from "./site-footer";

const render = (partial: Partial<SiteSettings>) =>
  renderToStaticMarkup(createElement(SiteFooter, { settings: { ...siteSettings, ...partial }, year: 2026 }));

describe("rodapé (LAY-03)", () => {
  it("os três links oficiais usam https e abrem em nova aba, avisando o leitor de tela", () => {
    const markup = render({});
    for (const url of Object.values(siteSettings.socials)) {
      expect(url).toMatch(/^https:\/\//);
      expect(markup).toContain(`href="${url}" target="_blank" rel="noopener noreferrer me"`);
    }
    for (const name of ["Instagram", "TikTok", "LinkedIn"]) {
      expect(markup).toContain(`${name} da Agência Benjamin (abre em nova aba)`);
    }
  });

  it("mostra só a rede informada, e sem nenhuma não deixa lista vazia", () => {
    const one = render({ socials: { instagram: "https://www.instagram.com/agenciabenja" } });
    expect(one).toContain("Instagram da Agência");
    expect(one).not.toContain("TikTok da Agência");
    expect(render({ socials: {} })).not.toContain("da Agência Benjamin (abre em nova aba)");
    expect(render({ socials: {} })).not.toContain('<ul class="flex items-center gap-3 mt-6"');
  });

  it("endereço sem mapa é texto, não um link sem destino", () => {
    const markup = render({ contact: { address: "Av. da Liberdade, 532" } });
    expect(markup).toContain("<p>Av. da Liberdade, 532</p>");
    expect(markup).not.toContain("abre o mapa");
  });

  it("endereço com mapa é link para o mapa", () => {
    const markup = render({ contact: { address: "Av. da Liberdade, 532", mapsUrl: "https://maps.exemplo/fecap" } });
    expect(markup).toContain('href="https://maps.exemplo/fecap"');
    expect(markup).toContain("abre o mapa em nova aba");
  });

  it("e-mail e telefone só aparecem quando informados", () => {
    expect(render({ contact: {} })).not.toContain("mailto:");
    const markup = render({ contact: { email: "contato@exemplo.com.br", phone: "(11) 3333-3333" } });
    expect(markup).toContain('href="mailto:contato@exemplo.com.br"');
    expect(markup).toContain("(11) 3333-3333");
  });

  it("mantém a ligação com a FECAP e o Envie uma mensagem", () => {
    const markup = render({});
    expect(markup).toContain("Agência experimental da FECAP");
    expect(markup).toContain('href="/contato"');
  });
});
