/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Linha do tempo de ações administrativas.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Tela de auditoria (TECH-10).
════════════════════════════════════════════════════════════════════════════════
*/
import type { Metadata } from "next";
import Link from "next/link";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { formatDateTime } from "@/components/admin/cms/cms-table";
import { AUDIT_EVENTS, isAuditEvent } from "@/lib/domain/audit/events";
import { isRole, ROLE_LABELS } from "@/lib/domain/auth/rbac";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { listRecentAudit } from "@/lib/server/audit/list";

export const metadata: Metadata = { title: "Histórico de atividades" };
export default async function AuditPage({ searchParams }: PageProps<"/admin/auditoria">) {
  await requirePageAccess("audit", "view", "/admin/auditoria");
  const query = await searchParams;
  const value = typeof query.pagina === "string" ? query.pagina : "";
  const page = /^\d{1,5}$/.test(value) ? Math.max(1, Number(value)) : 1;
  const { events, actors, hasNext } = await listRecentAudit(page);
  const outcome = { success: "Concluída", failure: "Falhou", denied: "Negada" } as const;
  return (
    <>
      <CmsHeader
        title="Histórico de atividades"
        description="Ações registradas no painel, das mais recentes às mais antigas."
      />
      <div className="studio-card overflow-x-auto">
        <table className="studio-tabela">
          <caption className="sr-only">Atividades recentes do painel</caption>
          <thead>
            <tr>
              <th scope="col">Quando</th>
              <th scope="col">Quem</th>
              <th scope="col">Atividade</th>
              <th scope="col">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(event.occurred_at)}</td>
                <td className="px-4 py-3">
                  <span className="font-bold">
                    {event.actor_id ? actors[event.actor_id] || "Usuário indisponível" : "Sistema"}
                  </span>
                  {isRole(event.actor_role) ? (
                    <span className="block text-xs text-studio-suave">{ROLE_LABELS[event.actor_role]}</span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {isAuditEvent(event.event) ? AUDIT_EVENTS[event.event].description : "Atividade registrada"}
                </td>
                <td className="px-4 py-3">{outcome[event.outcome] ?? "Registrada"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 ? <p className="p-5 text-sm">Nenhuma atividade registrada.</p> : null}
      </div>
      <nav aria-label="Páginas do histórico" className="mt-5 flex gap-5 text-sm font-bold">
        {page > 1 ? (
          <Link className="studio-link" href={`/admin/auditoria?pagina=${page - 1}`}>
            Anterior
          </Link>
        ) : null}
        <span>Página {page}</span>
        {hasNext ? (
          <Link className="studio-link" href={`/admin/auditoria?pagina=${page + 1}`}>
            Próxima
          </Link>
        ) : null}
      </nav>
    </>
  );
}
