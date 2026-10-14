/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : internal-auth.test.ts
 Descrição    : Testes da autenticação por segredo das rotas internas.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (GO-02).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { hasBearerSecret } from "./internal-auth";

describe("hasBearerSecret", () => {
  const secret = "s".repeat(40);
  it("aceita somente o Bearer exato", () => {
    expect(hasBearerSecret(`Bearer ${secret}`, secret)).toBe(true);
    expect(hasBearerSecret(`Bearer ${secret}x`, secret)).toBe(false);
    expect(hasBearerSecret(secret, secret)).toBe(false);
    expect(hasBearerSecret(null, secret)).toBe(false);
  });
  it("nega quando o segredo não está configurado", () => {
    expect(hasBearerSecret("Bearer qualquer", undefined)).toBe(false);
  });
});
