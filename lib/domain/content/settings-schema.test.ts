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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-03).
 04/11/2026 Vinícius Nishimura Reis  Links, e-mail, telefone e formulário do painel (ADM-10).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { siteSettings } from "@/content";
import {
  changedSettingsFields,
  contactSchema,
  parseSettingsSections,
  settingsFormSchema,
  socialsSchema,
} from "./settings-schema";

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

describe("regras de contato e redes (ADM-10)", () => {
  const form = {
    tagline: "Somando diferenças",
    description: "Agência experimental de comunicação, com projetos reais feitos por estudantes.",
    email: "",
    phone: "",
    address: "",
    mapsUrl: "",
    instagram: "",
    tiktok: "",
    linkedin: "",
  };
  const fieldError = (values: Partial<typeof form>, field: string) => {
    const result = settingsFormSchema.safeParse({ ...form, ...values });
    return result.success ? undefined : result.error.issues.find((issue) => issue.path[0] === field)?.message;
  };

  it("os valores de referência do site passam nas regras, sem mudar", () => {
    expect(contactSchema.parse(siteSettings.contact)).toEqual(siteSettings.contact);
    expect(socialsSchema.parse(siteSettings.socials)).toEqual(siteSettings.socials);
  });

  it.each([
    ["javascript:", "javascript:alert(1)"],
    ["javascript: com quebra de linha", "java\nscript:alert(1)"],
    ["data:", "data:text/html,<script>alert(1)</script>"],
    ["http:", "http://maps.exemplo.com/fecap"],
    ["ftp:", "ftp://maps.exemplo.com/fecap"],
    ["sem protocolo", "maps.exemplo.com/fecap"],
    ["relativo ao protocolo", "//maps.exemplo.com/fecap"],
    ["usuário e senha na URL", "https://maps.exemplo.com@golpe.com/"],
    ["endereço local", "https://localhost/mapa"],
    ["IP", "https://127.0.0.1/mapa"],
  ])("recusa link de mapa %s", (_label, mapsUrl) => {
    expect(fieldError({ address: "Rua A", mapsUrl }, "mapsUrl")).toBe("Use um link completo, começando com https://.");
  });

  it("grava o link na forma canônica: o navegador trataria https:exemplo como caminho relativo", () => {
    const { contact } = settingsFormSchema.parse({
      ...form,
      address: "Rua A",
      mapsUrl: "  HTTPS:maps.exemplo.com/a b ",
    });
    expect(contact.mapsUrl).toBe("https://maps.exemplo.com/a%20b");
  });

  it.each([
    ["instagram", "https://www.instagram.com/agenciabenja"],
    ["instagram", "https://instagram.com/agenciabenja"],
    ["tiktok", "https://www.tiktok.com/@tik.benja"],
    ["tiktok", "https://vm.tiktok.com/abc"],
    ["linkedin", "https://www.linkedin.com/company/benjamin-fecap/"],
    ["linkedin", "https://br.linkedin.com/company/benjamin-fecap"],
  ])("aceita %s em %s", (field, url) => {
    expect(fieldError({ [field]: url }, field)).toBeUndefined();
  });

  it.each([
    ["instagram", "https://www.tiktok.com/@tik.benja", "Instagram"],
    ["instagram", "https://instagram.com.golpe.com/benja", "Instagram"],
    ["instagram", "https://falsoinstagram.com/benja", "Instagram"],
    ["tiktok", "https://www.instagram.com/agenciabenja", "TikTok"],
    ["linkedin", "https://exemplo.com/linkedin.com", "LinkedIn"],
  ])("recusa em %s o endereço de outro site: %s", (field, url, network) => {
    expect(fieldError({ [field]: url }, field)).toContain(`Use um link do ${network}`);
  });

  it.each([["http://www.instagram.com/benja"], ["javascript:alert(1)//instagram.com"]])(
    "rede social também só aceita https: %s",
    (instagram) => {
      expect(fieldError({ instagram }, "instagram")).toBe("Use um link completo, começando com https://.");
    },
  );

  it.each([["sem-arroba"], ["a@b"], ["a b@exemplo.com"], ["a@exemplo.com?bcc=outro@exemplo.com"], ["<a@exemplo.com>"]])(
    "recusa e-mail que não seja um endereço simples: %s",
    (email) => {
      expect(fieldError({ email }, "email")).toContain("Use um e-mail válido");
    },
  );

  it.each([["(11) 3333-3333"], ["+55 11 3333-3333"], ["11 93333.3333"], ["0800 123 4567"]])(
    "aceita telefone %s",
    (phone) => {
      expect(fieldError({ phone }, "phone")).toBeUndefined();
    },
  );

  it.each([["ligue já"], ["1234"], ["1234567890123456"], ["tel:1133333333"], ["11+33333333"]])(
    "recusa telefone %s",
    (phone) => {
      expect(fieldError({ phone }, "phone")).toContain("Use só números");
    },
  );

  it("campo em branco ou só com espaços fica ausente, sem chave vazia gravada", () => {
    const parsed = settingsFormSchema.parse({ ...form, email: "   ", instagram: " " });
    expect(parsed.contact).toEqual({});
    expect(Object.keys(parsed.socials)).toEqual([]);
  });

  it("slogan e descrição são obrigatórios: o rodapé e as buscas dependem deles", () => {
    expect(fieldError({ tagline: "  " }, "tagline")).toBe("Preencha este campo.");
    expect(fieldError({ description: "" }, "description")).toBe("Preencha este campo.");
    expect(fieldError({ description: "Curta demais." }, "description")).toContain("ao menos 50");
    expect(fieldError({ tagline: "x".repeat(121) }, "tagline")).toContain("no máximo 120");
    expect(fieldError({ description: "x".repeat(301) }, "description")).toContain("no máximo 300");
  });

  it("mapa sem endereço é recusado no endereço: o site só mostra o mapa como link dele", () => {
    expect(fieldError({ mapsUrl: "https://maps.exemplo.com/fecap" }, "address")).toContain("Preencha o endereço");
  });

  it("endereço sem mapa é aceito", () => {
    expect(settingsFormSchema.parse({ ...form, address: "Rua A, 10" }).contact).toEqual({ address: "Rua A, 10" });
  });

  it("valor gravado direto no banco com link perigoso não chega ao site", () => {
    const { sections, problems } = parseSettingsSections(
      {
        manifesto: siteSettings.manifesto,
        about: siteSettings.about,
        contact: { mapsUrl: "javascript:alert(1)" },
        socials: { instagram: "https://golpe.com/benja" },
      },
      siteSettings,
    );
    expect(sections.contact).toEqual(siteSettings.contact);
    expect(sections.socials).toEqual(siteSettings.socials);
    expect(problems).toHaveLength(2);
  });

  it("lista só os campos que mudaram", () => {
    const base = {
      tagline: "A",
      description: "B",
      contact: { address: "Rua A" },
      socials: { instagram: "https://www.instagram.com/a" },
    };
    expect(changedSettingsFields(base, structuredClone(base))).toEqual([]);
    expect(
      changedSettingsFields(base, {
        ...base,
        tagline: "A2",
        contact: { email: "a@exemplo.com" },
        socials: { instagram: "https://www.instagram.com/b" },
      }),
    ).toEqual(["tagline", "email", "address", "instagram"]);
  });
});
