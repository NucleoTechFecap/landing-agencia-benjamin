import { describe, expect, it } from "vitest";
import { buildHeader, hasHeader, moduleFor, withHeader } from "./file-headers.mjs";

describe("file-headers", () => {
  const header = buildHeader({
    fileName: "page.tsx",
    module: "App",
    description: "Página inicial.",
    date: "13/10/2026",
  });

  it("gera cabeçalho em bloco com sistema, módulo e histórico", () => {
    expect(header.startsWith("/*\n")).toBe(true);
    expect(header).toContain("Sistema      : Agência Benjamin Landing Page");
    expect(header).toContain("Módulo       : App");
    expect(header).toContain("Arquivo      : page.tsx");
    expect(header).toContain("13/10/2026 Vinícius Nishimura Reis  Criação inicial / atualização.");
    expect(hasHeader(header)).toBe(true);
  });

  it("usa comentário com # para YAML e shell", () => {
    const yaml = buildHeader({ fileName: "ci.yml", module: "Config", description: "CI.", date: "13/10/2026" });
    expect(yaml.split("\n")[0].startsWith("# ")).toBe(true);
  });

  it("preserva o shebang na primeira linha", () => {
    const result = withHeader("#!/usr/bin/env node\nconsole.log(1);\n", header);
    expect(result.startsWith("#!/usr/bin/env node\n/*")).toBe(true);
    expect(result).toContain("console.log(1);");
  });

  it("deriva o módulo pela pasta raiz", () => {
    expect(moduleFor("app/(site)/page.tsx")).toBe("App");
    expect(moduleFor("lib/domain/auth/rbac.ts")).toBe("Lib");
    expect(moduleFor("next.config.ts")).toBe("Config");
  });

  it("não reconhece arquivo sem cabeçalho", () => {
    expect(hasHeader("export const a = 1;")).toBe(false);
  });
});
