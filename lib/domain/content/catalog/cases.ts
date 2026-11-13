/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : cases.ts
 Descrição    : Campos editáveis da página Cases, com os filtros do portfólio.

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

export const CASES = definePage({
  label: "Cases",
  kind: "rota",
  path: "/cases",
  seo: {
    title: "Cases e portfólio",
    description:
      "Portfólio da Agência Benjamin: cases de copywriting, social media & criação e assessoria de imprensa desenvolvidos para clientes reais.",
    keywords: ["portfólio", "cases de comunicação", "Aventura de Construir", "Meridiano", "FECAP"],
  },
  sections: {
    abertura: {
      label: "Abertura",
      fields: {
        fundo: tone("Cor de fundo", "verde"),
        etiqueta: optionalText("Etiqueta acima do título", "Portfólio", { max: 80 }),
        titulo: text("Título", "Cases e conteúdos"),
        descricao: optionalText(
          "Descrição",
          "Trabalhos desenvolvidos pela Agência Benjamin para clientes, parceiros e para a própria FECAP.",
          { rows: 2, max: 300 },
        ),
        trilha: text("Nome da página na trilha", "Cases", { max: 60 }),
        icone: icon("Ícone", "coracao", "rosa"),
      },
    },
    filtros: {
      label: "Filtros",
      hint: "As opções de cada filtro vêm dos cases, serviços e áreas publicados.",
      fields: {
        todos: text("Opção de todas as categorias", "Todos", { max: 40 }),
        servico: text("Nome do filtro de serviço", "Serviço", { max: 40 }),
        servicoTodos: text("Opção de todos os serviços", "Todos os serviços", { max: 60 }),
        area: text("Nome do filtro de área", "Área", { max: 40 }),
        areaTodas: text("Opção de todas as áreas", "Todas as áreas", { max: 60 }),
        cliente: text("Nome do filtro de cliente", "Cliente", { max: 40 }),
        clienteTodos: text("Opção de todos os clientes", "Todos os clientes", { max: 60 }),
        filtrar: text("Texto do botão", "Filtrar", { max: 40 }),
        limpar: text("Link de limpar os filtros", "Limpar filtros", { max: 60 }),
      },
    },
    lista: {
      label: "Lista de cases",
      hint: "Os cases vêm de Cases, no menu.",
      fields: {
        carregando: text("Mensagem enquanto carrega", "Carregando cases…", { max: 80 }),
        um: text("Resultado com um case", "1 case encontrado", { max: 80 }),
        varios: text("Resultado com vários cases", "{total} cases encontrados", {
          max: 80,
          hint: "{total} vira a quantidade de cases encontrados.",
        }),
        vazio: text("Mensagem sem cases publicados", "Os primeiros cases estão sendo preparados. Volte em breve!", {
          max: 200,
        }),
        vazioFiltro: text(
          "Mensagem sem cases nesses filtros",
          "Nenhum case com esses filtros por enquanto. Tente outra combinação.",
          { max: 200 },
        ),
        limpar: text("Link da mensagem sem cases nesses filtros", "Limpar filtros e ver todos os cases", { max: 60 }),
      },
    },
    fechamento: {
      label: "Faixa final",
      hideable: true,
      fields: {
        titulo: text("Título", "Seu projeto pode ser o próximo case."),
        texto: longText("Texto", "Conte o que você precisa. A equipe da Benjamin responde pelo e-mail informado.", {
          max: 300,
        }),
        botao1: link("Botão principal", { label: "Quero um projeto", href: "/contato#formulario" }),
        botao2: link("Botão secundário", { label: "Ver serviços", href: "/servicos" }),
      },
    },
  },
});
