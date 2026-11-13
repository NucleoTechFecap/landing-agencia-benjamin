/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : servicos.ts
 Descrição    : Campos editáveis da página Serviços, com as etapas de trabalho.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import { icon, link, list, longText, optionalText, text, tone } from "../fields";
import { definePage } from "./define";

export const SERVICOS = definePage({
  label: "Serviços",
  kind: "rota",
  path: "/servicos",
  seo: {
    title: "Serviços",
    description:
      "Estratégia digital, social media, eventos, produção de conteúdo, copywriting, design e identidade visual, audiovisual, assessoria de imprensa e comunicação interna.",
    keywords: [
      "serviços de comunicação",
      "agência de comunicação",
      "estratégia digital",
      "social media",
      "audiovisual",
    ],
  },
  sections: {
    abertura: {
      label: "Abertura",
      fields: {
        fundo: tone("Cor de fundo", "verde"),
        etiqueta: optionalText("Etiqueta acima do título", "Serviços", { max: 80 }),
        titulo: text("Título", "Comunicação completa, feita por quem está chegando com tudo"),
        descricao: text("Descrição", "{total} serviços que se combinam conforme o objetivo do seu projeto.", {
          max: 300,
          hint: "{total} vira a quantidade de serviços publicados.",
        }),
        descricaoVazia: text("Descrição sem serviços publicados", "Nossa lista de serviços está sendo atualizada.", {
          max: 300,
        }),
        trilha: text("Nome da página na trilha", "Serviços", { max: 60 }),
        icone: icon("Ícone", "megafone", "lima"),
      },
    },
    lista: {
      label: "Lista de serviços",
      hint: "Os serviços vêm de Serviços, no menu.",
      fields: {
        fundo: tone("Cor de fundo", "nyanza"),
        vazio: text(
          "Mensagem sem serviços publicados",
          "Os serviços estão sendo atualizados. Enquanto isso, a equipe responde pelo formulário de contato.",
          { max: 200 },
        ),
        vazioLink: link("Link da mensagem sem serviços", {
          label: "Conte o que você precisa",
          href: "/contato#formulario",
        }),
      },
    },
    processo: {
      label: "Como trabalhamos",
      hideable: true,
      fields: {
        fundo: tone("Cor de fundo", "azul"),
        etiqueta: optionalText("Etiqueta", "Como trabalhamos", { max: 80 }),
        titulo: text("Título", "Do briefing à entrega"),
        etapas: list(
          "Etapas",
          {
            icone: icon("Ícone", "estrela", "azul"),
            titulo: text("Título", "", { max: 80 }),
            texto: longText("Texto", "", { rows: 2, max: 300 }),
          },
          [
            {
              icone: { name: "comentario", color: "azul" },
              titulo: "Briefing",
              texto: "Entendemos o objetivo, o público e o contexto da sua marca.",
            },
            {
              icone: { name: "calendario", color: "azul" },
              titulo: "Planejamento",
              texto: "Definimos estratégia, cronograma e as áreas envolvidas.",
            },
            {
              icone: { name: "raio", color: "azul" },
              titulo: "Produção",
              texto: "Criamos e executamos com validação em cada etapa.",
            },
            {
              icone: { name: "enviado", color: "azul" },
              titulo: "Entrega",
              texto: "Publicamos, acompanhamos e apresentamos os resultados.",
            },
          ],
          { itemLabel: "Etapa", minItems: 1, maxItems: 8 },
        ),
      },
    },
    fechamento: {
      label: "Faixa final",
      hideable: true,
      fields: {
        titulo: text("Título", "Não sabe qual serviço escolher?"),
        texto: longText(
          "Texto",
          "Conte o seu desafio. A equipe indica a combinação certa de áreas para o seu projeto.",
          { max: 300 },
        ),
        botao1: link("Botão principal", { label: "Conversar sobre meu projeto", href: "/contato#formulario" }),
        botao2: link("Botão secundário", { label: "Ver cases", href: "/cases" }),
      },
    },
  },
});
