/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : media-picker.tsx
 Descrição    : Escolha de imagem da biblioteca, com prévia e atalho para enviar arquivo novo.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (reestruturação do painel).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SelectField } from "@/components/forms/fields";
import { StudioIcon } from "../ui/icons";
import type { MediaOption } from "./service-form";

/**
 * Escolha de imagem da biblioteca com prévia ao lado. O campo continua um <select> comum, que funciona
 * com teclado e leitor de tela; o envio de arquivo novo fica na biblioteca, que depois volta para cá.
 */
export function MediaPicker({
  name,
  label,
  placeholder,
  hint,
  images,
  errors,
  defaultValue,
  uploadHref,
  emptyLabel,
}: {
  name: string;
  label: string;
  placeholder: string;
  hint?: string;
  images: readonly MediaOption[];
  errors?: string[];
  defaultValue?: string;
  uploadHref: string;
  /** O que aparece no lugar da prévia, sem imagem escolhida. */
  emptyLabel: string;
}) {
  const [selected, setSelected] = useState(defaultValue ?? "");
  const image = images.find((option) => option.id === selected);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
      <div className="relative aspect-[16/10] overflow-hidden rounded-studio-md border border-studio-linha bg-studio-realce">
        {image?.src ? (
          <Image src={image.src} alt="" fill unoptimized sizes="15rem" className="object-cover" />
        ) : (
          <p className="studio-reticula flex h-full items-center justify-center px-3 text-center text-xs font-bold text-studio-suave">
            {emptyLabel}
          </p>
        )}
      </div>
      <div className="min-w-0">
        <SelectField
          name={name}
          label={label}
          placeholder={placeholder}
          options={images.map((option) => ({ value: option.id, label: option.label }))}
          hint={hint}
          errors={errors}
          defaultValue={defaultValue}
          onValueChange={setSelected}
        />
        <Link href={uploadHref} className="studio-btn studio-btn-secundario mt-3">
          <StudioIcon name="envio" size={18} />
          Enviar imagem para a biblioteca
        </Link>
      </div>
    </div>
  );
}
