/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Listagem de artigos no painel.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Listagem editorial (FUT-10).
════════════════════════════════════════════════════════════════════════════════
*/
import { CmsHeader, CmsLinkButton } from "@/components/admin/cms/cms-header";
import { ContentBoard } from "@/components/admin/cms/content-board";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { can } from "@/lib/domain/auth/rbac";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { listAdminArticles } from "@/lib/server/blog/repository";

export default async function BlogAdminPage({ searchParams }: PageProps<"/admin/blog">) {
  const user = await requirePageAccess("page", "view", "/admin/blog");
  const [articles, query] = await Promise.all([listAdminArticles(), searchParams]);
  return (
    <>
      <CmsHeader title="Blog" description="Prepare e publique os artigos da Benjamin.">
        {can(user.role, "page", "create") ? <CmsLinkButton href="/admin/blog/novo">Novo artigo</CmsLinkButton> : null}
      </CmsHeader>
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <ContentBoard
        basePath="/admin/blog"
        itemLabel="artigo"
        extraHeader="Autoria · Assunto"
        storageKey="painel-visao-blog"
        empty={<p>Nenhum artigo cadastrado. Crie um rascunho para começar.</p>}
        items={articles.map((item) => ({
          id: item.id,
          title: item.title,
          order: 0,
          status: item.status,
          publishedAt: item.published_at,
          archivedAt: item.archived_at,
          updatedAt: item.updated_at,
          subtitle: [item.author || "Sem autoria", item.topic || "sem assunto"].join(" · "),
          description: item.summary ?? "",
        }))}
      />
    </>
  );
}
