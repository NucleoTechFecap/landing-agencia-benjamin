/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : servicos-view.tsx
 Descrição    : Conteúdo da página Serviços, usado pela rota e pela prévia do painel.

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

import { ServiceCard } from "@/components/cards/service-card";
import { ClosingCta, closingLinks } from "@/components/sections/closing-cta";
import { PageBlocks } from "@/components/sections/page-blocks";
import { PageHero } from "@/components/sections/page-hero";
import { ProcessSteps } from "@/components/sections/process-steps";
import { JsonLd } from "@/components/seo/json-ld";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/states";
import { siteUrl } from "@/lib/config/public-env";
import { isSectionHidden, pageFields } from "@/lib/domain/content/catalog";
import { fillText } from "@/lib/domain/content/fields";
import type { Page } from "@/lib/domain/content/types";
import { itemListSchema } from "@/lib/domain/seo/structured-data";
import { getPage, listServices } from "@/lib/server/content/repository";

/** Listagem dos serviços publicados (SERV-01). */
export async function ServicosView({ page }: { page: Page | null }) {
  const [services, geralPage] = await Promise.all([listServices(), getPage("site-geral")]);
  const campos = pageFields("servicos", page);
  const geral = pageFields("site-geral", geralPage);
  const { abertura, lista, fechamento } = campos;

  return (
    <>
      <JsonLd
        data={itemListSchema(
          "Serviços da Agência Benjamin",
          services.map((service) => ({ name: service.name, path: `/servicos/${service.slug}` })),
          siteUrl,
        )}
      />
      <PageHero
        eyebrow={abertura.etiqueta}
        title={abertura.titulo}
        description={
          <p>
            {services.length > 0 ? fillText(abertura.descricao, { total: services.length }) : abertura.descricaoVazia}
          </p>
        }
        path="/servicos"
        breadcrumbs={[{ label: geral.mensagens.inicio, href: "/" }, { label: abertura.trilha }]}
        tone={abertura.fundo}
        icon={abertura.icone.name}
        iconColor={abertura.icone.color}
      />
      <Section tone={lista.fundo} labelledBy="lista-servicos">
        <h2 id="lista-servicos" className="sr-only">
          Lista de serviços
        </h2>
        {services.length > 0 ? (
          <ul data-motion="cards" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <li key={service.id}>
                <ServiceCard service={service} index={index} ctaLabel={geral.mensagens.saibaMais} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState action={lista.vazioLink}>{lista.vazio}</EmptyState>
        )}
      </Section>
      {isSectionHidden(page, "processo") ? null : <ProcessSteps campos={campos.processo} />}
      <PageBlocks page={page} />
      {isSectionHidden(page, "fechamento") ? null : (
        <ClosingCta
          title={fechamento.titulo}
          description={fechamento.texto}
          sticker={geral.fechamento.sticker.src}
          links={closingLinks(fechamento.botao1, fechamento.botao2)}
        />
      )}
    </>
  );
}
