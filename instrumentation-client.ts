/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Config
 Arquivo      : instrumentation-client.ts
 Descrição    : Desliga no navegador a sondagem de eval do Zod, que a CSP acusaria como violação.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (SEG-06).
──────────────────────────────────────────────────────────────────────────────
*/

import { config } from "zod/v4/core";

/*
 * O Zod testa `new Function("")` ao criar cada z.object, para compilar a validação. A CSP (sem
 * 'unsafe-eval', ver lib/domain/security/http-policy.ts) recusa o teste e o Zod segue pelo caminho
 * normal, mas o navegador registra a violação. O `jitless` evita o teste, e precisa valer antes de
 * o primeiro schema ser criado: por isso aqui, que o Next roda antes de hidratar a página. O
 * resultado da validação é o mesmo. No servidor não há CSP, e a compilação continua ligada.
 */
config({ jitless: true });
