/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Visão geral dos conteúdos do painel: estado de cada item e o que precisa de revisão.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-18).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { ContentOverviewView } from "@/components/admin/cms/content-overview";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { cmsDeps } from "@/lib/server/cms/context";
import { loadContentOverview } from "@/lib/server/cms/overview";

export const metadata: Metadata = { title: "Visão geral dos conteúdos" };

/**
 * Rota própria, e não o início do painel: quem entra em /admin não espera a leitura de todo o
 * conteúdo, e uma falha do banco aqui (tratada por error.tsx, com o menu de pé) não derruba a entrada.
 */
export default async function ContentOverviewPage() {
  const user = await requirePageAccess("dashboard", "view", "/admin/conteudos");
  const overview = await loadContentOverview((await cmsDeps()).store, user.role, new Date());
  return (
    <>
      <CmsHeader title="Visão geral dos conteúdos" trail={[{ label: "Visão geral" }]} />
      <p className="mb-6 max-w-3xl text-benja-grafite/80">
        Páginas, áreas, serviços, categorias e cases em um lugar só: o que está publicado e o que precisa da sua
        atenção.
      </p>
      <ContentOverviewView overview={overview} />
    </>
  );
}
