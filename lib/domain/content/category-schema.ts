/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : category-schema.ts
 Descrição    : Validação de rascunho e publicação da categoria de cases no CMS.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-08).
──────────────────────────────────────────────────────────────────────────────
*/

import { z } from "zod";
import { nameField, optionalText, orderField, slugField } from "./cms-schema";

/** Categoria do portfólio: nome e slug bastam para salvar e para publicar (TECH-05 §5). */
export const categoryInputSchema = z.object({
  name: nameField("o nome da categoria"),
  slug: slugField,
  description: optionalText(4000),
  order: orderField,
});

export type CategoryInput = z.output<typeof categoryInputSchema>;
