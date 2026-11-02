/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : motion-loader.tsx
 Descrição    : Tela de carregamento da marca, exibida na primeira página da sessão.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 02/11/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 02/11/2026 Vinícius Nishimura Reis  Criação inicial (animações GSAP).
──────────────────────────────────────────────────────────────────────────────
*/

import Image from "next/image";
import { bandText } from "../sections/hero-manifesto";
import { Sticker } from "../ui/sticker";

/**
 * Tela de carregamento da marca: fundo verde com textura em movimento, logotipo, stickers, barra no
 * estilo "sticker" e a faixa lima do hero. Só aparece na primeira página da sessão (ver MotionGate) e
 * é toda em CSS, para já estar em movimento antes de o JavaScript chegar. Não recebe cliques, foco nem
 * leitura de tela: o conteúdo já está na página atrás dela.
 */
export function MotionLoader({ tagline }: { tagline: string }) {
  return (
    <div
      aria-hidden
      data-loader
      className="pointer-events-none fixed inset-0 z-[60] flex-col overflow-hidden bg-benja-verde text-benja-verde"
      style={{ display: "none" }}
    >
      <div className="motion-drift halftone absolute -inset-6 text-benja-lima opacity-70" />
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(1rem,4vh,2.5rem)] px-6">
        <div className="relative">
          {/* Logotipo sem rotação nem transparência: entra por máscara. Os stickers ficam fora dele (zona de exclusão). */}
          <Image
            src="/brand/logos/logo-vertical.svg"
            alt=""
            width={480}
            height={496}
            priority
            className="motion-loader-logo h-[clamp(140px,min(40vh,62vw),320px)] w-auto"
          />
          <div className="absolute -top-20 -left-2 rotate-[-12deg] sm:-top-5 sm:-left-28">
            <div data-loader-sticker className="motion-loader-pop [animation-delay:0.25s]">
              <Sticker name="poupa-meu-tempo" color="laranja" width={92} />
            </div>
          </div>
          <div className="absolute -right-2 -bottom-20 rotate-[8deg] sm:-right-28 sm:-bottom-5">
            <div data-loader-sticker className="motion-loader-pop [animation-delay:0.4s]">
              <Sticker name="ta-no-briefing" color="rosa" width={104} anchor="bottom" />
            </div>
          </div>
        </div>
        <div className="mt-16 h-4 w-[min(16rem,70vw)] overflow-hidden sm:mt-0 rounded-full border-2 border-benja-noite bg-benja-nyanza shadow-sticker">
          <div data-loader-fill className="motion-loader-fill h-full origin-left bg-benja-lima" />
        </div>
      </div>
      <div className="relative overflow-hidden border-t-2 border-benja-noite bg-benja-lima px-4 py-3 text-xs font-black tracking-[0.25em] uppercase sm:text-sm sm:tracking-[0.3em]">
        <div className="motion-loader-band flex w-max gap-[1.5em] whitespace-nowrap">
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index}>{bandText(tagline)}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
