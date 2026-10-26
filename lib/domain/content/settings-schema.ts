/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : settings-schema.ts
 Descrição    : Valida a configuração institucional gravada no banco (site_settings).

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { z } from "zod";
import type { SiteSettings } from "./types";

const text = (max: number) => z.string().trim().min(1).max(max);
const httpsUrl = z.url({ protocol: /^https$/, error: "Use um link https." });

/*
 * As colunas jsonb de site_settings (manifesto, about, contact, socials) só garantem que o
 * valor é um objeto. O formato de cada uma é validado aqui, com o mesmo contrato de
 * SiteSettings (lib/domain/content/types.ts).
 */
export const manifestoSchema = z.object({
  title: text(160),
  paragraphs: z.array(text(600)).min(1).max(6),
  provisional: z.boolean().optional(),
});

export const aboutSchema = z.object({
  title: text(160),
  intro: text(1200),
  valueProposition: text(1200),
  howWeWork: text(1200),
  fecapRelation: text(1200),
  provisional: z.boolean().optional(),
});

export const contactSchema = z.object({
  email: z.email().optional(),
  phone: text(40).optional(),
  address: text(200).optional(),
  mapsUrl: httpsUrl.optional(),
});

export const socialsSchema = z.object({
  instagram: httpsUrl.optional(),
  tiktok: httpsUrl.optional(),
  linkedin: httpsUrl.optional(),
});

type SettingsSections = Pick<SiteSettings, "manifesto" | "about" | "contact" | "socials">;

export interface ParsedSections {
  sections: SettingsSections;
  /** Seções inválidas que foram substituídas pelo valor de referência. */
  problems: string[];
}

/**
 * Valida as seções estruturadas da configuração. Uma seção inválida não derruba o site
 * (cabeçalho e rodapé dependem dela em todas as páginas): ela é trocada pelo valor de
 * referência e o problema volta em `problems` para ser registrado em log.
 */
export function parseSettingsSections(
  raw: Record<keyof SettingsSections, unknown>,
  fallback: SettingsSections,
): ParsedSections {
  const problems: string[] = [];
  const section = <T>(name: string, schema: z.ZodType<T>, value: unknown, reference: T): T => {
    const result = schema.safeParse(value);
    if (result.success) return result.data;
    problems.push(`${name}: ${result.error.issues.map((issue) => issue.path.join(".") || issue.message).join(", ")}`);
    return reference;
  };
  return {
    sections: {
      manifesto: section("manifesto", manifestoSchema, raw.manifesto, fallback.manifesto),
      about: section("about", aboutSchema, raw.about, fallback.about),
      contact: section("contact", contactSchema, raw.contact, fallback.contact),
      socials: section("socials", socialsSchema, raw.socials, fallback.socials),
    },
    problems,
  };
}
