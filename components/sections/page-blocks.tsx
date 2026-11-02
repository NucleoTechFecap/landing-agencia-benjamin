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
 Modificado em: 01/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Site lê páginas e blocos publicados no CMS (INT-03).
 01/11/2026 Vinícius Nishimura Reis  Seção Nosso time como bloco opcional (SOB-03).
──────────────────────────────────────────────────────────────────────────────
*/

import Image from "next/image";
import { publicEnv } from "@/lib/config/public-env";
import { isValidExternalUrl } from "@/lib/domain/content/integrity";
import { isSectionBlock, type BlockContent, type PageBlock } from "@/lib/domain/content/blocks";
import type { Page } from "@/lib/domain/content/types";
import { ProvisionalBadge } from "../ui/badge";
import { ButtonLink } from "../ui/button-link";
import { Section, type SectionTone } from "../ui/section";
import { SectionHeading } from "../ui/section-heading";

const TONES: SectionTone[] = ["nyanza", "claro"];

function RichTextBlock({ id, content, tone }: { id: string; content: BlockContent<"rich-text">; tone: SectionTone }) {
  return (
    <Section tone={tone} labelledBy={content.title ? id : undefined}>
      {content.title ? <SectionHeading id={id} title={content.title} /> : null}
      <div className={`max-w-3xl space-y-4 text-lg leading-relaxed ${content.title ? "mt-6" : ""}`}>
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
      <ul className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${content.title ? "mt-10" : ""}`}>
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
  const known = (src: string) => src.startsWith("/") || src.startsWith(`${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/`);
  return (
    <Section tone={tone} labelledBy={id}>
      <SectionHeading id={id} title={content.title ?? "Nosso time"} />
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                  unoptimized={!known(member.photo.src)}
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
    <Section tone="lima" labelledBy={id}>
      <SectionHeading id={id} title={content.title} description={content.text} />
      <ButtonLink href={content.href} external={isValidExternalUrl(content.href)} className="mt-8">
        {content.label}
      </ButtonLink>
    </Section>
  );
}

function Block({ block, tone }: { block: PageBlock; tone: SectionTone }) {
  const id = `bloco-${block.id}`;
  switch (block.type) {
    case "rich-text":
      return <RichTextBlock id={id} content={block.content} tone={tone} />;
    case "list":
      return <ListBlock id={id} content={block.content} tone={tone} />;
    case "team":
      return <TeamBlock id={id} content={block.content} tone={tone} />;
    case "cta":
      return <CtaBlock id={id} content={block.content} />;
    default:
      return null;
  }
}

/**
 * Blocos publicados de uma página, depois das seções fixas da rota (INT-03). Só texto puro, com
 * o escape do React: o site nunca renderiza HTML vindo do banco. Manifesto e Sobre não entram:
 * eles tomam o lugar da seção fixa (getSiteSettings).
 */
export function PageBlocks({ page }: { page: Page | null }) {
  const blocks = page?.blocks.filter((block) => !isSectionBlock(block.type)) ?? [];
  if (!blocks.length) return null;
  return (
    <>
      {page?.provisional ? (
        <div className="bg-benja-nyanza pt-8 text-center">
          <ProvisionalBadge />
        </div>
      ) : null}
      {blocks.map((block, index) => (
        <Block key={block.id} block={block} tone={TONES[index % TONES.length]} />
      ))}
    </>
  );
}
