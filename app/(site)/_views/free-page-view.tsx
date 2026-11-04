/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Componentes
 Arquivo      : free-page-view.tsx
 Descrição    : Página criada no painel: a abertura e os blocos, na ordem escolhida.

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

import { PageBlocks } from "@/components/sections/page-blocks";
import { PageHero } from "@/components/sections/page-hero";
import { ButtonLink } from "@/components/ui/button-link";
import { pageFields } from "@/lib/domain/content/catalog";
import type { BlockContent } from "@/lib/domain/content/blocks";
import { isExternalHref } from "@/lib/domain/content/fields";
import type { Page } from "@/lib/domain/content/types";
import { getPage } from "@/lib/server/content/repository";

function HeroButtons({ content }: { content: BlockContent<"hero"> }) {
  if (!content.botao && !content.botao2) return null;
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      {content.botao ? (
        <ButtonLink href={content.botao.href} external={isExternalHref(content.botao.href)} variant="lima">
          {content.botao.label}
        </ButtonLink>
      ) : null}
      {content.botao2 ? (
        <ButtonLink href={content.botao2.href} external={isExternalHref(content.botao2.href)} variant="secondary">
          {content.botao2.label}
        </ButtonLink>
      ) : null}
    </div>
  );
}

/**
 * Toda página precisa de um único h1: o primeiro bloco de abertura assume esse papel. Sem ele, o
 * cabeçalho sai do título e da descrição da página, para nunca ficar uma página sem título.
 */
export async function FreePageView({ page }: { page: Page }) {
  const geral = pageFields("site-geral", await getPage("site-geral"));
  const [first] = page.blocks;
  const hero = first?.type === "hero" ? first.content : null;
  const crumbs = [{ label: geral.mensagens.inicio, href: "/" }, { label: page.title }];
  return (
    <>
      {hero ? (
        <PageHero
          eyebrow={hero.etiqueta}
          title={hero.titulo}
          description={hero.texto ? <p>{hero.texto}</p> : undefined}
          path={`/${page.slug}`}
          breadcrumbs={crumbs}
          tone={hero.fundo}
          icon={hero.icone?.name}
          iconColor={hero.icone?.color}
        >
          <HeroButtons content={hero} />
        </PageHero>
      ) : (
        <PageHero
          title={page.title}
          description={page.description ? <p>{page.description}</p> : undefined}
          path={`/${page.slug}`}
          breadcrumbs={crumbs}
        />
      )}
      <PageBlocks page={hero ? { ...page, blocks: page.blocks.slice(1) } : page} />
    </>
  );
}
