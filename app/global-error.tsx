/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : global-error.tsx
 Descrição    : Erro global quando o layout raiz falha.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

/** Último recurso quando o próprio layout raiz falha: HTML mínimo, sem dependências. */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f1fcd0", color: "#161313", padding: "3rem 1.5rem", textAlign: "center" }}>
        <h1 style={{ color: "#004a1b" }}>Agência Benjamin</h1>
        <p>O site está com instabilidade no momento. Tente novamente em instantes.</p>
        {error.digest ? <p>Código de atendimento: {error.digest}</p> : null}
        <button type="button" onClick={() => retry()} style={{ padding: "0.75rem 1.5rem", borderRadius: 999, fontWeight: 700 }}>
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
