/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : not-found.tsx
 Descrição    : Página 404 com identidade visual e caminhos de retorno.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 04/11/2026 Vinícius Nishimura Reis  Textos e imagens editáveis no painel (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteThemeStyle } from "@/components/seo/site-theme";
import { BrandIcon } from "@/components/ui/brand-icon";
import { ButtonLink } from "@/components/ui/button-link";
import { Section } from "@/components/ui/section";
import { pageFields } from "@/lib/domain/content/catalog";
import { isExternalHref } from "@/lib/domain/content/fields";
import { getPage, getSiteSettings } from "@/lib/server/content/repository";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: true },
};

async function copyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

/** 404 com a identidade da marca e caminhos de volta (LAY-09). */
export default async function NotFound() {
  const [settings, year, geralPage] = await Promise.all([getSiteSettings(), copyrightYear(), getPage("site-geral")]);
  const geral = pageFields("site-geral", geralPage);
  const campos = geral.naoEncontrado;
  return (
    <>
      <SiteThemeStyle theme={settings.theme} />
      <SiteHeader campos={geral.cabecalho} logo={settings.theme?.images?.logoHeader} />
      <main id="conteudo" className="flex flex-1 flex-col">
        <Section
          tone={campos.fundo}
          halftone
          className="flex flex-1 items-center"
          containerClassName="flex flex-col items-center py-10 text-center"
        >
          <BrandIcon name={campos.icone.name} color={campos.icone.color} size={120} className="animate-float" />
          {campos.etiqueta ? (
            <p className="mt-6 text-sm font-bold tracking-widest uppercase">{campos.etiqueta}</p>
          ) : null}
          <h1 className="mt-2 text-balance text-4xl font-black sm:text-6xl">{campos.titulo}</h1>
          <p className="mt-4 max-w-xl text-lg">{campos.texto}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {campos.botoes.map(({ botao }, index) => (
              <ButtonLink
                key={`${botao.href}-${index}`}
                href={botao.href}
                external={isExternalHref(botao.href)}
                variant={index === 0 ? "primary" : "secondary"}
              >
                {botao.label}
              </ButtonLink>
            ))}
          </div>
        </Section>
      </main>
      <SiteFooter settings={settings} year={year} geral={geral} logo={settings.theme?.images?.logoFooter} />
    </>
  );
}
