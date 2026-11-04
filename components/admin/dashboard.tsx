/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : dashboard.tsx
 Descrição    : Blocos do início do painel: abertura, atalhos, indicadores e listas.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (reestruturação do painel).
──────────────────────────────────────────────────────────────────────────────
*/

import Link from "next/link";
import { Sticker } from "@/components/ui/sticker";
import type { DashboardIndicator, QuickAction } from "@/lib/domain/content/dashboard";
import type { OverviewItem } from "@/lib/domain/content/overview";
import { formatDateTime } from "./cms/cms-table";
import { StatusBadge } from "./cms/status-badge";
import { StudioIcon, type StudioIconName } from "./ui/icons";
import { EmptyPanel, StatCard, StudioPanel } from "./ui/primitives";

/** Abertura do início: o único campo de cor forte do painel, como as capas do brandbook. */
export function DashboardHero({ name }: { name: string }) {
  const firstName = name.trim().split(/\s+/)[0];
  return (
    <section className="studio-reticula relative overflow-hidden rounded-studio-xl bg-benja-lima px-6 py-8 sm:px-10 sm:py-10">
      <div className="relative md:pr-52 lg:pr-56">
        <p className="text-sm font-bold text-benja-verde">Olá, {firstName}</p>
        <h1 className="mt-2 text-3xl leading-[1.1] font-black text-balance text-benja-verde sm:text-5xl">
          Bem-vindo(a) ao Benjamin Studio
        </h1>
        <p className="mt-3 max-w-xl font-medium text-benja-noite">
          Gerencie os conteúdos, projetos e informações da Agência Benjamin em um só lugar.
        </p>
      </div>
      <Sticker
        name="poupa-meu-tempo"
        color="verde"
        width={168}
        className="absolute top-1/2 right-8 hidden -translate-y-1/2 rotate-6 md:block lg:right-14"
      />
    </section>
  );
}

const ACTION_LOOK: Record<string, { icon: StudioIconName; tile: string; detail: string }> = {
  "novo-case": { icon: "mais", tile: "bg-benja-verde text-benja-nyanza", detail: "text-benja-claro" },
  "pagina-inicial": { icon: "paginas", tile: "bg-benja-rosa text-benja-noite", detail: "text-benja-noite" },
  servicos: { icon: "servicos", tile: "bg-benja-claro text-benja-verde", detail: "text-benja-verde" },
  informacoes: { icon: "configuracoes", tile: "bg-benja-nyanza text-benja-verde", detail: "text-benja-verde" },
  site: { icon: "site", tile: "bg-white text-benja-verde", detail: "text-studio-suave" },
};

export function QuickActionsGrid({ actions }: { actions: readonly QuickAction[] }) {
  return (
    <section aria-labelledby="acoes-rapidas">
      <h2 id="acoes-rapidas" className="studio-titulo-secao">
        Ações rápidas
      </h2>
      <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {actions.map((action) => {
          const look = ACTION_LOOK[action.key] ?? ACTION_LOOK.site!;
          return (
            <li
              key={action.key}
              className={`studio-card-ativo relative flex min-h-32 flex-col justify-between gap-3 rounded-studio-lg border border-benja-verde/25 p-4 ${look.tile}`}
            >
              <StudioIcon name={look.icon} size={24} />
              <div>
                <Link
                  href={action.href}
                  prefetch={false}
                  target={action.external ? "_blank" : undefined}
                  className="font-extrabold underline-offset-4 focus-visible:outline-current! after:absolute after:inset-0 hover:underline"
                >
                  {action.label}
                  {action.external ? <span className="sr-only"> (abre em nova aba)</span> : null}
                </Link>
                <p className={`mt-1 text-xs leading-snug font-medium ${look.detail}`}>{action.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function IndicatorsGrid({ indicators }: { indicators: readonly DashboardIndicator[] }) {
  if (!indicators.length) return null;
  return (
    <section aria-labelledby="indicadores">
      <h2 id="indicadores" className="studio-titulo-secao">
        Como está o conteúdo
      </h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {indicators.map(({ key, ...indicator }) => (
          <StatCard key={key} {...indicator} />
        ))}
      </ul>
    </section>
  );
}

/** Só aparece para quem pode ler os envios. Número de envios, sem nenhum dado de quem enviou. */
export function InboxPanel({ indicators }: { indicators: readonly DashboardIndicator[] }) {
  if (!indicators.length) return null;
  return (
    <StudioPanel id="caixa-de-entrada" title="Caixa de entrada">
      <ul className="grid grid-cols-2 gap-3">
        {indicators.map(({ key, ...indicator }) => (
          <StatCard key={key} {...indicator} />
        ))}
      </ul>
    </StudioPanel>
  );
}

export function RecentList({ items }: { items: readonly OverviewItem[] }) {
  return (
    <StudioPanel
      id="recentes"
      title="Conteúdos recentes"
      description="Os últimos itens alterados, para retomar o trabalho."
    >
      {items.length ? (
        <ul className="-mx-2 divide-y divide-studio-linha">
          {items.map((item) => (
            <li key={item.editHref} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-2 py-3">
              <div className="min-w-0 flex-1 basis-56">
                <p className="studio-rotulo">{item.groupLabel}</p>
                <Link
                  href={item.editHref}
                  prefetch={false}
                  className="mt-0.5 inline-flex min-h-6 items-center font-semibold wrap-anywhere text-benja-verde underline-offset-4 hover:underline"
                >
                  {item.title}
                  <span className="sr-only">, {item.canEdit ? "editar" : "ver"}</span>
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <StatusBadge status={item.status} provisional={item.provisional} />
                <p className="text-xs whitespace-nowrap text-studio-suave">{formatDateTime(item.updatedAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyPanel title="Ainda não há conteúdo cadastrado.">
          Quando alguém criar ou alterar um item, ele aparece aqui.
        </EmptyPanel>
      )}
    </StudioPanel>
  );
}

const pendingText = (item: OverviewItem) => {
  const pending = item.notes.missing.length + item.notes.warnings.length;
  if (pending) return `${pending} ${pending === 1 ? "pendência" : "pendências"}`;
  return "Texto provisório: aguarda aprovação";
};

export function AttentionList({ items, total }: { items: readonly OverviewItem[]; total: number }) {
  return (
    <StudioPanel
      id="atencao"
      title="Pedem atenção"
      description={total ? `${total} ${total === 1 ? "item" : "itens"} para revisar.` : undefined}
      actions={
        total > items.length ? (
          <Link
            href="/admin/conteudos"
            prefetch={false}
            className="studio-link inline-flex min-h-6 items-center text-sm"
          >
            Ver todos
          </Link>
        ) : null
      }
    >
      {items.length ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.editHref} className="rounded-studio-md bg-studio-papel px-3 py-2.5">
              <Link
                href={item.editHref}
                prefetch={false}
                className="inline-flex min-h-6 items-center text-sm font-semibold wrap-anywhere text-benja-verde underline-offset-4 hover:underline"
              >
                {item.title}
              </Link>
              <p className="mt-0.5 text-xs text-studio-suave">
                {item.groupLabel} · {pendingText(item)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 text-sm text-studio-suave">
          <StudioIcon name="sucesso" className="text-benja-verde" />
          Nada pendente por aqui.
        </p>
      )}
    </StudioPanel>
  );
}
