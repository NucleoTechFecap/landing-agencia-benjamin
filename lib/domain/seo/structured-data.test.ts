/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : structured-data.test.ts
 Descrição    : Testes dos dados estruturados schema.org.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (SEO da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { seedSnapshot, siteSettings } from "@/content";
import { breadcrumbSchema, caseSchema, organizationSchema, serviceSchema } from "./structured-data";

const URL = "https://www.exemplo.com.br";

describe("dados estruturados", () => {
  it("Organization traz redes oficiais, FECAP e endereço", () => {
    const schema = organizationSchema(siteSettings, URL);
    expect(schema["@type"]).toBe("Organization");
    expect(schema.sameAs).toHaveLength(3);
    expect(schema.parentOrganization.name).toMatch(/FECAP/);
    expect(schema.logo).toBe(`${URL}/brand/logo-horizontal.png`);
  });

  it("BreadcrumbList numera e monta URLs absolutas", () => {
    expect(
      breadcrumbSchema(
        [
          { name: "Início", path: "/" },
          { name: "Serviços", path: "/servicos" },
        ],
        URL,
      ).itemListElement,
    ).toEqual([
      { "@type": "ListItem", position: 1, name: "Início", item: `${URL}/` },
      { "@type": "ListItem", position: 2, name: "Serviços", item: `${URL}/servicos` },
    ]);
  });

  it("Service e CreativeWork apontam para a organização", () => {
    const service = seedSnapshot.services[0];
    expect(serviceSchema(service, seedSnapshot.areas, URL).provider).toEqual({ "@id": `${URL}/#organizacao` });
    const item = seedSnapshot.cases[0];
    const schema = caseSchema(item, "Copywriting", [service], URL);
    expect(schema).toMatchObject({
      "@type": "CreativeWork",
      about: { name: item.client },
      image: `${URL}${item.cover!.src}`,
    });
  });
});
