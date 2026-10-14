/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Scripts
 Arquivo      : provision-admin.test.mjs
 Descrição    : Testes da validação de argumentos do provisionamento de contas.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (INT-08).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { parseArgs } from "./provision-admin.mjs";

const env = {
  NEXT_PUBLIC_SITE_ENV: "homologation",
  NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  NEXT_PUBLIC_SITE_URL: "https://hml.exemplo.com/",
};

describe("provision-admin parseArgs", () => {
  it("aceita convite válido com confirmação do ambiente", () => {
    expect(parseArgs(["--email", "Pessoa@Exemplo.com", "--name", "Pessoa Teste", "--role", "admin", "--confirm", "hml"], env)).toEqual({
      email: "pessoa@exemplo.com",
      name: "Pessoa Teste",
      role: "admin",
      dryRun: false,
      environment: "homologation",
      redirectTo: "https://hml.exemplo.com/admin/auth/callback?next=/admin/nova-senha",
    });
  });

  it("exige confirmação explícita do ambiente (evita convidar no ambiente errado)", () => {
    expect(() => parseArgs(["--email", "a@b.com", "--name", "Ana", "--confirm", "prd"], env)).toThrow(/--confirm hml/);
  });

  it("papel padrão é pending e dry-run dispensa confirmação", () => {
    expect(parseArgs(["--email", "a@b.com", "--name", "Ana", "--dry-run"], env)).toMatchObject({ role: "pending", dryRun: true });
  });

  it("recusa papel inexistente, e-mail inválido e variáveis ausentes", () => {
    expect(() => parseArgs(["--email", "a@b.com", "--name", "Ana", "--role", "owner", "--dry-run"], env)).toThrow(/--role/);
    expect(() => parseArgs(["--email", "invalido", "--name", "Ana", "--dry-run"], env)).toThrow(/--email/);
    expect(() => parseArgs(["--email", "a@b.com", "--name", "Ana", "--dry-run"], { ...env, SUPABASE_SERVICE_ROLE_KEY: "" })).toThrow(
      /SUPABASE_SERVICE_ROLE_KEY/,
    );
  });
});
