/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : store-policy.ts
 Descrição    : Regra de onde os envios podem ficar em memória.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (FORM-08).
──────────────────────────────────────────────────────────────────────────────
*/

/**
 * Pode guardar envios em memória? Só onde os dados são descartáveis: desenvolvimento e preview. Em ambiente
 * real seriam perdidos na próxima instância, depois de o visitante receber confirmação e protocolo (RN-04).
 *
 * O ambiente do site não basta: `NEXT_PUBLIC_SITE_ENV` entra no build e vale "development" quando falta. Um
 * deploy de Production construído sem as variáveis cairia em memória, então `VERCEL_ENV` também conta.
 */
export function allowsMemoryStore({
  siteEnvironment,
  vercelEnv,
}: {
  siteEnvironment: string;
  vercelEnv: string | undefined;
}): boolean {
  if (vercelEnv === "production") return false;
  return siteEnvironment !== "production" && siteEnvironment !== "homologation";
}
