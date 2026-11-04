/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : json-ld.test.ts
 Descrição    : Texto vindo do CMS não fecha a tag do JSON-LD nem abre script novo.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (SEG-05).
──────────────────────────────────────────────────────────────────────────────
*/

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { seedSnapshot } from "@/content";
import { serviceSchema } from "@/lib/domain/seo/structured-data";
import { JsonLd } from "./json-ld";

const ATTACK = '</script><script>alert("xss")</script><!-- ';

const render = (data: Record<string, unknown>) => renderToStaticMarkup(createElement(JsonLd, { data }));
const payloadOf = (markup: string) =>
  markup.replace(/^<script type="application\/ld\+json">/, "").replace(/<\/script>$/, "");

describe("JsonLd (SEG-05)", () => {
  it("</script> em nome de serviço sai escapado: um único script, sem nenhum < no conteúdo", () => {
    const service = { ...seedSnapshot.services[0], name: ATTACK };
    const markup = render(serviceSchema(service, [], "https://www.exemplo.com.br"));

    expect(markup.match(/<script/g)).toHaveLength(1);
    expect(markup.match(/<\/script>/g)).toHaveLength(1);
    expect(payloadOf(markup)).not.toContain("<");
    expect(payloadOf(markup)).toContain("\\u003c/script>");
  });

  it("o escape não muda o dado: quem lê o JSON recebe o texto original", () => {
    const markup = render({ name: ATTACK, acentos: "Comunicação & mídia" });
    expect(JSON.parse(payloadOf(markup))).toEqual({ name: ATTACK, acentos: "Comunicação & mídia" });
  });
});
