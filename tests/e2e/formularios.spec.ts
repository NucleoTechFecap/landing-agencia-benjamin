/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : formularios.spec.ts
 Descrição    : E2E dos formulários públicos: envio sem JavaScript, falhas, validação e privacidade.

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

import { randomInt, randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

/*
 * Os envios contam para o limite real de 5 por IP em 10 min (TECH-07), que o teste não afrouxa: cada
 * teste se apresenta com um IP próprio. Em `next start` o cabeçalho enviado pelo navegador é o que vale;
 * na Vercel (E2E_BASE_URL) a borda o substitui, e aí o limite é compartilhado com quem rodar ao mesmo tempo.
 */
test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.${randomInt(256)}.${randomInt(1, 255)}` });
});

const CONSENT_ERROR = "É preciso declarar ciência do aviso de privacidade.";

/** Texto único: o mesmo conteúdo em 10 min voltaria como duplicado do envio de outro teste. */
const uniqueText = (label: string) => `${label} para o teste automatizado ${randomUUID()}.`;

async function fillContact(page: Page, message: string) {
  await page.getByLabel(/^Nome/).fill("Pessoa de Teste E2E");
  await page.getByLabel(/^E-mail/).fill("teste.e2e@exemplo.com");
  await page.getByLabel(/^Assunto/).selectOption("duvida");
  await page.getByLabel(/^Mensagem/).fill(message);
}

async function fillLead(page: Page, description: string) {
  await page.getByLabel(/^Nome/).fill("Pessoa de Teste E2E");
  await page.getByLabel(/^E-mail/).fill("teste.e2e@exemplo.com");
  await page.getByLabel(/Conte sobre o projeto/).fill(description);
}

async function fillFeedback(page: Page, message: string) {
  await page.getByText("Aluno(a)", { exact: true }).click();
  await page.getByLabel(/^Seu feedback/).fill(message);
}

test.describe("FORM-08 · sem JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("feedback válido mostra confirmação e protocolo", async ({ page }) => {
    await page.goto("/feedback");
    await fillFeedback(page, uniqueText("Feedback sem JavaScript"));
    await page.getByLabel(/aviso de privacidade/).check();
    await page.getByRole("button", { name: "Enviar feedback" }).click();

    await expect(page.getByRole("status").filter({ hasText: "Obrigado pelo feedback!" })).toBeVisible();
    await expect(page.getByText(/AB-[0-9A-F]{6}/)).toBeVisible();
  });

  test("feedback inválido destaca o campo e devolve o que foi digitado", async ({ page }) => {
    await page.goto("/feedback");
    await fillFeedback(page, "curto");
    await page.getByLabel(/^Nome/).fill("Pessoa de Teste");
    await page.getByRole("button", { name: "Enviar feedback" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "Revise os campos destacados." })).toBeVisible();
    await expect(page.getByText("Escreva seu feedback (mín. 10 caracteres).")).toBeVisible();
    await expect(page.getByText(CONSENT_ERROR)).toBeVisible();
    await expect(page.getByLabel(/^Seu feedback/)).toHaveValue("curto");
    await expect(page.getByLabel(/^Nome/)).toHaveValue("Pessoa de Teste");
    await expect(page.getByLabel(/^Seu feedback/)).toHaveAttribute("aria-invalid", "true");
  });

  test("honeypot preenchido segue recusado em silêncio", async ({ page }) => {
    await page.goto("/feedback");
    await fillFeedback(page, uniqueText("Feedback de robô"));
    await page.getByLabel(/aviso de privacidade/).check();
    await page.locator("#website").fill("https://spam.example", { force: true });
    await page.getByRole("button", { name: "Enviar feedback" }).click();

    await expect(page.getByRole("status").filter({ hasText: "Obrigado pelo feedback!" })).toBeVisible();
  });

  test("/contato leva ao formulário de novo projeto, que envia e confirma", async ({ page }) => {
    await page.goto("/contato");
    await expect(page.getByText("Carregando formulário…")).toBeHidden();
    await page.locator('a[href="/contato/projeto"]').click();
    await expect(page).toHaveURL(/\/contato\/projeto$/);

    await fillLead(page, uniqueText("Pedido de projeto sem JavaScript"));
    await page.getByLabel(/aviso de privacidade/).check();
    await page.getByRole("button", { name: "Enviar pedido" }).click();

    await expect(page.getByRole("status").filter({ hasText: "Pedido recebido!" })).toBeVisible();
    await expect(page.getByText(/AB-[0-9A-F]{6}/)).toBeVisible();
  });

  test("/contato leva ao formulário de contato, que valida no servidor e confirma", async ({ page }) => {
    await page.goto("/contato?tipo=contato");
    await page.locator('a[href="/contato/mensagem"]').click();
    await expect(page).toHaveURL(/\/contato\/mensagem$/);

    const message = uniqueText("Mensagem sem JavaScript");
    await fillContact(page, message);
    await page.getByLabel(/^E-mail/).fill("email-invalido");
    await page.getByLabel(/aviso de privacidade/).check();
    await page.getByRole("button", { name: "Enviar mensagem" }).click();
    await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();
    await expect(page.getByLabel(/^Mensagem/)).toHaveValue(message);

    await page.getByLabel(/^E-mail/).fill("teste.e2e@exemplo.com");
    await page.getByLabel(/aviso de privacidade/).check();
    await page.getByRole("button", { name: "Enviar mensagem" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Mensagem enviada!" })).toBeVisible();
  });

  test("depois de confirmar, 'Enviar outra mensagem' abre um formulário novo", async ({ page }) => {
    await page.goto("/feedback");
    await fillFeedback(page, uniqueText("Feedback que será seguido de outro"));
    await page.getByLabel(/aviso de privacidade/).check();
    await page.getByRole("button", { name: "Enviar feedback" }).click();
    await page.getByRole("link", { name: "Enviar outra mensagem" }).click();

    await expect(page.getByRole("button", { name: "Enviar feedback" })).toBeVisible();
    await expect(page.getByLabel(/^Seu feedback/)).toHaveValue("");
  });
});

test.describe("FORM-08 · envio antes da hidratação", () => {
  const bundles = /\/_next\/static\/.*\.js/;

  test("/contato: o resultado aparece e a página hidrata sem erro", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.route(bundles, (route) => route.abort());
    await page.goto("/contato");

    await fillLead(page, uniqueText("Pedido antes da hidratação"));
    await page.getByLabel(/aviso de privacidade/).check();
    await page.unroute(bundles);
    await page.getByRole("button", { name: "Enviar pedido" }).click();

    await expect(page.getByRole("status").filter({ hasText: "Pedido recebido!" })).toBeVisible();
    await expect(page.getByText(/AB-[0-9A-F]{6}/)).toBeVisible();
    await page.getByRole("link", { name: "Enviar outra mensagem" }).click();
    await expect(page.getByRole("button", { name: "Enviar pedido" })).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test("/feedback: erro de validação aparece com foco no campo e sem perder o texto", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.route(bundles, (route) => route.abort());
    await page.goto("/feedback");

    await fillFeedback(page, "curto");
    await page.unroute(bundles);
    await page.getByRole("button", { name: "Enviar feedback" }).click();

    await expect(page.getByText("Escreva seu feedback (mín. 10 caracteres).")).toBeVisible();
    await expect(page.getByLabel(/^Seu feedback/)).toHaveValue("curto");
    await expect(page.locator('input[name="submissionId"]')).not.toHaveValue("");
    await expect(page.getByLabel(/^Seu feedback/)).toBeFocused();
    expect(pageErrors).toEqual([]);
  });
});
