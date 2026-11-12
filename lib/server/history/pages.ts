/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : pages.ts
 Descrição    : Consulta de versões protegidas de páginas.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Histórico de páginas (FUT-04).
════════════════════════════════════════════════════════════════════════════════
*/
import "server-only";
import { z } from "zod";
import { toPage } from "@/lib/server/content/supabase/mappers";
import type { BlockRow, PageRow } from "@/lib/server/content/supabase/rows";
import { createSessionClient } from "@/lib/server/supabase/server";
import { AppError } from "@/lib/server/errors";

const versionSchema = z.object({
  page: z
    .object({
      id: z.string(),
      slug: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      status: z.enum(["draft", "published", "archived"]),
      provisional: z.boolean(),
      published_at: z.string().nullable(),
      archived_at: z.string().nullable(),
      updated_at: z.string(),
      is_custom: z.boolean().optional(),
    })
    .passthrough(),
  blocks: z.array(z.object({ type: z.string(), content: z.unknown(), sort_order: z.number().int().min(0) })),
});
export interface PageVersion {
  id: number;
  page_id: string;
  actor_id: string | null;
  created_at: string;
}

/** A RLS restringe o histórico a quem pode ver páginas; a guarda é exigida pela tela. */
export async function listPageVersions(
  pageId: string,
  page: number,
): Promise<{ versions: PageVersion[]; actors: Record<string, string>; hasNext: boolean }> {
  const client = await createSessionClient();
  const offset = (page - 1) * 50;
  const { data, error } = await client
    .from("page_versions")
    .select("id,page_id,actor_id,created_at")
    .eq("page_id", pageId)
    .order("id", { ascending: false })
    .range(offset, offset + 50);
  if (error) throw new AppError("SERVICE_UNAVAILABLE");
  const fetched = (data ?? []) as PageVersion[];
  const versions = fetched.slice(0, 50);
  const ids = [...new Set(versions.flatMap((v) => (v.actor_id ? [v.actor_id] : [])))];
  if (!ids.length) return { versions, actors: {}, hasNext: fetched.length > 50 };
  const profiles = await client.from("profiles").select("id,full_name").in("id", ids);
  if (profiles.error) throw new AppError("SERVICE_UNAVAILABLE");
  return {
    versions,
    actors: Object.fromEntries((profiles.data ?? []).map((p) => [p.id, p.full_name || "Pessoa da equipe"])),
    hasNext: fetched.length > 50,
  };
}

/** Reconstitui os blocos validados do catálogo sem executar HTML do snapshot. */
export async function getPageVersion(pageId: string, versionId: string) {
  const client = await createSessionClient();
  const { data, error } = await client
    .from("page_versions")
    .select("id,page_id,actor_id,created_at,snapshot")
    .eq("page_id", pageId)
    .eq("id", versionId)
    .maybeSingle();
  if (error) throw new AppError("SERVICE_UNAVAILABLE");
  if (!data) return null;
  const parsed = versionSchema.safeParse(data.snapshot);
  if (!parsed.success)
    throw new AppError("SERVICE_UNAVAILABLE", { message: "Esta versão não pode ser exibida no formato atual." });
  const blocks: BlockRow[] = parsed.data.blocks.map((block, index) => ({
    id: `versao-${index}`,
    page_id: pageId,
    ...block,
  }));
  const { page, problems } = toPage(parsed.data.page as PageRow, blocks);
  return { id: String(data.id), page, problems };
}
