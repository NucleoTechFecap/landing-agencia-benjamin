/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : unsaved-guard.tsx
 Descrição    : Aviso antes de sair de um formulário com alterações não salvas.

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

import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "./confirm-form";

/**
 * Avisa antes de sair de um formulário com alterações não salvas. Fechar ou recarregar a aba cai no aviso
 * do próprio navegador; clicar em um link do painel abre a janela da marca. O clique é capturado antes de
 * chegar ao <Link> do Next, que trocaria de página sem passar por `beforeunload`.
 */
export function UnsavedGuard({ active }: { active: boolean }) {
  const [destination, setDestination] = useState<string | null>(null);
  const leaving = useRef(false);

  useEffect(() => {
    if (!active) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!leaving.current) event.preventDefault();
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      // Outro site passa por `beforeunload`; âncora na mesma página não perde nada.
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      event.preventDefault();
      event.stopPropagation();
      setDestination(`${url.pathname}${url.search}${url.hash}`);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [active]);

  return (
    <ConfirmDialog
      open={destination !== null}
      confirmation={{
        title: "Sair sem salvar?",
        message: "As alterações feitas neste formulário ainda não foram salvas e serão perdidas.",
        confirmLabel: "Sair sem salvar",
      }}
      onCancel={() => setDestination(null)}
      onConfirm={() => {
        leaving.current = true;
        if (destination) window.location.assign(destination);
      }}
    />
  );
}
