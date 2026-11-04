/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : acesso-helpers.ts
 Descrição    : Requisição crua, corpo de Server Action e sessão real para os testes de acesso indevido.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (QA-06).
──────────────────────────────────────────────────────────────────────────────
*/

import { readFileSync } from "node:fs";
import { request as httpRequest, type IncomingHttpHeaders } from "node:http";
import { createServerClient } from "@supabase/ssr";
import { request as apiRequest, type APIRequestContext } from "@playwright/test";
import { SUPABASE_URL, type Account } from "./painel-helpers";

/** Chave pública do build: é com ela que qualquer visitante fala com o Supabase. */
export const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export interface RawResponse {
  status: number;
  headers: IncomingHttpHeaders;
  body: string;
}

/** `fetch` e o Playwright normalizam `..` e `%2e` antes de enviar: aqui o caminho vai como foi escrito. */
export function rawRequest(
  baseURL: string,
  path: string,
  options: { method?: string; headers?: Record<string, string>; body?: string } = {},
): Promise<RawResponse> {
  const { hostname, port } = new URL(baseURL);
  return new Promise((resolve, reject) => {
    const outgoing = httpRequest(
      { hostname, port, path, method: options.method ?? "GET", headers: options.headers, timeout: 30_000 },
      (incoming) => {
        const chunks: Buffer[] = [];
        incoming.on("data", (chunk: Buffer) => chunks.push(chunk));
        incoming.on("end", () =>
          resolve({
            status: incoming.statusCode ?? 0,
            headers: incoming.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );
    outgoing.on("timeout", () => outgoing.destroy(new Error(`Sem resposta: ${path}`)));
    outgoing.on("error", reject);
    outgoing.end(options.body);
  });
}

/** Id do Next e nome da função: o manifesto do build é a única lista completa de Server Actions. */
export function panelActionsFromBuild(): Map<string, string> {
  const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as {
    node: Record<string, { exportedName: string; filename: string }>;
  };
  return new Map(
    Object.entries(manifest.node)
      .filter(([, action]) => action.filename.startsWith("app/admin/"))
      .map(([id, action]) => [action.exportedName, id]),
  );
}

export type Fields = Record<string, string | string[]>;

/** Como o navegador monta (capturado na tela): os campos vêm antes da raiz, que os referencia em `$K1`. */
export function actionBody(fields: Fields, withState = true) {
  const form = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    for (const item of [value].flat()) form.append(`_1_${name}`, item);
  }
  form.append("0", JSON.stringify(withState ? [{ status: "idle" }, "$K1"] : ["$K1"]));
  return form;
}

/** Corpo do envio sem JavaScript, com o estado anterior: não passa pelo cabeçalho `Next-Action`. */
export function noScriptBody(actionId: string, fields: Fields) {
  const form = new FormData();
  form.append("$ACTION_REF_1", "");
  form.append("$ACTION_1:0", JSON.stringify({ id: actionId, bound: "$@1" }));
  form.append("$ACTION_1:1", JSON.stringify([null]));
  for (const [name, value] of Object.entries(fields)) {
    for (const item of [value].flat()) form.append(name, item);
  }
  return form;
}

const browserCookie = (name: string, value: string, httpOnly: boolean) => ({
  name,
  value,
  domain: "localhost",
  path: "/",
  expires: -1,
  httpOnly,
  secure: false,
  sameSite: "Lax" as const,
});

/** Sessão real no Auth, sem passar pela tela: é o que um atacante faria com a própria conta. */
export async function sessionCookies(account: Account) {
  const jar = new Map<string, string>();
  const auth = createServerClient(SUPABASE_URL!, ANON_KEY!, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => cookies.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const { error } = await auth.auth.signInWithPassword({ email: account.email, password: account.password });
  if (error) throw error;
  return [...jar].map(([name, value]) => browserCookie(name, value, true));
}

/** Contexto de requisições com a sessão da conta; `extra` são cookies que o próprio cliente forjou. */
export async function newSession(
  baseURL: string,
  account: Account,
  extra: { name: string; value: string }[] = [],
): Promise<APIRequestContext> {
  return apiRequest.newContext({
    baseURL,
    storageState: {
      cookies: [
        ...(await sessionCookies(account)),
        ...extra.map(({ name, value }) => browserCookie(name, value, false)),
      ],
      origins: [],
    },
  });
}

/** Token de acesso dentro do cookie de sessão do `@supabase/ssr`. */
export function sessionFromCookie(value: string) {
  return JSON.parse(Buffer.from(value.replace(/^base64-/, ""), "base64url").toString("utf8")) as {
    access_token: string;
    refresh_token: string;
  };
}

export const encodeSessionCookie = (session: object) =>
  `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
