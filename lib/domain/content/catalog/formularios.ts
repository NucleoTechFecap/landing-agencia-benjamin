/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : formularios.ts
 Descrição    : Textos dos formulários públicos e das páginas estáticas de envio sem JavaScript.

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

import { STANDALONE_FORM_PATHS } from "@/lib/config/navigation";
import { CONTACT_SUBJECTS, FEEDBACK_PROFILES } from "@/lib/domain/forms/schemas";
import { icon, link, optionalText, text } from "../fields";
import { definePage } from "./define";

export const FORMULARIOS = definePage({
  label: "Textos dos formulários",
  description:
    "Nomes dos campos, dicas, botões e mensagens de confirmação. As mensagens de erro de cada campo são fixas: acompanham as regras de validação.",
  kind: "geral",
  path: null,
  sections: {
    comum: {
      label: "Textos comuns",
      hint: "Valem para os três formulários.",
      fields: {
        selecione: text("Opção inicial das listas", "Selecione", { max: 40 }),
        opcional: text("Aviso de campo opcional", "(opcional)", { max: 40 }),
        consentimento: text("Texto de consentimento", "Li e estou ciente do", { max: 200 }),
        consentimentoLink: link("Link do consentimento", { label: "aviso de privacidade", href: "/privacidade" }),
        enviando: text("Botão durante o envio", "Enviando…", { max: 40 }),
        revise: text("Aviso de campos com erro", "Revise os campos destacados.", { max: 120 }),
        codigo: text("Código de atendimento", "Código de atendimento:", { max: 60 }),
        protocolo: text(
          "Confirmação do protocolo",
          "Protocolo {protocolo}. Guarde este número caso precise falar com a gente sobre esta mensagem.",
          { max: 300, hint: "{protocolo} vira o número gerado para o envio." },
        ),
        enviarOutra: text("Link de enviar outra mensagem", "Enviar outra mensagem", { max: 60 }),
      },
    },
    projeto: {
      label: "Formulário de novo projeto",
      fields: {
        nome: text("Campo nome", "Nome", { max: 60 }),
        email: text("Campo e-mail", "E-mail", { max: 60 }),
        telefone: text("Campo telefone", "Telefone / WhatsApp", { max: 60 }),
        telefoneDica: optionalText("Dica do telefone", "Com DDD. Ex.: (11) 91234-5678", { max: 120 }),
        empresa: text("Campo empresa", "Empresa ou organização", { max: 60 }),
        servico: text("Campo serviço", "Serviço de interesse", { max: 60 }),
        servicoNaoSei: text("Opção de quem não sabe o serviço", "Ainda não sei — quero uma indicação", {
          max: 80,
          hint: "As demais opções são os serviços publicados.",
        }),
        descricao: text("Campo descrição", "Conte sobre o projeto", { max: 60 }),
        descricaoDica: optionalText(
          "Dica da descrição",
          "Objetivo, público, prazo desejado e o que mais for importante.",
          { max: 200 },
        ),
        botao: text("Texto do botão", "Enviar pedido", { max: 40 }),
        sucesso: text("Mensagem de sucesso", "Pedido recebido!", { max: 80 }),
      },
    },
    contato: {
      label: "Formulário de contato",
      fields: {
        nome: text("Campo nome", "Nome", { max: 60 }),
        email: text("Campo e-mail", "E-mail", { max: 60 }),
        telefone: text("Campo telefone", "Telefone", { max: 60 }),
        telefoneDica: optionalText("Dica do telefone", "Com DDD.", { max: 120 }),
        assunto: text("Campo assunto", "Assunto", { max: 60 }),
        assuntoParceria: text("Assunto: parcerias", CONTACT_SUBJECTS.parceria, { max: 80 }),
        assuntoImprensa: text("Assunto: imprensa", CONTACT_SUBJECTS.imprensa, { max: 80 }),
        assuntoFazerParte: text("Assunto: fazer parte", CONTACT_SUBJECTS["fazer-parte"], { max: 80 }),
        assuntoDuvida: text("Assunto: dúvidas", CONTACT_SUBJECTS.duvida, { max: 80 }),
        assuntoOutro: text("Assunto: outro", CONTACT_SUBJECTS.outro, { max: 80 }),
        mensagem: text("Campo mensagem", "Mensagem", { max: 60 }),
        botao: text("Texto do botão", "Enviar mensagem", { max: 40 }),
        sucesso: text("Mensagem de sucesso", "Mensagem enviada!", { max: 80 }),
      },
    },
    feedback: {
      label: "Formulário de feedback",
      fields: {
        perfil: text("Pergunta do perfil", "Você é", { max: 80 }),
        perfilCliente: text("Perfil: cliente", FEEDBACK_PROFILES.cliente, { max: 40 }),
        perfilParceiro: text("Perfil: parceiro", FEEDBACK_PROFILES.parceiro, { max: 40 }),
        perfilAluno: text("Perfil: aluno", FEEDBACK_PROFILES.aluno, { max: 40 }),
        perfilComunidade: text("Perfil: comunidade", FEEDBACK_PROFILES.comunidade, { max: 40 }),
        perfilOutro: text("Perfil: outro", FEEDBACK_PROFILES.outro, { max: 40 }),
        nota: text("Pergunta da nota", "Que nota você dá para a Benjamin?", { max: 120 }),
        mensagem: text("Campo feedback", "Seu feedback", { max: 60 }),
        identificar: text("Convite para se identificar", "Quer se identificar? Os campos abaixo são opcionais.", {
          max: 160,
        }),
        nome: text("Campo nome", "Nome", { max: 60 }),
        email: text("Campo e-mail", "E-mail", { max: 60 }),
        retorno: text(
          "Opção de receber retorno",
          "Quero receber um retorno da Benjamin sobre este feedback (precisa do e-mail).",
          { max: 200 },
        ),
        botao: text("Texto do botão", "Enviar feedback", { max: 40 }),
        sucesso: text("Mensagem de sucesso", "Obrigado pelo feedback!", { max: 80 }),
      },
    },
    paginaProjeto: {
      label: "Página de novo projeto (sem JavaScript)",
      hint: "Página de reserva para quem navega sem JavaScript: fica fora do menu e dos buscadores.",
      fields: {
        etiqueta: optionalText("Etiqueta acima do título", "Contato", { max: 80 }),
        titulo: text("Título", "Quero um projeto"),
        descricao: optionalText(
          "Descrição",
          "Conte sobre o seu projeto. A equipe da Benjamin responde pelo e-mail informado.",
          { rows: 2, max: 300 },
        ),
        trilhaContato: link("Link de Contato na trilha", { label: "Contato", href: "/contato" }),
        trilha: text("Nome da página na trilha", "Novo projeto", { max: 60 }),
        icone: icon("Ícone", "comentario", "lima"),
        outro: text("Convite para o outro formulário", "Quer falar de outro assunto?", { max: 120 }),
        outroLink: link("Link do outro formulário", {
          label: "Fale com a gente",
          href: STANDALONE_FORM_PATHS.contact,
        }),
      },
    },
    paginaMensagem: {
      label: "Página de contato (sem JavaScript)",
      hint: "Página de reserva para quem navega sem JavaScript: fica fora do menu e dos buscadores.",
      fields: {
        etiqueta: optionalText("Etiqueta acima do título", "Contato", { max: 80 }),
        titulo: text("Título", "Fale com a gente"),
        descricao: optionalText(
          "Descrição",
          "Mande sua mensagem. A equipe da Benjamin responde pelo e-mail informado.",
          {
            rows: 2,
            max: 300,
          },
        ),
        trilhaContato: link("Link de Contato na trilha", { label: "Contato", href: "/contato" }),
        trilha: text("Nome da página na trilha", "Mensagem", { max: 60 }),
        icone: icon("Ícone", "comentario", "lima"),
        outro: text("Convite para o outro formulário", "Quer pedir um projeto?", { max: 120 }),
        outroLink: link("Link do outro formulário", {
          label: "Vá ao formulário de novo projeto",
          href: STANDALONE_FORM_PATHS.lead,
        }),
      },
    },
  },
});
