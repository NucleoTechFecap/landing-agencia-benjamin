/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Prévia autenticada de artigo do blog.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Prévia editorial (FUT-10).
════════════════════════════════════════════════════════════════════════════════
*/
import { notFound } from "next/navigation";
import { ArticleContent } from "@/components/blog/article-content";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { listAdminArticles } from "@/lib/server/blog/repository";
export const metadata = { title: "Prévia de artigo", robots: { index: false, follow: false } };
export default async function ArticlePreview({ params }: PageProps<"/admin/blog/[id]/previa">) {
  const { id } = await params;
  await requirePageAccess("page", "view", `/admin/blog/${id}/previa`);
  const article = (await listAdminArticles()).find((item) => item.id === id);
  if (!article) notFound();
  return (
    <>
      <p className="studio-card mb-4 p-4 font-bold">
        Prévia restrita ao painel. Este conteúdo pode não estar publicado.
      </p>
      <ArticleContent article={article} />
    </>
  );
}
