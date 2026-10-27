/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : brand-icon.test.ts
 Descrição    : Confere que todo ícone oferecido no CMS existe em todas as cores.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
──────────────────────────────────────────────────────────────────────────────
*/

import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BRAND_ICONS, isBrandIcon } from "@/lib/domain/content/icons";
import { BRAND_ICON_COLORS } from "./brand-icon";

describe("ícones do CMS (ADM-07)", () => {
  it("cada ícone oferecido tem o arquivo WebP em todas as cores", () => {
    const missing = BRAND_ICONS.flatMap((name) =>
      BRAND_ICON_COLORS.map((color) => `${name}-${color}.webp`).filter(
        (file) => !existsSync(join(process.cwd(), "public", "brand", "icons", file)),
      ),
    );
    expect(missing).toEqual([]);
  });

  it("recusa nome fora da lista", () => {
    expect(isBrandIcon("raio")).toBe(true);
    expect(isBrandIcon("foguete")).toBe(false);
  });
});
