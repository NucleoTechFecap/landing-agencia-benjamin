/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Content
 Arquivo      : services.ts
 Descrição    : Nove serviços iniciais com descrições provisórias e vínculo com áreas.

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
 13/10/2026 Vinícius Nishimura Reis  Audiovisual em destaque na Home (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Service } from "../lib/domain/content/types";

const published = {
  status: "published" as const,
  publishedAt: "2026-10-13T00:00:00.000Z",
  updatedAt: "2026-10-13T00:00:00.000Z",
  provisional: true,
};

/** Nove serviços iniciais (PRJ §10). Descrições provisórias até CON-05. */
export const services: Service[] = [
  {
    ...published,
    id: "service-estrategia-digital",
    slug: "estrategia-digital",
    name: "Estratégia Digital",
    summary: "Diagnóstico, objetivos e plano de presença digital para a sua marca.",
    description:
      "Analisamos o cenário da marca, definimos públicos, objetivos e canais e organizamos um plano de comunicação digital que orienta conteúdo, campanhas e métricas.",
    areaIds: ["area-social-media", "area-copywriting"],
    examples: ["Diagnóstico de presença digital", "Plano de comunicação", "Definição de indicadores"],
    icon: "estrela",
    featured: true,
    order: 1,
  },
  {
    ...published,
    id: "service-social-media",
    slug: "social-media",
    name: "Social Media",
    summary: "Planejamento, produção e gestão de redes sociais.",
    description:
      "Calendário editorial, criação de posts e vídeos curtos, publicação e acompanhamento de resultados em Instagram, TikTok e LinkedIn.",
    areaIds: ["area-social-media"],
    examples: ["Calendário editorial", "Posts e vídeos curtos", "Relatórios de desempenho"],
    icon: "coracao",
    featured: true,
    order: 2,
  },
  {
    ...published,
    id: "service-eventos",
    slug: "eventos",
    name: "Eventos",
    summary: "Concepção, produção e cobertura de eventos.",
    description:
      "Do conceito à operação no dia: planejamento, cronograma, produção, parceiros e cobertura de comunicação do evento.",
    areaIds: ["area-eventos-e-parcerias"],
    examples: ["Planejamento e cronograma", "Produção e operação", "Cobertura do evento"],
    icon: "calendario",
    featured: false,
    order: 3,
  },
  {
    ...published,
    id: "service-producao-de-conteudo",
    slug: "producao-de-conteudo",
    name: "Produção de Conteúdo",
    summary: "Conteúdos em texto, imagem e vídeo alinhados à estratégia.",
    description:
      "Pautas, roteiros, textos, imagens e vídeos produzidos para informar, engajar e gerar relacionamento com o público da marca.",
    areaIds: ["area-copywriting", "area-social-media", "area-criacao"],
    examples: ["Pautas e roteiros", "Conteúdo para blog e redes", "Séries editoriais"],
    icon: "salvo",
    featured: true,
    order: 4,
  },
  {
    ...published,
    id: "service-copywriting",
    slug: "copywriting",
    name: "Copywriting",
    summary: "Textos que vendem a ideia certa, do jeito certo.",
    description:
      "Criação de textos estratégicos, narrativas de marca, copys para campanhas e artigos, com tom de voz definido para cada cliente.",
    areaIds: ["area-copywriting"],
    examples: ["Copys de campanha", "Artigos para blog", "Narrativa e tom de voz"],
    icon: "enviado",
    featured: false,
    order: 5,
  },
  {
    ...published,
    id: "service-design-e-identidade-visual",
    slug: "design-e-identidade-visual",
    name: "Design e Identidade Visual",
    summary: "Identidade, peças gráficas e direção de arte.",
    description:
      "Criação e evolução de identidades visuais, peças para meios digitais e impressos e direção de arte de campanhas.",
    areaIds: ["area-criacao"],
    examples: ["Identidade visual", "Peças digitais e impressas", "Direção de arte"],
    icon: "raio",
    featured: true,
    order: 6,
  },
  {
    ...published,
    id: "service-audiovisual",
    slug: "audiovisual",
    name: "Audiovisual",
    summary: "Vídeos, fotos e coberturas para contar histórias.",
    description:
      "Roteiro, captação e edição de vídeos institucionais, conteúdos para redes e cobertura fotográfica e audiovisual de eventos.",
    areaIds: ["area-criacao"],
    examples: ["Vídeos institucionais", "Vídeos para redes", "Cobertura de eventos"],
    icon: "like",
    featured: true,
    order: 7,
  },
  {
    ...published,
    id: "service-assessoria-de-imprensa",
    slug: "assessoria-de-imprensa",
    name: "Assessoria de Imprensa / PR",
    summary: "Relacionamento com a imprensa e reputação.",
    description:
      "Elaboração de pautas e releases, relacionamento com veículos, preparação de porta-vozes e acompanhamento de publicações (clipping).",
    areaIds: ["area-assessoria-de-imprensa"],
    examples: ["Pautas e releases", "Media training", "Clipping"],
    icon: "megafone",
    featured: true,
    order: 8,
  },
  {
    ...published,
    id: "service-comunicacao-interna",
    slug: "comunicacao-interna",
    name: "Comunicação Interna",
    summary: "Engajamento e alinhamento de times.",
    description:
      "Diagnóstico de comunicação interna, campanhas para colaboradores, canais internos e ações de clima e engajamento.",
    areaIds: ["area-comunicacao-interna"],
    examples: ["Campanhas internas", "Canais e rituais", "Ações de engajamento"],
    icon: "comentario",
    featured: false,
    order: 9,
  },
];
