/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : command-bar.tsx
 Descrição    : Botões de publicação do CMS (publicar, despublicar, arquivar, restaurar, excluir).

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 04/11/2026 Vinícius Nishimura Reis  Responsividade, toque e teclado no painel (ADM-16).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { useActionState } from "react";
import { CMS_IDLE, type CmsFormState } from "@/lib/domain/content/cms-form";
import type { PublicationCommand } from "@/lib/domain/content/publication";
import { ConfirmForm, useHydrated, type Confirmation } from "../ui/confirm-form";
import { CmsFormError } from "./form-error";

type CommandAction = (state: CmsFormState, formData: FormData) => Promise<CmsFormState>;

const COMMANDS: Partial<Record<PublicationCommand, { label: string; tone: string; confirmation?: Confirmation }>> = {
  publish: { label: "Publicar", tone: "studio-btn-primario" },
  unpublish: {
    label: "Despublicar",
    tone: "studio-btn-secundario",
    confirmation: {
      title: "Despublicar este item?",
      message: "O item sai do site e volta para rascunho.",
      confirmLabel: "Despublicar",
      tone: "neutro",
    },
  },
  archive: {
    label: "Arquivar",
    tone: "studio-btn-secundario",
    confirmation: {
      title: "Arquivar este item?",
      message: "O item sai do site e vai para a lista de arquivados.",
      confirmLabel: "Arquivar",
      tone: "neutro",
    },
  },
  restore: { label: "Restaurar como rascunho", tone: "studio-btn-secundario" },
  delete: {
    label: "Excluir definitivamente",
    tone: "studio-btn-perigo",
    confirmation: {
      title: "Excluir definitivamente?",
      message: "Esta exclusão não pode ser desfeita.",
      confirmLabel: "Excluir definitivamente",
    },
  },
};

/**
 * Uma ação de publicação por formulário, só com as permitidas para o estado e o papel
 * (allowedCommands). A verificação de verdade acontece de novo no servidor.
 */
export function CommandBar({
  action,
  id,
  updatedAt,
  commands,
}: {
  action: CommandAction;
  id: string;
  updatedAt: string;
  commands: PublicationCommand[];
}) {
  const [state, formAction, pending] = useActionState(action, CMS_IDLE);
  const ready = useHydrated();
  const available = commands.filter((command) => COMMANDS[command]);
  if (!available.length) return null;
  return (
    <section aria-labelledby="publicacao-titulo" className="studio-card space-y-3 p-5">
      <h2 id="publicacao-titulo" className="text-base font-extrabold text-benja-verde">
        Publicação
      </h2>
      <p className="text-xs text-studio-suave">Salvar guarda o texto; publicar é o que leva o item ao site.</p>
      <CmsFormError state={state} />
      <div className="flex flex-col gap-2">
        {available.map((command) => {
          const config = COMMANDS[command]!;
          return (
            <ConfirmForm key={command} action={formAction} confirmation={config.confirmation}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="expectedUpdatedAt" value={updatedAt} />
              <input type="hidden" name="command" value={command} />
              <button type="submit" disabled={!ready || pending} className={`studio-btn w-full ${config.tone}`}>
                {config.label}
              </button>
            </ConfirmForm>
          );
        })}
      </div>
    </section>
  );
}
