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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-08).
 02/11/2026 Vinícius Nishimura Reis  Formulário com os dois passos do envio direto (TECH-13, #313).
 04/11/2026 Vinícius Nishimura Reis  Responsividade, toque e teclado no painel (ADM-16).
 04/11/2026 Vinícius Nishimura Reis  Editar texto alternativo e excluir arquivo sem uso da biblioteca (ADM-09).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { MediaUploadForm } from "@/components/admin/cms/media-upload-form";
import { EmptyPanel } from "@/components/admin/ui/primitives";
import { can } from "@/lib/domain/auth/rbac";
import { safeAdminRedirect } from "@/lib/domain/auth/redirect";
import { mediaDisplayName } from "@/lib/domain/media/usage";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { cmsDeps } from "@/lib/server/cms/context";
import { finishMediaUpload, requestMediaUpload } from "./actions";

export const metadata: Metadata = { title: "Imagens e arquivos" };

/**
 * Biblioteca de mídia: envio e lista para capa e galeria dos cases, imagem dos serviços e fotos do
 * time. Texto alternativo, usos e exclusão ficam no detalhe de cada arquivo (ADM-09).
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
        title="Imagens e arquivos"
        description="A biblioteca do site: capas e galerias dos cases, imagens dos serviços e fotos do time."
      />
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <div className={`grid grid-cols-1 gap-8 ${canUpload ? "xl:grid-cols-[360px_minmax(0,1fr)]" : ""}`}>
        {canUpload ? (
          <section className="h-fit studio-card p-4 sm:p-6">
            <h2 className="mb-4 studio-titulo-secao">Enviar arquivo</h2>
            {back && back !== "/admin" ? (
              <p className="mb-4 text-sm text-studio-suave">
                Depois do envio você volta para o formulário que pediu a imagem.
              </p>
            ) : null}
            <MediaUploadForm
              request={requestMediaUpload}
              finish={finishMediaUpload}
              back={back && back !== "/admin" ? back : undefined}
            />
          </section>
        ) : null}
        <section aria-labelledby="arquivos" className="studio-card p-4 sm:p-6">
          <h2 id="arquivos" className="mb-4 studio-titulo-secao">
            Arquivos ({media.length})
          </h2>
          {media.length ? (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {media.map((asset) => (
                <li key={asset.id} className="overflow-hidden rounded-studio-md border border-studio-linha">
                  {asset.mimeType.startsWith("image/") ? (
                    <Image
                      src={asset.src}
                      alt={asset.alt}
                      width={asset.width ?? 400}
                      height={asset.height ?? 250}
                      unoptimized
                      className="aspect-[16/10] w-full bg-studio-realce object-cover"
                    />
                  ) : (
                    <a
                      href={asset.src}
                      target="_blank"
                      className="flex aspect-[16/10] items-center justify-center bg-studio-realce font-bold"
                    >
                      PDF<span className="sr-only"> (abre em nova aba)</span>
                    </a>
                  )}
                  <div className="space-y-1 p-3 text-xs">
                    <p className="font-semibold wrap-anywhere text-benja-noite">
                      {asset.decorative ? "Decorativa" : asset.alt || "Sem texto alternativo"}
                    </p>
                    <p className="text-studio-suave">
                      {asset.width && asset.height ? `${asset.width} × ${asset.height} px · ` : ""}
                      {asset.mimeType.replace("image/", "").replace("application/", "").toUpperCase()}
                    </p>
                    <Link href={`/admin/midia/${asset.id}`} className="studio-link inline-block py-1">
                      Detalhes<span className="sr-only"> de {mediaDisplayName(asset.path)}</span>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyPanel title="Nenhum arquivo enviado ainda.">
              Envie a primeira imagem: ela fica disponível para capas, galerias e serviços.
            </EmptyPanel>
          )}
        </section>
      </div>
    </>
  );
}
