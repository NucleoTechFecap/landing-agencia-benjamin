/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : actions.ts
 Descrição    : Gravação e publicação de artigos do blog.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Ações editoriais do blog (FUT-10).
════════════════════════════════════════════════════════════════════════════════
*/
"use server";
import { revalidatePath } from "next/cache";
import { articleDraftSchema, validateArticleForPublish } from "@/lib/domain/blog/article";
import { fieldErrorsOf, optionalText } from "@/lib/domain/content/cms-schema";
import type { CmsFormState } from "@/lib/domain/content/cms-form";
import { COMMAND_PERMISSION, transition } from "@/lib/domain/content/publication";
import { cmsFormAction, withFlash } from "@/lib/server/cms/context";
import { command, itemRef, lines, text, typedValues } from "@/lib/server/cms/form-data";
import { publicationError } from "@/lib/server/cms/content-service";
import { toCmsError } from "@/lib/server/cms/supabase-store";
import { createSessionClient } from "@/lib/server/supabase/server";
import { AppError } from "@/lib/server/errors";
import { listAdminArticles } from "@/lib/server/blog/repository";
import { recordAuditEvent } from "@/lib/server/audit";
import { invalidateContentFromAction } from "@/lib/server/content/invalidate";

const invalidate = (slug: string) => {
  invalidateContentFromAction({ entity: "blog", slug });
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
};

export async function saveArticle(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  const editing = Boolean(text(form, "id"));
  return cmsFormAction(
    "page",
    editing ? "edit" : "create",
    async () => {
      const ref = itemRef(form);
      const parsed = articleDraftSchema.safeParse({
        title: text(form, "title"),
        slug: text(form, "slug"),
        summary: text(form, "summary"),
        author: text(form, "author"),
        coverId: text(form, "coverId") || undefined,
        blocks: lines(form, "paragraphs").map((value) => ({ type: "paragraph", text: value })),
      });
      if (!parsed.success) throw new AppError("VALIDATION_FAILED", { fieldErrors: fieldErrorsOf(parsed.error) });
      const topic = optionalText(80).safeParse(text(form, "topic"));
      if (!topic.success)
        throw new AppError("VALIDATION_FAILED", { fieldErrors: { topic: ["Use no máximo 80 caracteres."] } });
      const client = await createSessionClient();
      const current = ref ? (await listAdminArticles()).find((item) => item.id === ref.id) : undefined;
      if (ref && !current) throw new AppError("NOT_FOUND");
      if (ref && current?.updated_at !== ref.expectedUpdatedAt) throw new AppError("CONFLICT");
      if (current?.status === "archived") throw new AppError("INVALID_TRANSITION");
      if (current?.status === "published") {
        const problems = validateArticleForPublish(parsed.data);
        if (problems.length) throw new AppError("VALIDATION_FAILED", { fieldErrors: { publicacao: problems } });
      }
      const values = {
        title: parsed.data.title,
        slug: parsed.data.slug,
        summary: parsed.data.summary ?? null,
        author: parsed.data.author ?? null,
        topic: topic.data ?? null,
        cover_media_id: parsed.data.coverId ?? null,
        paragraphs: parsed.data.blocks.flatMap((block) => (block.type === "paragraph" ? [block.text] : [])),
      };
      const query = ref
        ? client.from("blog_articles").update(values).eq("id", ref.id).eq("updated_at", ref.expectedUpdatedAt)
        : client.from("blog_articles").insert(values);
      const { data, error } = await query.select("id").maybeSingle();
      if (error) throw toCmsError(error, { table: "blog_articles", operation: "save" });
      if (!data) throw new AppError("CONFLICT");
      await recordAuditEvent({
        event: ref ? "content.updated" : "content.created",
        resourceId: data.id,
        metadata: { entity: "page", slug: values.slug, kind: "blog" },
      });
      if (current?.status === "published") invalidate(current.slug);
      return withFlash(`/admin/blog/${data.id}`, ref ? "salvo" : "criado");
    },
    typedValues(form, ["id", "expectedUpdatedAt"]),
  );
}

export async function articleCommand(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  let requested;
  try {
    requested = command(form);
  } catch {
    return { status: "error", code: "BAD_REQUEST", message: "Operação desconhecida.", requestId: "" };
  }
  return cmsFormAction("page", COMMAND_PERMISSION[requested], async (user) => {
    const ref = itemRef(form);
    if (!ref) throw new AppError("BAD_REQUEST");
    const item = (await listAdminArticles()).find((article) => article.id === ref.id);
    if (!item) throw new AppError("NOT_FOUND");
    if (item.updated_at !== ref.expectedUpdatedAt) throw new AppError("CONFLICT");
    const result = transition(
      { status: item.status, publishedAt: item.published_at, archivedAt: item.archived_at },
      requested,
      {
        role: user.role,
        resource: "page",
        now: new Date(),
        validateForPublish: () =>
          validateArticleForPublish({
            title: item.title,
            slug: item.slug,
            summary: item.summary ?? undefined,
            author: item.author ?? undefined,
            blocks: item.paragraphs.map((value) => ({ type: "paragraph", text: value })),
          }),
      },
    );
    if (!result.ok) throw publicationError(result.error);
    if (requested === "delete" && item.published_at)
      throw new AppError("CONFLICT", {
        message: "Artigos já publicados devem permanecer arquivados para preservar o endereço.",
      });
    const events = {
      publish: "content.published",
      unpublish: "content.unpublished",
      archive: "content.archived",
      restore: "content.restored",
      delete: "content.deleted",
    } as const;
    const flashes = {
      publish: "publicado",
      unpublish: "despublicado",
      archive: "arquivado",
      restore: "restaurado",
      delete: "excluido",
    } as const;
    if (requested === "save") throw new AppError("BAD_REQUEST");
    const event = events[requested];
    const audit = (outcome: "success" | "failure") =>
      recordAuditEvent({
        event,
        resourceId: item.id,
        outcome,
        metadata: { entity: "page", kind: "blog", slug: item.slug },
      });
    if (requested !== "restore") await audit("success");
    const client = await createSessionClient();
    const query =
      result.next.status === "deleted"
        ? client.from("blog_articles").delete().eq("id", item.id).eq("updated_at", ref.expectedUpdatedAt)
        : client
            .from("blog_articles")
            .update({
              status: result.next.status,
              published_at: result.next.publishedAt,
              archived_at: result.next.archivedAt,
            })
            .eq("id", item.id)
            .eq("updated_at", ref.expectedUpdatedAt);
    try {
      const { data, error } = await query.select("id").maybeSingle();
      if (error) throw toCmsError(error, { table: "blog_articles", operation: "command" });
      if (!data) throw new AppError("CONFLICT");
    } catch (error) {
      if (requested !== "restore") await audit("failure").catch(() => undefined);
      throw error;
    }
    if (requested === "restore") await audit("success");
    if (item.status === "published" || result.next.status === "published") invalidate(item.slug);
    return withFlash(result.next.status === "deleted" ? "/admin/blog" : `/admin/blog/${item.id}`, flashes[requested]);
  });
}
