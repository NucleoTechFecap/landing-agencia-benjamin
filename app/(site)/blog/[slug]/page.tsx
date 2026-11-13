/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Leitura pública de artigo do blog.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Detalhe do blog (FUT-10).
════════════════════════════════════════════════════════════════════════════════
*/
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArticleContent } from "@/components/blog/article-content";
import { JsonLd } from "@/components/seo/json-ld";
import { Section } from "@/components/ui/section";
import { siteUrl } from "@/lib/config/public-env";
import { getArticle, listArticles } from "@/lib/server/blog/repository";
import { toStaticParams } from "@/lib/server/content/published-slugs";
import { buildMetadata } from "@/lib/server/seo";

export const instant = false;
export async function generateStaticParams() {
  return toStaticParams((await listArticles()).map((item) => item.slug));
}
export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const item = await getArticle((await params).slug);
  if (!item) return { title: "Artigo não encontrado", robots: { index: false } };
  return buildMetadata({
    title: item.title,
    description: item.summary ?? "",
    path: `/blog/${item.slug}`,
    type: "article",
    ...(item.cover ? { image: { url: item.cover.src, alt: item.cover.alt } } : {}),
  });
}
export default async function BlogArticlePage({ params }: PageProps<"/blog/[slug]">) {
  const article = await getArticle((await params).slug);
  if (!article) notFound();
  const related = article.topic
    ? (await listArticles()).filter((item) => item.id !== article.id && item.topic === article.topic).slice(0, 3)
    : [];
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: article.title,
          description: article.summary,
          author: { "@type": "Person", name: article.author },
          datePublished: article.published_at,
          dateModified: article.updated_at,
          mainEntityOfPage: `${siteUrl}/blog/${article.slug}`,
          inLanguage: "pt-BR",
          ...(article.cover ? { image: new URL(article.cover.src, siteUrl).href } : {}),
        }}
      />
      <ArticleContent article={article} />
      {related.length ? (
        <Section tone="nyanza" labelledBy="blog-relacionados">
          <h2 id="blog-relacionados" className="text-3xl font-black">
            Continue lendo
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <li key={item.id} className="rounded-3xl border-2 border-benja-noite bg-white p-6 shadow-sticker">
                <Link href={`/blog/${item.slug}`} className="text-xl font-black underline-offset-4 hover:underline">
                  {item.title}
                </Link>
                <p className="mt-3">{item.summary}</p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}
