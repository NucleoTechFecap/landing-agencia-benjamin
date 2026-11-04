/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : contact-channels.test.ts
 Descrição    : Testes dos canais da página de contato com campos preenchidos e vazios.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-10).
──────────────────────────────────────────────────────────────────────────────
*/

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { siteSettings } from "@/content";
import type { SiteSettings } from "@/lib/domain/content/types";
import { ContactChannels } from "./contact-channels";

const render = (partial: Partial<Pick<SiteSettings, "contact" | "socials">>) =>
  renderToStaticMarkup(
    createElement(ContactChannels, { contact: siteSettings.contact, socials: siteSettings.socials, ...partial }),
  );

describe("canais da página de contato (ADM-10)", () => {
  it("endereço com mapa é link https para o mapa, em nova aba", () => {
    const markup = render({ contact: { address: "Rua A, 10", mapsUrl: "https://maps.exemplo.com/a" } });
    expect(markup).toContain('href="https://maps.exemplo.com/a"');
    expect(markup).toContain("abre o mapa em nova aba");
  });

  it("endereço sem mapa é texto, não um link sem destino", () => {
    const markup = render({ contact: { address: "Rua A, 10" } });
    expect(markup).toContain('<p class="mt-2">Rua A, 10</p>');
    expect(markup).not.toContain("abre o mapa");
    expect(markup).not.toMatch(/<a\s(?![^>]*href)/);
  });

  it("e-mail e telefone só aparecem quando informados", () => {
    const empty = render({ contact: { address: "Rua A, 10" } });
    expect(empty).not.toContain("mailto:");
    const full = render({ contact: { email: "contato@exemplo.com.br", phone: "(11) 3333-3333" } });
    expect(full).toContain('href="mailto:contato@exemplo.com.br"');
    expect(full).toContain("(11) 3333-3333");
  });

  it("sem contato nem redes, não sobra título vazio", () => {
    const markup = render({ contact: {}, socials: {} });
    expect(markup).not.toContain("Onde estamos");
    expect(markup).not.toContain("Redes sociais");
    expect(markup).toContain('href="/feedback"');
  });

  it("mostra só as redes informadas", () => {
    const markup = render({ socials: { tiktok: "https://www.tiktok.com/@tik.benja" } });
    expect(markup).toContain("Redes sociais");
    expect(markup).toContain('href="https://www.tiktok.com/@tik.benja"');
    expect(markup).not.toContain("Instagram da Agência");
  });
});
