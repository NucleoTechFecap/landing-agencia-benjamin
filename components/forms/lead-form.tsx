/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : lead-form.tsx
 Descrição    : Formulário de novos projetos (prospecção).

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
import { UNKNOWN_SERVICE } from "@/lib/domain/forms/schemas";
import { CheckboxField, HoneypotField, SelectField, TextArea, TextField } from "./fields";
import { FormErrorBanner, FormSuccess, PrivacyConsentText, SubmitButton, TechnicalFields } from "./form-parts";
import { useSubmission, type FormAction } from "./use-submission";

export interface ServiceOption {
  value: string;
  label: string;
}

/** Formulário de novos projetos (prospecção) — campos de FORM-01. */
export function LeadForm(props: { action: FormAction; services: ServiceOption[]; preselectedService?: string }) {
  const [round, setRound] = useState(0);
  return <LeadFormInner key={round} {...props} onReset={() => setRound((value) => value + 1)} />;
}

function LeadFormInner({
  action,
  services,
  preselectedService,
  onReset,
}: {
  action: FormAction;
  services: ServiceOption[];
  preselectedService?: string;
  onReset: () => void;
}) {
  const { state, formAction, pending, meta, formRef, errors, values } = useSubmission(action);
  if (state.status === "success") {
    return <FormSuccess protocol={state.protocol} title="Pedido recebido!" onReset={onReset} />;
  }
  return (
    <form ref={formRef} action={formAction} noValidate className="relative space-y-5">
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
          label="Telefone / WhatsApp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          hint="Com DDD. Ex.: (11) 91234-5678"
          errors={errors.phone}
          defaultValue={values.phone}
        />
        <TextField
          name="company"
          label="Empresa ou organização"
          autoComplete="organization"
          maxLength={120}
          errors={errors.company}
          defaultValue={values.company}
        />
      </div>
      <SelectField
        name="serviceInterest"
        label="Serviço de interesse"
        options={[...services, { value: UNKNOWN_SERVICE, label: "Ainda não sei — quero uma indicação" }]}
        placeholder="Selecione"
        errors={errors.serviceInterest}
        defaultValue={values.serviceInterest ?? preselectedService}
      />
      <TextArea
        name="projectDescription"
        label="Conte sobre o projeto"
        required
        rows={6}
        maxLength={3000}
        hint="Objetivo, público, prazo desejado e o que mais for importante."
        errors={errors.projectDescription}
        defaultValue={values.projectDescription}
      />
      <CheckboxField name="privacyConsent" required errors={errors.privacyConsent}>
        <PrivacyConsentText />
      </CheckboxField>
      <SubmitButton pending={pending} ready={Boolean(meta.submissionId)}>
        Enviar pedido
      </SubmitButton>
    </form>
  );
}
