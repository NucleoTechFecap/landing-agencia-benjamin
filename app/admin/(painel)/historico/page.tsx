/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Linha do tempo de todas as alterações do site.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { VersionList } from "@/components/admin/cms/version-list";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { cmsDeps } from "@/lib/server/cms/context";
import { listRecentVersions } from "@/lib/server/cms/versions";

const TITLE = "Histórico de alterações";

export const metadata: Metadata = { title: TITLE };

/** A RLS só devolve as versões dos tipos de conteúdo que o papel pode ver. */
export default async function HistoryPage() {
  await requirePageAccess("dashboard", "view", "/admin/historico");
  const versions = await listRecentVersions(await cmsDeps());
  return (
    <>
      <CmsHeader
        title={TITLE}
        description="Quem alterou o quê no site, das alterações mais recentes às mais antigas. Abra uma versão para comparar e restaurar."
      />
      <VersionList versions={versions} withItem empty="As alterações aparecem aqui a partir da primeira edição." />
    </>
  );
}
