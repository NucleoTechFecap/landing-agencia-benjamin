/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : seo.test.ts
 Descrição    : Testes do helper de metadados de página.

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
import { buildMetadata } from "./seo";

describe("buildMetadata", () => {
  const page = { title: "Serviços", description: "Lista de serviços.", path: "/servicos", keywords: ["social media"] };

  it("define canonical, Open Graph e Twitter da página", () => {
    const metadata = buildMetadata(page, { keywords: ["Agência Benjamin", "social media"] });
    expect(metadata.alternates?.canonical).toBe("/servicos");
    expect(metadata.openGraph).toMatchObject({ url: "/servicos", locale: "pt_BR", siteName: "Agência Benjamin" });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    expect(metadata.keywords).toEqual(["social media", "Agência Benjamin"]);
  });

  it("não indexa fora de produção (ambiente de teste = development)", () => {
    expect(buildMetadata(page).robots).toMatchObject({ index: false, follow: false });
  });

  it("título absoluto ignora o template", () => {
    expect(buildMetadata({ ...page, absoluteTitle: true }).title).toEqual({ absolute: "Serviços" });
  });
});
