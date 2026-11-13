/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Páginas criadas no painel, com endereço próprio e conteúdo em blocos.

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

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FreePageView } from "@/app/(site)/_views/free-page-view";
import { isFreePageSlug } from "@/lib/domain/content/blocks";
import { toStaticParams } from "@/lib/server/content/published-slugs";
import { getPage, getSiteSettings, listFreePages } from "@/lib/server/content/repository";
import { buildMetadata } from "@/lib/server/seo";

/** Prerenderiza as páginas publicadas; as novas entram por ISR com App Shell, como serviços e cases. */
export async function generateStaticParams() {
  return toStaticParams((await listFreePages()).map((page) => page.slug));
}

/** Pode bloquear na navegação: as publicadas já são pré-geradas e o proxy.ts responde 404 às demais. */
export const instant = false;

const pageOf = async (slug: string) => (isFreePageSlug(slug) ? getPage(slug) : null);

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await pageOf(slug);
  if (!page) return { title: "Página não encontrada", robots: { index: false } };
  return buildMetadata(
    {
      title: page.title,
      description: page.description ?? page.title,
      path: `/${page.slug}`,
      seo: page.seo,
    },
    await getSiteSettings(),
  );
}

export default async function FreePage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const page = await pageOf(slug);
  // Rascunho, arquivada ou inexistente: 404 sem revelar se existe (TECH-04 I1). O status real vem do proxy.
  if (!page) notFound();
  return <FreePageView page={page} />;
}
