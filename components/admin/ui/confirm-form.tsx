/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : confirm-form.tsx
 Descrição    : Janela de confirmação e formulário que só envia depois dela.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (reestruturação do painel).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

export interface Confirmation {
  title: string;
  message: string;
  confirmLabel: string;
  /** Ação que não se desfaz (padrão) ou que só precisa de um segundo olhar. */
  tone?: "perigo" | "neutro";
}

const subscribeToNothing = () => () => {};

/** Antes de a página ficar pronta, o clique enviaria o formulário sem passar pela confirmação. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

/**
 * Janela de confirmação da marca, sobre o <dialog> nativo: o navegador cuida da camada, do Esc, do foco
 * preso e de devolver o foco a quem abriu. Só pergunta: quem decide se a ação vale é o servidor.
 */
export function ConfirmDialog({
  open,
  confirmation,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  confirmation: Confirmation;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-studio-xl border border-studio-linha bg-white p-6 text-benja-noite shadow-studio-flutuante open:animate-studio-entrada"
    >
      <h2 id={titleId} className="text-lg font-extrabold text-benja-verde">
        {confirmation.title}
      </h2>
      <p id={messageId} className="mt-2 text-sm leading-relaxed text-studio-suave">
        {confirmation.message}
      </p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="studio-btn studio-btn-secundario">
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`studio-btn ${confirmation.tone === "neutro" ? "studio-btn-primario" : "studio-btn-perigo"}`}
        >
          {confirmation.confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

/** Formulário que, com `confirmation`, só é enviado depois de a pessoa confirmar na janela. */
export function ConfirmForm({
  action,
  confirmation,
  className,
  children,
}: {
  action: (formData: FormData) => void;
  confirmation?: Confirmation;
  className?: string;
  children: ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const approved = useRef(false);
  const [asking, setAsking] = useState(false);
  return (
    <>
      <form
        ref={formRef}
        action={action}
        className={className}
        onSubmit={(event) => {
          if (!confirmation || approved.current) {
            approved.current = false;
            return;
          }
          event.preventDefault();
          setAsking(true);
        }}
      >
        {children}
      </form>
      {confirmation ? (
        <ConfirmDialog
          open={asking}
          confirmation={confirmation}
          onCancel={() => setAsking(false)}
          onConfirm={() => {
            setAsking(false);
            approved.current = true;
            formRef.current?.requestSubmit();
          }}
        />
      ) : null}
    </>
  );
}
