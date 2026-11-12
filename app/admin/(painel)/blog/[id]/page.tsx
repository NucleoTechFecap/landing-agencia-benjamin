/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Edição e publicação de artigo no painel.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Edição editorial (FUT-10).
════════════════════════════════════════════════════════════════════════════════
*/
import { notFound } from "next/navigation";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { CommandBar } from "@/components/admin/cms/command-bar";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { ItemPanel } from "@/components/admin/cms/item-panel";
import { ArticleForm } from "@/components/blog/article-form";
import { can } from "@/lib/domain/auth/rbac";
import { allowedCommands } from "@/lib/domain/content/publication";
import { validateArticleForPublish } from "@/lib/domain/blog/article";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { loadImageOptions } from "@/lib/server/cms/context";
import { listAdminArticles } from "@/lib/server/blog/repository";
import { articleCommand, saveArticle } from "../actions";

export default async function EditBlogArticlePage({ params, searchParams }: PageProps<"/admin/blog/[id]">) {
  const { id } = await params;
  const user = await requirePageAccess("page", "view", `/admin/blog/${id}`);
  const [articles, query, images] = await Promise.all([listAdminArticles(), searchParams, loadImageOptions()]);
  const item = articles.find((article) => article.id === id);
  if (!item) notFound();
  const missing = validateArticleForPublish({
    title: item.title,
    slug: item.slug,
    summary: item.summary ?? undefined,
    author: item.author ?? undefined,
    blocks: item.paragraphs.map((text) => ({ type: "paragraph", text })),
  });
  const commands = allowedCommands(item.status, user.role, "page").filter(
    (command) => command !== "delete" || !item.published_at,
  );
  return (
    <>
      <CmsHeader title={item.title} />
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="studio-card p-4 sm:p-6">
          {item.status === "published" ? (
            <p className="mb-5 rounded-studio-md bg-studio-realce px-4 py-3 text-sm">
              Ao salvar, as alterações serão publicadas imediatamente.
            </p>
          ) : null}
          <ArticleForm
            images={images}
            action={saveArticle}
            article={item}
            readOnly={!can(user.role, "page", "edit") || item.status === "archived"}
          />
        </div>
        <ItemPanel
          item={{
            status: item.status,
            publishedAt: item.published_at,
            archivedAt: item.archived_at,
            updatedAt: item.updated_at,
          }}
          publicHref={`/blog/${item.slug}`}
          previewHref={`/admin/blog/${item.id}/previa`}
          missing={missing}
          warnings={[]}
        >
          <CommandBar action={articleCommand} id={item.id} updatedAt={item.updated_at} commands={commands} />
        </ItemPanel>
      </div>
    </>
  );
}
