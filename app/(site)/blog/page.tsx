/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Listagem pública dos artigos do blog.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Blog público (FUT-10).
════════════════════════════════════════════════════════════════════════════════
*/
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { PageHero } from "@/components/sections/page-hero";
import { ClosingCta } from "@/components/sections/closing-cta";
import { Section } from "@/components/ui/section";
import { EmptyState, LoadingState } from "@/components/ui/states";
import { listArticles } from "@/lib/server/blog/repository";
import { buildMetadata } from "@/lib/server/seo";

export const metadata = buildMetadata({
  title: "Blog",
  description: "Ideias, perspectivas e conteúdos da Agência Benjamin.",
  path: "/blog",
});

export default function BlogPage({ searchParams }: PageProps<"/blog">) {
  return (
    <>
      <PageHero
        eyebrow="Ideias em movimento"
        title="Blog da Benjamin"
        description={<p>Um espaço para compartilhar ideias, comunicação e criatividade.</p>}
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Blog" }]}
        path="/blog"
        icon="coracao"
        iconColor="rosa"
      />
      <Section tone="claro" labelledBy="blog-artigos">
        <h2 id="blog-artigos" className="text-3xl font-black">
          Artigos
        </h2>
        <Suspense fallback={<LoadingState label="Carregando artigos…" />}>
          <ArticleList searchParams={searchParams} />
        </Suspense>
      </Section>
      <ClosingCta
        title="Vamos criar algo juntos?"
        description="Conte com a equipe da Benjamin para transformar a sua próxima ideia em um projeto."
        links={[{ id: "contato", label: "Fale com a gente", href: "/contato#formulario", external: false }]}
      />
    </>
  );
}

async function ArticleList({ searchParams }: Pick<PageProps<"/blog">, "searchParams">) {
  const [params, articles] = await Promise.all([searchParams, listArticles()]);
  const q = typeof params.busca === "string" ? params.busca.trim().slice(0, 100) : "";
  const topic = typeof params.assunto === "string" ? params.assunto.slice(0, 80) : "";
  const topics = [...new Set(articles.flatMap((article) => (article.topic ? [article.topic] : [])))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
  const filtered = articles.filter(
    (article) =>
      (!topic || article.topic === topic) &&
      (!q ||
        [article.title, article.summary, article.author, article.topic].some((v) =>
          v?.toLocaleLowerCase("pt-BR").includes(q.toLocaleLowerCase("pt-BR")),
        )),
  );
  const requested = typeof params.pagina === "string" && /^\d{1,6}$/.test(params.pagina) ? Number(params.pagina) : 1;
  const pages = Math.max(1, Math.ceil(filtered.length / 9));
  const page = Math.min(Math.max(1, requested), pages);
  const href = (n: number) => {
    const p = new URLSearchParams();
    if (q) p.set("busca", q);
    if (topic) p.set("assunto", topic);
    p.set("pagina", String(n));
    return `/blog?${p}`;
  };
  return (
    <>
      <form action="/blog" className="mt-6 flex flex-wrap items-end gap-4">
        <label className="grid gap-2 font-bold">
          Buscar artigos
          <input
            name="busca"
            defaultValue={q}
            maxLength={100}
            className="rounded-xl border-2 border-benja-noite bg-white px-4 py-3 font-normal"
          />
        </label>
        <label className="grid gap-2 font-bold">
          Assunto
          <select
            name="assunto"
            defaultValue={topics.includes(topic) ? topic : ""}
            className="rounded-xl border-2 border-benja-noite bg-white px-4 py-3 font-normal"
          >
            <option value="">Todos</option>
            {topics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <button className="rounded-full border-2 border-benja-noite bg-benja-lima px-6 py-3 font-bold">Buscar</button>
      </form>
      <p role="status" className="mt-6 text-sm font-bold">
        {filtered.length === 1 ? "1 artigo encontrado" : `${filtered.length} artigos encontrados`}
      </p>
      {filtered.length ? (
        <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.slice((page - 1) * 9, page * 9).map((article) => (
            <li key={article.id} className="rounded-3xl border-2 border-benja-noite bg-white p-7 shadow-sticker">
              {article.cover ? (
                <div className="relative mb-5 aspect-[16/9] overflow-hidden rounded-2xl">
                  <Image
                    src={article.cover.src}
                    alt={article.cover.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <p className="text-sm font-bold uppercase">{article.topic || "Blog"}</p>
              <h3 className="mt-3 text-2xl font-black">
                <Link className="underline-offset-4 hover:underline" href={`/blog/${article.slug}`}>
                  {article.title}
                </Link>
              </h3>
              <p className="mt-3 leading-relaxed">{article.summary}</p>
              <p className="mt-5 text-sm font-semibold">{article.author}</p>
              <Link className="mt-5 inline-block font-bold underline underline-offset-4" href={`/blog/${article.slug}`}>
                Ler artigo<span className="sr-only">: {article.title}</span> →
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState className="mt-5">
          {q || topic
            ? "Nenhum artigo encontrado para esses filtros."
            : "Os primeiros artigos estão sendo preparados. Volte em breve!"}
        </EmptyState>
      )}
      {pages > 1 ? (
        <nav aria-label="Páginas do blog" className="mt-8 flex items-center gap-5">
          {page > 1 ? (
            <Link href={href(page - 1)} className="font-bold underline">
              Anterior
            </Link>
          ) : null}
          <span>
            Página {page} de {pages}
          </span>
          {page < pages ? (
            <Link href={href(page + 1)} className="font-bold underline">
              Próxima
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
