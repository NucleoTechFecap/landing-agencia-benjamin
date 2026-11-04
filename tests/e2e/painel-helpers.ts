/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : painel-helpers.ts
 Descrição    : Contas de teste, login e menu do painel para as jornadas E2E da casca administrativa.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-04, ADM-16).
 04/11/2026 Vinícius Nishimura Reis  Conta de teste com o papel super_admin (QA-06).
 04/11/2026 Vinícius Nishimura Reis  Prazo de publicação e espera de Server Action para máquina carregada (QA-06).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import { cpus, loadavg } from "node:os";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, type Page } from "@playwright/test";

/** Precisa do app construído contra o Supabase local: rode `npm run test:e2e:cms`. */
export const SUPABASE_URL = process.env.E2E_SUPABASE_URL;
export const SERVICE_KEY = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
export const REQUIRES_SUPABASE = "Requer o Supabase local: npm run test:e2e:cms";

export type PanelRole = "super_admin" | "admin" | "editor" | "viewer" | "pending";

export interface Account {
  email: string;
  password: string;
  id: string;
}

export const newSuffix = () => randomBytes(4).toString("hex");

/**
 * Prazo para a publicação chegar ao site (ADR-0006: 5 s). Com a máquina sobrecarregada, o relógio mede a fila de
 * CPU e não a invalidação, então o prazo folga só nesse caso. Em máquina livre, e no CI, o limite é o do ADR.
 */
export const publishBudgetMs = () => (loadavg()[0] > cpus().length ? 30_000 : 5_000);

/** Espera por uma Server Action terminar. É evento, não pausa: em máquina livre, responde bem antes. */
export const ACTION_TIMEOUT_MS = 20_000;

export const serviceClient = (): SupabaseClient =>
  createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { persistSession: false } });

export async function createAccount(admin: SupabaseClient, role: PanelRole, suffix: string): Promise<Account> {
  const email = `painel-${role}-${suffix}@teste.local`;
  const password = `Senha-e2e-${suffix}-${role}1`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const { error: profileError } = await admin
    .from("profiles")
    .update({ role, full_name: `E2E ${role}` })
    .eq("id", data.user.id);
  if (profileError) throw profileError;
  return { email, password, id: data.user.id };
}

export async function deleteAccounts(admin: SupabaseClient, accounts: readonly (Account | undefined)[]) {
  for (const account of accounts) if (account?.id) await admin.auth.admin.deleteUser(account.id);
}

/** Preenche e envia o login; quem chama confere o destino (conta pendente não chega ao início). */
export async function submitLogin(page: Page, account: Account) {
  await page.goto("/admin/login");
  // O login troca o formulário de fallback pelo definitivo ao terminar de carregar (B-08).
  await expect(page.locator("form")).toHaveCount(1);
  await page.getByLabel("E-mail").fill(account.email);
  await page.getByLabel("Senha").fill(account.password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

export async function login(page: Page, account: Account) {
  await submitLogin(page, account);
  await expect(page).toHaveURL(/\/admin$/);
}

/** Capturas de tela ficam fora do Git, em test-results/evidencias: só são gravadas com E2E_EVIDENCE=1. */
export async function saveEvidence(page: Page, name: string, fullPage = true) {
  if (process.env.E2E_EVIDENCE !== "1") return;
  const dir = join("test-results", "evidencias");
  mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: join(dir, `${name}.png`), fullPage });
}

/** Confirma na janela do painel, já aberta pelo clique de quem chama. */
export async function acceptConfirmation(page: Page, label: string) {
  await page.locator("dialog[open]").getByRole("button", { name: label, exact: true }).click();
}

export const panelMenu = (page: Page) => page.getByRole("navigation", { name: "Módulos do painel" });

/** Corrige a corrida com a hidratação: antes dela o clique no botão não abre nada, então repete. */
export async function openMenu(page: Page) {
  await expect(async () => {
    await page.getByRole("button", { name: "Abrir menu" }).click({ timeout: 2_000 });
    await expect(panelMenu(page)).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
}
