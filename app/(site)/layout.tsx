/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : layout.tsx
 Descrição    : Layout do site público com cabeçalho, conteúdo e rodapé.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 13/10/2026 Vinícius Nishimura Reis  JSON-LD de Organization e WebSite (SEO da landing).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
──────────────────────────────────────────────────────────────────────────────
*/

import { cacheLife } from "next/cache";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SkipLink } from "@/components/layout/skip-link";
import { MotionGate } from "@/components/motion/motion-gate";
import { MotionLoader } from "@/components/motion/motion-loader";
import { MotionRoot } from "@/components/motion/motion-root";
import { JsonLd } from "@/components/seo/json-ld";
import { siteUrl } from "@/lib/config/public-env";
import { organizationSchema, websiteSchema } from "@/lib/domain/seo/structured-data";
import { getSiteSettings } from "@/lib/server/content/repository";

/** Ano do copyright cacheado (Cache Components não permite `new Date()` fora de cache). */
async function copyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

/** Layout do site público: link de pular, cabeçalho, conteúdo e rodapé. */
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [settings, year] = await Promise.all([getSiteSettings(), copyrightYear()]);
  return (
    <>
      <MotionGate />
      <MotionLoader tagline={settings.tagline} />
      <JsonLd data={[organizationSchema(settings, siteUrl), websiteSchema(settings, siteUrl)]} />
      <SkipLink />
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter settings={settings} year={year} />
      <MotionRoot />
    </>
  );
}
