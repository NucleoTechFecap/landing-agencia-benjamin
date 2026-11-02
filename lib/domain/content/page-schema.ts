/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : page-schema.ts
 Descrição    : Schema de entrada da página do CMS.

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
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
──────────────────────────────────────────────────────────────────────────────
*/

import { z } from "zod";
import { nameField, optionalText, slugField } from "./cms-schema";

/**
 * Página do CMS: o conteúdo mora nos blocos, editados um a um. `provisional` marca texto que
 * ainda espera aprovação da Benjamin (exibe o selo e bloqueia o go-live, PRJ §40).
 */
export const pageInputSchema = z.object({
  title: nameField("o título da página"),
  slug: slugField,
  description: optionalText(300),
  provisional: z.boolean().default(false),
});

export type PageInput = z.output<typeof pageInputSchema>;
