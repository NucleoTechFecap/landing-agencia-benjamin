/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : article-form.tsx
 Descrição    : Formulário editorial de artigos.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Formulário do blog (FUT-10).
════════════════════════════════════════════════════════════════════════════════
*/
"use client";
import { TextArea, TextField } from "@/components/forms/fields";
import { CmsFormShell, type CmsSaveAction } from "@/components/admin/cms/form-shell";
import { MediaPicker } from "@/components/admin/cms/media-picker";
import type { BlogArticle } from "@/lib/domain/blog/article";

export function ArticleForm({
  action,
  article,
  readOnly,
  images,
}: {
  action: CmsSaveAction;
  article?: BlogArticle;
  readOnly?: boolean;
  images: { id: string; label: string; src: string }[];
}) {
  return (
    <CmsFormShell
      action={action}
      item={article ? { id: article.id, updatedAt: article.updated_at } : undefined}
      readOnly={readOnly}
      cancelHref="/admin/blog"
      submitLabel={article ? "Salvar alterações" : "Criar rascunho"}
    >
      {({ errors, value }) => (
        <>
          <TextField
            name="title"
            label="Título"
            required
            maxLength={120}
            errors={errors("title")}
            defaultValue={value("title", article?.title)}
          />
          <TextField
            name="slug"
            label="Endereço"
            required
            maxLength={80}
            hint="Letras minúsculas, números e hífens. Depois de publicado, o endereço não muda."
            errors={errors("slug")}
            defaultValue={value("slug", article?.slug)}
          />
          <TextArea
            name="summary"
            label="Resumo"
            maxLength={280}
            rows={3}
            hint="Para publicar, use pelo menos 30 caracteres."
            errors={errors("summary")}
            defaultValue={value("summary", article?.summary ?? "")}
          />
          <TextField
            name="author"
            label="Autoria"
            maxLength={120}
            errors={errors("author")}
            defaultValue={value("author", article?.author ?? "")}
          />
          <TextField
            name="topic"
            label="Assunto"
            maxLength={80}
            errors={errors("topic")}
            defaultValue={value("topic", article?.topic ?? "")}
          />
          <MediaPicker
            name="coverId"
            label="Imagem de capa"
            placeholder="Sem capa"
            emptyLabel="Nenhuma capa escolhida"
            hint="Opcional. A capa publicada precisa de texto alternativo."
            images={images}
            errors={errors("coverId")}
            defaultValue={value("coverId", article?.cover_media_id ?? "")}
            uploadHref={`/admin/midia/novo?voltar=${encodeURIComponent(article ? `/admin/blog/${article.id}` : "/admin/blog/novo")}`}
          />
          <TextArea
            name="paragraphs"
            label="Texto do artigo"
            rows={16}
            hint="Um parágrafo por linha. Para subtítulo, comece com ##; para link, use [texto](https://endereço). HTML é exibido como texto."
            errors={errors("blocks")}
            defaultValue={value("paragraphs", article?.paragraphs.join("\n") ?? "")}
          />
        </>
      )}
    </CmsFormShell>
  );
}
