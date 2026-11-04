/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : content-board.tsx
 Descrição    : Lista de conteúdo com busca, filtro de estado e visão em cartões ou tabela.

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

"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { BrandIcon } from "@/components/ui/brand-icon";
import { PUBLICATION_STATUS_LABELS, type PublicationStatus } from "@/lib/domain/content/publication-status";
import { StudioIcon } from "../ui/icons";
import { EmptyPanel } from "../ui/primitives";
import { CmsTable, formatDateTime, type CmsRow } from "./cms-table";
import { StatusBadge, badgeBase } from "./status-badge";

export interface BoardItem extends Omit<CmsRow, "extra"> {
  /** Cliente e categoria, ou áreas: a linha sob o nome no cartão e a coluna extra na tabela. */
  subtitle?: string;
  description?: string;
  /** Capa do case, quando o item é visual. */
  coverSrc?: string;
  /** Ícone do brandbook, quando o item tem um (serviço, área). */
  icon?: string;
  featured?: boolean;
}

export type BoardView = "cartoes" | "tabela";

const STATUS_OPTIONS: PublicationStatus[] = ["published", "draft", "archived"];

/** O que a pessoa digitou casa com o nome ou com a linha de apoio, sem diferenciar acento nem caixa. */
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR");

export function matchesBoardFilter(
  item: Pick<BoardItem, "title" | "subtitle" | "status">,
  search: string,
  status: PublicationStatus | "",
): boolean {
  if (status && item.status !== status) return false;
  const term = normalize(search.trim());
  if (!term) return true;
  return normalize(`${item.title} ${item.subtitle ?? ""}`).includes(term);
}

/* A escolha entre cartões e tabela é só desta pessoa, neste navegador. Fica guardada fora do React para
   a primeira renderização, igual à do servidor, não trocar de visão no meio da hidratação. */
const viewListeners = new Set<() => void>();

function readView(key: string): BoardView | null {
  try {
    const saved = window.localStorage.getItem(key);
    return saved === "cartoes" || saved === "tabela" ? saved : null;
  } catch {
    return null;
  }
}

function saveView(key: string, view: BoardView) {
  try {
    window.localStorage.setItem(key, view);
  } catch {
    // Navegação privada ou armazenamento bloqueado: a escolha só não fica salva.
  }
  viewListeners.forEach((listener) => listener());
}

function subscribeToView(listener: () => void) {
  viewListeners.add(listener);
  return () => viewListeners.delete(listener);
}

function BoardCard({ item, basePath }: { item: BoardItem; basePath: string }) {
  const visual = item.coverSrc !== undefined;
  return (
    <li className="studio-card studio-card-ativo relative flex min-w-0 flex-col overflow-hidden">
      {visual ? (
        <div className="relative aspect-[16/10] bg-studio-realce">
          {item.coverSrc ? (
            <Image
              src={item.coverSrc}
              alt=""
              fill
              unoptimized
              sizes="(min-width: 80rem) 25vw, (min-width: 40rem) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <p className="studio-reticula flex h-full items-center justify-center text-xs font-bold text-studio-suave">
              Sem capa
            </p>
          )}
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          {item.icon ? <BrandIcon name={item.icon} color="verde" size={40} className="shrink-0" /> : null}
          <div className="min-w-0">
            <Link
              href={`${basePath}/${item.id}`}
              prefetch={false}
              className="font-extrabold wrap-anywhere text-benja-verde underline-offset-4 focus-visible:outline-current! after:absolute after:inset-0 hover:underline"
            >
              {item.title}
            </Link>
            {item.subtitle ? <p className="mt-0.5 text-xs wrap-anywhere text-studio-suave">{item.subtitle}</p> : null}
          </div>
        </div>
        {item.description ? <p className="line-clamp-2 text-sm text-studio-suave">{item.description}</p> : null}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <StatusBadge status={item.status} provisional={item.provisional} />
            {item.featured ? (
              <span className={`${badgeBase} border-benja-verde bg-benja-nyanza text-benja-verde`}>
                <StudioIcon name="estrela" size={12} />
                Destaque
              </span>
            ) : null}
          </span>
          <p className="text-xs whitespace-nowrap text-studio-suave">{formatDateTime(item.updatedAt)}</p>
        </div>
      </div>
    </li>
  );
}

function CardGrid({ items, basePath }: { items: BoardItem[]; basePath: string }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {items.map((item) => (
        <BoardCard key={item.id} item={item} basePath={basePath} />
      ))}
    </ul>
  );
}

/**
 * Lista de conteúdo com busca, filtro de estado e duas visões. Filtra no navegador o que o servidor já
 * mandou: as listas do painel são curtas e chegam inteiras. Quem protege os dados é a página, não esta tela.
 */
export function ContentBoard({
  items,
  basePath,
  itemLabel,
  extraHeader,
  storageKey,
  empty,
}: {
  items: BoardItem[];
  basePath: string;
  /** Como o item é chamado na busca ("case", "serviço"). */
  itemLabel: string;
  extraHeader?: string;
  storageKey: string;
  empty: ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PublicationStatus | "">("");
  const searchId = useId();
  const statusId = useId();
  const view =
    useSyncExternalStore(
      subscribeToView,
      () => readView(storageKey),
      () => null,
    ) ?? "cartoes";

  if (!items.length) return <EmptyPanel>{empty}</EmptyPanel>;

  const sorted = [...items].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "pt-BR"));
  const visible = sorted.filter((item) => matchesBoardFilter(item, search, status));
  const active = visible.filter((item) => item.status !== "archived");
  const archived = visible.filter((item) => item.status === "archived");
  const filtering = Boolean(search.trim() || status);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-60">
          <label htmlFor={searchId} className="text-sm font-bold">
            Buscar {itemLabel}
          </label>
          <div className="relative mt-1">
            <StudioIcon
              name="busca"
              size={18}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-studio-suave"
            />
            <input
              id={searchId}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full pl-10!"
            />
          </div>
        </div>
        <div className="min-w-40">
          <label htmlFor={statusId} className="text-sm font-bold">
            Estado
          </label>
          <select
            id={statusId}
            value={status}
            onChange={(event) => setStatus(event.target.value as PublicationStatus | "")}
            className="mt-1 w-full"
          >
            <option value="">Todos</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {PUBLICATION_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
        <div
          role="group"
          aria-label="Forma de ver a lista"
          className="flex rounded-full border-[1.5px] border-benja-verde bg-white"
        >
          {(
            [
              { id: "cartoes", label: "Cartões", icon: "cartoes" },
              { id: "tabela", label: "Tabela", icon: "tabela" },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={view === option.id}
              onClick={() => saveView(storageKey, option.id)}
              className={`flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-bold transition duration-150 ease-studio ${
                view === option.id ? "bg-benja-verde text-benja-nyanza" : "text-benja-verde hover:bg-studio-realce"
              }`}
            >
              <StudioIcon name={option.icon} size={16} />
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <p aria-live="polite" className="text-sm text-studio-suave">
        {visible.length} de {items.length} {items.length === 1 ? "item" : "itens"}
      </p>
      {!visible.length ? (
        <EmptyPanel title="Nada encontrado.">Tente outra busca ou limpe o filtro de estado.</EmptyPanel>
      ) : view === "tabela" ? (
        <CmsTable
          basePath={basePath}
          extraHeader={extraHeader}
          rows={visible.map((item) => ({ ...item, extra: item.subtitle }))}
          empty={empty}
        />
      ) : (
        <div className="space-y-5">
          {active.length ? <CardGrid items={active} basePath={basePath} /> : null}
          {archived.length ? (
            // Com filtro, o arquivado foi pedido: fica aberto.
            <details open={filtering || undefined} className="studio-card p-4">
              <summary className="flex min-h-11 cursor-pointer items-center font-bold">
                Arquivados ({archived.length})
              </summary>
              <div className="mt-3">
                <CardGrid items={archived} basePath={basePath} />
              </div>
            </details>
          ) : null}
        </div>
      )}
    </div>
  );
}
