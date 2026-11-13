/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Gestão de convites e acesso ao painel.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Tela de usuários (ADM-01).
════════════════════════════════════════════════════════════════════════════════
*/
import type { Metadata } from "next";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { InviteForm, UserControls } from "@/components/admin/users/user-forms";
import { can, canAssignRole, ROLE_LABELS, ROLES } from "@/lib/domain/auth/rbac";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { listPanelProfiles } from "@/lib/server/users/repository";
import { changeUserActive, changeUserRole, inviteUser } from "./actions";

export const metadata: Metadata = { title: "Usuários e papéis" };
export default async function UsersPage({ searchParams }: PageProps<"/admin/usuarios">) {
  const user = await requirePageAccess("user", "view", "/admin/usuarios");
  const [profiles, query] = await Promise.all([listPanelProfiles(), searchParams]);
  return (
    <>
      <CmsHeader title="Usuários e papéis" description="Convide pessoas e controle quem acessa o painel." />
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        <section aria-labelledby="usuarios-titulo" className="space-y-4">
          <h2 id="usuarios-titulo" className="text-xl font-black text-benja-verde">
            Equipe
          </h2>
          {profiles.length ? (
            profiles.map((item) => {
              const manageable =
                can(user.role, "user", "edit") &&
                canAssignRole(user, { id: item.id, currentRole: item.role }, item.role);
              const roles = ROLES.filter((role) => canAssignRole(user, { id: item.id, currentRole: item.role }, role));
              return (
                <article key={item.id} className="studio-card space-y-3 p-5">
                  <div>
                    <h3 className="font-black text-benja-verde">{item.full_name || "Usuário sem nome"}</h3>
                    <p className="text-sm text-studio-suave">
                      {ROLE_LABELS[item.role]} · {item.active ? "Ativo" : "Desativado"}
                    </p>
                  </div>
                  {manageable ? (
                    <UserControls
                      item={item}
                      roles={roles}
                      roleAction={changeUserRole}
                      activeAction={changeUserActive}
                    />
                  ) : null}
                </article>
              );
            })
          ) : (
            <p>Nenhuma conta cadastrada.</p>
          )}
        </section>
        {can(user.role, "user", "create") ? (
          <section aria-labelledby="convite-titulo">
            <h2 id="convite-titulo" className="mb-4 text-xl font-black text-benja-verde">
              Convidar pessoa
            </h2>
            <div className="studio-card p-4 sm:p-6">
              <InviteForm action={inviteUser} />
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
