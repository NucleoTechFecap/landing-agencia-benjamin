/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : sobre.ts
 Descrição    : Campos editáveis da página Sobre.

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

export const SOBRE = definePage({
  label: "Sobre",
  kind: "rota",
  path: "/sobre",
  seo: {
    title: "Sobre a Benjamin",
    description:
      "Conheça a Agência Benjamin, agência experimental de comunicação da FECAP: proposta de valor, modelo de atuação e relação com a FECAP.",
    keywords: ["sobre a Agência Benjamin", "agência experimental FECAP", "agência de comunicação universitária"],
  },
  sections: {
    abertura: {
      label: "Abertura",
      fields: {
        fundo: tone("Cor de fundo", "verde"),
        etiqueta: optionalText("Etiqueta acima do título", "Sobre a Benjamin", { max: 80 }),
        titulo: { ...text("Título", "", { max: 160 }), fromSettings: (settings) => settings.about.title },
        descricao: {
          ...longText("Descrição", "", { rows: 4 }),
          fromSettings: (settings) => settings.about.intro,
        },
        trilha: text("Nome da página na trilha", "Sobre", { max: 60 }),
        icone: icon("Ícone", "hermes", "lima"),
      },
    },
    pilares: {
      label: "Como a Benjamin funciona",
      hideable: true,
      fields: {
        fundo: tone("Cor de fundo", "nyanza"),
        etiqueta: optionalText("Etiqueta", "Agência experimental", { max: 80 }),
        titulo: text("Título", "Como a Benjamin funciona"),
        pilar1: text("Pilar 1: título", "Proposta de valor", { max: 80 }),
        pilar1Texto: {
          ...longText("Pilar 1: texto", "", { rows: 4 }),
          fromSettings: (settings) => settings.about.valueProposition,
        },
        pilar1Icone: icon("Pilar 1: ícone", "estrela", "lima"),
        pilar2: text("Pilar 2: título", "Modelo de atuação", { max: 80 }),
        pilar2Texto: {
          ...longText("Pilar 2: texto", "", { rows: 4 }),
          fromSettings: (settings) => settings.about.howWeWork,
        },
        pilar2Icone: icon("Pilar 2: ícone", "seta-curva", "laranja"),
        pilar3: text("Pilar 3: título", "Dentro da FECAP", { max: 80 }),
        pilar3Texto: {
          ...longText("Pilar 3: texto", "", { rows: 4 }),
          fromSettings: (settings) => settings.about.fecapRelation,
        },
        pilar3Icone: icon("Pilar 3: ícone", "chapeu", "azul"),
      },
    },
    areas: {
      label: "Áreas",
      hideable: true,
      hint: "Os nomes das áreas vêm de Áreas de atuação, no menu. Sem áreas publicadas, a seção não aparece.",
      fields: {
        fundo: tone("Cor de fundo", "claro"),
        etiqueta: optionalText("Etiqueta", "Estrutura", { max: 80 }),
        titulo: text("Título", "Seis áreas que trabalham juntas"),
        descricao: optionalText(
          "Descrição",
          "Cada área tem especialistas próprios e se combina com as demais conforme o projeto.",
          { rows: 2, max: 300 },
        ),
      },
    },
    fechamento: {
      label: "Faixa final",
      hideable: true,
      fields: {
        titulo: text("Título", "Quer construir algo com a gente?"),
        texto: longText(
          "Texto",
          "Seja um projeto para sua marca ou vontade de fazer parte da Benjamin, a conversa começa por aqui.",
          { max: 300 },
        ),
        botao1: link("Botão principal", { label: "Quero um projeto", href: "/contato#formulario" }),
        botao2: link("Botão secundário", {
          label: "Quero fazer parte",
          href: "/contato?assunto=fazer-parte#formulario",
        }),
      },
    },
  },
});
