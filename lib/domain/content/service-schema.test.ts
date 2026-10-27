/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : service-schema.test.ts
 Descrição    : Testes da validação do serviço no CMS.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-06).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { serviceInputSchema, validateServiceForPublish } from "./service-schema";

const area = "8b4f6a52-6c43-4a8f-9d55-2f5a2f6f0c11";

describe("serviço no CMS (ADM-06)", () => {
  it("rascunho exige só nome e slug; vazios viram ausentes", () => {
    expect(serviceInputSchema.parse({ name: "Audiovisual", slug: "audiovisual", imageId: "", icon: "" })).toMatchObject(
      {
        name: "Audiovisual",
        areaIds: [],
        examples: [],
        featured: false,
        imageId: undefined,
        icon: undefined,
        order: 0,
      },
    );
  });

  it("recusa área e imagem que não são ids válidos", () => {
    const result = serviceInputSchema.safeParse({
      name: "Audiovisual",
      slug: "audiovisual",
      areaIds: ["x"],
      imageId: "y",
    });
    expect(result.error?.issues.map((issue) => issue.path[0]).sort()).toEqual(["areaIds", "imageId"]);
  });

  it("publicar exige resumo, descrição e ao menos uma área (R03)", () => {
    const draft = serviceInputSchema.parse({ name: "Audiovisual", slug: "audiovisual" });
    expect(validateServiceForPublish(draft)).toEqual([
      "Resumo: Escreva um resumo (mínimo de 10 caracteres).",
      "Descrição: Escreva a descrição (mínimo de 20 caracteres).",
      "Áreas: Vincule ao menos uma área de atuação.",
    ]);
    expect(
      validateServiceForPublish({
        ...draft,
        summary: "Vídeos e fotos para redes.",
        description: "Roteiro, captação e edição de vídeos institucionais.",
        areaIds: [area],
      }),
    ).toEqual([]);
  });
});
