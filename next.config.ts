/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Config
 Arquivo      : next.config.ts
 Descrição    : Configuração do Next.js: Cache Components, Partial Prefetching e Turbopack.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ARC-03).
 13/10/2026 Vinícius Nishimura Reis  Otimização de imagens e bucket de mídia do Supabase (ARC-10).
──────────────────────────────────────────────────────────────────────────────
*/

import type { NextConfig } from "next";

// Mídia do CMS servida pelo Supabase Storage (ARC-10): somente o bucket público "media"
// do projeto configurado no ambiente pode ser otimizado pelo next/image.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const mediaPatterns = supabaseUrl ? [new URL("/storage/v1/object/public/media/**", supabaseUrl)] : [];

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: mediaPatterns,
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
