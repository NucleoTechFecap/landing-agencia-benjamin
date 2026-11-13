/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : contato.ts
 Descrição    : Campos editáveis da página Contato, com os canais institucionais.

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

export const CONTATO = definePage({
  label: "Contato",
  kind: "rota",
  path: "/contato",
  seo: {
    title: "Contato",
    description:
      "Peça um projeto ou fale com a Agência Benjamin: formulário de novos projetos e contato institucional.",
    keywords: ["contato Agência Benjamin", "orçamento de comunicação", "contratar agência de comunicação"],
  },
  sections: {
    abertura: {
      label: "Abertura",
      fields: {
        fundo: tone("Cor de fundo", "verde"),
        etiqueta: optionalText("Etiqueta acima do título", "Contato", { max: 80 }),
        titulo: text("Título", "Vamos conversar?"),
        descricao: optionalText(
          "Descrição",
          "Conte sobre o seu projeto ou mande sua mensagem. A equipe da Benjamin responde pelo e-mail informado.",
          { rows: 2, max: 300 },
        ),
        trilha: text("Nome da página na trilha", "Contato", { max: 60 }),
        icone: icon("Ícone", "comentario", "lima"),
      },
    },
    canais: {
      label: "Outros canais",
      hideable: true,
      hint: "Endereço, e-mail, telefone e redes sociais vêm das configurações do site. Bloco sem nada preenchido não aparece.",
      fields: {
        icone: icon("Ícone", "enviado", "verde"),
        onde: text("Título do endereço e contatos", "Onde estamos", { max: 80 }),
        redes: text("Título das redes sociais", "Redes sociais", { max: 80 }),
        feedback: text("Convite para o feedback", "É cliente, parceiro ou aluno e quer contar como foi?", { max: 200 }),
        feedbackLink: link("Link do convite para o feedback", { label: "Deixe seu feedback", href: "/feedback" }),
      },
    },
    formulario: {
      label: "Formulários",
      hint: "Campos, botões e mensagens dos formulários ficam em Textos dos formulários.",
      fields: {
        abaProjeto: text("Aba de novo projeto", "Quero um projeto", { max: 40 }),
        abaContato: text("Aba de contato", "Fale com a gente", { max: 40 }),
        carregando: text("Mensagem enquanto carrega", "Carregando formulário…", { max: 80 }),
        semScript: text("Chamada para quem navega sem JavaScript", "Escolha o que você quer enviar:", {
          max: 120,
          hint: "Aparece acima de dois botões com os mesmos nomes das abas.",
        }),
      },
    },
  },
});
