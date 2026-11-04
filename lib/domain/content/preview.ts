/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : preview.ts
 Descrição    : Tipos de item com prévia no painel e o endereço de cada um.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-14).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Resource } from "@/lib/domain/auth/rbac";

/** Tipos com página própria no site. Área e categoria só aparecem dentro de outras páginas. */
const PREVIEW_RESOURCES = { servico: "service", case: "case", pagina: "page" } as const satisfies Record<
  string,
  Resource
>;

export type PreviewType = keyof typeof PREVIEW_RESOURCES;

export function isPreviewType(value: string): value is PreviewType {
  return Object.hasOwn(PREVIEW_RESOURCES, value);
}

export const previewResource = (type: PreviewType): Resource => PREVIEW_RESOURCES[type];

export const previewPath = (type: PreviewType, id: string): string => `/admin/previa/${type}/${id}`;
