/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : article-content.tsx
 Descrição    : Leitura de artigo, compartilhada entre site e prévia.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Exibição de artigos (FUT-10).
════════════════════════════════════════════════════════════════════════════════
*/
import Link from "next/link";
import Image from "next/image";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import type { BlogArticle } from "@/lib/domain/blog/article";
import { articleLine } from "@/lib/domain/blog/formatting";

export function ArticleContent({ article }: { article: BlogArticle }) {
  return (
    <article>
      <PageHero
        eyebrow={article.topic || "Blog"}
        title={article.title}
        path={`/blog/${article.slug}`}
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Blog", href: "/blog" }, { label: article.title }]}
        description={
          <>
            <p>{article.summary}</p>
            <p className="mt-4 text-sm font-bold">
              {article.author || "Autoria não informada"}
              {article.published_at ? (
                <>
                  {" "}
                  ·{" "}
                  <time dateTime={article.published_at}>
                    {new Intl.DateTimeFormat("pt-BR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "America/Sao_Paulo",
                    }).format(new Date(article.published_at))}
                  </time>
                </>
              ) : null}
            </p>
          </>
        }
      />
      <Section tone="claro">
        <div className="mx-auto max-w-3xl space-y-6 text-lg leading-relaxed text-benja-noite">
          {article.cover ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border-2 border-benja-noite">
              <Image
                src={article.cover.src}
                alt={article.cover.alt}
                fill
                sizes="(min-width: 768px) 768px, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}
          {article.paragraphs.map((paragraph, index) => {
            const line = articleLine(paragraph);
            const content = line.content.map((part, partIndex) =>
              part.href ? (
                <a
                  key={partIndex}
                  href={part.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline underline-offset-4"
                >
                  {part.text}
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              ) : (
                part.text
              ),
            );
            return line.kind === "heading" ? (
              <h2 key={index} className="pt-4 text-2xl font-black">
                {content}
              </h2>
            ) : (
              <p key={index} className="whitespace-pre-wrap">
                {content}
              </p>
            );
          })}
          <Link href="/blog" className="inline-block pt-6 font-bold text-benja-verde underline underline-offset-4">
            ← Voltar ao blog
          </Link>
        </div>
      </Section>
    </article>
  );
}
