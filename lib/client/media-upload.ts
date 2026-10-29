/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : media-upload.ts
 Descrição    : Cliente de navegador para envio de mídia com URL assinada.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 28/10/2026
 Modificado em: 28/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 28/10/2026 Vinícius Nishimura Reis  Envio direto ao Storage por URL assinada (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/config/public-env";

let browserClient: ReturnType<typeof createClient> | undefined;

/** Envia os bytes sem passar pelo corpo da Server Action. */
export async function uploadMediaWithTicket(path: string, token: string, file: File): Promise<void> {
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("O armazenamento de mídia não está configurado.");
  }
  browserClient ??= createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { error } = await browserClient.storage.from("media").uploadToSignedUrl(path, token, file, {
    contentType: file.type,
    upsert: false,
    cacheControl: "31536000",
  });
  if (error) throw new Error("Não foi possível enviar o arquivo. Tente de novo.");
}
