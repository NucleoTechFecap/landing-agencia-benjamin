/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Biblioteca de mídia do CMS: envio e lista de arquivos.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-08).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import Image from "next/image";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { MediaUploadForm } from "@/components/admin/cms/media-upload-form";
import { can } from "@/lib/domain/auth/rbac";
import { safeAdminRedirect } from "@/lib/domain/auth/redirect";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { cmsDeps } from "@/lib/server/cms/context";
import { createMediaUpload, finalizeMediaUpload } from "./actions";

export const metadata: Metadata = { title: "Biblioteca de mídia" };

/**
 * Biblioteca de mídia mínima (envio + lista) para capa e galeria dos cases e imagem dos
 * serviços. Gestão completa (excluir, editar texto alternativo, ver onde é usado) é ADM-09.
 */
export default async function MediaAdminPage({ searchParams }: PageProps<"/admin/midia">) {
  const user = await requirePageAccess("media", "view", "/admin/midia");
  const query = await searchParams;
  const media = await (await cmsDeps()).store.listMedia();
  const back = typeof query.voltar === "string" ? safeAdminRedirect(query.voltar) : undefined;
  const canUpload = can(user.role, "media", "create");
  return (
    <>
      <CmsHeader
        title="Biblioteca de mídia"
        trail={[{ label: "Cases", href: "/admin/cases" }, { label: "Biblioteca de mídia" }]}
      />
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <div className={`grid gap-8 ${canUpload ? "lg:grid-cols-[360px_1fr]" : ""}`}>
        {canUpload ? (
          <section className="h-fit rounded-3xl border-2 border-benja-noite/15 bg-white p-6">
            <h2 className="mb-4 text-lg font-black text-benja-verde">Enviar arquivo</h2>
            {back && back !== "/admin" ? (
              <p className="mb-4 text-sm text-benja-grafite/80">
                Depois do envio você volta para o formulário que pediu a imagem.
              </p>
            ) : null}
            <MediaUploadForm
              actions={{ create: createMediaUpload, finalize: finalizeMediaUpload }}
              back={back && back !== "/admin" ? back : undefined}
            />
          </section>
        ) : null}
        <section aria-labelledby="arquivos" className="rounded-3xl border-2 border-benja-noite/15 bg-white p-6">
          <h2 id="arquivos" className="mb-4 text-lg font-black text-benja-verde">
            Arquivos ({media.length})
          </h2>
          {media.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {media.map((asset) => (
                <li key={asset.id} className="overflow-hidden rounded-2xl border-2 border-benja-noite/10">
                  {asset.mimeType.startsWith("image/") ? (
                    <Image
                      src={asset.src}
                      alt={asset.alt}
                      width={asset.width ?? 400}
                      height={asset.height ?? 250}
                      unoptimized
                      className="aspect-[16/10] w-full bg-benja-creme object-cover"
                    />
                  ) : (
                    <a
                      href={asset.src}
                      target="_blank"
                      className="flex aspect-[16/10] items-center justify-center bg-benja-creme font-bold"
                    >
                      PDF<span className="sr-only"> (abre em nova aba)</span>
                    </a>
                  )}
                  <div className="space-y-1 p-3 text-xs">
                    <p className="font-semibold text-benja-noite">
                      {asset.decorative ? "Decorativa" : asset.alt || "Sem texto alternativo"}
                    </p>
                    <p className="text-benja-grafite/70">
                      {asset.width && asset.height ? `${asset.width} × ${asset.height} px · ` : ""}
                      {asset.mimeType.replace("image/", "").replace("application/", "").toUpperCase()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-benja-grafite/80">Nenhum arquivo enviado ainda.</p>
          )}
        </section>
      </div>
    </>
  );
}
