/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : define.ts
 Descrição    : Formato do catálogo de campos editáveis de cada página do site.

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
──────────────────────────────────────────────────────────────────────────────
*/

import type { FieldDef, FieldValue } from "../fields";

export interface CatalogSection {
  label: string;
  hint?: string;
  /** A seção pode ser escondida do site sem apagar o que está escrito nela. */
  hideable?: boolean;
  fields: Readonly<Record<string, FieldDef>>;
}

/** `rota`: página com endereço. `geral`: aparece em todo o site. `modelo`: vale para todo serviço ou case. */
export type CatalogPageKind = "rota" | "geral" | "modelo";

export interface CatalogPageSeo {
  title: string;
  description: string;
  keywords: readonly string[];
  /** Ignora o template "%s | Agência Benjamin" (Home). */
  absoluteTitle?: boolean;
}

export interface CatalogPage {
  label: string;
  /** Uma frase sobre o que a pessoa edita aqui. */
  description?: string;
  kind: CatalogPageKind;
  /** Endereço público; `null` quando não é uma página (geral e modelos). */
  path: string | null;
  /** SEO padrão da rota: vale enquanto a aba de SEO da página não disser outra coisa. */
  seo?: CatalogPageSeo;
  sections: Readonly<Record<string, CatalogSection>>;
}

export const definePage = <const P extends CatalogPage>(page: P): P => page;

/** Valores de uma página já resolvidos: `campos.areas.titulo`. */
export type ResolvedPage<P extends CatalogPage> = {
  [S in keyof P["sections"]]: { [F in keyof P["sections"][S]["fields"]]: FieldValue<P["sections"][S]["fields"][F]> };
};
