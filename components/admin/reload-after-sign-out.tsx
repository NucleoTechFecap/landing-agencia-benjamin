/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : reload-after-sign-out.tsx
 Descrição    : Recarrega a página depois de sair, para não sobrar dado do painel na memória do navegador.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (SEG-04).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { useEffect } from "react";
import { LOGIN_PATH } from "@/lib/domain/auth/redirect";

/**
 * O redirecionamento da Server Action é uma navegação interna: o Next mantém as telas visitadas no
 * documento, escondidas (Activity), e um lead aberto continuaria no DOM depois de sair, ao alcance de
 * quem usar o mesmo computador. Só uma carga completa limpa isso, como orienta a documentação do Next.
 */
export function ReloadAfterSignOut() {
  useEffect(() => {
    // `ok`: o aviso de saída continua, e a página não recarrega de novo.
    window.location.replace(`${LOGIN_PATH}?saiu=ok`);
  }, []);
  return null;
}
