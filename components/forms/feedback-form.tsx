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
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { useState } from "react";
import { FEEDBACK_PROFILES } from "@/lib/domain/forms/schemas";
import { CheckboxField, HoneypotField, TextArea, TextField } from "./fields";
import { FormErrorBanner, FormSuccess, PrivacyConsentText, SubmitButton, TechnicalFields } from "./form-parts";
import { useSubmission, type FormAction } from "./use-submission";

/** Formulário de feedback — pode ser anônimo (FORM-01 / SEG-01). */
export function FeedbackForm({ action }: { action: FormAction }) {
  const [round, setRound] = useState(0);
  return <FeedbackFormInner key={round} action={action} onReset={() => setRound((value) => value + 1)} />;
}

function FeedbackFormInner({ action, onReset }: { action: FormAction; onReset: () => void }) {
  const { state, formAction, pending, meta, formRef, errors, values } = useSubmission(action);
  if (state.status === "success") {
    return <FormSuccess protocol={state.protocol} title="Obrigado pelo feedback!" onReset={onReset} />;
  }
  return (
    <form ref={formRef} action={formAction} noValidate className="relative space-y-6">
      <TechnicalFields meta={meta} />
      <HoneypotField />
      <FormErrorBanner state={state} />

      <fieldset aria-describedby={errors.profile ? "profile-erro" : undefined}>
        <legend className="text-sm font-bold">
          Você é <span aria-hidden className="text-benja-laranja">*</span>
          <span className="sr-only"> (obrigatório)</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(FEEDBACK_PROFILES).map(([value, label]) => (
            <label key={value} className="cursor-pointer">
              <input type="radio" name="profile" value={value} defaultChecked={values.profile === value} className="peer sr-only" />
              <span className="inline-block rounded-full border-2 border-benja-noite bg-white px-4 py-2 text-sm font-bold peer-checked:bg-benja-verde peer-checked:text-benja-nyanza peer-focus-visible:outline-3 peer-focus-visible:outline-benja-azul">
                {label}
              </span>
            </label>
          ))}
        </div>
        {errors.profile ? (
          <p id="profile-erro" className="mt-1 text-sm font-semibold text-[#9a2e00]">
            {errors.profile[0]}
          </p>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-bold">
          Que nota você dá para a Benjamin? <span className="font-normal text-benja-grafite/70">(opcional)</span>
        </legend>
        <div className="mt-2 flex gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <label key={rating} className="cursor-pointer">
              <input type="radio" name="rating" value={rating} defaultChecked={values.rating === String(rating)} className="peer sr-only" />
              <span className="flex size-11 items-center justify-center rounded-full border-2 border-benja-noite bg-white font-black peer-checked:bg-benja-lima peer-checked:text-benja-verde peer-focus-visible:outline-3 peer-focus-visible:outline-benja-azul">
                {rating}
                <span className="sr-only"> de 5</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <TextArea name="message" label="Seu feedback" required rows={6} maxLength={2000} errors={errors.message} defaultValue={values.message} />

      <div className="rounded-2xl border-2 border-dashed border-benja-verde/30 p-4">
        <p className="text-sm font-bold">Quer se identificar? Os campos abaixo são opcionais.</p>
        <div className="mt-3 grid gap-5 sm:grid-cols-2">
          <TextField name="name" label="Nome" autoComplete="name" maxLength={120} errors={errors.name} defaultValue={values.name} />
          <TextField name="email" label="E-mail" type="email" inputMode="email" autoComplete="email" errors={errors.email} defaultValue={values.email} />
        </div>
        <div className="mt-4">
          <CheckboxField name="allowContact" defaultChecked={values.allowContact === "on"}>
            Quero receber um retorno da Benjamin sobre este feedback (precisa do e-mail).
          </CheckboxField>
        </div>
      </div>

      <CheckboxField name="privacyConsent" required errors={errors.privacyConsent}>
        <PrivacyConsentText />
      </CheckboxField>
      <SubmitButton pending={pending} ready={Boolean(meta.submissionId)}>
        Enviar feedback
      </SubmitButton>
    </form>
  );
}
