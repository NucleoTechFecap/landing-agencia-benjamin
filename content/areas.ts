/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Content
 Arquivo      : areas.ts
 Descrição    : Seis áreas de atuação da agência com textos provisórios.

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

import type { Area } from "../lib/domain/content/types";

const published = {
  status: "published" as const,
  publishedAt: "2026-10-13T00:00:00.000Z",
  updatedAt: "2026-10-13T00:00:00.000Z",
  provisional: true,
};

/** Seis áreas de atuação descritas no documento de requisitos (PRJ §9). Textos provisórios (CON-04). */
export const areas: Area[] = [
  {
    ...published,
    id: "area-eventos-e-parcerias",
    slug: "eventos-e-parcerias",
    name: "Eventos e Parcerias",
    summary: "Planejamento e produção de eventos e prospecção de conexões estratégicas.",
    description:
      "Concebe, organiza e produz eventos que aproximam marcas e públicos, além de buscar parcerias que ampliam o alcance dos projetos da agência.",
    highlights: ["Planejamento de eventos", "Produção e operação", "Prospecção de parcerias"],
    icon: "calendario",
    order: 1,
  },
  {
    ...published,
    id: "area-social-media",
    slug: "social-media",
    name: "Social Media",
    summary: "Estratégia e gestão multicanal, com foco em Instagram, TikTok e LinkedIn.",
    description:
      "Planeja, produz e acompanha a presença das marcas nas redes sociais, adaptando linguagem e formato a cada canal.",
    highlights: ["Instagram", "TikTok", "LinkedIn"],
    icon: "coracao",
    order: 2,
  },
  {
    ...published,
    id: "area-comunicacao-interna",
    slug: "comunicacao-interna",
    name: "Comunicação Interna",
    summary: "Comunicação interna, clima, engajamento e alinhamento do time.",
    description:
      "Cuida de como as pessoas de uma organização se informam e se conectam, fortalecendo clima, engajamento e alinhamento.",
    highlights: ["Campanhas internas", "Clima e engajamento", "Alinhamento de times"],
    icon: "comentario",
    order: 3,
  },
  {
    ...published,
    id: "area-copywriting",
    slug: "copywriting",
    name: "Copywriting",
    summary: "Textos estratégicos, narrativas, conteúdos, materiais para blogs e copys.",
    description:
      "Transforma estratégia em palavras: do texto curto de uma campanha ao artigo de blog, com voz adequada a cada marca.",
    highlights: ["Textos estratégicos", "Narrativas e conteúdos", "Blogs e copys"],
    icon: "enviado",
    order: 4,
  },
  {
    ...published,
    id: "area-criacao",
    slug: "criacao",
    name: "Criação",
    summary: "Identidade visual, design, direção criativa e produção audiovisual.",
    description:
      "Dá forma às ideias com identidade visual, peças gráficas, direção criativa e produção audiovisual.",
    highlights: ["Identidade visual", "Design e direção criativa", "Produção audiovisual"],
    icon: "raio",
    order: 5,
  },
  {
    ...published,
    id: "area-assessoria-de-imprensa",
    slug: "assessoria-de-imprensa",
    name: "Assessoria de Imprensa",
    summary: "Relacionamento com a mídia, pautas, porta-vozes e releases.",
    description:
      "Constrói pontes entre organizações e veículos de comunicação: pautas, releases, preparação de porta-vozes e relacionamento institucional.",
    highlights: ["Relacionamento com a mídia", "Pautas e releases", "Gestão de porta-vozes"],
    icon: "megafone",
    order: 6,
  },
];
