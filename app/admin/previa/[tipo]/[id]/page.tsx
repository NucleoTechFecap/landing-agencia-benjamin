/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Prévia protegida de serviço, case ou página, lida direto da fonte e fora do cache público.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-14).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { PreviewBanner } from "@/components/admin/cms/preview-banner";
import { AboutPreview } from "@/components/sections/about-preview";
import { CaseDetailSections } from "@/components/sections/case-detail";
import { HeroManifesto } from "@/components/sections/hero-manifesto";
import { PageBlocks } from "@/components/sections/page-blocks";
import { PageHero } from "@/components/sections/page-hero";
import { ServiceDetailSections } from "@/components/sections/service-detail";
import { LoadingState } from "@/components/ui/states";
import {
  caseDetailOf,
  pickOtherServices,
  pickRelatedCases,
  serviceDetailOf,
  toCaseCards,
} from "@/lib/domain/content/details";
import { pagePath } from "@/lib/domain/content/blocks";
import { withPublishedTexts } from "@/lib/domain/content/page-texts";
import { isPreviewType, previewPath, previewResource } from "@/lib/domain/content/preview";
import type { Page } from "@/lib/domain/content/types";
import { visibleSorted } from "@/lib/domain/content/visibility";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { loadCmsSnapshot } from "@/lib/server/cms/context";
import { getSiteSettings } from "@/lib/server/content/repository";

// O noindex vem do layout de /admin e do cabeçalho X-Robots-Tag de next.config.ts.
export const metadata: Metadata = { title: "Prévia" };

/**
 * Mostra o item como o site mostraria (ADM-14), com os mesmos componentes. Lê com a sessão de quem
 * está logado, fora do `use cache`, e não grava nada: um rascunho aberto aqui não chega ao cache
 * público. Fica fora do grupo (painel) para ter a largura do site, e sem o JSON-LD do item.
 */
export default function PreviewPage({ params }: PageProps<"/admin/previa/[tipo]/[id]">) {
  return (
    <Suspense fallback={<LoadingState label="Carregando prévia…" className="p-8 text-sm" />}>
      <Preview params={params} />
    </Suspense>
  );
}

function Frame({ banner, children }: { banner: ReactNode; children: ReactNode }) {
  return (
    <>
      {banner}
      <main id="conteudo" tabIndex={-1} className="outline-none">
        {children}
      </main>
    </>
  );
}

/** Manifesto e "Sobre" tomam o lugar da seção fixa da rota; os demais blocos vêm depois. */
async function PagePreview({ page }: { page: Page }) {
  const settings = withPublishedTexts(await getSiteSettings(), [page]);
  const hasBlock = (type: Page["blocks"][number]["type"]) => page.blocks.some((block) => block.type === type);
  return (
    <>
      {hasBlock("manifesto") ? (
        <HeroManifesto settings={settings} ctas={[]} />
      ) : (
        <PageHero
          eyebrow="Página"
          path={pagePath(page.slug) ?? `/${page.slug}`}
          title={page.title}
          description={page.description ? <p>{page.description}</p> : undefined}
          breadcrumbs={[{ label: "Início", href: "/" }, { label: page.title }]}
        />
      )}
      {hasBlock("about") ? <AboutPreview settings={settings} solutionsSummary="" /> : null}
      <PageBlocks page={page} />
    </>
  );
}

async function Preview({ params }: { params: Promise<{ tipo: string; id: string }> }) {
  const { tipo, id } = await params;
  if (!isPreviewType(tipo)) notFound();
  await requirePageAccess(previewResource(tipo), "view", previewPath(tipo, id));
  const snapshot = await loadCmsSnapshot();
  const now = new Date();

  if (tipo === "servico") {
    const service = snapshot.services.find((item) => item.id === id);
    if (!service) notFound();
    const others = pickOtherServices(
      visibleSorted(snapshot.services, (item) => item.name, now),
      service.id,
    );
    return (
      <Frame banner={<PreviewBanner status={service.status} backHref={`/admin/servicos/${service.id}`} />}>
        <ServiceDetailSections detail={serviceDetailOf(snapshot, service, now)} others={others} />
      </Frame>
    );
  }

  if (tipo === "case") {
    const item = snapshot.cases.find((entry) => entry.id === id);
    if (!item) notFound();
    const detail = caseDetailOf(snapshot, item, now);
    const sameCategory = visibleSorted(
      snapshot.cases.filter((entry) => detail.category && entry.categoryId === detail.category.id),
      (entry) => entry.title,
      now,
    );
    return (
      <Frame banner={<PreviewBanner status={item.status} backHref={`/admin/cases/${item.id}`} />}>
        <CaseDetailSections
          detail={detail}
          related={pickRelatedCases(toCaseCards(snapshot, sameCategory, now), item.id)}
        />
      </Frame>
    );
  }

  const page = snapshot.pages.find((entry) => entry.id === id);
  if (!page) notFound();
  return (
    <Frame
      banner={
        <PreviewBanner
          status={page.status}
          backHref={`/admin/paginas/${page.id}`}
          note="Aqui aparecem os blocos editáveis; as seções fixas da rota ficam de fora."
        />
      }
    >
      <PagePreview page={page} />
    </Frame>
  );
}
