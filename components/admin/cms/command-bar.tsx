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
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { useActionState } from "react";
import { CMS_IDLE, type CmsFormState } from "@/lib/domain/content/cms-form";
import type { PublicationCommand } from "@/lib/domain/content/publication";
import { CmsFormError } from "./form-error";

type CommandAction = (state: CmsFormState, formData: FormData) => Promise<CmsFormState>;

const COMMANDS: Partial<Record<PublicationCommand, { label: string; tone: string; confirm?: string }>> = {
  publish: { label: "Publicar", tone: "bg-benja-verde text-benja-nyanza hover:bg-benja-noite" },
  unpublish: {
    label: "Despublicar",
    tone: "border-2 border-benja-noite bg-white text-benja-noite hover:bg-benja-creme",
    confirm: "O item sai do site e volta para rascunho. Continuar?",
  },
  archive: {
    label: "Arquivar",
    tone: "border-2 border-benja-noite bg-white text-benja-noite hover:bg-benja-creme",
    confirm: "O item sai do site e vai para a lista de arquivados. Continuar?",
  },
  restore: {
    label: "Restaurar como rascunho",
    tone: "border-2 border-benja-verde bg-white text-benja-verde hover:bg-benja-claro",
  },
  delete: {
    label: "Excluir definitivamente",
    tone: "border-2 border-benja-erro bg-white text-benja-erro hover:bg-benja-erro-fundo",
    confirm: "Esta exclusão não pode ser desfeita. Excluir mesmo assim?",
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
  const available = commands.filter((command) => COMMANDS[command]);
  if (!available.length) return null;
  return (
    <section
      aria-labelledby="publicacao-titulo"
      className="space-y-3 rounded-3xl border-2 border-benja-noite/15 bg-white p-5"
    >
      <h2 id="publicacao-titulo" className="text-sm font-black tracking-widest text-benja-verde uppercase">
        Publicação
      </h2>
      <CmsFormError state={state} />
      <div className="flex flex-wrap gap-3">
        {available.map((command) => {
          const config = COMMANDS[command]!;
          return (
            <form
              key={command}
              action={formAction}
              onSubmit={(event) => {
                if (config.confirm && !window.confirm(config.confirm)) event.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="expectedUpdatedAt" value={updatedAt} />
              <input type="hidden" name="command" value={command} />
              <button
                type="submit"
                disabled={pending}
                className={`rounded-full px-5 py-2.5 text-sm font-bold transition disabled:cursor-wait disabled:opacity-60 ${config.tone}`}
              >
                {config.label}
              </button>
            </form>
          );
        })}
      </div>
    </section>
  );
}
