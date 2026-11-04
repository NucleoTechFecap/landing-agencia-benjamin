/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : settings-form.tsx
 Descrição    : Formulário de contato, links, redes sociais e textos de apresentação no CMS.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-10).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { TextArea, TextField } from "@/components/forms/fields";
import { SETTINGS_LIMITS } from "@/lib/domain/content/settings-schema";
import type { SiteSettings } from "@/lib/domain/content/types";
import { FormSection } from "../ui/primitives";
import { CmsFormShell, type CmsSaveAction } from "./form-shell";

const LEFT_BLANK = "Em branco, não aparece no site.";

const NETWORKS = [
  { name: "instagram", label: "Instagram", example: "https://www.instagram.com/nome-do-perfil" },
  { name: "tiktok", label: "TikTok", example: "https://www.tiktok.com/@nome-do-perfil" },
  { name: "linkedin", label: "LinkedIn", example: "https://www.linkedin.com/company/nome-da-pagina" },
] as const;

/**
 * Campos de site_settings editáveis no painel (ADM-10). `autoComplete` desligado: o navegador não
 * pode preencher um campo público com o e-mail ou o telefone pessoal de quem edita.
 */
export function SettingsForm({
  action,
  settings,
  updatedAt,
  readOnly,
}: {
  action: CmsSaveAction;
  settings: SiteSettings;
  updatedAt: string | null;
  readOnly?: boolean;
}) {
  return (
    <CmsFormShell
      action={action}
      item={updatedAt ? { id: "site_settings", updatedAt } : undefined}
      readOnly={readOnly}
      submitLabel="Salvar e colocar no ar"
    >
      {({ errors, value }) => (
        <>
          <FormSection title="Contato">
            <div className="grid gap-5 md:grid-cols-2">
              <TextField
                name="email"
                label="E-mail"
                type="email"
                inputMode="email"
                autoComplete="off"
                hint={`${LEFT_BLANK} Só é exibido no site: os formulários têm destinatários próprios.`}
                errors={errors("email")}
                defaultValue={value("email", settings.contact.email)}
              />
              <TextField
                name="phone"
                label="Telefone"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                hint={`${LEFT_BLANK} Com DDD, como (11) 3333-3333.`}
                errors={errors("phone")}
                defaultValue={value("phone", settings.contact.phone)}
              />
            </div>
            <TextField
              name="address"
              label="Endereço"
              autoComplete="off"
              maxLength={SETTINGS_LIMITS.address}
              hint={LEFT_BLANK}
              errors={errors("address")}
              defaultValue={value("address", settings.contact.address)}
            />
            <TextField
              name="mapsUrl"
              label="Link do mapa"
              type="url"
              autoComplete="off"
              hint="Link https do mapa. Em branco, o endereço aparece como texto, sem link."
              errors={errors("mapsUrl")}
              defaultValue={value("mapsUrl", settings.contact.mapsUrl)}
            />
          </FormSection>
          <FormSection title="Redes sociais">
            {NETWORKS.map(({ name, label, example }) => (
              <TextField
                key={name}
                name={name}
                label={label}
                type="url"
                autoComplete="off"
                hint={`${LEFT_BLANK} Exemplo: ${example}`}
                errors={errors(name)}
                defaultValue={value(name, settings.socials[name])}
              />
            ))}
          </FormSection>
          <FormSection title="Apresentação no rodapé e nas buscas">
            <TextField
              name="tagline"
              label="Slogan"
              required
              autoComplete="off"
              maxLength={SETTINGS_LIMITS.tagline}
              errors={errors("tagline")}
              defaultValue={value("tagline", settings.tagline)}
            />
            <TextArea
              name="description"
              label="Descrição da agência"
              required
              rows={4}
              maxLength={SETTINGS_LIMITS.description}
              hint={`Até ${SETTINGS_LIMITS.description} caracteres. Aparece no rodapé e como resumo do site nas buscas.`}
              errors={errors("description")}
              defaultValue={value("description", settings.description)}
            />
          </FormSection>
        </>
      )}
    </CmsFormShell>
  );
}
