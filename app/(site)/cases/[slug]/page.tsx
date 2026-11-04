/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Detalhe do case: história, ficha, galeria, links e cases relacionados.

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
 26/10/2026 Vinícius Nishimura Reis  Veículo e data nos links de clipping (CASE-10).
 30/10/2026 Caio Moraes              Galeria mostra a peça inteira, sem corte (CASE-04).
 01/11/2026 Vinícius Nishimura Reis  Estados globais de carregamento, vazio e erro (LAY-07).
 01/11/2026 Vinícius Nishimura Reis  SEO e compartilhamento das páginas públicas (SEG-09).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
 04/11/2026 Vinícius Nishimura Reis  Seções movidas para componentes compartilhados com a prévia (ADM-14).
 04/11/2026 Vinícius Nishimura Reis  Textos e imagens editáveis no painel (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseDetailSections } from "@/components/sections/case-detail";
import { JsonLd } from "@/components/seo/json-ld";
import { siteUrl } from "@/lib/config/public-env";
import { pickRelatedCases } from "@/lib/domain/content/details";
import { caseSchema } from "@/lib/domain/seo/structured-data";
import {
  getCaseDetail,
  getPage,
  getSiteSettings,
  listCases,
  listPublishedSlugs,
} from "@/lib/server/content/repository";
import { toStaticParams } from "@/lib/server/content/published-slugs";
import { buildMetadata } from "@/lib/server/seo";

export async function generateStaticParams() {
  const { cases } = await listPublishedSlugs();
  return toStaticParams(cases);
}

/** Pode bloquear na navegação: os slugs publicados já são pré-gerados e o proxy.ts responde 404 aos inexistentes (LAY-01). */
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/cases/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getCaseDetail(slug);
  if (!detail) return { title: "Case não encontrado", robots: { index: false } };
  const { item, category, services } = detail;
  return buildMetadata(
    {
      title: `${item.title} — ${item.client}`,
      description: item.summary,
      path: `/cases/${item.slug}`,
      type: "article",
      segmentImage: true,
      keywords: [item.client, category?.name ?? "", ...services.map((service) => service.name)].filter(Boolean),
      seo: item.seo,
    },
    await getSiteSettings(),
  );
}

/** Detalhe do case: desafio, solução, resultados, galeria, links e serviços (CASE-02, CASE-04). */
export default async function CasePage({ params }: PageProps<"/cases/[slug]">) {
  const { slug } = await params;
  const [detail, modelo, geralPage] = await Promise.all([
    getCaseDetail(slug),
    getPage("modelo-case"),
    getPage("site-geral"),
  ]);
  if (!detail) notFound();
  const { item, category, services } = detail;
  const related = category ? pickRelatedCases(await listCases({ category: category.slug }), item.id) : [];

  return (
    <>
      <JsonLd data={caseSchema(item, category?.name, services, siteUrl)} />
      <CaseDetailSections detail={detail} related={related} modelo={modelo} geralPage={geralPage} />
    </>
  );
}
