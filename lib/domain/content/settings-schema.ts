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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-03).
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 04/11/2026 Vinícius Nishimura Reis  Regras de contato e redes e formulário do painel (ADM-10).
──────────────────────────────────────────────────────────────────────────────
*/

import { z } from "zod";
import type { SiteSettings } from "./types";

const FILL_IN = "Preencha este campo.";
const text = (max: number) =>
  z.string({ error: FILL_IN }).trim().min(1, FILL_IN).max(max, `Use no máximo ${max} caracteres.`);
const HTTPS_ONLY = "Use um link completo, começando com https://.";

/** Limites de tamanho mostrados no formulário; slogan e descrição seguem as colunas do banco. */
export const SETTINGS_LIMITS = { tagline: 120, description: 300, address: 200 } as const;

function parsedUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/**
 * Link externo que o site pode publicar: só https, em domínio público e sem usuário e senha na
 * URL (`https://instagram.com@golpe.com` abriria outro site). `normalize` grava a forma canônica,
 * porque `https:exemplo.com` passa pelo `new URL`, mas no navegador vira caminho relativo.
 */
const httpsUrl = z
  .url({ protocol: /^https$/, hostname: z.regexes.domain, normalize: true, abort: true, error: HTTPS_ONLY })
  .max(500, "Use no máximo 500 caracteres.")
  .refine((value) => {
    const url = parsedUrl(value);
    return !url?.username && !url?.password;
  }, HTTPS_ONLY);

/** Link de rede social: o domínio da rede ou um subdomínio dele (`br.linkedin.com`). */
const networkUrl = (network: string, domain: string) =>
  httpsUrl.refine((value) => {
    const host = parsedUrl(value)?.hostname ?? "";
    return host === domain || host.endsWith(`.${domain}`);
  }, `Use um link do ${network}, como https://www.${domain}/nome-do-perfil.`);

const PHONE_CHARACTERS = /^\+?[0-9 ().-]+$/;
const PHONE_DIGITS = { min: 8, max: 15 };
const phoneField = z
  .string()
  .trim()
  .max(30, "Use no máximo 30 caracteres.")
  .refine((value) => {
    const digits = value.replace(/\D/g, "").length;
    return PHONE_CHARACTERS.test(value) && digits >= PHONE_DIGITS.min && digits <= PHONE_DIGITS.max;
  }, "Use só números, espaços, parênteses e hífen, com DDD. Exemplo: (11) 3333-3333.");

/*
 * As colunas jsonb de site_settings (manifesto, about, contact, socials) só garantem que o
 * valor é um objeto. O formato de cada uma é validado aqui, com o mesmo contrato de
 * SiteSettings (lib/domain/content/types.ts).
 */
export const manifestoSchema = z.object({
  title: text(160),
  paragraphs: z.array(text(600)).min(1, "Escreva ao menos um parágrafo.").max(6, "Use no máximo 6 parágrafos."),
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
  email: z
    .email({ error: "Use um e-mail válido, como contato@exemplo.com.br." })
    .max(254, "Use no máximo 254 caracteres.")
    .optional(),
  phone: phoneField.optional(),
  address: text(SETTINGS_LIMITS.address).optional(),
  mapsUrl: httpsUrl.optional(),
});

export const socialsSchema = z.object({
  instagram: networkUrl("Instagram", "instagram.com").optional(),
  tiktok: networkUrl("TikTok", "tiktok.com").optional(),
  linkedin: networkUrl("LinkedIn", "linkedin.com").optional(),
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

/** O que o painel edita. Manifesto e Sobre ficam de fora: têm blocos publicáveis (ADM-05). */
export type EditableSettings = Pick<SiteSettings, "tagline" | "description" | "contact" | "socials">;

/** No formulário, campo em branco é campo ausente: nada é gravado e o site não mostra o item. */
const blankIsAbsent = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (typeof value === "string" ? value.trim() || undefined : value), schema);

const withoutAbsent = <T extends object>(values: T): T =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined)) as T;

/**
 * Campos do formulário do painel, um por nome (ADM-10). Reaproveita as regras de leitura acima:
 * o que o painel aceita é exatamente o que o site aceita exibir.
 */
export const settingsFormSchema = z
  .object({
    tagline: text(SETTINGS_LIMITS.tagline).min(2, "Use ao menos 2 caracteres."),
    description: text(SETTINGS_LIMITS.description).min(
      50,
      "Use ao menos 50 caracteres: este texto também aparece nas buscas.",
    ),
    email: blankIsAbsent(contactSchema.shape.email),
    phone: blankIsAbsent(contactSchema.shape.phone),
    address: blankIsAbsent(contactSchema.shape.address),
    mapsUrl: blankIsAbsent(contactSchema.shape.mapsUrl),
    instagram: blankIsAbsent(socialsSchema.shape.instagram),
    tiktok: blankIsAbsent(socialsSchema.shape.tiktok),
    linkedin: blankIsAbsent(socialsSchema.shape.linkedin),
  })
  .superRefine((values, context) => {
    // O site só mostra o mapa como link do endereço: sem endereço, o link não apareceria.
    if (values.mapsUrl && !values.address) {
      context.addIssue({
        code: "custom",
        path: ["address"],
        message: "Preencha o endereço: o mapa abre a partir dele.",
      });
    }
  })
  .transform(
    ({ tagline, description, email, phone, address, mapsUrl, instagram, tiktok, linkedin }) =>
      ({
        tagline,
        description,
        contact: withoutAbsent({ email, phone, address, mapsUrl }),
        socials: withoutAbsent({ instagram, tiktok, linkedin }),
      }) satisfies EditableSettings,
  );

const SETTINGS_FIELDS = [
  "tagline",
  "description",
  "email",
  "phone",
  "address",
  "mapsUrl",
  "instagram",
  "tiktok",
  "linkedin",
] as const;

export type SettingsField = (typeof SETTINGS_FIELDS)[number];

/** Nomes dos campos que mudaram. A auditoria guarda só os nomes: contato pode ter dado pessoal. */
export function changedSettingsFields(current: EditableSettings, next: EditableSettings): SettingsField[] {
  const flat = ({ tagline, description, contact, socials }: EditableSettings) =>
    ({ tagline, description, ...contact, ...socials }) as Partial<Record<SettingsField, string>>;
  const before = flat(current);
  const after = flat(next);
  return SETTINGS_FIELDS.filter((field) => before[field] !== after[field]);
}
