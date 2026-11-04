/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : privacidade.ts
 Descrição    : Campos editáveis do aviso de privacidade.

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

import { lines, link, list, longText, optionalText, text, tone } from "../fields";
import { definePage } from "./define";

export const PRIVACIDADE = definePage({
  label: "Aviso de privacidade",
  kind: "rota",
  path: "/privacidade",
  seo: {
    title: "Aviso de privacidade",
    description:
      "Como a Agência Benjamin trata os dados enviados pelos formulários de contato, novos projetos e feedback.",
    keywords: ["privacidade", "LGPD"],
  },
  sections: {
    abertura: {
      label: "Abertura",
      fields: {
        fundo: tone("Cor de fundo", "creme"),
        etiqueta: optionalText("Etiqueta acima do título", "Privacidade", { max: 80 }),
        titulo: text("Título", "Aviso de privacidade"),
        descricao: optionalText("Descrição", "Como tratamos os dados enviados pelos formulários deste site.", {
          rows: 2,
          max: 300,
        }),
        trilha: text("Nome da página na trilha", "Aviso de privacidade", { max: 60 }),
      },
    },
    aviso: {
      label: "Aviso de minuta",
      hideable: true,
      hint: "Esconda esta seção quando o texto for validado pelos responsáveis.",
      fields: {
        destaque: text("Texto em destaque", "Minuta em validação.", { max: 80 }),
        texto: longText(
          "Texto",
          "Este texto está sendo revisado pelos responsáveis institucionais da Agência Benjamin e da FECAP e pode mudar antes da publicação oficial.",
          { rows: 2, max: 300 },
        ),
      },
    },
    conteudo: {
      label: "Texto do aviso",
      fields: {
        secoes: list(
          "Seções",
          {
            titulo: text("Título", ""),
            corpo: lines("Texto", [], { hint: "Um parágrafo por linha." }),
          },
          [
            {
              titulo: "Quem trata os seus dados",
              corpo: [
                "A Agência Benjamin, agência experimental da FECAP, decide como os dados enviados neste site são usados. A plataforma é desenvolvida e mantida pelo NúcleoTech (Núcleo de Tecnologia da FECAP).",
                "Contato do encarregado de dados: será publicado aqui após a validação institucional.",
              ],
            },
            {
              titulo: "Quais dados coletamos e para quê",
              corpo: [
                "Novo projeto: nome, e-mail, telefone (opcional), empresa (opcional), serviço de interesse e descrição do projeto — para responder ao seu pedido e avaliar a proposta.",
                "Contato: nome, e-mail, telefone (opcional), assunto e mensagem — para responder à sua mensagem.",
                "Feedback: perfil, nota, mensagem e, se você quiser, nome e e-mail — para melhorar o trabalho da agência e, quando solicitado, responder.",
                "Dados técnicos: o endereço IP é usado apenas em forma cifrada (hash) para evitar abuso e envios em massa. Não usamos cookies de publicidade nem rastreamento no site público.",
              ],
            },
            {
              titulo: "Com quem os dados são compartilhados",
              corpo: [
                "Somente com a equipe autorizada da Agência Benjamin e com os serviços que operam a plataforma (hospedagem, banco de dados e envio de e-mail). Esses fornecedores podem processar dados fora do Brasil. Não vendemos nem cedemos dados para publicidade.",
              ],
            },
            {
              titulo: "Por quanto tempo guardamos",
              corpo: [
                "Pedidos de projeto: até 12 meses após o último contato. Mensagens de contato: até 6 meses. Feedbacks identificados: até 12 meses, depois ficam anônimos.",
              ],
            },
            {
              titulo: "Seus direitos",
              corpo: [
                "Você pode pedir confirmação, acesso, correção ou exclusão dos seus dados, além de revogar o consentimento para retorno do feedback, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).",
              ],
            },
          ],
          { itemLabel: "Seção", minItems: 1, maxItems: 20 },
        ),
      },
    },
    duvidas: {
      label: "Dúvidas",
      hideable: true,
      fields: {
        texto: text("Texto", "Dúvidas? Use o", { max: 120 }),
        link: link("Link", { label: "formulário de contato", href: "/contato?tipo=contato#formulario" }),
      },
    },
  },
});
