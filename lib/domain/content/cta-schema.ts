/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : cta-schema.ts
 Descrição    : Validação do CTA no CMS: posição, destino permitido e regra contra botão circular.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-11).
──────────────────────────────────────────────────────────────────────────────
*/

import { z } from "zod";
import { orderField, publishProblemsOf, uuidField } from "./cms-schema";
import { isValidExternalUrl } from "./integrity";
import type { ContentSnapshot, Cta, CtaPlacement, CtaTarget, Publishable } from "./types";

/** Limites de public.ctas (conferidos com a migration em content-sql.test.ts). */
export const CTA_LIMITS = { labelMin: 2, label: 40, url: 500 } as const;

export const CTA_PLACEMENTS = [
  "home-hero",
  "home-highlight",
  "footer",
  "service-detail",
  "case-detail",
] as const satisfies readonly CtaPlacement[];

export const CTA_TARGET_KINDS = [
  "internal",
  "external",
  "service",
  "case",
  "area",
  "contact",
] as const satisfies readonly CtaTarget["kind"][];

export type CtaTargetKind = CtaTarget["kind"];

/** Posições que o site já exibe. As demais ficam gravadas, mas nenhuma página as lê ainda. */
export const CTA_PLACEMENTS_ON_SITE: readonly CtaPlacement[] = ["home-hero", "home-highlight"];

export const CTA_PLACEMENT_LABELS: Readonly<Record<CtaPlacement, string>> = {
  "home-hero": "Home: topo, junto do manifesto",
  "home-highlight": "Home: faixa final",
  footer: "Rodapé",
  "service-detail": "Página de serviço",
  "case-detail": "Página de case",
};

export const CTA_TARGET_KIND_LABELS: Readonly<Record<CtaTargetKind, string>> = {
  internal: "Página do site",
  external: "Link externo (https)",
  service: "Serviço",
  case: "Case",
  area: "Área de atuação",
  contact: "Formulário de contato",
};

/**
 * Páginas fixas que um CTA pode abrir. A lista é exata, sem `/servicos/qualquer-coisa`: para
 * apontar para um item específico há os destinos Serviço, Case e Área, que seguem o item se o
 * endereço dele mudar e caem no fallback se ele sair do site. Assim o CTA não leva a página
 * inexistente. As chaves são as rotas de PUBLIC_ROUTE_PREFIXES (conferidas em cta-schema.test.ts).
 */
export const CTA_PAGE_LABELS: Readonly<Record<string, string>> = {
  "/": "Home",
  "/sobre": "Sobre",
  "/areas": "Áreas de atuação",
  "/servicos": "Serviços",
  "/cases": "Cases",
  "/contato": "Contato",
  "/feedback": "Feedback",
  "/privacidade": "Privacidade",
};

const isHomePlacement = (placement: CtaPlacement) => placement === "home-hero" || placement === "home-highlight";

/** Mesmo formato do CHECK de public.ctas.target_url: `new URL` sozinho aceitaria espaço no caminho. */
const HTTPS_URL = /^https:\/\/\S+$/;

function externalUrlProblem(url: string): string | null {
  if (!url) return "Informe o link completo, começando com https://.";
  if (url.length > CTA_LIMITS.url) return `Use no máximo ${CTA_LIMITS.url} caracteres.`;
  if (!HTTPS_URL.test(url) || !isValidExternalUrl(url)) {
    return "Use um link completo com https://, sem espaços (ex.: https://exemplo.com).";
  }
  // https://fecap.br@golpe.example abre golpe.example, embora pareça abrir fecap.br.
  const { username, password } = new URL(url);
  return username || password ? "O link não pode trazer usuário ou senha." : null;
}

const SELECT_TARGET = {
  service: "Escolha o serviço de destino.",
  case: "Escolha o case de destino.",
  area: "Escolha a área de destino.",
} as const;

const fields = z.object({
  label: z
    .string({ error: "Escreva o texto do botão." })
    .trim()
    .min(CTA_LIMITS.labelMin, `Escreva o texto do botão (ao menos ${CTA_LIMITS.labelMin} caracteres).`)
    .max(CTA_LIMITS.label, `Use no máximo ${CTA_LIMITS.label} caracteres.`),
  placement: z.enum(CTA_PLACEMENTS, { error: "Escolha onde o botão aparece." }),
  targetKind: z.enum(CTA_TARGET_KINDS, { error: "Escolha o tipo de destino." }),
  targetPath: z.string().trim().optional(),
  targetUrl: z.string().trim().optional(),
  targetId: z.string().trim().optional(),
  order: orderField,
});

/** Formulário validado. Sem `slug`: o CTA não tem endereço próprio. */
export interface CtaInput {
  slug?: undefined;
  label: string;
  placement: CtaPlacement;
  target: CtaTarget;
  order: number;
}

/**
 * O formulário manda só o campo do tipo de destino escolhido; o que vier a mais é ignorado, para
 * nenhum valor antigo sobrar na coluna de outro tipo.
 */
export const ctaInputSchema = fields.transform((values, ctx): CtaInput => {
  const reject = (field: "targetPath" | "targetUrl" | "targetId", message: string) => {
    ctx.addIssue({ code: "custom", path: [field], message });
    return z.NEVER;
  };
  const { label, placement, order } = values;
  const done = (target: CtaTarget): CtaInput => ({ label, placement, order, target });
  const id = values.targetId ?? "";

  switch (values.targetKind) {
    case "internal": {
      const path = values.targetPath ?? "";
      if (!path) return reject("targetPath", "Escolha a página de destino.");
      if (!Object.hasOwn(CTA_PAGE_LABELS, path)) {
        return reject("targetPath", "Escolha uma página da lista: este destino não existe no site.");
      }
      if (path === "/" && isHomePlacement(placement)) {
        return reject("targetPath", "Este botão já fica na Home e levaria para ela mesma. Escolha outra página.");
      }
      return done({ kind: "internal", path });
    }
    case "external": {
      const url = values.targetUrl ?? "";
      const problem = externalUrlProblem(url);
      return problem ? reject("targetUrl", problem) : done({ kind: "external", url });
    }
    case "service":
    case "case":
    case "area": {
      const kind = values.targetKind;
      if (!id) return reject("targetId", SELECT_TARGET[kind]);
      if (!uuidField.safeParse(id).success) return reject("targetId", "Seleção inválida.");
      if (kind === "service") return done({ kind, serviceId: id });
      return done(kind === "case" ? { kind, caseId: id } : { kind, areaId: id });
    }
    case "contact":
      if (!id) return done({ kind: "contact" });
      return uuidField.safeParse(id).success
        ? done({ kind: "contact", serviceId: id })
        : reject("targetId", "Seleção inválida.");
  }
});

/** Valores do formulário a partir do CTA salvo (também usados para revalidar ao publicar). */
export function ctaFormValues(cta: Pick<Cta, "label" | "placement" | "target" | "order">) {
  const { target } = cta;
  const targetId =
    target.kind === "service" || target.kind === "contact"
      ? target.serviceId
      : target.kind === "case"
        ? target.caseId
        : target.kind === "area"
          ? target.areaId
          : undefined;
  return {
    label: cta.label,
    placement: cta.placement,
    targetKind: target.kind,
    targetPath: target.kind === "internal" ? target.path : undefined,
    targetUrl: target.kind === "external" ? target.url : undefined,
    targetId,
    order: cta.order,
  };
}

export const CTA_FIELD_LABELS: Readonly<Record<string, string>> = {
  label: "Texto do botão",
  placement: "Posição",
  targetKind: "Tipo de destino",
  targetPath: "Página",
  targetUrl: "Link",
  targetId: "Destino",
  order: "Ordem",
};

/**
 * O que impede publicar: as mesmas regras do formulário, reaplicadas sobre o CTA salvo. Pega também
 * o destino que foi excluído depois (a coluna vira nula) e linha gravada fora do painel.
 */
export function validateCtaForPublish(cta: Pick<Cta, "label" | "placement" | "target" | "order">): string[] {
  const result = ctaInputSchema.safeParse(ctaFormValues(cta));
  return result.success ? [] : publishProblemsOf(result.error, { ...CTA_FIELD_LABELS });
}

export interface CtaOption {
  value: string;
  label: string;
}

export interface CtaTargetOptions {
  services: CtaOption[];
  cases: CtaOption[];
  areas: CtaOption[];
}

const STATE_SUFFIX: Record<Publishable["status"], string> = {
  draft: " (rascunho)",
  published: "",
  archived: " (arquivado)",
};

/** Item escolhível: o arquivado só entra quando já é o destino atual, para o formulário não o esconder. */
function optionsOf<T extends Publishable & { id: string }>(
  items: readonly T[],
  name: (item: T) => string,
  keep?: string,
) {
  return items
    .filter((item) => item.status !== "archived" || item.id === keep)
    .map((item) => ({ value: item.id, label: `${name(item)}${STATE_SUFFIX[item.status]}` }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

/** Destinos que o formulário oferece. Rascunho pode ser escolhido: o site usa o fallback até publicar (R08). */
export function ctaTargetOptions(
  snapshot: Pick<ContentSnapshot, "services" | "cases" | "areas">,
  current?: CtaTarget,
): CtaTargetOptions {
  const keep = current
    ? ctaFormValues({ label: "", placement: "footer", order: 0, target: current }).targetId
    : undefined;
  return {
    services: optionsOf(snapshot.services, (service) => service.name, keep),
    cases: optionsOf(snapshot.cases, (item) => item.title, keep),
    areas: optionsOf(snapshot.areas, (area) => area.name, keep),
  };
}

/** Destino em uma linha, como aparece na lista do painel. */
export function describeCtaTarget(
  target: CtaTarget,
  snapshot: Pick<ContentSnapshot, "services" | "cases" | "areas">,
): string {
  const gone = "excluído";
  switch (target.kind) {
    case "internal":
      return `Página: ${CTA_PAGE_LABELS[target.path] ?? target.path}`;
    case "external":
      return `Link: ${target.url}`;
    case "service":
      return `Serviço: ${snapshot.services.find((item) => item.id === target.serviceId)?.name ?? gone}`;
    case "case":
      return `Case: ${snapshot.cases.find((item) => item.id === target.caseId)?.title ?? gone}`;
    case "area":
      return `Área: ${snapshot.areas.find((item) => item.id === target.areaId)?.name ?? gone}`;
    case "contact": {
      const service = target.serviceId && snapshot.services.find((item) => item.id === target.serviceId);
      return service ? `Contato, com ${service.name} pré-selecionado` : "Formulário de contato";
    }
  }
}
