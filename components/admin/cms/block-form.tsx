/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : block-form.tsx
 Descrição    : Formulário de bloco de página, por tipo.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { SelectField, TextArea, TextField } from "@/components/forms/fields";
import { blockFormValues, type TeamMemberInput } from "@/lib/domain/content/block-input";
import { BLOCK_FIELDS, isFieldBlock, type BlockType, type PageBlock } from "@/lib/domain/content/blocks";
import { blockEditorFields } from "@/lib/domain/content/field-editor";
import { SECTION_TONE_LABELS, SECTION_TONE_NAMES } from "@/lib/domain/content/tones";
import { FieldEditor, type ImageOption } from "./field-editor";
import { CmsFormShell, type CmsSaveAction, type FieldHelpers } from "./form-shell";
import { TeamMembersField, type PhotoOption } from "./team-members-field";

/** Mesmo prefixo de lib/server/cms/page-blocks.ts: o nome dos campos no formulário. */
const BLOCK_FIELD_PREFIX = "bloco";

const TONE_OPTIONS = SECTION_TONE_NAMES.map((tone) => ({ value: tone, label: SECTION_TONE_LABELS[tone] }));

/** Pessoas salvas no bloco; a foto volta para o id da biblioteca pelo endereço. */
function savedMembers(block: PageBlock | undefined, photos: PhotoOption[]): TeamMemberInput[] {
  if (block?.type !== "team") return [];
  return block.content.members.map((member) => ({
    name: member.name,
    role: member.role ?? "",
    photoId: photos.find((photo) => photo.src === member.photo?.src)?.id ?? "",
  }));
}

/** Pessoas digitadas antes de um erro: os campos repetidos voltam unidos por quebra de linha. */
function typedMembers({ value }: FieldHelpers): TeamMemberInput[] | undefined {
  const names = value("memberName");
  if (names === undefined) return undefined;
  const roles = (value("memberRole") ?? "").split("\n");
  const photos = (value("memberPhoto") ?? "").split("\n");
  return names.split("\n").map((name, index) => ({ name, role: roles[index] ?? "", photoId: photos[index] ?? "" }));
}

/** Formulário de um bloco (ADM-05). Só texto puro: o site nunca renderiza HTML vindo do banco. */
export function BlockForm({
  action,
  page,
  type,
  block,
  photos,
  images = [],
}: {
  action: CmsSaveAction;
  page: { id: string; updatedAt: string };
  type: BlockType;
  block?: PageBlock;
  photos: PhotoOption[];
  /** Biblioteca, para os blocos com imagem. */
  images?: readonly ImageOption[];
}) {
  const saved = block ? blockFormValues(block) : {};
  return (
    <CmsFormShell
      action={action}
      item={page}
      cancelHref={`/admin/paginas/${page.id}`}
      submitLabel={block ? "Salvar bloco" : "Adicionar bloco"}
    >
      {(helpers) => {
        const { errors, value } = helpers;
        const field = (
          name: string,
          label: string,
          props: { required?: boolean; maxLength?: number; hint?: string } = {},
        ) => (
          <TextField
            name={name}
            label={label}
            {...props}
            errors={errors(name)}
            defaultValue={value(name, saved[name])}
          />
        );
        const area = (
          name: string,
          label: string,
          props: { required?: boolean; rows?: number; hint?: string; maxLength?: number } = {},
        ) => (
          <TextArea
            name={name}
            label={label}
            {...props}
            errors={errors(name)}
            defaultValue={value(name, saved[name])}
          />
        );
        const paragraphs = (max: number, length: number) =>
          area("paragraphs", "Parágrafos", {
            required: true,
            rows: 8,
            hint: `Um parágrafo por linha, até ${max}, cada um com até ${length} caracteres.`,
          });
        return (
          <>
            <input type="hidden" name="type" value={type} />
            {block ? <input type="hidden" name="blockId" value={block.id} /> : null}
            {isFieldBlock(type) ? (
              <FieldEditor
                fields={blockEditorFields(
                  BLOCK_FIELDS[type],
                  BLOCK_FIELD_PREFIX,
                  block?.content as Readonly<Record<string, unknown>> | undefined,
                )}
                images={images}
                helpers={helpers}
              />
            ) : null}
            {type === "rich-text" || type === "list" || type === "team" || type === "cta" ? (
              <SelectField
                name="fundo"
                label="Cor de fundo"
                placeholder="Automática"
                options={TONE_OPTIONS}
                errors={errors("fundo")}
                defaultValue={value("fundo", saved.fundo)}
              />
            ) : null}
            {type === "rich-text" ? (
              <>
                {field("title", "Título", { maxLength: 120 })}
                {paragraphs(12, 1200)}
              </>
            ) : null}
            {type === "list" ? (
              <>
                {field("title", "Título", { maxLength: 120 })}
                {area("items", "Itens", {
                  required: true,
                  rows: 8,
                  hint: "Um por linha, até 12: Título | texto opcional. Ex.: Estratégia | Do briefing à entrega.",
                })}
              </>
            ) : null}
            {type === "team" ? (
              <>
                {field("title", "Título", { maxLength: 120, hint: "Em branco, o site usa “Nosso time”." })}
                <TeamMembersField
                  initial={typedMembers(helpers) ?? savedMembers(block, photos)}
                  photos={photos}
                  errors={errors("members")}
                />
              </>
            ) : null}
            {type === "cta" ? (
              <>
                {field("title", "Título", { required: true, maxLength: 120 })}
                {area("text", "Texto", { rows: 2, maxLength: 300 })}
                {field("label", "Texto do botão", { required: true, maxLength: 40 })}
                {field("href", "Destino", {
                  required: true,
                  maxLength: 500,
                  hint: "Uma página do site (ex.: /contato) ou um link https.",
                })}
              </>
            ) : null}
            {type === "manifesto" ? (
              <>
                {field("title", "Título", { required: true, maxLength: 160 })}
                {paragraphs(6, 600)}
              </>
            ) : null}
            {type === "about" ? (
              <>
                {field("title", "Título", { required: true, maxLength: 160 })}
                {area("intro", "Quem somos", { required: true, rows: 4, maxLength: 1200 })}
                {area("valueProposition", "Proposta de valor", { required: true, rows: 4, maxLength: 1200 })}
                {area("howWeWork", "Modelo de atuação", { required: true, rows: 4, maxLength: 1200 })}
                {area("fecapRelation", "Relação com a FECAP", { required: true, rows: 4, maxLength: 1200 })}
              </>
            ) : null}
          </>
        );
      }}
    </CmsFormShell>
  );
}
