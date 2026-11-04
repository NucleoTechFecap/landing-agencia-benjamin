/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : modelo-servico.ts
 Descrição    : Textos fixos de toda página de detalhe de serviço.

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

import { icon, link, longText, optionalText, text, tone } from "../fields";
import { definePage } from "./define";

export const MODELO_SERVICO = definePage({
  label: "Modelo da página de serviço",
  description:
    "Os textos que se repetem em todo serviço. Nome, resumo e entregas de cada um ficam em Serviços, no menu.",
  kind: "modelo",
  path: null,
  sections: {
    abertura: {
      label: "Abertura",
      fields: {
        etiqueta: optionalText("Etiqueta acima do título", "Serviço", { max: 80 }),
        trilha: link("Link de Serviços na trilha", { label: "Serviços", href: "/servicos" }),
        botao: text("Texto do botão", "Quero este serviço", {
          max: 60,
          hint: "O botão leva ao formulário de contato com este serviço já escolhido.",
        }),
      },
    },
    descricao: {
      label: "Como funciona",
      fields: {
        titulo: text("Título", "Como funciona"),
        exemplos: text("Título das entregas", "O que pode entrar no projeto"),
        exemplosIcone: icon("Ícone das entregas", "estrela", "lima"),
        areas: text("Título das áreas", "Áreas envolvidas", { max: 80 }),
      },
    },
    cases: {
      label: "Cases do serviço",
      hideable: true,
      hint: "Os cases vêm de Cases, no menu.",
      fields: {
        fundo: tone("Cor de fundo", "verde"),
        etiqueta: optionalText("Etiqueta", "Na prática", { max: 80 }),
        titulo: text("Título", "Cases com {servico}", { hint: "{servico} vira o nome do serviço." }),
        vazio: text("Mensagem sem cases", "Os cases deste serviço estão sendo preparados.", { max: 200 }),
        vazioLink: link("Link da mensagem sem cases", { label: "Ver todo o portfólio", href: "/cases" }),
      },
    },
    outros: {
      label: "Outros serviços",
      hideable: true,
      fields: {
        titulo: text("Título", "Outros serviços"),
      },
    },
    fechamento: {
      label: "Faixa final",
      hideable: true,
      fields: {
        titulo: text("Título", "Vamos conversar sobre {servico}?", {
          hint: "{servico} vira o nome do serviço, em letras minúsculas.",
        }),
        texto: longText("Texto", "Conte o que você precisa. A equipe da Benjamin responde pelo e-mail informado.", {
          max: 300,
        }),
        botao1: text("Texto do botão principal", "Quero este serviço", {
          max: 60,
          hint: "O botão leva ao formulário de contato com este serviço já escolhido.",
        }),
        botao2: link("Botão secundário", { label: "Ver todos os serviços", href: "/servicos" }),
      },
    },
  },
});
