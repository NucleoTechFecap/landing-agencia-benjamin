/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : feedback.ts
 Descrição    : Campos editáveis da página de feedback.

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

import { icon, optionalText, text, tone } from "../fields";
import { definePage } from "./define";

export const FEEDBACK = definePage({
  label: "Feedback",
  description: "A abertura da página. Os textos do formulário ficam em Textos dos formulários.",
  kind: "rota",
  path: "/feedback",
  seo: {
    title: "Feedback",
    description: "Clientes, parceiros, alunos e comunidade: conte para a Agência Benjamin como foi a sua experiência.",
    keywords: ["feedback Agência Benjamin", "avaliação"],
  },
  sections: {
    abertura: {
      label: "Abertura",
      fields: {
        fundo: tone("Cor de fundo", "rosa"),
        etiqueta: optionalText("Etiqueta acima do título", "Feedback", { max: 80 }),
        titulo: text("Título", "Como foi com a Benjamin?"),
        descricao: optionalText(
          "Descrição",
          "Elogio, crítica ou sugestão: tudo ajuda a agência a melhorar. Você pode responder sem se identificar.",
          { rows: 2, max: 300 },
        ),
        trilha: text("Nome da página na trilha", "Feedback", { max: 60 }),
        icone: icon("Ícone", "like", "verde"),
      },
    },
  },
});
