/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : home.ts
 Descrição    : Campos editáveis da Home.

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

import { icon, image, lines, link, longText, optionalText, text, tone } from "../fields";
import { definePage } from "./define";

export const HOME = definePage({
  label: "Home",
  kind: "rota",
  path: "/",
  seo: {
    title: "Agência Benjamin — agência experimental de comunicação da FECAP",
    // A descrição padrão é a da configuração institucional: quem lê é a própria rota.
    description: "",
    keywords: ["agência experimental de comunicação", "Agência Benjamin FECAP"],
    absoluteTitle: true,
  },
  sections: {
    abertura: {
      label: "Abertura",
      fields: {
        etiqueta: optionalText("Etiqueta acima do título", "Agência experimental da FECAP", { max: 80 }),
        titulo: { ...text("Título", "", { max: 160 }), fromSettings: (settings) => settings.manifesto.title },
        paragrafos: lines("Parágrafos", [], {
          max: 600,
          maxItems: 6,
          hint: "Um parágrafo por linha.",
          fromSettings: (settings) => settings.manifesto.paragraphs,
        }),
        sticker1: image("Sticker do alto", { src: "/brand/stickers/poupa-meu-tempo-laranja.svg", alt: "" }),
        sticker2: image("Sticker de baixo", { src: "/brand/stickers/ta-no-briefing-rosa.svg", alt: "" }),
      },
    },
    quemSomos: {
      label: "Quem é a Benjamin",
      hideable: true,
      fields: {
        etiqueta: optionalText("Etiqueta", "Quem é a Benjamin", { max: 80 }),
        titulo: { ...text("Título", "", { max: 160 }), fromSettings: (settings) => settings.about.title },
        botao: link("Botão", { label: "Conheça a agência", href: "/sobre" }),
        topico1: text("Tópico 1: título", "Quem somos", { max: 80 }),
        topico1Texto: {
          ...longText("Tópico 1: texto", "", { rows: 4 }),
          fromSettings: (settings) => settings.about.intro,
        },
        topico1Icone: icon("Tópico 1: ícone", "hermes", "lima"),
        topico2: text("Tópico 2: título", "Nossa proposta", { max: 80 }),
        topico2Texto: {
          ...longText("Tópico 2: texto", "", { rows: 4 }),
          fromSettings: (settings) => settings.about.valueProposition,
        },
        topico2Icone: icon("Tópico 2: ícone", "estrela", "lima"),
        topico3: text("Tópico 3: título", "Como atuamos", { max: 80 }),
        topico3Texto: {
          ...longText("Tópico 3: texto", "", { rows: 4 }),
          fromSettings: (settings) => settings.about.howWeWork,
        },
        topico3Icone: icon("Tópico 3: ícone", "seta-curva", "lima"),
        topico4: text("Tópico 4: título", "O que entregamos", { max: 80 }),
        topico4Icone: icon("Tópico 4: ícone", "raio", "lima"),
      },
    },
    areas: {
      label: "Áreas de atuação",
      hideable: true,
      hint: "Os nomes das áreas vêm de Áreas de atuação, no menu.",
      fields: {
        fundo: tone("Cor de fundo", "lima"),
        etiqueta: optionalText("Etiqueta", "Áreas de atuação", { max: 80 }),
        titulo: text("Título", "Seis frentes, um mesmo time."),
        descricao: optionalText("Descrição", "Cada projeto combina as áreas certas para o objetivo da sua marca.", {
          rows: 2,
          max: 300,
        }),
        vazio: text("Mensagem sem áreas publicadas", "As áreas de atuação estão sendo atualizadas. Volte em breve!", {
          max: 200,
        }),
      },
    },
    servicos: {
      label: "Serviços",
      hideable: true,
      hint: "Os serviços vêm de Serviços, no menu: aqui entram os marcados como destaque.",
      fields: {
        fundo: tone("Cor de fundo", "nyanza"),
        etiqueta: optionalText("Etiqueta", "Serviços", { max: 80 }),
        titulo: text("Título", "O que a Benjamin faz pela sua marca"),
        descricao: optionalText("Descrição", "Do planejamento à entrega, com acompanhamento em cada etapa.", {
          rows: 2,
          max: 300,
        }),
        botao: link("Botão", { label: "Ver todos os serviços", href: "/servicos" }),
        vazio: text(
          "Mensagem sem serviços em destaque",
          "Os serviços em destaque estão sendo atualizados. Volte em breve!",
          { max: 200 },
        ),
      },
    },
    cases: {
      label: "Cases",
      hideable: true,
      hint: "Os cases vêm de Cases, no menu: aqui entram os marcados como destaque.",
      fields: {
        fundo: tone("Cor de fundo", "verde"),
        etiqueta: optionalText("Etiqueta", "Cases", { max: 80 }),
        titulo: text("Título", "Trabalhos que saíram do briefing"),
        descricao: optionalText("Descrição", "Projetos reais desenvolvidos pela Agência Benjamin.", {
          rows: 2,
          max: 300,
        }),
        botao: link("Botão", { label: "Ver portfólio completo", href: "/cases" }),
        vazio: text("Mensagem sem cases em destaque", "Os primeiros cases estão sendo preparados. Volte em breve!", {
          max: 200,
        }),
      },
    },
  },
});
