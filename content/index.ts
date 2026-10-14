/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Content
 Arquivo      : index.ts
 Descrição    : Agrega o conteúdo provisório versionado em um recorte único.

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

import type { ContentSnapshot } from "../lib/domain/content/types";
import { areas } from "./areas";
import { cases, categories } from "./cases";
import { ctas } from "./ctas";
import { services } from "./services";
import { siteSettings } from "./site";

/** Conteúdo provisório versionado — fonte do site enquanto o CMS não está publicado. */
export const seedSnapshot: ContentSnapshot = { areas, services, categories, cases, ctas };
export { siteSettings };
