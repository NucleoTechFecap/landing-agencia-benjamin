/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : error.tsx
 Descrição    : Erro inesperado nas telas do painel.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Estados globais de carregamento, vazio e erro (LAY-07).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import Link from "next/link";
import { StudioIcon } from "@/components/admin/ui/icons";

/**
 * Erro inesperado no painel, dentro da casca: o menu continua de pé e a pessoa não perde o caminho de
 * volta (LAY-07). Sem o componente do site: a tela de erro pública ocupa a página inteira.
 */
export default function PanelError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <section className="studio-card mx-auto mt-6 max-w-2xl p-8 text-center">
      <StudioIcon name="alerta" size={40} className="mx-auto text-benja-laranja-texto" />
      <h1 className="mt-4 text-3xl leading-tight font-black text-benja-verde">Algo deu errado por aqui.</h1>
      <p className="mt-3 text-studio-suave">
        Nada foi perdido do que já estava salvo. Tente de novo; se persistir, envie o código ao NúcleoTech.
      </p>
      {error.digest ? (
        <p className="mt-2 text-sm">
          Código de atendimento: <code className="font-mono font-bold">{error.digest}</code>
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => retry()} className="studio-btn studio-btn-primario">
          Tentar novamente
        </button>
        <Link href="/admin" prefetch={false} className="studio-btn studio-btn-secundario">
          Voltar ao painel
        </Link>
      </div>
    </section>
  );
}
