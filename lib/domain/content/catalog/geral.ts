/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : geral.ts
 Descrição    : Campos que aparecem em todo o site: menu, rodapé, faixa final e mensagens gerais.

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
 04/11/2026 Vinícius Nishimura Reis  Textos e imagens editáveis no painel (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import { MAIN_NAVIGATION, SECONDARY_NAVIGATION } from "@/lib/config/navigation";
import { icon, image, link, list, longText, optionalText, text, tone } from "../fields";
import { definePage } from "./define";

const menuItem = {
  label: text("Texto do link", "", { max: 40 }),
  href: text("Destino", "", { max: 200, format: "href", hint: "Uma página do site (ex.: /contato) ou um link https." }),
};

export const GERAL = definePage({
  label: "Menu, rodapé e textos gerais",
  description: "O que aparece em todas as páginas: menu, botão do cabeçalho, rodapé, faixa final e mensagens do site.",
  kind: "geral",
  path: null,
  sections: {
    cabecalho: {
      label: "Cabeçalho",
      fields: {
        cta: link("Botão do cabeçalho", { label: "Fale com a gente", href: "/contato" }),
        menu: list("Menu principal", menuItem, MAIN_NAVIGATION, {
          itemLabel: "Link",
          minItems: 1,
          maxItems: 9,
          hint: "Para uma página nova aparecer no menu, acrescente uma linha com o endereço dela.",
        }),
        menuSecundario: list("Links secundários (menu do celular e rodapé)", menuItem, SECONDARY_NAVIGATION, {
          itemLabel: "Link",
          maxItems: 6,
        }),
      },
    },
    rodape: {
      label: "Rodapé",
      fields: {
        navegue: text("Título da coluna de navegação", "Navegue", { max: 40 }),
        contato: text("Título da coluna de contato", "Contato", { max: 40 }),
        chamada: link("Link da coluna de contato", { label: "Envie uma mensagem", href: "/contato" }),
        direitos: text("Linha de direitos", "© {ano} Agência Benjamin · Agência experimental da FECAP.", {
          hint: "{ano} vira o ano atual.",
        }),
        credito: text("Crédito", "Plataforma desenvolvida pelo", { max: 80 }),
        creditoLink: link("Link do crédito", {
          label: "NúcleoTech FECAP",
          href: "https://www.instagram.com/nucleotechfecap",
        }),
      },
    },
    fechamento: {
      label: "Faixa final",
      hint: "Título e texto usados nas páginas que não definem os próprios.",
      fields: {
        titulo: text("Título", "Tem um projeto em mente?"),
        texto: longText("Texto", "Conte o que você precisa. A equipe da Benjamin responde pelo e-mail informado.", {
          max: 300,
        }),
        sticker: image("Sticker", { src: "/brand/stickers/benja-verde.svg", alt: "" }),
      },
    },
    mensagens: {
      label: "Mensagens do site",
      fields: {
        inicio: text("Nome da página inicial na trilha", "Início", { max: 40 }),
        pular: text("Link de pular para o conteúdo", "Pular para o conteúdo", { max: 60 }),
        saibaMais: text("Chamada dos cartões de serviço", "Saiba mais", { max: 40 }),
        verCase: text("Chamada dos cartões de case", "Ver case", { max: 40 }),
        faixa: text("Palavras da faixa da marca", "estratégia · conteúdo · criação · eventos · imprensa", {
          hint: "Aparecem depois do slogan, na faixa da abertura e na tela de carregamento.",
        }),
      },
    },
    naoEncontrado: {
      label: "Página não encontrada (404)",
      fields: {
        fundo: tone("Cor de fundo", "lima"),
        icone: icon("Ícone", "seta-curva", "verde"),
        etiqueta: optionalText("Etiqueta acima do título", "Erro 404", { max: 40 }),
        titulo: text("Título", "Essa pauta não saiu do briefing."),
        texto: longText(
          "Texto",
          "A página que você procurou não existe ou foi retirada do ar. Que tal seguir por um destes caminhos?",
          { max: 300 },
        ),
        botoes: list(
          "Botões",
          { botao: link("Botão", { label: "", href: "" }) },
          [
            { botao: { label: "Voltar ao início", href: "/" } },
            { botao: { label: "Ver serviços", href: "/servicos" } },
            { botao: { label: "Ver cases", href: "/cases" } },
          ],
          { itemLabel: "Botão", minItems: 1, maxItems: 4, hint: "O primeiro botão aparece com mais destaque." },
        ),
      },
    },
  },
});
