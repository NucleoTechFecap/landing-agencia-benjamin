/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : jornada-visitante.spec.ts
 Descrição    : E2E das jornadas do visitante (positivos e negativos) e do painel protegido.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-12).
──────────────────────────────────────────────────────────────────────────────
*/

import { expect, test } from "@playwright/test";

/**
 * J1 — Navegação → serviço → case → contato → envio (TECH-12).
 * Sem Supabase (desenvolvimento) o envio usa o armazenamento em memória e a
 * notificação em log; em homologação o mesmo teste roda com E2E_BASE_URL.
 */
test.describe("J1 · visitante encontra um serviço, vê um case e pede um projeto", () => {
  test("fluxo positivo completo", async ({ page, isMobile }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    if (isMobile) {
      await page.getByRole("button", { name: "Abrir menu" }).click();
      await page.getByRole("navigation", { name: "Menu principal" }).getByRole("link", { name: "Serviços" }).click();
    } else {
      await page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Serviços" }).click();
    }
    await expect(page).toHaveURL(/\/servicos$/);

    await page.getByRole("link", { name: "Copywriting", exact: true }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Copywriting" })).toBeVisible();

    await page.getByRole("link", { name: /Conteúdo para o blog Aventura de Construir/ }).click();
    await expect(page).toHaveURL(/\/cases\/aventura-de-construir$/);
    await page.goBack();

    await page.getByRole("link", { name: "Quero este serviço" }).first().click();
    await expect(page).toHaveURL(/\/contato\?servico=copywriting/);
    await expect(page.getByLabel(/Serviço de interesse/)).toHaveValue("copywriting");

    // Aguarda a hidratação (identificador de envio) e o tempo mínimo antirrobô.
    await expect(page.locator('input[name="submissionId"]')).not.toHaveValue("");
    await page.waitForTimeout(3_100);
    await page.getByLabel(/^Nome/).fill("Pessoa de Teste E2E");
    await page.getByLabel(/^E-mail/).fill("teste.e2e@exemplo.com");
    await page.getByLabel(/Conte sobre o projeto/).fill("Queremos uma série de artigos para o blog da empresa em 2027.");
    await page.getByLabel(/aviso de privacidade/).check();
    await page.getByRole("button", { name: "Enviar pedido" }).click();

    await expect(page.getByRole("status").filter({ hasText: "Pedido recebido!" })).toBeVisible();
    await expect(page.getByText(/AB-[0-9A-F]{6}/)).toBeVisible();
  });

  test("negativo: campos inválidos mostram erros e focam o primeiro campo", async ({ page }) => {
    await page.goto("/contato");
    await expect(page.locator('input[name="submissionId"]')).not.toHaveValue("");
    await page.getByLabel(/^E-mail/).fill("email-invalido");
    await page.getByRole("button", { name: "Enviar pedido" }).click();
    await expect(page.getByText("Revise os campos destacados.")).toBeVisible();
    await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();
    await expect(page.getByLabel(/^Nome/)).toBeFocused();
  });

  test("negativo: case inexistente responde 404", async ({ page }) => {
    const response = await page.goto("/cases/case-que-nao-existe");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /Essa pauta não saiu do briefing/ })).toBeVisible();
  });
});

test.describe("J2/J3 · painel protegido", () => {
  test("negativo: painel sem sessão redireciona ao login preservando o destino", async ({ page }) => {
    await page.goto("/admin/cases");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fcases/);
    await expect(page.getByRole("heading", { name: "Painel da Benjamin" })).toBeVisible();
  });
});
