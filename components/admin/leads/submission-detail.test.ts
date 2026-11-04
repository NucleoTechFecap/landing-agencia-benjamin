/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : submission-detail.test.ts
 Descrição    : O envio aberto no painel é só texto: sem HTML interpretado e sem link vindo do visitante.

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

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SubmissionDetail } from "@/lib/domain/forms/inbox";
import { NotificationPanel, SubmissionContent, SubmissionRecordPanel } from "./submission-detail";

const record: SubmissionDetail = {
  id: "00000000-0000-4000-8000-000000000601",
  protocol: "AB-000000",
  kind: "contact",
  category: "contact:imprensa",
  name: "Pessoa Fictícia",
  status: "novo",
  notificationStatus: "sent",
  notificationAttempts: 1,
  createdAt: "2026-11-04T10:00:00Z",
  updatedAt: "2026-11-04T10:00:00Z",
  sourcePath: "/contato",
  payload: { name: "Pessoa Fictícia", email: "pessoa@exemplo.test", message: "Olá" },
};

const content = (payload: unknown) =>
  renderToStaticMarkup(createElement(SubmissionContent, { record: { ...record, payload } }));
const panel = (sourcePath: string | null) =>
  renderToStaticMarkup(createElement(SubmissionRecordPanel, { record: { ...record, sourcePath }, services: [] }));

describe("SubmissionContent", () => {
  it("mostra rótulo e valor de cada campo", () => {
    const markup = content(record.payload);
    expect(markup).toContain("Pessoa Fictícia");
    expect(markup).toContain("pessoa@exemplo.test");
    expect(markup).toContain("Mensagem");
  });

  it.each([
    '<img src=x onerror="alert(1)">',
    "<script>alert(1)</script>",
    '"><svg onload=alert(1)>',
    "javascript:alert(1)",
  ])("não interpreta como HTML: %s", (attack) => {
    const markup = content({ message: attack, name: attack });
    expect(markup).not.toMatch(/<img|<script|<svg/);
    expect(markup).not.toContain("<a ");
  });

  it("e-mail e endereço enviados nunca viram link", () => {
    const markup = content({ email: "pessoa@exemplo.test", message: "Veja https://evil.example" });
    expect(markup).not.toContain("<a ");
    expect(markup).not.toContain("href");
  });

  it("escapa também a chave de campo desconhecido", () => {
    const markup = content({ "<b>chave</b>": "valor" });
    expect(markup).not.toContain("<b>");
    expect(markup).toContain("&lt;b&gt;chave&lt;/b&gt;");
  });

  it("explica quando o conteúdo não é legível", () => {
    expect(content(null)).toContain("não tem conteúdo legível");
  });
});

describe("SubmissionRecordPanel", () => {
  it.each(["//evil.com", "/\\evil.com", "/contato?x=<script>", "javascript:alert(1)"])(
    "página de origem %s é só texto, nunca link",
    (sourcePath) => {
      const markup = panel(sourcePath);
      expect(markup).not.toContain("<a ");
      expect(markup).not.toContain("href");
      expect(markup).not.toContain("<script");
    },
  );

  it("mostra a origem como foi recebida", () => {
    expect(panel("//evil.com")).toContain("//evil.com");
    expect(panel(null)).toContain("—");
  });

  it("mostra o protocolo", () => {
    expect(panel("/contato")).toContain("AB-000000");
  });
});

describe("NotificationPanel (INT-07)", () => {
  const notification = (notificationStatus: SubmissionDetail["notificationStatus"], notificationAttempts = 1) =>
    renderToStaticMarkup(
      createElement(NotificationPanel, { record: { ...record, notificationStatus, notificationAttempts } }),
    );

  it.each([
    ["sent", "Enviada"],
    ["pending", "Pendente"],
    ["failed", "Falhou"],
    ["skipped", "Sem destinatário"],
  ] as const)("%s aparece como %s, em texto", (status, label) => {
    expect(notification(status)).toContain(label);
  });

  it("deixa claro quando o contato não chegou por e-mail", () => {
    expect(notification("failed", 5)).toContain("não há novo reenvio automático");
  });
});
