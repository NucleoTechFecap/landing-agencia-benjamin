/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : invite.ts
 Descrição    : Validação dos convites para o painel.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Convites para a equipe (ADM-01).
════════════════════════════════════════════════════════════════════════════════
*/
import { z } from "zod";

export const inviteSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(120, "Use no máximo 120 caracteres."),
  email: z
    .string()
    .trim()
    .max(254)
    .pipe(z.email("Informe um e-mail válido."))
    .transform((value) => value.toLowerCase()),
});
export type InviteInput = z.output<typeof inviteSchema>;
