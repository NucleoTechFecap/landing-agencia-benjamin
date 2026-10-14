/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Início do painel com os módulos previstos no MVP.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-02).
 13/10/2026 Vinícius Nishimura Reis  Guarda de página e menu filtrado pelo papel (ADM-03).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { can, type Action, type Resource } from "@/lib/domain/auth/rbac";
import { requirePageAccess } from "@/lib/server/auth/guards";

export const metadata: Metadata = { title: "Início" };

const MODULES: { name: string; issue: string; resource: Resource; action: Action }[] = [
  { name: "Páginas e textos institucionais", issue: "ADM-05", resource: "page", action: "view" },
  { name: "Serviços", issue: "ADM-06", resource: "service", action: "view" },
  { name: "Áreas de atuação", issue: "ADM-07", resource: "area", action: "view" },
  { name: "Cases e categorias", issue: "ADM-08", resource: "case", action: "view" },
  { name: "Biblioteca de mídia", issue: "ADM-09", resource: "media", action: "view" },
  { name: "Contato, links e redes sociais", issue: "ADM-10", resource: "settings", action: "view" },
  { name: "CTAs e destaques da Home", issue: "ADM-11", resource: "cta", action: "view" },
  { name: "Leads e feedbacks", issue: "FORM-09", resource: "lead", action: "view" },
  { name: "Usuários e papéis", issue: "INT-08", resource: "user", action: "view" },
  { name: "Trilha de auditoria", issue: "TECH-10", resource: "audit", action: "view" },
];

/**
 * Início do painel: módulos previstos no MVP (implementação nas issues indicadas).
 * O menu mostra só o que o papel pode abrir — a proteção real está em cada página/ação.
 */
export default async function AdminHomePage() {
  const user = await requirePageAccess("dashboard", "view", "/admin");
  const modules = MODULES.filter((module) => can(user.role, module.resource, module.action));
  return (
    <section>
      <h1 className="text-3xl font-black text-[#004a1b]">Bem-vindo(a) ao painel</h1>
      <p className="mt-2 max-w-2xl text-[#231f20]/80">
        Aqui a equipe da Agência Benjamin atualiza o site sem depender do NúcleoTech. Os módulos abaixo estão em
        construção.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((module) => (
          <li key={module.issue} className="rounded-2xl border-2 border-[#004a1b]/15 bg-white p-5">
            <p className="font-bold">{module.name}</p>
            <p className="mt-1 text-xs text-[#231f20]/60">Em construção · {module.issue}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
