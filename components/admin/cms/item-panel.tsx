/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : item-panel.tsx
 Descrição    : Painel lateral do item no CMS: estado, pendências para publicar, avisos e link público.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
──────────────────────────────────────────────────────────────────────────────
*/

import Link from "next/link";
import type { ReactNode } from "react";
import type { Publishable } from "@/lib/domain/content/types";
import { formatDateTime } from "./cms-table";
import { StatusBadge } from "./status-badge";

/**
 * Resumo do item ao lado do formulário. Mostra antes de clicar em "Publicar" o que ainda
 * falta (mesma validação do servidor) e os avisos de integridade do item.
 */
export function ItemPanel({
  item,
  publicHref,
  missing,
  warnings,
  children,
}: {
  item: Publishable;
  publicHref?: string;
  missing: string[];
  warnings: string[];
  children?: ReactNode;
}) {
  return (
    <aside className="space-y-4">
      <section className="space-y-2 rounded-3xl border-2 border-benja-noite/15 bg-white p-5 text-sm">
        <StatusBadge status={item.status} provisional={item.provisional} />
        <p className="text-benja-grafite/80">Atualizado em {formatDateTime(item.updatedAt)}</p>
        {item.publishedAt ? (
          <p className="text-benja-grafite/80">Publicado pela primeira vez em {formatDateTime(item.publishedAt)}</p>
        ) : null}
        {item.status === "published" && publicHref ? (
          <Link
            href={publicHref}
            target="_blank"
            className="inline-block font-bold text-benja-verde underline underline-offset-4"
          >
            Ver no site<span className="sr-only"> (abre em nova aba)</span>
          </Link>
        ) : null}
        {item.provisional ? (
          <p className="rounded-xl bg-benja-creme px-3 py-2">
            Marcado como <strong>provisório</strong>: aguardando texto aprovado pela Benjamin. O go-live é bloqueado
            enquanto houver item provisório publicado.
          </p>
        ) : null}
      </section>
      {item.status !== "published" && item.status !== "archived" && missing.length ? (
        <section className="rounded-3xl border-2 border-benja-laranja bg-white p-5 text-sm">
          <h2 className="font-bold">Para publicar, falta:</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {missing.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {warnings.length ? (
        <section className="rounded-3xl border-2 border-benja-laranja bg-white p-5 text-sm">
          <h2 className="font-bold">Avisos</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {children}
    </aside>
  );
}
