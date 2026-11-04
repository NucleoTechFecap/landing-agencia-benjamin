/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Detalhe do serviço com entregas, áreas, cases relacionados e CTA de contato.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 13/10/2026 Vinícius Nishimura Reis  Metadados completos e dados estruturados (SEO da landing).
 25/10/2026 Caio Moraes              Permite navegação bloqueante (instant = false) (LAY-01).
 26/10/2026 Vinícius Nishimura Reis  Parâmetro estático para banco vazio (DB-03).
 01/11/2026 Vinícius Nishimura Reis  Estados globais de carregamento, vazio e erro (LAY-07).
 01/11/2026 Vinícius Nishimura Reis  SEO e compartilhamento das páginas públicas (SEG-09).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
 04/11/2026 Vinícius Nishimura Reis  Seções movidas para componentes compartilhados com a prévia (ADM-14).
 04/11/2026 Vinícius Nishimura Reis  Textos e imagens editáveis no painel (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceDetailSections } from "@/components/sections/service-detail";
import { JsonLd } from "@/components/seo/json-ld";
import { siteUrl } from "@/lib/config/public-env";
import { pickOtherServices } from "@/lib/domain/content/details";
import { serviceSchema } from "@/lib/domain/seo/structured-data";
import {
  getPage,
  getServiceDetail,
  getSiteSettings,
  listPublishedSlugs,
  listServices,
} from "@/lib/server/content/repository";
import { toStaticParams } from "@/lib/server/content/published-slugs";
import { buildMetadata } from "@/lib/server/seo";

/** Prerenderiza os serviços publicados; novos slugs entram por ISR com App Shell. */
export async function generateStaticParams() {
  const { services } = await listPublishedSlugs();
  return toStaticParams(services);
}

/** Pode bloquear na navegação: os slugs publicados já são pré-gerados e o proxy.ts responde 404 aos inexistentes (LAY-01). */
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/servicos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getServiceDetail(slug);
  if (!detail) return { title: "Serviço não encontrado", robots: { index: false } };
  const { service, areas } = detail;
  return buildMetadata(
    {
      title: `${service.name} — serviço de comunicação`,
      description: service.summary,
      path: `/servicos/${service.slug}`,
      keywords: [service.name, ...areas.map((area) => area.name), ...service.examples],
      segmentImage: true,
      seo: service.seo,
    },
    await getSiteSettings(),
  );
}

/** Detalhe do serviço com entregas, áreas, cases relacionados e CTA de contato (SERV-02, SERV-12). */
export default async function ServicePage({ params }: PageProps<"/servicos/[slug]">) {
  const { slug } = await params;
  const [detail, services, modelo, geralPage] = await Promise.all([
    getServiceDetail(slug),
    listServices(),
    getPage("modelo-servico"),
    getPage("site-geral"),
  ]);
  // Item inexistente, rascunho ou arquivado: 404 sem revelar se existe (TECH-04 I1).
  if (!detail) notFound();
  const others = pickOtherServices(services, detail.service.id);

  return (
    <>
      <JsonLd data={serviceSchema(detail.service, detail.areas, siteUrl)} />
      <ServiceDetailSections detail={detail} others={others} modelo={modelo} geralPage={geralPage} />
    </>
  );
}
