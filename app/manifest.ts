/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : manifest.ts
 Descrição    : Manifesto web com nome, cores e ícones da marca.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (SEO da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import type { MetadataRoute } from "next";

/** Manifesto web: nome, cores da marca e ícones (instalação e barra do navegador). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agência Benjamin",
    short_name: "Benja",
    description: "Agência experimental de comunicação da FECAP.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#f1fcd0",
    theme_color: "#004a1b",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
