#!/usr/bin/env node
/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Scripts
 Arquivo      : print-rbac-seed.mjs
 Descrição    : Gera o seed SQL de role_permissions a partir da matriz RBAC.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-03).
──────────────────────────────────────────────────────────────────────────────
*/

/**
 * Imprime o seed SQL de `role_permissions` a partir da matriz RBAC em código
 * (lib/domain/auth/rbac.ts — fonte única, TECH-03). Requer Node 22.18+ (type stripping).
 * Uso: node scripts/print-rbac-seed.mjs > /tmp/seed.sql
 */
const { listGrants } = await import(new URL("../lib/domain/auth/rbac.ts", import.meta.url).href);

const rows = listGrants().map(({ role, resource, action }) => `  ('${role}', '${resource}', '${action}')`);
console.log(`insert into public.role_permissions (role, resource, action) values\n${rows.join(",\n")};`);
