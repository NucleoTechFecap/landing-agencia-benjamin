/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : render-server-tree.ts
 Descrição    : Renderiza nos testes uma árvore com componentes de servidor assíncronos.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (editor do site).
 04/11/2026 Vinícius Nishimura Reis  Tira as marcas do React sem regex (alerta do CodeQL).
──────────────────────────────────────────────────────────────────────────────
*/

import type { ReactElement } from "react";
import { renderToReadableStream } from "react-dom/server";

/**
 * As rotas renderizam views assíncronas, que o `renderToStaticMarkup` não espera. As marcas que o
 * streaming deixa no HTML (`<!-- -->` entre textos, `<!--$-->` de Suspense) saem, para o resultado
 * ser comparável ao markup estático. Erro dentro de um Suspense não passa em silêncio.
 */
export async function renderServerTree(element: ReactElement): Promise<string> {
  let failure: unknown;
  const stream = await renderToReadableStream(element, {
    onError: (error) => {
      failure ??= error;
    },
  });
  await stream.allReady;
  if (failure) throw failure;
  const html = await new Response(stream).text();
  const [start, ...rest] = html.split("<!--");
  return start + rest.map((part) => part.slice(part.indexOf("-->") + 3)).join("");
}
