/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : CTAs da Home e demais posições, por posição, e destaques de serviços e cases.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-11).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { CmsHeader, CmsLinkButton } from "@/components/admin/cms/cms-header";
import { CmsTable } from "@/components/admin/cms/cms-table";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { HomeHighlights } from "@/components/admin/cms/home-highlights";
import { can } from "@/lib/domain/auth/rbac";
import {
  CTA_PLACEMENT_LABELS,
  CTA_PLACEMENTS,
  CTA_PLACEMENTS_ON_SITE,
  describeCtaTarget,
} from "@/lib/domain/content/cta-schema";
import type { CtaPlacement } from "@/lib/domain/content/types";
import { isPubliclyVisible } from "@/lib/domain/content/visibility";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { loadCmsSnapshot } from "@/lib/server/cms/context";

export const metadata: Metadata = { title: "CTAs e destaques da Home" };

/** O que acontece no site quando a posição fica sem nenhum botão publicado. */
const WITHOUT_LIVE_CTA: Partial<Record<CtaPlacement, string>> = {
  "home-hero": "Nenhum botão publicado: o topo da Home fica só com o manifesto.",
  "home-highlight": "Nenhum botão publicado: a faixa final da Home não aparece.",
};

/** CTAs (ADM-11), agrupados porque a ordem só vale dentro da mesma posição. */
export default async function CtasAdminPage({ searchParams }: PageProps<"/admin/ctas">) {
  const user = await requirePageAccess("cta", "view", "/admin/ctas");
  const [snapshot, query] = await Promise.all([loadCmsSnapshot(), searchParams]);
  const now = new Date();
  const placements = CTA_PLACEMENTS.filter(
    (placement) =>
      CTA_PLACEMENTS_ON_SITE.includes(placement) || snapshot.ctas.some((cta) => cta.placement === placement),
  );
  return (
    <>
      <CmsHeader
        title="CTAs e destaques da Home"
        description="Os botões do site são editados aqui, sem mexer em código. Todo CTA novo nasce como rascunho e só aparece depois de publicado."
      >
        {can(user.role, "cta", "create") ? <CmsLinkButton href="/admin/ctas/novo">Novo CTA</CmsLinkButton> : null}
      </CmsHeader>
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <div className="space-y-8">
        {placements.map((placement) => {
          const rows = snapshot.ctas.filter((cta) => cta.placement === placement);
          const onSite = CTA_PLACEMENTS_ON_SITE.includes(placement);
          const notice = !rows.some((cta) => isPubliclyVisible(cta, now)) ? WITHOUT_LIVE_CTA[placement] : undefined;
          return (
            <section key={placement} aria-labelledby={`posicao-${placement}`}>
              <h2 id={`posicao-${placement}`} className="studio-titulo-secao">
                {CTA_PLACEMENT_LABELS[placement]}
              </h2>
              {onSite ? null : (
                <p className="mt-1 text-sm text-studio-suave">
                  O site ainda não mostra botões nesta posição: publicar aqui não muda nenhuma página.
                </p>
              )}
              {notice && rows.length ? <p className="mt-1 text-sm text-studio-suave">{notice}</p> : null}
              <div className="mt-3">
                <CmsTable
                  basePath="/admin/ctas"
                  extraHeader="Destino"
                  rows={rows.map((cta) => ({
                    ...cta,
                    title: cta.label,
                    extra: <span className="break-all">{describeCtaTarget(cta.target, snapshot)}</span>,
                  }))}
                  empty={<p>{notice ?? "Nenhum botão nesta posição."}</p>}
                />
              </div>
            </section>
          );
        })}
      </div>
      <HomeHighlights
        services={snapshot.services}
        cases={snapshot.cases.map((item) => ({ ...item, name: item.title }))}
        now={now}
      />
    </>
  );
}
