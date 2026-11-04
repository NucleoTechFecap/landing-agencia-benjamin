/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : inbox.test.ts
 Descrição    : Regras de permissão, filtros, paginação e exibição dos envios no painel.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (FORM-09).
 04/11/2026 Vinícius Nishimura Reis  Situação da notificação e filtro (INT-07).
──────────────────────────────────────────────────────────────────────────────
*/

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { NOTIFICATION_RETRY } from "./idempotency";
import {
  INBOX_PAGE_SIZE,
  NOTIFICATION_STATUSES,
  SUBMISSION_RESOURCE,
  SUBMISSION_STATUSES,
  categoryLabel,
  categoryOptions,
  describeNotification,
  inboxHref,
  isSubmissionId,
  kindsAllowed,
  pageRange,
  parseInboxQuery,
  presentPayload,
  statusOptions,
  totalPages,
} from "./inbox";
import { routeSubmission } from "./routing";
import { SUBMISSION_KINDS, type SubmissionInput } from "./schemas";

const ALL = SUBMISSION_KINDS;
const parse = (raw: Record<string, string | string[] | undefined>) => parseInboxQuery(raw, ALL);

describe("permissão por tipo", () => {
  it("só o admin vê envios (N05, N08)", () => {
    expect(kindsAllowed("admin", "view")).toEqual(["lead", "contact", "feedback"]);
    for (const role of ["super_admin", "editor", "viewer", "pending", null, undefined] as const) {
      expect(kindsAllowed(role, "view")).toEqual([]);
      expect(kindsAllowed(role, "edit")).toEqual([]);
    }
  });

  it("usa o mesmo recurso que o roteamento e a RLS", () => {
    const inputs = [
      { kind: "lead", data: { serviceInterest: "video" } },
      { kind: "contact", data: { subject: "imprensa" } },
      { kind: "feedback", data: { profile: "aluno", allowContact: false } },
    ] as unknown as SubmissionInput[];
    for (const input of inputs) {
      expect(SUBMISSION_RESOURCE[input.kind]).toBe(routeSubmission(input).viewResource);
    }
  });
});

describe("parseInboxQuery", () => {
  it("sem parâmetros: primeira página e sem filtro", () => {
    expect(parse({})).toEqual({ page: 1 });
  });

  it("aceita os filtros válidos", () => {
    expect(parse({ pagina: "3", tipo: "contact", status: "respondido", categoria: "contact:imprensa" })).toEqual({
      page: 3,
      kind: "contact",
      status: "respondido",
      category: "contact:imprensa",
    });
  });

  it.each(["-1", "0", "abc", "1.5", "1e3", " 2", "9999999", "", "2;drop table", "NaN"])(
    "página malformada %j volta para a primeira",
    (pagina) => {
      expect(parse({ pagina }).page).toBe(1);
    },
  );

  it.each(["orcamento", "LEAD", "lead,feedback", "in.(lead)", "", "constructor"])(
    "tipo fora da lista %j é ignorado",
    (tipo) => {
      expect(parse({ tipo }).kind).toBeUndefined();
    },
  );

  it.each(["aprovado", "NOVO", "eq.novo", "", "__proto__"])("status fora da lista %j é ignorado", (status) => {
    expect(parse({ status }).status).toBeUndefined();
  });

  it.each([
    "fulano@empresa.com",
    "lead",
    "lead:",
    ":audiovisual",
    "orcamento:x",
    "lead:Audiovisual",
    "lead:a b",
    "lead:a,kind.eq.feedback",
    "lead:a)",
    `lead:${"a".repeat(100)}`,
  ])("categoria fora do padrão %j é ignorada", (categoria) => {
    expect(parse({ categoria }).category).toBeUndefined();
  });

  it("aceita a situação da notificação só de lista fechada", () => {
    expect(parse({ notificacao: "failed" }).notification).toBe("failed");
    for (const notificacao of ["falhou", "FAILED", "eq.failed", ""]) {
      expect(parse({ notificacao }).notification).toBeUndefined();
    }
  });

  it("categoria de outro tipo não combina com o tipo escolhido", () => {
    expect(parse({ tipo: "lead", categoria: "contact:imprensa" })).toEqual({ page: 1, kind: "lead" });
  });

  it("valor repetido na URL: vale o primeiro, se for válido", () => {
    expect(parse({ tipo: ["lead", "feedback"] }).kind).toBe("lead");
    expect(parse({ pagina: ["x", "2"] }).page).toBe(1);
  });

  it("não aceita tipo nem categoria que o papel não vê", () => {
    const onlyFeedback = parseInboxQuery({ tipo: "lead", categoria: "contact:imprensa" }, ["feedback"]);
    expect(onlyFeedback).toEqual({ page: 1 });
    expect(parseInboxQuery({ tipo: "feedback", categoria: "feedback:aluno" }, ["feedback"])).toEqual({
      page: 1,
      kind: "feedback",
      category: "feedback:aluno",
    });
  });
});

describe("paginação", () => {
  it("calcula o intervalo com as duas pontas inclusivas", () => {
    expect(pageRange(1)).toEqual({ from: 0, to: INBOX_PAGE_SIZE - 1 });
    expect(pageRange(3)).toEqual({ from: 2 * INBOX_PAGE_SIZE, to: 3 * INBOX_PAGE_SIZE - 1 });
  });

  it("conta as páginas, com ao menos uma", () => {
    expect(totalPages(0)).toBe(1);
    expect(totalPages(INBOX_PAGE_SIZE)).toBe(1);
    expect(totalPages(INBOX_PAGE_SIZE + 1)).toBe(2);
  });

  it("monta o link só com o que foi filtrado", () => {
    expect(inboxHref({})).toBe("/admin/leads");
    expect(inboxHref({ page: 1, kind: "lead" })).toBe("/admin/leads?tipo=lead");
    expect(inboxHref({ page: 2, status: "novo", category: "contact:imprensa" })).toBe(
      "/admin/leads?status=novo&categoria=contact%3Aimprensa&pagina=2",
    );
    expect(inboxHref({ notification: "failed" })).toBe("/admin/leads?notificacao=failed");
  });
});

describe("status por tipo", () => {
  it("lead e contato seguem um fluxo, feedback outro (TECH-06 §7)", () => {
    expect(statusOptions("lead")).toEqual(["novo", "em_atendimento", "respondido", "arquivado"]);
    expect(statusOptions("contact")).toEqual(["novo", "em_atendimento", "respondido", "arquivado"]);
    expect(statusOptions("feedback")).toEqual(["novo", "lido", "arquivado"]);
  });

  it("mantém o status atual visível mesmo fora do fluxo do tipo", () => {
    expect(statusOptions("feedback", "respondido")).toEqual(["respondido", "novo", "lido", "arquivado"]);
    expect(statusOptions("lead", "novo")).toEqual(["novo", "em_atendimento", "respondido", "arquivado"]);
  });

  it("a lista é a mesma do check da migration", () => {
    const sql = readFileSync("supabase/migrations/20261013000400_form_submissions.sql", "utf8");
    const check = /check \(status in \(([^)]+)\)\)/.exec(sql)?.[1] ?? "";
    expect(check.split(",").map((value) => value.trim().replaceAll("'", ""))).toEqual([...SUBMISSION_STATUSES]);
  });
});

describe("situação da notificação (INT-07)", () => {
  it("a lista é a mesma do check da migration", () => {
    const sql = readFileSync("supabase/migrations/20261013000400_form_submissions.sql", "utf8");
    const check = /check \(notification_status in \(([^)]+)\)\)/.exec(sql)?.[1] ?? "";
    expect(
      check
        .split(",")
        .map((value) => value.trim().replaceAll("'", ""))
        .sort(),
    ).toEqual([...NOTIFICATION_STATUSES].sort());
  });

  it("diz que o contato não chegou por e-mail quando falhou ou não tem destinatário", () => {
    expect(describeNotification("failed", 1)).toContain("não chegou");
    expect(describeNotification("failed", 1)).toContain("reenvio automático tenta de novo");
    expect(describeNotification("skipped", 0)).toContain("nenhum e-mail foi enviado");
  });

  it("avisa quando as tentativas acabaram", () => {
    const text = describeNotification("failed", NOTIFICATION_RETRY.maxAttempts);
    expect(text).toContain("não há novo reenvio automático");
    expect(text).toContain("NúcleoTech");
  });

  it("não promete entrega além do que o provedor aceitou", () => {
    expect(describeNotification("sent", 1)).toContain("aceito pelo provedor");
  });
});

describe("identificador do envio", () => {
  it("aceita só UUID no formato canônico", () => {
    expect(isSubmissionId("00000000-0000-4000-8000-000000000601")).toBe(true);
    for (const value of ["1", "not-a-uuid", "", "00000000-0000-4000-8000-000000000601;", null, 1, undefined]) {
      expect(isSubmissionId(value)).toBe(false);
    }
  });
});

describe("categorias", () => {
  const services = [{ slug: "audiovisual", name: "Audiovisual" }];

  it("oferece as categorias só dos tipos permitidos", () => {
    const groups = categoryOptions(["lead", "feedback"], services);
    expect(groups.map((group) => group.kind)).toEqual(["lead", "feedback"]);
    expect(groups[0].options).toEqual([
      { value: "lead:nao-sei", label: "Ainda não sabe" },
      { value: "lead:audiovisual", label: "Audiovisual" },
    ]);
    expect(groups[1].options).toContainEqual({ value: "feedback:aluno", label: "Aluno(a)" });
  });

  it("toda opção oferecida passa pela validação do filtro", () => {
    for (const group of categoryOptions(ALL, services)) {
      for (const option of group.options) {
        expect(parse({ categoria: option.value }).category).toBe(option.value);
      }
    }
  });

  it("mostra o rótulo e não quebra com valor desconhecido", () => {
    expect(categoryLabel("lead:audiovisual", services)).toBe("Audiovisual");
    expect(categoryLabel("lead:nao-sei")).toBe("Ainda não sabe");
    expect(categoryLabel("lead:servico-antigo", services)).toBe("servico-antigo");
    expect(categoryLabel("contact:imprensa")).toBe("Imprensa");
    expect(categoryLabel("feedback:aluno")).toBe("Aluno(a)");
    expect(categoryLabel("contact:constructor")).toBe("constructor");
    expect(categoryLabel("sem-separador")).toBe("sem-separador");
  });
});

describe("presentPayload", () => {
  it("ordena os campos conhecidos e traduz os valores", () => {
    const fields = presentPayload({
      message: "Olá",
      rating: 4,
      profile: "aluno",
      name: "Pessoa",
      allowContact: false,
      privacyConsent: true,
    });
    expect(fields).toEqual([
      { label: "Nome", value: "Pessoa" },
      { label: "Perfil", value: "Aluno(a)" },
      { label: "Nota", value: "4 de 5" },
      { label: "Mensagem", value: "Olá" },
      { label: "Deseja retorno", value: "Não" },
      { label: "Ciência do aviso de privacidade", value: "Sim" },
    ]);
  });

  it("traduz o assunto do contato e mantém assunto desconhecido como texto", () => {
    expect(presentPayload({ subject: "imprensa" })).toEqual([{ label: "Assunto", value: "Imprensa" }]);
    expect(presentPayload({ subject: "constructor" })).toEqual([{ label: "Assunto", value: "constructor" }]);
  });

  it("mantém campo desconhecido visível, como texto", () => {
    expect(presentPayload({ extra: { a: 1 }, outro: "x" })).toEqual([
      { label: "extra", value: '{"a":1}' },
      { label: "outro", value: "x" },
    ]);
  });

  it("não usa chave herdada como rótulo", () => {
    const payload = JSON.parse('{"constructor":"a","__proto__":"b","toString":"c"}');
    expect(presentPayload(payload)).toEqual([
      { label: "constructor", value: "a" },
      { label: "__proto__", value: "b" },
      { label: "toString", value: "c" },
    ]);
  });

  it("omite campo vazio e aceita conteúdo que não é objeto", () => {
    expect(presentPayload({ name: null, email: "", phone: undefined })).toEqual([]);
    for (const payload of [null, "texto", 1, ["a"], undefined]) expect(presentPayload(payload)).toEqual([]);
  });

  it("devolve o texto como foi enviado: quem escapa é a tela", () => {
    const html = '<img src=x onerror="alert(1)">';
    expect(presentPayload({ message: html })).toEqual([{ label: "Mensagem", value: html }]);
  });
});
