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
 04/11/2026 Vinícius Nishimura Reis  Textos e imagens editáveis no painel (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { useState } from "react";
import { STANDALONE_FORM_PATHS } from "@/lib/config/navigation";
import type { ResolvedPage } from "@/lib/domain/content/catalog";
import type { FORMULARIOS } from "@/lib/domain/content/catalog/formularios";
import { CONTACT_SUBJECTS, type ContactSubject } from "@/lib/domain/forms/schemas";
import { CheckboxField, HoneypotField, SelectField, TextArea, TextField } from "./fields";
import {
  FormErrorBanner,
  FormSuccess,
  PrivacyConsentText,
  SubmitButton,
  TechnicalFields,
  type TextosComuns,
} from "./form-parts";
import { useSubmission, type FormAction } from "./use-submission";

type TextosContato = ResolvedPage<typeof FORMULARIOS>["contato"];

/** As chaves dos assuntos são as do formulário e do banco: daqui só muda o nome que a pessoa lê. */
const subjectOptions = (textos: TextosContato) => {
  const labels: Record<ContactSubject, string> = {
    parceria: textos.assuntoParceria,
    imprensa: textos.assuntoImprensa,
    "fazer-parte": textos.assuntoFazerParte,
    duvida: textos.assuntoDuvida,
    outro: textos.assuntoOutro,
  };
  return (Object.keys(CONTACT_SUBJECTS) as ContactSubject[]).map((value) => ({ value, label: labels[value] }));
};

/** Formulário de contato institucional — campos de FORM-01. */
export function ContactForm(props: {
  action: FormAction;
  preselectedSubject?: string;
  textos: TextosContato;
  comum: TextosComuns;
}) {
  const [round, setRound] = useState(0);
  return <ContactFormInner key={round} {...props} onReset={() => setRound((value) => value + 1)} />;
}

function ContactFormInner({
  action,
  preselectedSubject,
  textos,
  comum,
  onReset,
}: {
  action: FormAction;
  preselectedSubject?: string;
  textos: TextosContato;
  comum: TextosComuns;
  onReset: () => void;
}) {
  const { state, formAction, onSubmit, pending, meta, formRef, errors, values } = useSubmission(
    "contact",
    action,
    STANDALONE_FORM_PATHS.contact,
  );
  if (state.status === "success") {
    return <FormSuccess protocol={state.protocol} title={textos.sucesso} onReset={onReset} textos={comum} />;
  }
  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate className="relative space-y-5">
      <TechnicalFields meta={meta} />
      <HoneypotField />
      <FormErrorBanner state={state} textos={comum} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="name"
          label={textos.nome}
          required
          autoComplete="name"
          maxLength={120}
          errors={errors.name}
          defaultValue={values.name}
        />
        <TextField
          name="email"
          label={textos.email}
          type="email"
          inputMode="email"
          required
          autoComplete="email"
          errors={errors.email}
          defaultValue={values.email}
        />
        <TextField
          name="phone"
          label={textos.telefone}
          optionalLabel={comum.opcional}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          hint={textos.telefoneDica}
          errors={errors.phone}
          defaultValue={values.phone}
        />
        <SelectField
          name="subject"
          label={textos.assunto}
          required
          options={subjectOptions(textos)}
          placeholder={comum.selecione}
          errors={errors.subject}
          defaultValue={values.subject ?? preselectedSubject}
        />
      </div>
      <TextArea
        name="message"
        label={textos.mensagem}
        required
        rows={6}
        maxLength={3000}
        errors={errors.message}
        defaultValue={values.message}
      />
      <CheckboxField name="privacyConsent" required errors={errors.privacyConsent}>
        <PrivacyConsentText textos={comum} />
      </CheckboxField>
      <SubmitButton pending={pending} textos={comum}>
        {textos.botao}
      </SubmitButton>
    </form>
  );
}
