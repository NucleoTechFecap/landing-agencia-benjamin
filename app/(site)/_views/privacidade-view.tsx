/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : privacidade-view.tsx
 Descrição    : Conteúdo do aviso de privacidade, usado pela rota e pela prévia do painel.

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

import Link from "next/link";
import { PageBlocks } from "@/components/sections/page-blocks";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { isSectionHidden, pageFields } from "@/lib/domain/content/catalog";
import type { Page } from "@/lib/domain/content/types";
import { getPage } from "@/lib/server/content/repository";

/** Âncoras das seções do texto padrão; seção acrescentada no painel ganha o número da posição. */
const SECTION_IDS = ["quem", "dados", "compartilhamento", "retencao", "direitos"];

/**
 * Aviso de privacidade — MINUTA técnica baseada em SEG-01/TECH-08. Texto final, bases
 * legais e contato do encarregado dependem de validação institucional (SEG-02/SEG-10).
 */
export async function PrivacidadeView({ page }: { page: Page | null }) {
  const geralPage = await getPage("site-geral");
  const campos = pageFields("privacidade", page);
  const geral = pageFields("site-geral", geralPage);
  const { abertura, aviso, duvidas } = campos;

  return (
    <>
      <PageHero
        eyebrow={abertura.etiqueta}
        title={abertura.titulo}
        description={abertura.descricao ? <p>{abertura.descricao}</p> : undefined}
        path="/privacidade"
        breadcrumbs={[{ label: geral.mensagens.inicio, href: "/" }, { label: abertura.trilha }]}
        tone={abertura.fundo}
      />
      <Section tone="nyanza">
        <article className="mx-auto max-w-3xl">
          {isSectionHidden(page, "aviso") ? null : (
            <p className="rounded-2xl border-2 border-dashed border-benja-laranja bg-white p-4 text-sm">
              <strong>{aviso.destaque}</strong> {aviso.texto}
            </p>
          )}
          {campos.conteudo.secoes.map((section, index) => {
            const id = SECTION_IDS[index] ?? `secao-${index + 1}`;
            return (
              <section key={id} data-motion="reveal" aria-labelledby={`${id}-titulo`} className="mt-10">
                <h2 id={`${id}-titulo`} className="text-2xl font-black text-benja-verde">
                  {section.titulo}
                </h2>
                {section.corpo.map((paragraph) => (
                  <p key={paragraph} className="mt-3 leading-relaxed text-benja-grafite">
                    {paragraph}
                  </p>
                ))}
              </section>
            );
          })}
          {isSectionHidden(page, "duvidas") ? null : (
            <p className="mt-12 text-sm text-benja-grafite">
              {duvidas.texto}{" "}
              <Link href={duvidas.link.href} className="font-bold underline underline-offset-4">
                {duvidas.link.label}
              </Link>
              .
            </p>
          )}
        </article>
      </Section>
      <PageBlocks page={page} />
    </>
  );
}
