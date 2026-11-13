/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Criação de artigo no painel.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Criação editorial (FUT-10).
════════════════════════════════════════════════════════════════════════════════
*/
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { ArticleForm } from "@/components/blog/article-form";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { loadImageOptions } from "@/lib/server/cms/context";
import { saveArticle } from "../actions";

export default async function NewBlogArticlePage() {
  await requirePageAccess("page", "create", "/admin/blog/novo");
  const images = await loadImageOptions();
  return (
    <>
      <CmsHeader
        title="Novo artigo"
        description="O artigo nasce como rascunho e só aparece no site após a publicação."
      />
      <div className="max-w-4xl studio-card p-4 sm:p-6">
        <ArticleForm action={saveArticle} images={images} />
      </div>
    </>
  );
}
