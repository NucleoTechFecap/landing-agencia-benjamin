/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : contact-form.tsx
 Descrição    : Formulário de contato institucional.

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
 04/11/2026 Vinícius Nishimura Reis  Página estática para o envio sem JavaScript (FORM-08).
 04/11/2026 Vinícius Nishimura Reis  Envio pelo onSubmit do hook (FORM-08).
 04/11/2026 Vinícius Nishimura Reis  Validação no navegador (FORM-04/FORM-05).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { useState } from "react";
import { STANDALONE_FORM_PATHS } from "@/lib/config/navigation";
import { CONTACT_SUBJECTS } from "@/lib/domain/forms/schemas";
import { CheckboxField, HoneypotField, SelectField, TextArea, TextField } from "./fields";
import { FormErrorBanner, FormSuccess, PrivacyConsentText, SubmitButton, TechnicalFields } from "./form-parts";
import { useSubmission, type FormAction } from "./use-submission";

const SUBJECT_OPTIONS = Object.entries(CONTACT_SUBJECTS).map(([value, label]) => ({ value, label }));

/** Formulário de contato institucional — campos de FORM-01. */
export function ContactForm(props: { action: FormAction; preselectedSubject?: string }) {
  const [round, setRound] = useState(0);
  return <ContactFormInner key={round} {...props} onReset={() => setRound((value) => value + 1)} />;
}

function ContactFormInner({
  action,
  preselectedSubject,
  onReset,
}: {
  action: FormAction;
  preselectedSubject?: string;
  onReset: () => void;
}) {
  const { state, formAction, onSubmit, pending, meta, formRef, errors, values } = useSubmission(
    "contact",
    action,
    STANDALONE_FORM_PATHS.contact,
  );
  if (state.status === "success") {
    return <FormSuccess protocol={state.protocol} title="Mensagem enviada!" onReset={onReset} />;
  }
  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate className="relative space-y-5">
      <TechnicalFields meta={meta} />
      <HoneypotField />
      <FormErrorBanner state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="name"
          label="Nome"
          required
          autoComplete="name"
          maxLength={120}
          errors={errors.name}
          defaultValue={values.name}
        />
        <TextField
          name="email"
          label="E-mail"
          type="email"
          inputMode="email"
          required
          autoComplete="email"
          errors={errors.email}
          defaultValue={values.email}
        />
        <TextField
          name="phone"
          label="Telefone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          hint="Com DDD."
          errors={errors.phone}
          defaultValue={values.phone}
        />
        <SelectField
          name="subject"
          label="Assunto"
          required
          options={SUBJECT_OPTIONS}
          placeholder="Selecione"
          errors={errors.subject}
          defaultValue={values.subject ?? preselectedSubject}
        />
      </div>
      <TextArea
        name="message"
        label="Mensagem"
        required
        rows={6}
        maxLength={3000}
        errors={errors.message}
        defaultValue={values.message}
      />
      <CheckboxField name="privacyConsent" required errors={errors.privacyConsent}>
        <PrivacyConsentText />
      </CheckboxField>
      <SubmitButton pending={pending}>Enviar mensagem</SubmitButton>
    </form>
  );
}
