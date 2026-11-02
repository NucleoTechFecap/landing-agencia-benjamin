/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Listagem de serviços publicados com etapas de trabalho e CTA.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 01/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 13/10/2026 Vinícius Nishimura Reis  Metadados completos e dados estruturados (SEO da landing).
 01/11/2026 Vinícius Nishimura Reis  Estados globais de carregamento, vazio e erro (LAY-07).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { buildMetadata } from "@/lib/server/seo";
import { ServiceCard } from "@/components/cards/service-card";
import { ClosingCta } from "@/components/sections/closing-cta";
import { PageHero } from "@/components/sections/page-hero";
import { ProcessSteps } from "@/components/sections/process-steps";
import { JsonLd } from "@/components/seo/json-ld";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/states";
import { siteUrl } from "@/lib/config/public-env";
import { itemListSchema } from "@/lib/domain/seo/structured-data";
import { getSiteSettings, listServices } from "@/lib/server/content/repository";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(
    {
      title: "Serviços",
      description:
        "Estratégia digital, social media, eventos, produção de conteúdo, copywriting, design e identidade visual, audiovisual, assessoria de imprensa e comunicação interna.",
      path: "/servicos",
      keywords: [
        "serviços de comunicação",
        "agência de comunicação",
        "estratégia digital",
        "social media",
        "audiovisual",
      ],
    },
    await getSiteSettings(),
  );
}

/** Listagem dos serviços publicados (SERV-01). */
export default async function ServicesPage() {
  const services = await listServices();
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
        eyebrow="Serviços"
        title="Comunicação completa, feita por quem está chegando com tudo"
        description={
          <p>
            {services.length > 0
              ? `${services.length} serviços que se combinam conforme o objetivo do seu projeto.`
              : "Nossa lista de serviços está sendo atualizada."}
          </p>
        }
        path="/servicos"
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Serviços" }]}
        icon="megafone"
      />
      <Section tone="nyanza" labelledBy="lista-servicos">
        <h2 id="lista-servicos" className="sr-only">
          Lista de serviços
        </h2>
        {services.length > 0 ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <li key={service.id}>
                <ServiceCard service={service} index={index} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState action={{ href: "/contato#formulario", label: "Conte o que você precisa" }}>
            Os serviços estão sendo atualizados. Enquanto isso, a equipe responde pelo formulário de contato.
          </EmptyState>
        )}
      </Section>
      <ProcessSteps />
      <ClosingCta
        title="Não sabe qual serviço escolher?"
        description="Conte o seu desafio. A equipe indica a combinação certa de áreas para o seu projeto."
        links={[
          { id: "contato", label: "Conversar sobre meu projeto", href: "/contato#formulario", external: false },
          { id: "cases", label: "Ver cases", href: "/cases", external: false },
        ]}
      />
    </>
  );
}
