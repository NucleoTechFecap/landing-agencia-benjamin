/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Página personalizada publicada pelo painel.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Páginas personalizadas.
════════════════════════════════════════════════════════════════════════════════
*/
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageBlocks } from "@/components/sections/page-blocks";
import { PageHero } from "@/components/sections/page-hero";
import { getPage, listCustomPages } from "@/lib/server/content/repository";
import { toStaticParams } from "@/lib/server/content/published-slugs";
import { buildMetadata } from "@/lib/server/seo";

export const instant = false;
export async function generateStaticParams() {
  return toStaticParams((await listCustomPages()).map((page) => page.slug));
}
export async function generateMetadata({ params }: PageProps<"/paginas/[slug]">): Promise<Metadata> {
  const page = await getPage((await params).slug);
  if (!page?.isCustom) return { title: "Página não encontrada", robots: { index: false } };
  return buildMetadata({
    title: page.title,
    description: page.description ?? page.title,
    path: `/paginas/${page.slug}`,
  });
}
export default async function CustomPage({ params }: PageProps<"/paginas/[slug]">) {
  const page = await getPage((await params).slug);
  if (!page?.isCustom) notFound();
  return (
    <>
      <PageHero
        eyebrow="Agência Benjamin"
        title={page.title}
        path={`/paginas/${page.slug}`}
        description={page.description ? <p>{page.description}</p> : undefined}
        breadcrumbs={[{ label: "Início", href: "/" }, { label: page.title }]}
      />
      <PageBlocks page={page} />
    </>
  );
}
