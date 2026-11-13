/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : forms-sql.test.ts
 Descrição    : Garante que as restrições de form_submissions aceitam tudo o que a aplicação grava.

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 09/11/2026
 Modificado em: 09/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 09/11/2026 Vinicius Binda           Criação inicial (DB-06).
──────────────────────────────────────────────────────────────────────────────
*/

import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from "@/lib/domain/content/slug";
import { protocolFromId, routeSubmission } from "@/lib/domain/forms/routing";
import {
  CONTACT_SUBJECTS,
  FEEDBACK_PROFILES,
  SUBMISSION_KINDS,
  parseSubmission,
  technicalFieldsSchema,
  type SubmissionInput,
  type SubmissionKind,
} from "@/lib/domain/forms/schemas";

/*
 * O banco é a segunda barreira e nunca pode ser mais rígido que a validação: um envio aceito pela aplicação
 * e recusado pelo banco vira erro para o visitante, e o pedido se perde (migration 20261109000100, DB-06).
 * Mudou protocolo, categoria, origem ou limite num lado só? Este teste falha.
 */
const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

const sql = readdirSync(MIGRATIONS)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(join(MIGRATIONS, file), "utf8"))
  .join("\n");

const quoted = (list: string) => [...list.matchAll(/'([^']+)'/g)].map(([, value]) => value);

/** Expressão regular de `<coluna> ~ '...'` dentro da restrição. As usadas aqui valem igual em JS e no Postgres. */
function checkRegex(constraint: string, column: string): RegExp {
  const source = sql.match(new RegExp(`add constraint ${constraint}\\s+check \\([\\s\\S]*?${column} ~ '([^']+)'`))?.[1];
  expect(source, `${constraint}: ${column} ~ '...'`).toBeDefined();
  return new RegExp(source!);
}

/** Número em `<expressão> <= N` dentro da restrição. */
function checkLimit(constraint: string, expression: string): number {
  const escaped = expression.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const limit = sql.match(new RegExp(`add constraint ${constraint}\\s+check \\([\\s\\S]*?${escaped} <= (\\d+)`))?.[1];
  expect(limit, `${constraint}: ${expression} <= N`).toBeDefined();
  return Number(limit);
}

const technical = () => ({ submissionId: randomUUID(), privacyConsent: "on" });

function parsed(kind: SubmissionKind, raw: Record<string, unknown>): SubmissionInput {
  const result = parseSubmission(kind, { ...technical(), ...raw });
  if (!result.success) throw new Error(`${kind} inválido no teste: ${JSON.stringify(result.fieldErrors)}`);
  return result.value;
}

const person = { name: "Pessoa Teste", email: "pessoa@empresa.test" };
const description = "Campanha de lançamento com vídeo institucional.";

describe("consistência formulários código × banco (DB-06)", () => {
  it("o check de kind tem os mesmos tipos de SUBMISSION_KINDS", () => {
    const kinds = sql.match(/kind text not null check \(kind in \(([^)]+)\)\)/)?.[1] ?? "";
    expect(quoted(kinds)).toEqual([...SUBMISSION_KINDS]);
  });

  it("todo protocolo de protocolFromId passa em form_submissions_protocol_format", () => {
    const format = checkRegex("form_submissions_protocol_format", "protocol");
    for (let index = 0; index < 200; index += 1) {
      const id = randomUUID();
      expect(protocolFromId(id)).toMatch(format);
      expect(protocolFromId(id.toUpperCase())).toMatch(format);
    }
  });

  it("toda categoria de routeSubmission passa em form_submissions_category_format, com o prefixo do tipo", () => {
    const format = checkRegex("form_submissions_category_format", "category");
    expect(`^${format.source.split(":")[1]}`).toBe(SLUG_PATTERN.source.replace("(?:", "("));
    expect(sql).toContain(`char_length(category) <= char_length(kind) + 1 + ${SLUG_MAX_LENGTH}`);

    const inputs: Array<[SubmissionInput, boolean]> = [
      [parsed("lead", { ...person, projectDescription: description }), true],
      [parsed("lead", { ...person, projectDescription: description, serviceInterest: "a" }), true],
      [
        parsed("lead", { ...person, projectDescription: description, serviceInterest: "x".repeat(SLUG_MAX_LENGTH) }),
        true,
      ],
      // Serviço que não está na lista do site vira `lead:nao-sei`.
      [parsed("lead", { ...person, projectDescription: description, serviceInterest: "fora-do-site" }), false],
      ...Object.keys(CONTACT_SUBJECTS).map(
        (subject) =>
          [parsed("contact", { ...person, subject, message: description }), true] as [SubmissionInput, boolean],
      ),
      ...Object.keys(FEEDBACK_PROFILES).map(
        (profile) => [parsed("feedback", { profile, message: description }), true] as [SubmissionInput, boolean],
      ),
    ];
    for (const [input, serviceExists] of inputs) {
      const { category } = routeSubmission(input, serviceExists);
      expect(category).toMatch(format);
      expect(category.split(":")[0]).toBe(input.kind);
      expect(category.length).toBeLessThanOrEqual(input.kind.length + 1 + SLUG_MAX_LENGTH);
    }
  });

  it("a origem que technicalFieldsSchema aceita é a que form_submissions_source_path_format aceita", () => {
    const format = checkRegex("form_submissions_source_path_format", "source_path");
    const limit = checkLimit("form_submissions_source_path_format", "char_length(source_path)");
    const samples = [
      "/",
      "/contato",
      "/contato?tipo=projeto#formulario",
      "//evil.com",
      "/servicos/produção",
      `/${"a".repeat(199)}`,
      `/${"a".repeat(200)}`,
      "contato",
      "/contato x",
      "/contato\ttab",
    ];
    for (const sample of samples) {
      const app = technicalFieldsSchema.shape.sourcePath.safeParse(sample).success;
      const db = format.test(sample) && [...sample].length <= limit;
      expect(db, sample).toBe(app);
    }
  });

  it("o teto do conteúdo cobre com folga o maior envio que a validação aceita", () => {
    const limit = checkLimit("form_submissions_payload_size", "octet_length(payload::text)");
    // Caractere de controle é o que o JSON mais aumenta: vira 6 bytes (\u0001).
    const worst = "\u0001";
    const largest = [
      parsed("lead", {
        name: "名".repeat(120),
        email: `${"a".repeat(254 - "@empresa.test".length)}@empresa.test`,
        phone: "5511912345678",
        company: "名".repeat(120),
        serviceInterest: "x".repeat(SLUG_MAX_LENGTH),
        projectDescription: `Projeto ${worst.repeat(2992)}`,
        sourcePath: `/${"a".repeat(199)}`,
      }),
      parsed("contact", { ...person, subject: "outro", message: worst.repeat(3000) }),
      parsed("feedback", { profile: "outro", message: worst.repeat(2000), name: "名".repeat(120) }),
    ];
    for (const input of largest) {
      // Com os campos técnicos, que nem vão para o banco: a conta fica do lado seguro.
      expect(Buffer.byteLength(JSON.stringify(input.data))).toBeLessThan(limit / 2);
    }
  });

  it("o erro de notificação gravado cabe em form_submissions_notification_error_length", () => {
    const limit = checkLimit("form_submissions_notification_error_length", "char_length(last_notification_error)");
    const service = readFileSync(join(process.cwd(), "lib", "server", "forms", "submission-service.ts"), "utf8");
    expect(service).toContain(`error.message.slice(0, ${limit})`);
    expect("Sem destinatário configurado.".length).toBeLessThanOrEqual(limit);
  });
});
