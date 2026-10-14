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
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Início" };

const MODULES = [
  { name: "Páginas e textos institucionais", issue: "ADM-05" },
  { name: "Serviços", issue: "ADM-06" },
  { name: "Áreas de atuação", issue: "ADM-07" },
  { name: "Cases e categorias", issue: "ADM-08" },
  { name: "Biblioteca de mídia", issue: "ADM-09" },
  { name: "Contato, links e redes sociais", issue: "ADM-10" },
  { name: "CTAs e destaques da Home", issue: "ADM-11" },
  { name: "Leads e feedbacks", issue: "FORM-09" },
];

/** Início do painel: módulos previstos no MVP (implementação nas issues indicadas). */
export default function AdminHomePage() {
  return (
    <section>
      <h1 className="text-3xl font-black text-[#004a1b]">Bem-vindo(a) ao painel</h1>
      <p className="mt-2 max-w-2xl text-[#231f20]/80">
        Aqui a equipe da Agência Benjamin atualiza o site sem depender do NúcleoTech. Os módulos abaixo estão em
        construção.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODULES.map((module) => (
          <li key={module.issue} className="rounded-2xl border-2 border-[#004a1b]/15 bg-white p-5">
            <p className="font-bold">{module.name}</p>
            <p className="mt-1 text-xs text-[#231f20]/60">Em construção · {module.issue}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
