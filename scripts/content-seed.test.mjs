/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Scripts
 Arquivo      : content-seed.test.mjs
 Descrição    : Garante que supabase/seed.sql está em dia com content/ e tem a trava de produção.

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 28/10/2026
 Modificado em: 28/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 28/10/2026 Vinicius Binda             Criação inicial (DBX-02).
──────────────────────────────────────────────────────────────────────────────
*/

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { seedSnapshot, siteSettings } from "../content/index";
import { buildContentSeed, SEED_PATH } from "./content-seed.mjs";

const seed = readFileSync(SEED_PATH, "utf8");

describe("supabase/seed.sql (DBX-02)", () => {
  it("está em dia com content/ (senão: npm run seed:write)", () => {
    expect(seed).toBe(buildContentSeed(seedSnapshot, siteSettings));
  });

  it("recusa produção antes de qualquer insert", () => {
    const guard = seed.indexOf("current_setting('app.ambiente', true), '') = 'producao'");
    expect(guard).toBeGreaterThan(0);
    expect(guard).toBeLessThan(seed.indexOf("insert into"));
  });

  it("pode rodar de novo sem duplicar: todo insert ignora o que já existe", () => {
    const inserts = seed.match(/^insert into /gm) ?? [];
    const ignored = seed.match(/^on conflict .+ do nothing;$/gm) ?? [];
    expect(inserts.length).toBeGreaterThan(0);
    expect(ignored).toHaveLength(inserts.length);
  });

  it("não cria contas, senhas nem dados pessoais", () => {
    expect(seed).not.toMatch(/auth\.users|profiles|form_submissions|encrypted_password/);
  });
});
