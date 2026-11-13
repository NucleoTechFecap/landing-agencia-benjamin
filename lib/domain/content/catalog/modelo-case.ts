/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : modelo-case.ts
 Descrição    : Textos fixos de toda página de detalhe de case.

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

import { icon, link, text, tone } from "../fields";
import { definePage } from "./define";

export const MODELO_CASE = definePage({
  label: "Modelo da página de case",
  description: "Os textos que se repetem em todo case. Título, história e galeria de cada um ficam em Cases, no menu.",
  kind: "modelo",
  path: null,
  sections: {
    abertura: {
      label: "Abertura",
      fields: {
        fundo: tone("Cor de fundo", "azul"),
        trilha: link("Link de Cases na trilha", { label: "Cases", href: "/cases" }),
      },
    },
    historia: {
      label: "História do projeto",
      fields: {
        desafio: text("Título do desafio", "Desafio", { max: 80 }),
        desafioIcone: icon("Ícone do desafio", "interrogacao", "lima"),
        solucao: text("Título da solução", "Solução", { max: 80 }),
        solucaoIcone: icon("Ícone da solução", "raio", "lima"),
        resultados: text("Título dos resultados", "Resultados", { max: 80 }),
        resultadosIcone: icon("Ícone dos resultados", "estrela", "lima"),
        vazio: text(
          "Mensagem sem história preenchida",
          "Os detalhes deste case (desafio, solução e resultados) estão sendo preparados com o cliente.",
          { max: 200 },
        ),
      },
    },
    ficha: {
      label: "Ficha do projeto",
      fields: {
        cliente: text("Título do cliente", "Cliente", { max: 40 }),
        servicos: text("Título dos serviços", "Serviços", { max: 40 }),
        areas: text("Título das áreas", "Áreas", { max: 40 }),
        equipe: text("Título da equipe", "Equipe", { max: 40 }),
        publicado: text("Título dos links publicados", "Veja publicado", { max: 40 }),
      },
    },
    galeria: {
      label: "Galeria",
      hideable: true,
      fields: {
        titulo: text("Título", "Galeria"),
      },
    },
    relacionados: {
      label: "Mais cases",
      hideable: true,
      fields: {
        fundo: tone("Cor de fundo", "verde"),
        titulo: text("Título", "Mais cases de {categoria}", { hint: "{categoria} vira a categoria do case." }),
      },
    },
    fechamento: {
      label: "Faixa final",
      hideable: true,
      hint: "O título e o texto da faixa ficam em Menu, rodapé e textos gerais.",
      fields: {
        botao1: link("Botão principal", { label: "Quero um projeto assim", href: "/contato#formulario" }),
        botao2: link("Botão secundário", { label: "Ver todos os cases", href: "/cases" }),
      },
    },
  },
});
