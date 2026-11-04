/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : feedback-form.tsx
 Descrição    : Formulário de feedback com identificação opcional.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 25/10/2026 Caio Moraes              Cores de erro via tokens do tema (LAY-04).
 04/11/2026 Vinícius Nishimura Reis  Botão disponível antes da hidratação (FORM-08).
 04/11/2026 Vinícius Nishimura Reis  Envio pelo onSubmit do hook (FORM-08).
 04/11/2026 Vinícius Nishimura Reis  Validação no navegador (FORM-04/FORM-05).
 04/11/2026 Vinícius Nishimura Reis  Textos e imagens editáveis no painel (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { useState } from "react";
import type { ResolvedPage } from "@/lib/domain/content/catalog";
import type { FORMULARIOS } from "@/lib/domain/content/catalog/formularios";
import { FEEDBACK_PROFILES, type FeedbackProfile } from "@/lib/domain/forms/schemas";
import { CheckboxField, HoneypotField, TextArea, TextField } from "./fields";
import {
  FormErrorBanner,
  FormSuccess,
  PrivacyConsentText,
  SubmitButton,
  TechnicalFields,
  type TextosComuns,
} from "./form-parts";
import { useSubmission, type FormAction } from "./use-submission";

type TextosFeedback = ResolvedPage<typeof FORMULARIOS>["feedback"];

/** As chaves dos perfis são as do formulário e do banco: daqui só muda o nome que a pessoa lê. */
const profileLabels = (textos: TextosFeedback): Record<FeedbackProfile, string> => ({
  cliente: textos.perfilCliente,
  parceiro: textos.perfilParceiro,
  aluno: textos.perfilAluno,
  comunidade: textos.perfilComunidade,
  outro: textos.perfilOutro,
});

/** Formulário de feedback — pode ser anônimo (FORM-01 / SEG-01). */
export function FeedbackForm(props: { action: FormAction; textos: TextosFeedback; comum: TextosComuns }) {
  const [round, setRound] = useState(0);
  return <FeedbackFormInner key={round} {...props} onReset={() => setRound((value) => value + 1)} />;
}

function FeedbackFormInner({
  action,
  textos,
  comum,
  onReset,
}: {
  action: FormAction;
  textos: TextosFeedback;
  comum: TextosComuns;
  onReset: () => void;
}) {
  const labels = profileLabels(textos);
  const { state, formAction, onSubmit, pending, meta, formRef, errors, values } = useSubmission("feedback", action);
  if (state.status === "success") {
    return <FormSuccess protocol={state.protocol} title={textos.sucesso} onReset={onReset} textos={comum} />;
  }
  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate className="relative space-y-6">
      <TechnicalFields meta={meta} />
      <HoneypotField />
      <FormErrorBanner state={state} textos={comum} />

      <fieldset
        role="radiogroup"
        aria-invalid={errors.profile ? true : undefined}
        aria-describedby={errors.profile ? "profile-erro" : undefined}
      >
        <legend className="text-sm font-bold">
          {textos.perfil}{" "}
          <span aria-hidden className="text-benja-laranja">
            *
          </span>
          <span className="sr-only"> (obrigatório)</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(FEEDBACK_PROFILES) as FeedbackProfile[]).map((value) => (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name="profile"
                value={value}
                defaultChecked={values.profile === value}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full border-2 border-benja-noite bg-white px-4 py-2 text-sm font-bold peer-checked:bg-benja-verde peer-checked:text-benja-nyanza peer-focus-visible:outline-3 peer-focus-visible:outline-benja-azul">
                {labels[value]}
              </span>
            </label>
          ))}
        </div>
        {errors.profile ? (
          <p id="profile-erro" className="mt-1 text-sm font-semibold text-benja-erro">
            {errors.profile[0]}
          </p>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-bold">
          {textos.nota} <span className="font-normal text-benja-grafite/70">{comum.opcional}</span>
        </legend>
        <div className="mt-2 flex gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <label key={rating} className="cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={rating}
                defaultChecked={values.rating === String(rating)}
                className="peer sr-only"
              />
              <span className="flex size-11 items-center justify-center rounded-full border-2 border-benja-noite bg-white font-black peer-checked:bg-benja-lima peer-checked:text-benja-verde peer-focus-visible:outline-3 peer-focus-visible:outline-benja-azul">
                {rating}
                <span className="sr-only"> de 5</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <TextArea
        name="message"
        label={textos.mensagem}
        required
        rows={6}
        maxLength={2000}
        errors={errors.message}
        defaultValue={values.message}
      />

      <div className="rounded-2xl border-2 border-dashed border-benja-verde/30 p-4">
        <p className="text-sm font-bold">{textos.identificar}</p>
        <div className="mt-3 grid gap-5 sm:grid-cols-2">
          <TextField
            name="name"
            label={textos.nome}
            optionalLabel={comum.opcional}
            autoComplete="name"
            maxLength={120}
            errors={errors.name}
            defaultValue={values.name}
          />
          <TextField
            name="email"
            label={textos.email}
            optionalLabel={comum.opcional}
            type="email"
            inputMode="email"
            autoComplete="email"
            errors={errors.email}
            defaultValue={values.email}
          />
        </div>
        <div className="mt-4">
          <CheckboxField name="allowContact" defaultChecked={values.allowContact === "on"}>
            {textos.retorno}
          </CheckboxField>
        </div>
      </div>

      <CheckboxField name="privacyConsent" required errors={errors.privacyConsent}>
        <PrivacyConsentText textos={comum} />
      </CheckboxField>
      <SubmitButton pending={pending} textos={comum}>
        {textos.botao}
      </SubmitButton>
    </form>
  );
}
