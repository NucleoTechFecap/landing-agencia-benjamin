/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Prévia protegida e restauração de uma versão de página.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Prévia de versão (FUT-04).
════════════════════════════════════════════════════════════════════════════════
*/
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsHeader, CmsSecondaryLink } from "@/components/admin/cms/cms-header";
import { RestoreVersionForm } from "@/components/admin/cms/restore-version-form";
import { PageBlocks } from "@/components/sections/page-blocks";
import { can } from "@/lib/domain/auth/rbac";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { loadCmsSnapshot } from "@/lib/server/cms/context";
import { getPageVersion } from "@/lib/server/history/pages";
import { restorePageVersion } from "../actions";

export const metadata: Metadata = { title: "Prévia da versão", robots: { index: false, follow: false } };
export default async function PageVersionPreview({ params }: PageProps<"/admin/paginas/[id]/historico/[version]">) {
  const { id, version } = await params;
  if (!/^[1-9]\d{0,15}$/.test(version)) notFound();
  const user = await requirePageAccess("page", "view", `/admin/paginas/${id}/historico/${version}`);
  const [snapshot, old] = await Promise.all([loadCmsSnapshot(), getPageVersion(id, version)]);
  const current = snapshot.pages.find((item) => item.id === id);
  if (!current || !old) notFound();
  return (
    <>
      <CmsHeader title="Prévia da versão" description="Confira o conteúdo antes de usá-lo.">
        <CmsSecondaryLink href={`/admin/paginas/${id}/historico`}>Voltar ao histórico</CmsSecondaryLink>
      </CmsHeader>
      {old.problems.length ? (
        <p role="alert" className="mb-4 rounded-studio-md bg-studio-realce p-4">
          Alguns blocos desta versão não puderam ser exibidos. Revise o conteúdo antes de publicar.
        </p>
      ) : null}
      <div className="studio-card mb-6 p-5">
        <h2 className="text-2xl font-black">{old.page.title}</h2>
        {old.page.description ? <p className="mt-2">{old.page.description}</p> : null}
      </div>
      {old.page.blocks.map((block) =>
        block.type === "manifesto" ? (
          <section key={block.id} className="studio-card mb-4 p-5">
            <h3 className="font-black">Manifesto: {block.content.title}</h3>
            {block.content.paragraphs.map((paragraph, index) => (
              <p key={index} className="mt-2">
                {paragraph}
              </p>
            ))}
          </section>
        ) : block.type === "about" ? (
          <section key={block.id} className="studio-card mb-4 space-y-2 p-5">
            <h3 className="font-black">Sobre: {block.content.title}</h3>
            <p>{block.content.intro}</p>
            <p>{block.content.valueProposition}</p>
            <p>{block.content.howWeWork}</p>
            <p>{block.content.fecapRelation}</p>
          </section>
        ) : null,
      )}
      <PageBlocks page={old.page} />
      {can(user.role, "page", "edit") && current.status !== "archived" && !old.problems.length ? (
        <div className="mt-6">
          <RestoreVersionForm
            action={restorePageVersion}
            id={id}
            updatedAt={current.updatedAt}
            version={version}
            published={current.status === "published"}
          />
        </div>
      ) : null}
    </>
  );
}
