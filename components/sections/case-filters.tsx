/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : case-filters.tsx
 Descrição    : Filtros do portfólio por categoria, serviço, área e cliente (funciona sem JS).

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import Form from "next/form";
import Link from "next/link";

export interface FilterOption {
  slug: string;
  name: string;
}

export interface ActiveFilters {
  categoria?: string;
  servico?: string;
  area?: string;
  cliente?: string;
}

const selectClass =
  "w-full rounded-2xl border-2 border-benja-noite bg-white px-4 py-3 text-sm font-semibold text-benja-noite focus:ring-4 focus:ring-benja-lima/40";

/**
 * Filtros do portfólio por categoria, serviço e área (CASE-03). Formulário GET com
 * <Form> do Next: navegação no cliente quando há JS e funcionamento nativo sem JS.
 */
export function CaseFilters({
  categories,
  services,
  areas,
  clients,
  active,
}: {
  categories: FilterOption[];
  services: FilterOption[];
  areas: FilterOption[];
  clients: string[];
  active: ActiveFilters;
}) {
  const hasFilters = Boolean(active.categoria || active.servico || active.area || active.cliente);
  return (
    <div className="rounded-3xl border-2 border-benja-noite bg-benja-nyanza p-5 text-benja-noite shadow-sticker">
      <nav aria-label="Filtrar por categoria">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              href="/cases"
              aria-current={!active.categoria ? "true" : undefined}
              className={`inline-block rounded-full border-2 border-benja-noite px-4 py-1.5 text-sm font-bold ${!active.categoria ? "bg-benja-verde text-benja-nyanza" : "bg-white"}`}
            >
              Todos
            </Link>
          </li>
          {categories.map((category) => {
            const current = active.categoria === category.slug;
            return (
              <li key={category.slug}>
                <Link
                  href={`/cases?categoria=${category.slug}`}
                  aria-current={current ? "true" : undefined}
                  className={`inline-block rounded-full border-2 border-benja-noite px-4 py-1.5 text-sm font-bold ${current ? "bg-benja-verde text-benja-nyanza" : "bg-white"}`}
                >
                  {category.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <Form action="/cases" className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto_auto] sm:items-end">
        {active.categoria ? <input type="hidden" name="categoria" value={active.categoria} /> : null}
        <label className="text-xs font-bold tracking-widest uppercase">
          Serviço
          <select name="servico" defaultValue={active.servico ?? ""} className={`mt-1 ${selectClass}`}>
            <option value="">Todos os serviços</option>
            {services.map((service) => (
              <option key={service.slug} value={service.slug}>
                {service.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold tracking-widest uppercase">
          Área
          <select name="area" defaultValue={active.area ?? ""} className={`mt-1 ${selectClass}`}>
            <option value="">Todas as áreas</option>
            {areas.map((area) => (
              <option key={area.slug} value={area.slug}>
                {area.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold tracking-widest uppercase">
          Cliente
          <select name="cliente" defaultValue={active.cliente ?? ""} className={`mt-1 ${selectClass}`}>
            <option value="">Todos os clientes</option>
            {clients.map((client) => (
              <option key={client} value={client}>
                {client}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-full border-2 border-benja-noite bg-benja-lima px-6 py-3 font-bold text-benja-verde shadow-sticker">
          Filtrar
        </button>
        {hasFilters ? (
          <Link href="/cases" className="px-2 py-3 text-center text-sm font-bold underline underline-offset-4">
            Limpar filtros
          </Link>
        ) : null}
      </Form>
    </div>
  );
}
