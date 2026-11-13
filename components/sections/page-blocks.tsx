/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : page-blocks.tsx
 Descrição    : Blocos publicados de uma página, depois das seções fixas da rota.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Site lê páginas e blocos publicados no CMS (INT-03).
 01/11/2026 Vinícius Nishimura Reis  Seção Nosso time como bloco opcional (SOB-03).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

import Image from "next/image";
import Link from "next/link";
import { isExternalHref, type IconValue } from "@/lib/domain/content/fields";
import { isSectionBlock, type BlockContent, type PageBlock } from "@/lib/domain/content/blocks";
import type { Page } from "@/lib/domain/content/types";
import { BrandIcon } from "../ui/brand-icon";
import { ButtonLink } from "../ui/button-link";
import { SiteImage, isKnownImageSource } from "../ui/site-image";
import { Section, type SectionTone } from "../ui/section";
import { SectionHeading } from "../ui/section-heading";

const TONES: SectionTone[] = ["nyanza", "claro"];

function RichTextBlock({ id, content, tone }: { id: string; content: BlockContent<"rich-text">; tone: SectionTone }) {
  return (
    <Section tone={tone} labelledBy={content.title ? id : undefined}>
      {content.title ? <SectionHeading id={id} title={content.title} /> : null}
      <div
        data-motion="reveal"
        className={`max-w-3xl space-y-4 text-lg leading-relaxed ${content.title ? "mt-6" : ""}`}
      >
        {content.paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </Section>
  );
}

function ListBlock({ id, content, tone }: { id: string; content: BlockContent<"list">; tone: SectionTone }) {
  return (
    <Section tone={tone} labelledBy={content.title ? id : undefined}>
      {content.title ? <SectionHeading id={id} title={content.title} /> : null}
      <ul data-motion="cards" className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${content.title ? "mt-10" : ""}`}>
        {content.items.map((item, index) => (
          <li key={index} className="rounded-3xl border-2 border-benja-noite bg-white/70 p-7 shadow-sticker">
            <h3 className="text-xl font-black text-benja-verde">{item.title}</h3>
            {item.text ? <p className="mt-3 leading-relaxed text-benja-grafite">{item.text}</p> : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * "Nosso time" (SOB-03). Sem foto, o card mostra só o texto: nada de avatar genérico. A foto do
 * bloco fica gravada como endereço, então um host fora de `images.remotePatterns` (ex.: projeto
 * Supabase trocado) não pode derrubar a página: nesse caso a imagem vai sem otimização.
 */
function TeamBlock({ id, content, tone }: { id: string; content: BlockContent<"team">; tone: SectionTone }) {
  return (
    <Section tone={tone} labelledBy={id}>
      <SectionHeading id={id} title={content.title ?? "Nosso time"} />
      <ul data-motion="cards" className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {content.members.map((member, index) => (
          <li
            key={index}
            className="overflow-hidden rounded-3xl border-2 border-benja-noite bg-white/70 shadow-sticker"
          >
            {member.photo ? (
              <div className="relative aspect-square">
                <Image
                  src={member.photo.src}
                  alt={member.photo.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  unoptimized={!isKnownImageSource(member.photo.src)}
                  className="object-cover"
                />
              </div>
            ) : null}
            <div className="p-6">
              <h3 className="text-xl font-black text-benja-verde">{member.name}</h3>
              {member.role ? <p className="mt-1 text-benja-grafite">{member.role}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function CtaBlock({ id, content }: { id: string; content: BlockContent<"cta"> }) {
  return (
    <Section tone={content.fundo ?? "lima"} labelledBy={id}>
      <SectionHeading id={id} title={content.title} description={content.text} />
      <ButtonLink href={content.href} external={isExternalHref(content.href)} className="mt-8">
        {content.label}
      </ButtonLink>
    </Section>
  );
}

/** Abertura fora do topo: o h1 da página já existe, então aqui é um h2 (free-page-view). */
function HeroBlock({ id, content }: { id: string; content: BlockContent<"hero"> }) {
  return (
    <Section tone={content.fundo} halftone labelledBy={id}>
      {content.icone ? <BlockIcon icon={content.icone} size={96} className="mb-6" /> : null}
      <SectionHeading id={id} eyebrow={content.etiqueta} title={content.titulo} description={content.texto} />
      {content.botao || content.botao2 ? (
        <div data-motion="group" className="mt-8 flex flex-wrap gap-3">
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
      ) : null}
    </Section>
  );
}

function BlockIcon({ icon, size, className }: { icon: IconValue; size: number; className?: string }) {
  return <BrandIcon name={icon.name} color={icon.color} size={size} className={className} />;
}

function MediaTextBlock({ id, content }: { id: string; content: BlockContent<"media-text"> }) {
  const left = content.lado === "esquerda";
  return (
    <Section tone={content.fundo} labelledBy={content.titulo ? id : undefined}>
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div className={left ? "md:order-2" : ""}>
          {content.titulo ? <SectionHeading id={id} title={content.titulo} /> : null}
          <div data-motion="reveal" className={`space-y-4 text-lg leading-relaxed ${content.titulo ? "mt-6" : ""}`}>
            {content.paragrafos.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          {content.botao ? (
            <ButtonLink href={content.botao.href} external={isExternalHref(content.botao.href)} className="mt-8">
              {content.botao.label}
            </ButtonLink>
          ) : null}
        </div>
        <div
          data-motion="image"
          className="relative aspect-[4/3] overflow-hidden rounded-3xl border-2 border-benja-noite"
        >
          <SiteImage
            src={content.imagem.src}
            alt={content.imagem.alt}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </Section>
  );
}

function ImageBlock({ content }: { content: BlockContent<"image"> }) {
  const { src, alt, width, height } = content.imagem;
  return (
    <Section tone={content.fundo}>
      <figure data-motion="image">
        <SiteImage
          src={src}
          alt={alt}
          width={width ?? 1200}
          height={height ?? 750}
          sizes="(min-width: 1152px) 1152px, 100vw"
          className="h-auto w-full rounded-3xl border-2 border-benja-noite"
        />
        {content.legenda ? <figcaption className="mt-3 text-sm">{content.legenda}</figcaption> : null}
      </figure>
    </Section>
  );
}

function CardsBlock({ id, content }: { id: string; content: BlockContent<"cards"> }) {
  return (
    <Section tone={content.fundo} labelledBy={content.titulo ? id : undefined}>
      {content.titulo ? <SectionHeading id={id} title={content.titulo} description={content.descricao} /> : null}
      <ul data-motion="cards" className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${content.titulo ? "mt-10" : ""}`}>
        {content.itens.map((item, index) => (
          <li
            key={index}
            className="flex flex-col overflow-hidden rounded-3xl border-2 border-benja-noite bg-white/70 text-benja-noite shadow-sticker"
          >
            {item.imagem ? (
              <div className="relative aspect-[16/10]">
                <SiteImage
                  src={item.imagem.src}
                  alt={item.imagem.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col p-7">
              {item.icone ? <BlockIcon icon={item.icone} size={56} className="mb-4" /> : null}
              <h3 className="text-xl font-black text-benja-verde">{item.titulo}</h3>
              {item.texto ? <p className="mt-3 leading-relaxed text-benja-grafite">{item.texto}</p> : null}
              {item.link ? (
                isExternalHref(item.link.href) ? (
                  <a
                    href={item.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 font-bold text-benja-verde underline underline-offset-4"
                  >
                    {item.link.label}
                    <span className="sr-only"> (abre em nova aba)</span>
                  </a>
                ) : (
                  <Link href={item.link.href} className="mt-4 font-bold text-benja-verde underline underline-offset-4">
                    {item.link.label}
                  </Link>
                )
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function GalleryBlock({ id, content }: { id: string; content: BlockContent<"gallery"> }) {
  return (
    <Section tone={content.fundo} labelledBy={content.titulo ? id : undefined}>
      {content.titulo ? <SectionHeading id={id} title={content.titulo} /> : null}
      <ul data-motion="cards" className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${content.titulo ? "mt-10" : ""}`}>
        {content.imagens.map(({ imagem }, index) => (
          <li
            key={index}
            className="relative aspect-square overflow-hidden rounded-3xl border-2 border-benja-noite bg-white"
          >
            <SiteImage
              src={imagem.src}
              alt={imagem.alt}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-contain"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** `details` nativo: abre com teclado e sem JavaScript, e o conteúdo fica disponível para busca. */
function FaqBlock({ id, content }: { id: string; content: BlockContent<"faq"> }) {
  return (
    <Section tone={content.fundo} labelledBy={content.titulo ? id : undefined}>
      {content.titulo ? <SectionHeading id={id} title={content.titulo} /> : null}
      <div data-motion="group" className={`max-w-3xl space-y-3 ${content.titulo ? "mt-10" : ""}`}>
        {content.itens.map((item, index) => (
          <details key={index} className="rounded-2xl border-2 border-benja-noite bg-white/70 p-5 text-benja-noite">
            <summary className="cursor-pointer text-lg font-bold">{item.pergunta}</summary>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-benja-grafite">{item.resposta}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

function ButtonsBlock({ id, content }: { id: string; content: BlockContent<"buttons"> }) {
  return (
    <Section tone={content.fundo} labelledBy={content.titulo ? id : undefined}>
      {content.titulo ? <SectionHeading id={id} title={content.titulo} description={content.texto} /> : null}
      {!content.titulo && content.texto ? <p className="text-lg">{content.texto}</p> : null}
      <div data-motion="group" className="mt-8 flex flex-wrap gap-3">
        {content.itens.map((item, index) => (
          <ButtonLink
            key={index}
            href={item.href}
            external={isExternalHref(item.href)}
            variant={index === 0 ? "primary" : "secondary"}
          >
            {item.label}
          </ButtonLink>
        ))}
      </div>
    </Section>
  );
}

function Block({ block, tone }: { block: PageBlock; tone: SectionTone }) {
  const id = `bloco-${block.id}`;
  switch (block.type) {
    case "rich-text":
      return <RichTextBlock id={id} content={block.content} tone={block.content.fundo ?? tone} />;
    case "list":
      return <ListBlock id={id} content={block.content} tone={block.content.fundo ?? tone} />;
    case "team":
      return <TeamBlock id={id} content={block.content} tone={block.content.fundo ?? tone} />;
    case "cta":
      return <CtaBlock id={id} content={block.content} />;
    case "hero":
      return <HeroBlock id={id} content={block.content} />;
    case "media-text":
      return <MediaTextBlock id={id} content={block.content} />;
    case "image":
      return <ImageBlock content={block.content} />;
    case "cards":
      return <CardsBlock id={id} content={block.content} />;
    case "gallery":
      return <GalleryBlock id={id} content={block.content} />;
    case "faq":
      return <FaqBlock id={id} content={block.content} />;
    case "buttons":
      return <ButtonsBlock id={id} content={block.content} />;
    default:
      return null;
  }
}

/**
 * Blocos publicados de uma página, depois das seções fixas da rota (INT-03) ou como todo o conteúdo dela,
 * nas páginas livres. Só texto puro, com
 * o escape do React: o site nunca renderiza HTML vindo do banco. Manifesto e Sobre não entram:
 * eles tomam o lugar da seção fixa (getSiteSettings).
 */
export function PageBlocks({ page }: { page: Page | null }) {
  const blocks = page?.blocks.filter((block) => !isSectionBlock(block.type)) ?? [];
  if (!blocks.length) return null;
  return blocks.map((block, index) => <Block key={block.id} block={block} tone={TONES[index % TONES.length]} />);
}
