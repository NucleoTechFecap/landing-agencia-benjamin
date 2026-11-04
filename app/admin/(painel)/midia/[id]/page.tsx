/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Detalhe de um arquivo da biblioteca: onde é usado, texto alternativo e exclusão.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-09).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { MediaDeleteForm } from "@/components/admin/cms/media-delete-form";
import { MediaDetailsForm } from "@/components/admin/cms/media-details-form";
import { StatusBadge } from "@/components/admin/cms/status-badge";
import { can } from "@/lib/domain/auth/rbac";
import { findMediaUsage, mediaDisplayName, type MediaUsage } from "@/lib/domain/media/usage";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { cmsDeps, loadCmsSnapshot } from "@/lib/server/cms/context";
import { deleteMediaAsset, saveMediaDetails } from "../actions";

export const metadata: Metadata = { title: "Arquivo da biblioteca" };

const ADMIN_PATH: Record<MediaUsage["entity"], string> = {
  service: "/admin/servicos",
  case: "/admin/cases",
  page: "/admin/paginas",
  theme: "/admin/aparencia",
};

export default async function MediaDetailPage({ params, searchParams }: PageProps<"/admin/midia/[id]">) {
  const { id } = await params;
  const user = await requirePageAccess("media", "view", `/admin/midia/${id}`);
  const deps = await cmsDeps();
  const [media, snapshot, stored, query] = await Promise.all([
    deps.store.listMedia(),
    loadCmsSnapshot(),
    deps.store.readSettings(),
    searchParams,
  ]);
  const asset = media.find((item) => item.id === id);
  if (!asset) notFound();
  const usage = findMediaUsage(asset, { ...snapshot, theme: stored?.settings.theme });
  const isImage = asset.mimeType.startsWith("image/");
  const name = mediaDisplayName(asset.path);
  const description = asset.decorative ? "Decorativa" : asset.alt || "Sem texto alternativo";
  return (
    <>
      <CmsHeader title={name} />
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 space-y-6 studio-card p-6 wrap-anywhere">
          {isImage ? (
            <Image
              src={asset.src}
              alt={asset.alt}
              width={asset.width ?? 800}
              height={asset.height ?? 500}
              unoptimized
              className="max-h-96 w-full rounded-studio-md bg-studio-realce object-contain"
            />
          ) : (
            <a
              href={asset.src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block py-1 font-bold underline"
            >
              Abrir PDF<span className="sr-only"> (abre em nova aba)</span>
            </a>
          )}
          <p className="text-sm text-studio-suave">
            {asset.width && asset.height ? `${asset.width} × ${asset.height} px · ` : ""}
            {asset.mimeType.replace("image/", "").replace("application/", "").toUpperCase()}
          </p>
          {can(user.role, "media", "edit") ? (
            <MediaDetailsForm
              action={saveMediaDetails}
              id={asset.id}
              updatedAt={asset.updatedAt}
              alt={asset.alt}
              decorative={asset.decorative}
              isImage={isImage}
            />
          ) : (
            <p className="text-sm font-semibold text-benja-noite">{description}</p>
          )}
        </section>
        <div className="min-w-0 space-y-6 wrap-anywhere">
          <section aria-labelledby="usos" className="studio-card p-5 text-sm">
            <h2 id="usos" className="text-base font-extrabold text-benja-verde">
              Onde é usado
            </h2>
            {usage.length ? (
              <ul className="mt-3 space-y-3">
                {usage.map((item) => (
                  <li key={`${item.entity}-${item.id}-${item.place}`} className="space-y-1">
                    <Link
                      href={item.entity === "theme" ? ADMIN_PATH.theme : `${ADMIN_PATH[item.entity]}/${item.id}`}
                      className="studio-link inline-block py-1"
                    >
                      {item.name}
                    </Link>
                    <p className="flex flex-wrap items-center gap-2 text-xs text-studio-suave">
                      {item.place} <StatusBadge status={item.status} />
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-studio-suave">Nenhum conteúdo usa este arquivo.</p>
            )}
          </section>
          {can(user.role, "media", "delete") ? (
            <section aria-labelledby="excluir" className="space-y-3 studio-card p-5 text-sm">
              <h2 id="excluir" className="text-base font-extrabold text-benja-verde">
                Excluir
              </h2>
              {usage.length ? (
                <p className="text-studio-suave">
                  Arquivo em uso não pode ser excluído. Troque ou retire nos conteúdos acima, inclusive rascunhos e
                  arquivados.
                </p>
              ) : (
                <MediaDeleteForm action={deleteMediaAsset} id={asset.id} />
              )}
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
