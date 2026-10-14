/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Minuta do aviso de privacidade dos formulários (pendente de validação).

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Aviso de privacidade",
  description: "Como a Agência Benjamin trata os dados enviados pelos formulários de contato, novos projetos e feedback.",
};

const SECTIONS = [
  {
    id: "quem",
    title: "Quem trata os seus dados",
    body: [
      "A Agência Benjamin, agência experimental da FECAP, decide como os dados enviados neste site são usados. A plataforma é desenvolvida e mantida pelo NúcleoTech (Núcleo de Tecnologia da FECAP).",
      "Contato do encarregado de dados: será publicado aqui após a validação institucional.",
    ],
  },
  {
    id: "dados",
    title: "Quais dados coletamos e para quê",
    body: [
      "Novo projeto: nome, e-mail, telefone (opcional), empresa (opcional), serviço de interesse e descrição do projeto — para responder ao seu pedido e avaliar a proposta.",
      "Contato: nome, e-mail, telefone (opcional), assunto e mensagem — para responder à sua mensagem.",
      "Feedback: perfil, nota, mensagem e, se você quiser, nome e e-mail — para melhorar o trabalho da agência e, quando solicitado, responder.",
      "Dados técnicos: o endereço IP é usado apenas em forma cifrada (hash) para evitar abuso e envios em massa. Não usamos cookies de publicidade nem rastreamento no site público.",
    ],
  },
  {
    id: "compartilhamento",
    title: "Com quem os dados são compartilhados",
    body: [
      "Somente com a equipe autorizada da Agência Benjamin e com os serviços que operam a plataforma (hospedagem, banco de dados e envio de e-mail). Esses fornecedores podem processar dados fora do Brasil. Não vendemos nem cedemos dados para publicidade.",
    ],
  },
  {
    id: "retencao",
    title: "Por quanto tempo guardamos",
    body: [
      "Pedidos de projeto: até 12 meses após o último contato. Mensagens de contato: até 6 meses. Feedbacks identificados: até 12 meses, depois ficam anônimos.",
    ],
  },
  {
    id: "direitos",
    title: "Seus direitos",
    body: [
      "Você pode pedir confirmação, acesso, correção ou exclusão dos seus dados, além de revogar o consentimento para retorno do feedback, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).",
    ],
  },
];

/**
 * Aviso de privacidade — MINUTA técnica baseada em SEG-01/TECH-08. Texto final, bases
 * legais e contato do encarregado dependem de validação institucional (SEG-02/SEG-10).
 */
export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacidade"
        title="Aviso de privacidade"
        description={<p>Como tratamos os dados enviados pelos formulários deste site.</p>}
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Aviso de privacidade" }]}
        tone="creme"
        provisional
      />
      <Section tone="nyanza">
        <article className="mx-auto max-w-3xl">
          <p className="rounded-2xl border-2 border-dashed border-benja-laranja bg-white p-4 text-sm">
            <strong>Minuta em validação.</strong> Este texto está sendo revisado pelos responsáveis institucionais da
            Agência Benjamin e da FECAP e pode mudar antes da publicação oficial.
          </p>
          {SECTIONS.map((section) => (
            <section key={section.id} aria-labelledby={`${section.id}-titulo`} className="mt-10">
              <h2 id={`${section.id}-titulo`} className="text-2xl font-black text-benja-verde">
                {section.title}
              </h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="mt-3 leading-relaxed text-benja-grafite">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
          <p className="mt-12 text-sm text-benja-grafite">
            Dúvidas? Use o{" "}
            <Link href="/contato?tipo=contato#formulario" className="font-bold underline underline-offset-4">
              formulário de contato
            </Link>
            .
          </p>
        </article>
      </Section>
    </>
  );
}
