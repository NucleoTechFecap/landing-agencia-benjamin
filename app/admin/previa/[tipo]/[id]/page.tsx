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
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, type ComponentType, type ReactNode } from "react";
import { PreviewBanner } from "@/components/admin/cms/preview-banner";
import { CaseDetailSections } from "@/components/sections/case-detail";
import { AreasView } from "@/app/(site)/_views/areas-view";
import { CasesView } from "@/app/(site)/_views/cases-view";
import { ContatoView } from "@/app/(site)/_views/contato-view";
import { FeedbackView } from "@/app/(site)/_views/feedback-view";
import { FreePageView } from "@/app/(site)/_views/free-page-view";
import { HomeView } from "@/app/(site)/_views/home-view";
import { PrivacidadeView } from "@/app/(site)/_views/privacidade-view";
import { ServicosView } from "@/app/(site)/_views/servicos-view";
import { SobreView } from "@/app/(site)/_views/sobre-view";
import { SiteThemeStyle } from "@/components/seo/site-theme";
import { ServiceDetailSections } from "@/components/sections/service-detail";
import { LoadingState } from "@/components/ui/states";
import {
  caseDetailOf,
  pickOtherServices,
  pickRelatedCases,
  serviceDetailOf,
  toCaseCards,
} from "@/lib/domain/content/details";
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

async function Frame({ banner, children }: { banner: ReactNode; children: ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <>
      <SiteThemeStyle theme={settings.theme} />
      {banner}
      <main id="conteudo" tabIndex={-1} className="outline-none">
        {children}
      </main>
    </>
  );
}

/** Rotas fixas usam a mesma tela do site, com o rascunho no lugar da versão publicada. */
const ROUTE_VIEWS: Partial<Record<string, ComponentType<{ page: Page | null }>>> = {
  home: HomeView,
  sobre: SobreView,
  areas: AreasView,
  servicos: ServicosView,
  cases: CasesView,
  contato: ContatoView,
  feedback: FeedbackView,
  privacidade: PrivacidadeView,
};

function PagePreview({ page }: { page: Page }) {
  const RouteView = ROUTE_VIEWS[page.slug];
  return RouteView ? <RouteView page={page} /> : <FreePageView page={page} />;
}

async function Preview({ params }: { params: Promise<{ tipo: string; id: string }> }) {
  const { tipo, id } = await params;
  if (!isPreviewType(tipo)) notFound();
  await requirePageAccess(previewResource(tipo), "view", previewPath(tipo, id));
  const snapshot = await loadCmsSnapshot();
  const now = new Date();
  // Os textos em volta são os que estão no ar: só o item aberto aparece como rascunho.
  const publishedPage = (slug: string) =>
    snapshot.pages.find((entry) => entry.slug === slug && entry.status === "published") ?? null;

  if (tipo === "servico") {
    const service = snapshot.services.find((item) => item.id === id);
    if (!service) notFound();
    const others = pickOtherServices(
      visibleSorted(snapshot.services, (item) => item.name, now),
      service.id,
    );
    return (
      <Frame banner={<PreviewBanner status={service.status} backHref={`/admin/servicos/${service.id}`} />}>
        <ServiceDetailSections
          detail={serviceDetailOf(snapshot, service, now)}
          others={others}
          modelo={publishedPage("modelo-servico")}
          geralPage={publishedPage("site-geral")}
        />
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
          modelo={publishedPage("modelo-case")}
          geralPage={publishedPage("site-geral")}
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
          note="É como a página fica com o que está salvo no painel."
        />
      }
    >
      <PagePreview page={page} />
    </Frame>
  );
}
