/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : store-policy.test.ts
 Descrição    : Testes da regra de armazenamento em memória.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (FORM-08).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { allowsMemoryStore } from "./store-policy";

describe("allowsMemoryStore", () => {
  it.each([
    ["development", undefined],
    ["preview", undefined],
    ["development", "development"],
    ["development", "preview"],
    ["preview", "preview"],
  ])("site em %s e Vercel em %s: pode, os dados ali são descartáveis", (siteEnvironment, vercelEnv) => {
    expect(allowsMemoryStore({ siteEnvironment, vercelEnv })).toBe(true);
  });

  it.each([
    ["development", "production"],
    ["preview", "production"],
  ])(
    "site em %s e Vercel em %s: não pode, é um deploy real com o ambiente mal configurado",
    (siteEnvironment, vercelEnv) => {
      expect(allowsMemoryStore({ siteEnvironment, vercelEnv })).toBe(false);
    },
  );

  it.each([
    ["production", undefined],
    ["production", "preview"],
    ["production", "production"],
    ["homologation", undefined],
    ["homologation", "preview"],
    ["homologation", "production"],
  ])("site em %s e Vercel em %s: não pode", (siteEnvironment, vercelEnv) => {
    expect(allowsMemoryStore({ siteEnvironment, vercelEnv })).toBe(false);
  });
});
