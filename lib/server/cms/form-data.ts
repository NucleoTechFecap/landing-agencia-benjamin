/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : form-data.ts
 Descrição    : Leitura dos campos enviados pelos formulários do painel (FormData).

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 27/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 27/10/2026 Vinícius Nishimura Reis  Correções da revisão de segurança (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { PUBLICATION_COMMANDS, type PublicationCommand } from "@/lib/domain/content/publication";
import { AppError } from "../errors";
import type { ItemRef } from "./content-service";

export const text = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
};

/** Textarea de lista: um item por linha, sem linhas em branco. */
export const lines = (form: FormData, name: string): string[] =>
  text(form, name)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

export const checked = (form: FormData, name: string): boolean => form.get(name) === "on";

/** Grupo de checkboxes com o mesmo `name` (ex.: áreas do serviço). */
/** Valores de um campo múltiplo, sem vazios nem repetidos (um id repetido quebraria o vínculo N:M). */
export const many = (form: FormData, name: string): string[] => [
  ...new Set(form.getAll(name).filter((value): value is string => typeof value === "string" && value !== "")),
];

/** Item em edição: id + versão lida (campos ocultos). Ausente = criação. */
export function itemRef(form: FormData): ItemRef | undefined {
  const id = text(form, "id");
  const expectedUpdatedAt = text(form, "expectedUpdatedAt");
  if (!id) return undefined;
  if (!expectedUpdatedAt)
    throw new AppError("BAD_REQUEST", { message: "Formulário desatualizado. Recarregue a página." });
  return { id, expectedUpdatedAt };
}

export function command(form: FormData): PublicationCommand {
  const value = text(form, "command");
  if (!(PUBLICATION_COMMANDS as readonly string[]).includes(value) || value === "save") {
    throw new AppError("BAD_REQUEST", { message: "Operação desconhecida." });
  }
  return value as PublicationCommand;
}

/** Valores digitados (texto) para repreencher o formulário depois de um erro. */
export function typedValues(form: FormData, exclude: readonly string[] = []): Record<string, string> {
  const values: Record<string, string> = {};
  for (const key of new Set(form.keys())) {
    if (key.startsWith("$") || exclude.includes(key)) continue;
    values[key] = form
      .getAll(key)
      .filter((value): value is string => typeof value === "string")
      .join("\n");
  }
  return values;
}
