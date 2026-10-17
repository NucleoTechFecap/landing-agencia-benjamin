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
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { BrandIcon } from "@/components/ui/brand-icon";
import { ButtonLink } from "@/components/ui/button-link";
import { Section } from "@/components/ui/section";
import { getSiteSettings } from "@/lib/server/content/repository";

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
  const [settings, year] = await Promise.all([getSiteSettings(), copyrightYear()]);
  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="flex flex-1 flex-col">
        <Section
          tone="lima"
          halftone
          className="flex flex-1 items-center"
          containerClassName="flex flex-col items-center py-10 text-center"
        >
          <BrandIcon name="seta-curva" color="verde" size={120} className="animate-float" />
          <p className="mt-6 text-sm font-bold tracking-widest uppercase">Erro 404</p>
          <h1 className="mt-2 text-balance text-4xl font-black sm:text-6xl">Essa pauta não saiu do briefing.</h1>
          <p className="mt-4 max-w-xl text-lg">
            A página que você procurou não existe ou foi retirada do ar. Que tal seguir por um destes caminhos?
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/">Voltar ao início</ButtonLink>
            <ButtonLink href="/servicos" variant="secondary">
              Ver serviços
            </ButtonLink>
            <ButtonLink href="/cases" variant="secondary">
              Ver cases
            </ButtonLink>
          </div>
        </Section>
      </main>
      <SiteFooter settings={settings} year={year} />
    </>
  );
}
