/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : inbox.ts
 Descrição    : Regras puras da consulta de envios no painel: permissão por tipo, filtros, paginação e exibição.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (FORM-09).
──────────────────────────────────────────────────────────────────────────────
*/

import { can, type Action, type Role } from "../auth/rbac";
import {
  CONTACT_SUBJECTS,
  FEEDBACK_PROFILES,
  SUBMISSION_KINDS,
  SUBMISSION_KIND_LABELS,
  UNKNOWN_SERVICE,
  type SubmissionKind,
} from "./schemas";

/** Valores do check `form_submissions.status` (um teste compara com a migration). */
export const SUBMISSION_STATUSES = ["novo", "em_atendimento", "respondido", "lido", "arquivado"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  novo: "Novo",
  em_atendimento: "Em atendimento",
  respondido: "Respondido",
  lido: "Lido",
  arquivado: "Arquivado",
};

/**
 * Etapas por tipo (TECH-06 §7, proposta ainda sem aprovação da Benjamin). A separação fica só na
 * aplicação: o banco continua aceitando os cinco valores, para não fixar lá uma decisão pendente.
 */
const STATUS_FLOW: Record<SubmissionKind, readonly SubmissionStatus[]> = {
  lead: ["novo", "em_atendimento", "respondido", "arquivado"],
  contact: ["novo", "em_atendimento", "respondido", "arquivado"],
  feedback: ["novo", "lido", "arquivado"],
};

/** Status que o painel oferece para o tipo. O atual entra sempre, mesmo se veio de fora do fluxo. */
export function statusOptions(kind: SubmissionKind, current?: SubmissionStatus): SubmissionStatus[] {
  const flow = STATUS_FLOW[kind];
  return current && !flow.includes(current) ? [current, ...flow] : [...flow];
}

export function isSubmissionStatus(value: unknown): value is SubmissionStatus {
  return typeof value === "string" && (SUBMISSION_STATUSES as readonly string[]).includes(value);
}

/** Recurso RBAC de cada tipo: contato também tem dados pessoais e segue a regra do lead (TECH-06 §8). */
export const SUBMISSION_RESOURCE = {
  lead: "lead",
  contact: "lead",
  feedback: "feedback",
} as const satisfies Record<SubmissionKind, "lead" | "feedback">;

export function canOnKind(role: Role | null | undefined, kind: SubmissionKind, action: Action): boolean {
  return can(role, SUBMISSION_RESOURCE[kind], action);
}

/** Tipos em que o papel pode executar a ação. Lista vazia significa "sem acesso à tela". */
export function kindsAllowed(role: Role | null | undefined, action: Action): SubmissionKind[] {
  return SUBMISSION_KINDS.filter((kind) => canOnKind(role, kind, action));
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Só o formato canônico chega ao banco: outro texto viraria erro `22P02` do Postgres. */
export function isSubmissionId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/* ─────────────── Filtros e paginação ─────────────── */

export const INBOX_PAGE_SIZE = 20;
export const INBOX_PATH = "/admin/leads";

const PAGE_PATTERN = /^[1-9]\d{0,5}$/;
const CATEGORY_PATTERN = /^(lead|contact|feedback):[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CATEGORY_MAX_LENGTH = 100;

export interface InboxQuery {
  page: number;
  kind?: SubmissionKind;
  status?: SubmissionStatus;
  /** Categoria completa, como gravada: `contact:imprensa`. */
  category?: string;
}

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const kindOfCategory = (category: string) => category.slice(0, category.indexOf(":")) as SubmissionKind;

/**
 * Lê os filtros da URL. Todo valor é conferido contra lista fechada ou padrão fixo: o que estiver
 * fora (página negativa, tipo inventado, tentativa de operador do PostgREST) vira "sem filtro", sem
 * erro e sem eco. `allowedKinds` tira da consulta o que o papel não vê.
 */
export function parseInboxQuery(raw: RawParams, allowedKinds: readonly SubmissionKind[]): InboxQuery {
  const query: InboxQuery = { page: 1 };

  const page = first(raw.pagina);
  if (page && PAGE_PATTERN.test(page)) query.page = Number(page);

  const kind = first(raw.tipo);
  if (allowedKinds.some((allowed) => allowed === kind)) query.kind = kind as SubmissionKind;

  const status = first(raw.status);
  if (isSubmissionStatus(status)) query.status = status;

  const category = first(raw.categoria);
  if (category && category.length <= CATEGORY_MAX_LENGTH && CATEGORY_PATTERN.test(category)) {
    const categoryKind = kindOfCategory(category);
    // Categoria de outro tipo devolveria lista vazia sem explicar por quê: vale o tipo escolhido.
    if (allowedKinds.includes(categoryKind) && (!query.kind || query.kind === categoryKind)) {
      query.category = category;
    }
  }
  return query;
}

/** Intervalo da página para `.range()`, com as duas pontas inclusivas. */
export function pageRange(page: number): { from: number; to: number } {
  const from = (page - 1) * INBOX_PAGE_SIZE;
  return { from, to: from + INBOX_PAGE_SIZE - 1 };
}

export function totalPages(total: number): number {
  return Math.max(1, Math.ceil(total / INBOX_PAGE_SIZE));
}

/** Link da lista com os filtros: só valores já validados, nunca nome ou e-mail (TECH-08). */
export function inboxHref(query: Partial<InboxQuery>): string {
  const params = new URLSearchParams();
  if (query.kind) params.set("tipo", query.kind);
  if (query.status) params.set("status", query.status);
  if (query.category) params.set("categoria", query.category);
  if (query.page && query.page > 1) params.set("pagina", String(query.page));
  const search = params.toString();
  return search ? `${INBOX_PATH}?${search}` : INBOX_PATH;
}

/* ─────────────── Categorias ─────────────── */

export interface CategoryOption {
  value: string;
  label: string;
}

const UNKNOWN_SERVICE_LABEL = "Ainda não sabe";

/**
 * Opções do filtro por categoria. Contato e feedback têm lista fechada; o pedido de projeto usa os
 * serviços do site. Serviço que saiu do site não aparece aqui, mas continua legível na lista.
 */
export function categoryOptions(
  kinds: readonly SubmissionKind[],
  services: readonly { slug: string; name: string }[],
): { kind: SubmissionKind; label: string; options: CategoryOption[] }[] {
  const entries: Record<SubmissionKind, [string, string][]> = {
    lead: [
      [UNKNOWN_SERVICE, UNKNOWN_SERVICE_LABEL],
      ...services.map(({ slug, name }): [string, string] => [slug, name]),
    ],
    contact: Object.entries(CONTACT_SUBJECTS),
    feedback: Object.entries(FEEDBACK_PROFILES),
  };
  return kinds.map((kind) => ({
    kind,
    label: SUBMISSION_KIND_LABELS[kind],
    options: entries[kind].map(([slug, label]) => ({ value: `${kind}:${slug}`, label })),
  }));
}

/** Rótulo da categoria. Slug desconhecido aparece como está: é texto, nunca vira link. */
export function categoryLabel(category: string, services: readonly { slug: string; name: string }[] = []): string {
  const separator = category.indexOf(":");
  if (separator < 0) return category;
  const kind = category.slice(0, separator);
  const slug = category.slice(separator + 1);
  if (kind === "lead") {
    if (slug === UNKNOWN_SERVICE) return UNKNOWN_SERVICE_LABEL;
    return services.find((service) => service.slug === slug)?.name ?? slug;
  }
  const labels: Record<string, string> = kind === "contact" ? CONTACT_SUBJECTS : FEEDBACK_PROFILES;
  return Object.hasOwn(labels, slug) ? labels[slug] : slug;
}

/* ─────────────── Registros exibidos ─────────────── */

/** Linha da lista: sem conteúdo enviado, só o nome (TECH-08 §4). */
export interface InboxItem {
  id: string;
  protocol: string;
  kind: SubmissionKind;
  category: string;
  /** Nulo em feedback anônimo. */
  name: string | null;
  status: SubmissionStatus;
  createdAt: string;
}

export interface InboxPage {
  items: InboxItem[];
  total: number;
  page: number;
  totalPages: number;
}

/** Registro aberto. Hash de IP, impressão digital e erro do provedor não saem do banco. */
export interface SubmissionDetail extends InboxItem {
  payload: unknown;
  /** Vem do navegador e aceita `//evil.com`: é só texto, nunca link. */
  sourcePath: string | null;
  updatedAt: string;
}

export interface PayloadField {
  label: string;
  value: string;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  email: "E-mail",
  phone: "Telefone",
  company: "Empresa",
  serviceInterest: "Serviço de interesse",
  projectDescription: "Descrição do projeto",
  subject: "Assunto",
  profile: "Perfil",
  rating: "Nota",
  message: "Mensagem",
  allowContact: "Deseja retorno",
  privacyConsent: "Ciência do aviso de privacidade",
};

function fieldValue(key: string, value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "object") return JSON.stringify(value);
  const text = String(value);
  if (key === "rating") return `${text} de 5`;
  if (key === "subject" && Object.hasOwn(CONTACT_SUBJECTS, text)) {
    return CONTACT_SUBJECTS[text as keyof typeof CONTACT_SUBJECTS];
  }
  if (key === "profile" && Object.hasOwn(FEEDBACK_PROFILES, text)) {
    return FEEDBACK_PROFILES[text as keyof typeof FEEDBACK_PROFILES];
  }
  return text;
}

/**
 * Transforma o conteúdo gravado em pares rótulo/valor de texto, para a tela nunca interpretar nada
 * como HTML. Campos conhecidos vêm em ordem fixa; os desconhecidos aparecem depois, com a própria
 * chave, para nenhum dado do titular ficar escondido.
 */
export function presentPayload(payload: unknown): PayloadField[] {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return [];
  const data = payload as Record<string, unknown>;
  const known = Object.keys(FIELD_LABELS).filter((key) => Object.hasOwn(data, key));
  const unknown = Object.keys(data).filter((key) => !Object.hasOwn(FIELD_LABELS, key));
  return [...known, ...unknown].flatMap((key) => {
    const value = fieldValue(key, data[key]);
    if (value === null) return [];
    return [{ label: Object.hasOwn(FIELD_LABELS, key) ? FIELD_LABELS[key] : key, value }];
  });
}
