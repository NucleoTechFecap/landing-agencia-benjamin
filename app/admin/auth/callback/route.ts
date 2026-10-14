/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : route.ts
 Descrição    : Troca o código dos e-mails de convite/recuperação por sessão.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-02).
──────────────────────────────────────────────────────────────────────────────
*/

import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { LOGIN_PATH, safeAdminRedirect } from "@/lib/domain/auth/redirect";
import { logger } from "@/lib/server/logger";
import { createSessionClient } from "@/lib/server/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["invite", "recovery", "magiclink", "email", "email_change", "signup"];

/**
 * Retorno dos links enviados por e-mail (convite e redefinição de senha). Troca o código
 * (PKCE) ou o token_hash por uma sessão e segue para um destino interno validado.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeAdminRedirect(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  try {
    const supabase = await createSessionClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : tokenHash && type && OTP_TYPES.includes(type)
        ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
        : { error: new Error("missing_code") };
    if (error) throw error;
    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    logger.warn("auth.callback.failed", { error });
    return NextResponse.redirect(new URL(`${LOGIN_PATH}?erro=link`, request.url));
  }
}
