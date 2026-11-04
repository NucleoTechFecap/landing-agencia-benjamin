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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-02).
 13/10/2026 Vinícius Nishimura Reis  Guarda de página e menu filtrado pelo papel (ADM-03).
 26/10/2026 Vinícius Nishimura Reis  Link para o CMS de áreas (ADM-07).
 26/10/2026 Vinícius Nishimura Reis  Link para o CMS de serviços (ADM-06).
 26/10/2026 Vinícius Nishimura Reis  Links para cases e biblioteca de mídia (ADM-08).
 29/10/2026 Caio Moraes              Cores via tokens do tema (ADM-04).
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 04/11/2026 Vinícius Nishimura Reis  Módulos vêm do registro único, com o card inteiro clicável (ADM-04).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import Link from "next/link";
import { modulesFor } from "@/lib/config/admin-modules";
import { requirePageAccess } from "@/lib/server/auth/guards";

export const metadata: Metadata = { title: "Início" };

/**
 * Início do painel: os mesmos módulos do menu, filtrados pelo papel. Não lê conteúdo, então
 * continua de pé se o banco falhar — quem lê é a tela de cada módulo.
 */
export default async function AdminHomePage() {
  const user = await requirePageAccess("dashboard", "view", "/admin");
  return (
    <section>
      <h1 className="text-3xl font-black text-benja-verde">Bem-vindo(a) ao painel</h1>
      <p className="mt-2 max-w-2xl text-benja-grafite/80">
        Aqui a equipe da Agência Benjamin atualiza o site sem depender do NúcleoTech. Os módulos com link já funcionam;
        os demais estão em construção.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {modulesFor(user.role).map((module) => (
          <li
            key={module.name}
            className="relative rounded-2xl border-2 border-benja-verde/15 bg-white p-5 has-[a:hover]:border-benja-verde"
          >
            {module.href ? (
              <Link
                href={module.href}
                prefetch={false}
                className="font-bold text-benja-verde underline-offset-4 after:absolute after:inset-0 hover:underline"
              >
                {module.name}
              </Link>
            ) : (
              <p className="font-bold">{module.name}</p>
            )}
            <p className="mt-1 text-xs text-benja-grafite/80">
              {module.href ? "Disponível" : `Em construção · ${module.issue}`}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
