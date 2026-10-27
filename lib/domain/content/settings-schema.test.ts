/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : settings-schema.test.ts
 Descrição    : Testes da validação da configuração institucional vinda do banco.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { siteSettings } from "@/content";
import { parseSettingsSections } from "./settings-schema";

describe("parseSettingsSections (DB-03)", () => {
  const valid = {
    manifesto: { title: "Manifesto", paragraphs: ["Um parágrafo."] },
    about: {
      title: "Sobre",
      intro: "Intro.",
      valueProposition: "Proposta.",
      howWeWork: "Como.",
      fecapRelation: "FECAP.",
    },
    contact: { email: "contato@exemplo.com.br", mapsUrl: "https://maps.google.com/?q=fecap" },
    socials: { instagram: "https://www.instagram.com/agenciabenja" },
  };

  it("aceita seções válidas sem problemas", () => {
    const { sections, problems } = parseSettingsSections(valid, siteSettings);
    expect(problems).toEqual([]);
    expect(sections.contact.email).toBe("contato@exemplo.com.br");
    expect(sections.about.provisional).toBeUndefined();
  });

  it("troca só a seção inválida pelo valor de referência e reporta o problema", () => {
    const { sections, problems } = parseSettingsSections(
      { ...valid, socials: { instagram: "http://instagram.com/x" }, manifesto: {} },
      siteSettings,
    );
    expect(sections.socials).toEqual(siteSettings.socials);
    expect(sections.manifesto).toEqual(siteSettings.manifesto);
    expect(sections.contact.email).toBe("contato@exemplo.com.br");
    expect(problems).toHaveLength(2);
    expect(problems.join(" ")).toMatch(/socials: instagram/);
  });

  it("objeto vazio em contato e redes é válido (campos opcionais)", () => {
    const { problems } = parseSettingsSections({ ...valid, contact: {}, socials: {} }, siteSettings);
    expect(problems).toEqual([]);
  });
});
