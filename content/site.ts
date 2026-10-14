/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Content
 Arquivo      : site.ts
 Descrição    : Configuração institucional provisória: manifesto, sobre, contato, redes e palavras-chave.

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

import type { SiteSettings } from "../lib/domain/content/types";

/**
 * Configuração institucional provisória (PRJ §7, §8, §16). Textos marcados como
 * provisórios aguardam a versão final da Agência Benjamin (CON-02, CON-03, CON-10).
 */
export const siteSettings: SiteSettings = {
  name: "Agência Benjamin",
  shortName: "Benja",
  tagline: "Somando diferenças",
  description:
    "Agência experimental de comunicação da FECAP. Estratégia, conteúdo, criação, eventos e assessoria de imprensa feitos por estudantes em projetos reais para marcas e organizações.",
  manifesto: {
    title: "Comunicação que soma diferenças.",
    paragraphs: [
      "Toda marca tem algo a dizer. Nem toda marca é ouvida.",
      "A Benjamin nasce dentro da FECAP para provar que comunicação boa é feita de gente diferente pensando junto: estratégia, texto, imagem, evento e relacionamento trabalhando pelo mesmo objetivo.",
      "Aqui, cada projeto é real, cada entrega é aprendizado e cada ideia é testada no mundo — não só na sala de aula.",
    ],
    provisional: true,
  },
  about: {
    title: "Uma agência experimental dentro da FECAP",
    intro:
      "A Agência Benjamin é a agência experimental de comunicação da FECAP. Reúne estudantes que atuam em áreas complementares para desenvolver projetos de comunicação para clientes, parceiros e para a própria comunidade acadêmica.",
    valueProposition:
      "Unimos o olhar curioso de quem está se formando à responsabilidade de entregar para marcas reais: estratégia, criatividade e execução com acompanhamento próximo.",
    howWeWork:
      "Cada demanda passa por briefing, planejamento e produção com times formados pelas áreas da agência — de social media a assessoria de imprensa — com validação em cada etapa.",
    fecapRelation:
      "Vinculada à FECAP, a Benjamin conecta a formação acadêmica à prática profissional, fortalecendo a presença da instituição e de seus parceiros.",
    provisional: true,
  },
  contact: {
    // E-mail e telefone institucionais dependem de CON-10.
    address: "FECAP — Av. da Liberdade, 532, Liberdade, São Paulo/SP",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=FECAP+Av.+da+Liberdade+532+S%C3%A3o+Paulo",
  },
  socials: {
    instagram: "https://www.instagram.com/agenciabenja",
    tiktok: "https://www.tiktok.com/@tik.benja",
    linkedin: "https://www.linkedin.com/company/benjamin-fecap/",
  },
  keywords: [
    "Agência Benjamin",
    "Benja",
    "agência experimental",
    "agência experimental FECAP",
    "agência de comunicação",
    "agência de comunicação São Paulo",
    "FECAP",
    "estratégia digital",
    "social media",
    "gestão de redes sociais",
    "produção de conteúdo",
    "copywriting",
    "design e identidade visual",
    "audiovisual",
    "eventos e parcerias",
    "assessoria de imprensa",
    "comunicação interna",
    "portfólio de comunicação",
    "cases de comunicação",
  ],
};
