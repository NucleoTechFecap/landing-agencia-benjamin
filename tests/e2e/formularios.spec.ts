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
 04/11/2026 Vinícius Nishimura Reis  Contato institucional: válido e inválido (FORM-04).
 04/11/2026 Vinícius Nishimura Reis  Duplo clique e novo envio depois da confirmação (FORM-08).
 04/11/2026 Vinícius Nishimura Reis  Feedback: anônimo, pedido de retorno e perfil (FORM-05).
 04/11/2026 Vinícius Nishimura Reis  Ciência do aviso de privacidade nos três formulários (SEG-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { randomInt, randomUUID } from "node:crypto";
import { expect, test, type Page, type Request, type Route } from "@playwright/test";

/*
 * Os envios contam para o limite real de 5 por IP em 10 min (TECH-07), que o teste não afrouxa: cada
 * teste se apresenta com um IP próprio. Em `next start` o cabeçalho enviado pelo navegador é o que vale;
 * na Vercel (E2E_BASE_URL) a borda o substitui, e aí o limite é compartilhado com quem rodar ao mesmo tempo.
 */
test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.${randomInt(256)}.${randomInt(1, 255)}` });
});

const NETWORK_WARNING = /Não conseguimos enviar agora/;
const CONSENT_ERROR = "É preciso declarar ciência do aviso de privacidade.";

/** Texto único: o mesmo conteúdo em 10 min voltaria como duplicado do envio de outro teste. */
const uniqueText = (label: string) => `${label} para o teste automatizado ${randomUUID()}.`;

/** Espera a hidratação e o tempo mínimo de preenchimento (abaixo dele o envio é tratado como robô). */
async function waitUntilHumanlyReady(page: Page) {
  await expect(page.locator('input[name="submissionId"]')).not.toHaveValue("");
  await page.waitForTimeout(3_100);
}

/** POSTs de Server Action feitos pelo formulário hidratado. */
function trackActionPosts(page: Page) {
  const posts: Request[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.headers()["next-action"]) posts.push(request);
  });
  return posts;
}

const isPost = (route: Route) => route.request().method() === "POST";
const protocolOf = (submissionId: string) => `AB-${submissionId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;

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

test.describe("FORM-08 · falha de rede no envio", () => {
  const contactRoute = (url: URL) => url.pathname === "/contato";

  async function openFilledContact(page: Page) {
    await page.goto("/contato?tipo=contato");
    await waitUntilHumanlyReady(page);
    const message = uniqueText("Mensagem de contato");
    await fillContact(page, message);
    await page.getByLabel(/aviso de privacidade/).check();
    return { message, submissionId: await page.locator('input[name="submissionId"]').inputValue() };
  }

  async function expectFormPreserved(page: Page, message: string) {
    await expect(page.getByRole("alert").filter({ hasText: NETWORK_WARNING })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Algo deu errado por aqui." })).toHaveCount(0);
    await expect(page.getByLabel(/^Nome/)).toHaveValue("Pessoa de Teste E2E");
    await expect(page.getByLabel(/^E-mail/)).toHaveValue("teste.e2e@exemplo.com");
    await expect(page.getByLabel(/^Assunto/)).toHaveValue("duvida");
    await expect(page.getByLabel(/^Mensagem/)).toHaveValue(message);
    await expect(page.getByLabel(/aviso de privacidade/)).toBeChecked();
  }

  test("conexão caiu: mostra o aviso, mantém o que foi digitado e o reenvio funciona", async ({ page }) => {
    const { message, submissionId } = await openFilledContact(page);
    await page.route(contactRoute, (route) => (isPost(route) ? route.abort("connectionfailed") : route.fallback()));

    await page.getByRole("button", { name: "Enviar mensagem" }).click();
    await expectFormPreserved(page, message);
    await expect(page.getByRole("alert").filter({ hasText: NETWORK_WARNING })).toBeFocused();
    await expect(page.getByText("Código de atendimento")).toHaveCount(0);

    await page.unroute(contactRoute);
    await page.getByRole("button", { name: "Enviar mensagem" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Mensagem enviada!" })).toBeVisible();
    await expect(page.getByText(protocolOf(submissionId))).toBeVisible();
  });

  test("resposta perdida depois de salvar: o reenvio não duplica e devolve o mesmo protocolo", async ({ page }) => {
    const { message, submissionId } = await openFilledContact(page);
    let saved = false;
    let retryBody = "";
    await page.route(contactRoute, async (route) => {
      if (!isPost(route)) return route.fallback();
      const response = await route.fetch();
      if (saved) {
        retryBody = await response.text();
        return route.fulfill({ response });
      }
      saved = response.ok();
      await route.abort("connectionreset");
    });

    await page.getByRole("button", { name: "Enviar mensagem" }).click();
    await expectFormPreserved(page, message);
    expect(saved).toBe(true);

    await page.getByRole("button", { name: "Enviar mensagem" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Mensagem enviada!" })).toBeVisible();
    await expect(page.getByText(protocolOf(submissionId))).toBeVisible();
    expect(retryBody).toContain('"duplicate":true');
  });

  test("resposta que não é da aplicação (erro 500 da plataforma): mesmo aviso, formulário de pé", async ({ page }) => {
    const { message } = await openFilledContact(page);
    await page.route(contactRoute, (route) =>
      isPost(route) ? route.fulfill({ status: 500, contentType: "text/html", body: "<h1>500</h1>" }) : route.fallback(),
    );

    await page.getByRole("button", { name: "Enviar mensagem" }).click();
    await expectFormPreserved(page, message);
  });
});

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

test.describe("FORM-04 · contato institucional", () => {
  test("válido mostra confirmação e protocolo", async ({ page }) => {
    await page.goto("/contato?tipo=contato");
    await waitUntilHumanlyReady(page);
    await fillContact(page, uniqueText("Mensagem de contato"));
    await page.getByLabel(/aviso de privacidade/).check();
    await page.getByRole("button", { name: "Enviar mensagem" }).click();

    await expect(page.getByRole("status").filter({ hasText: "Mensagem enviada!" })).toBeVisible();
    await expect(page.getByText(/AB-[0-9A-F]{6}/)).toBeVisible();
  });

  test("inválido mostra o erro no campo, com foco nele, sem ir ao servidor", async ({ page }) => {
    const posts = trackActionPosts(page);
    await page.goto("/contato?tipo=contato");
    await expect(page.locator('input[name="submissionId"]')).not.toHaveValue("");
    await page.getByLabel(/^Nome/).fill("Pessoa de Teste E2E");
    await page.getByLabel(/^E-mail/).fill("email-invalido");
    await page.getByRole("button", { name: "Enviar mensagem" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "Revise os campos destacados." })).toBeVisible();
    await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();
    await expect(page.getByText("Escolha o assunto.")).toBeVisible();
    await expect(page.getByLabel(/^E-mail/)).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel(/^E-mail/)).toBeFocused();
    await expect(page.getByLabel(/^Nome/)).toHaveValue("Pessoa de Teste E2E");
    expect(posts).toHaveLength(0);
  });
});

test.describe("FORM-08 · duplo envio", () => {
  test("duplo clique gera um único POST e um único protocolo", async ({ page }) => {
    const posts = trackActionPosts(page);
    await page.goto("/contato?tipo=contato");
    await waitUntilHumanlyReady(page);
    await fillContact(page, uniqueText("Mensagem de duplo clique"));
    await page.getByLabel(/aviso de privacidade/).check();
    const submissionId = await page.locator('input[name="submissionId"]').inputValue();
    // Resposta atrasada: o segundo clique acontece com o envio em andamento, como numa rede real.
    await page.route(
      (url) => url.pathname === "/contato",
      async (route) => {
        if (isPost(route)) await new Promise((resolve) => setTimeout(resolve, 500));
        await route.fallback();
      },
    );

    await page.getByRole("button", { name: "Enviar mensagem" }).dblclick();
    await expect(page.getByRole("button", { name: "Enviando…" })).toBeDisabled();

    await expect(page.getByRole("status").filter({ hasText: "Mensagem enviada!" })).toBeVisible();
    await expect(page.getByText(/AB-[0-9A-F]{6}/)).toHaveText(protocolOf(submissionId));
    expect(posts).toHaveLength(1);
  });

  test("'Enviar outra mensagem' abre um envio novo, com outro identificador", async ({ page }) => {
    await page.goto("/feedback");
    await waitUntilHumanlyReady(page);
    const firstId = await page.locator('input[name="submissionId"]').inputValue();
    await fillFeedback(page, uniqueText("Primeiro feedback"));
    await page.getByLabel(/aviso de privacidade/).check();
    await page.getByRole("button", { name: "Enviar feedback" }).click();
    await page.getByRole("link", { name: "Enviar outra mensagem" }).click();

    await expect(page.locator('input[name="submissionId"]')).not.toHaveValue("");
    await expect(page.locator('input[name="submissionId"]')).not.toHaveValue(firstId);
    await expect(page.getByLabel(/^Seu feedback/)).toHaveValue("");
  });
});

test.describe("FORM-05 · feedback", () => {
  test("anônimo válido mostra confirmação e protocolo", async ({ page }) => {
    await page.goto("/feedback");
    await waitUntilHumanlyReady(page);
    await fillFeedback(page, uniqueText("Feedback anônimo"));
    await page.getByLabel(/aviso de privacidade/).check();
    await page.getByRole("button", { name: "Enviar feedback" }).click();

    await expect(page.getByRole("status").filter({ hasText: "Obrigado pelo feedback!" })).toBeVisible();
    await expect(page.getByText(/AB-[0-9A-F]{6}/)).toBeVisible();
  });

  test("'quero retorno' sem e-mail dá erro no campo de e-mail, sem ir ao servidor", async ({ page }) => {
    const posts = trackActionPosts(page);
    await page.goto("/feedback");
    await expect(page.locator('input[name="submissionId"]')).not.toHaveValue("");
    await fillFeedback(page, uniqueText("Feedback com pedido de retorno"));
    await page.getByLabel(/Quero receber um retorno/).check();
    await page.getByLabel(/aviso de privacidade/).check();
    await page.getByRole("button", { name: "Enviar feedback" }).click();

    await expect(page.getByText("Informe o e-mail para que possamos responder.")).toBeVisible();
    await expect(page.getByLabel(/^E-mail/)).toBeFocused();
    await expect(page.getByLabel(/Quero receber um retorno/)).toBeChecked();
    expect(posts).toHaveLength(0);
  });

  test("sem perfil, o erro aparece e o foco vai para a primeira opção", async ({ page }) => {
    await page.goto("/feedback");
    await expect(page.locator('input[name="submissionId"]')).not.toHaveValue("");
    await page.getByLabel(/^Seu feedback/).fill(uniqueText("Feedback sem perfil"));
    await page.getByLabel(/aviso de privacidade/).check();
    await page.getByRole("button", { name: "Enviar feedback" }).click();

    await expect(page.getByText("Conte quem você é.")).toBeVisible();
    await expect(page.getByRole("radio", { name: "Cliente" })).toBeFocused();
  });
});

test.describe("SEG-03 · ciência do aviso de privacidade", () => {
  const forms = [
    { name: "novo projeto", path: "/contato", button: "Enviar pedido", fill: fillLead },
    { name: "contato", path: "/contato?tipo=contato", button: "Enviar mensagem", fill: fillContact },
    { name: "feedback", path: "/feedback", button: "Enviar feedback", fill: fillFeedback },
  ];

  for (const form of forms) {
    test(`${form.name}: o aviso está linkado, e sem a ciência nada é enviado`, async ({ page }) => {
      const posts = trackActionPosts(page);
      await page.goto(form.path);
      await expect(page.locator('input[name="submissionId"]')).not.toHaveValue("");

      const noticeLink = page.locator("form").getByRole("link", { name: /aviso de privacidade/ });
      await expect(noticeLink).toHaveAttribute("href", "/privacidade");
      await expect(noticeLink).toHaveAttribute("target", "_blank");

      await form.fill(page, uniqueText("Mensagem sem ciência do aviso"));
      await expect(page.getByLabel(/aviso de privacidade/)).not.toBeChecked();
      await page.getByRole("button", { name: form.button }).click();

      await expect(page.getByText(CONSENT_ERROR)).toBeVisible();
      await expect(page.getByLabel(/aviso de privacidade/)).toHaveAttribute("aria-invalid", "true");
      await expect(page.getByLabel(/aviso de privacidade/)).toBeFocused();
      expect(posts).toHaveLength(0);
    });
  }
});
