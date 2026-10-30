/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : auth-forms.tsx
 Descrição    : Formulários de login, recuperação e nova senha (useActionState).

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 29/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-02).
 26/10/2026 Vinícius Nishimura Reis  Formulário único no shell; next por promessa (B-08) (ADM-02).
 29/10/2026 Caio Moraes              Cores via tokens do tema (ADM-04).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import Link from "next/link";
import { Suspense, use, useActionState } from "react";
import type { AuthFormState } from "@/lib/domain/auth/redirect";

type AuthAction = (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;

const input =
  "w-full rounded-xl border-2 border-benja-verde/20 bg-white px-4 py-3 text-base outline-none transition focus:border-benja-lima focus:ring-4 focus:ring-benja-lima/25";
const button =
  "w-full rounded-full bg-benja-verde px-6 py-3 font-bold text-benja-nyanza transition hover:bg-benja-verde-hover disabled:cursor-wait disabled:opacity-60";

function Feedback({ state }: { state: AuthFormState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-xl bg-benja-erro-fundo px-4 py-3 text-sm font-medium text-benja-erro-texto">
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p role="status" className="rounded-xl bg-benja-sucesso-fundo px-4 py-3 text-sm font-medium text-benja-verde">
        {state.message}
      </p>
    );
  }
  return null;
}

/**
 * Formulário de login. Fica no shell estático da página e não é trocado depois: o destino de
 * retorno (`next`) chega como promessa e só o campo oculto espera por ele. Antes, o fallback
 * do Suspense era outro formulário, substituído ao carregar — o que já tinha sido digitado se
 * perdia (B-08, QA-04).
 */
export function LoginForm({ action, next }: { action: AuthAction; next?: Promise<string | undefined> }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next ? (
        <Suspense fallback={null}>
          <NextField next={next} />
        </Suspense>
      ) : null}
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-semibold">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          className={input}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-semibold">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={input}
        />
      </div>
      <Feedback state={state} />
      <button type="submit" className={button} disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
      <p className="text-center text-sm">
        <Link href="/admin/recuperar-senha" className="font-semibold text-benja-verde underline underline-offset-4">
          Esqueci minha senha
        </Link>
      </p>
    </form>
  );
}

function NextField({ next }: { next: Promise<string | undefined> }) {
  return <input type="hidden" name="next" value={use(next) ?? ""} />;
}

export function ResetRequestForm({ action }: { action: AuthAction }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-semibold">
          E-mail cadastrado
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          className={input}
        />
      </div>
      <Feedback state={state} />
      <button type="submit" className={button} disabled={pending}>
        {pending ? "Enviando…" : "Enviar link"}
      </button>
      <p className="text-center text-sm">
        <Link href="/admin/login" className="font-semibold text-benja-verde underline underline-offset-4">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}

export function NewPasswordForm({ action }: { action: AuthAction }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-semibold">
          Nova senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          aria-describedby="password-hint"
          className={input}
        />
        <p id="password-hint" className="text-xs text-benja-grafite/70">
          Mínimo de 12 caracteres, combinando letras e números.
        </p>
      </div>
      <div className="space-y-1">
        <label htmlFor="confirmation" className="text-sm font-semibold">
          Confirme a nova senha
        </label>
        <input
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          required
          className={input}
        />
      </div>
      <Feedback state={state} />
      <button type="submit" className={button} disabled={pending}>
        {pending ? "Salvando…" : "Salvar senha"}
      </button>
    </form>
  );
}
