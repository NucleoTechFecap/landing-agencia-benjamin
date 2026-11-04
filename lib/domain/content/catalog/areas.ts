/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : areas.ts
 Descrição    : Campos editáveis da página Áreas de atuação.

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

import { icon, link, optionalText, text, tone } from "../fields";
import { definePage } from "./define";

export const AREAS = definePage({
  label: "Áreas de atuação",
  kind: "rota",
  path: "/areas",
  seo: {
    title: "Áreas de atuação",
    description:
      "Eventos e Parcerias, Social Media, Comunicação Interna, Copywriting, Criação e Assessoria de Imprensa: as seis áreas da Agência Benjamin.",
    keywords: [
      "áreas de atuação",
      "social media",
      "copywriting",
      "criação",
      "assessoria de imprensa",
      "eventos e parcerias",
      "comunicação interna",
    ],
  },
  sections: {
    abertura: {
      label: "Abertura",
      fields: {
        fundo: tone("Cor de fundo", "verde"),
        etiqueta: optionalText("Etiqueta acima do título", "Áreas de atuação", { max: 80 }),
        titulo: text("Título", "Seis frentes de comunicação, um só time"),
        descricao: optionalText("Descrição", "Conheça o que cada área da Benjamin faz e quais serviços nascem dela.", {
          rows: 2,
          max: 300,
        }),
        trilha: text("Nome da página na trilha", "Áreas de atuação", { max: 60 }),
        icone: icon("Ícone", "estrela", "lima"),
      },
    },
    lista: {
      label: "Áreas",
      hint: "Nome, descrição e destaques de cada área vêm de Áreas de atuação, no menu. A cor de cada faixa é fixa.",
      fields: {
        numero: text("Número da área", "Área {numero}", {
          max: 40,
          hint: "{numero} vira a posição da área na lista: 01, 02, 03…",
        }),
        servicos: text("Título dos serviços da área", "Serviços desta área", { max: 80 }),
        vazio: text("Mensagem sem áreas publicadas", "As áreas de atuação estão sendo atualizadas. Volte em breve!", {
          max: 200,
        }),
      },
    },
    fechamento: {
      label: "Faixa final",
      hideable: true,
      hint: "O título e o texto da faixa ficam em Menu, rodapé e textos gerais.",
      fields: {
        botao1: link("Botão principal", { label: "Ver todos os serviços", href: "/servicos" }),
        botao2: link("Botão secundário", { label: "Fale com a gente", href: "/contato#formulario" }),
      },
    },
  },
});
