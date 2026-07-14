'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { z } from 'zod';
import { fieldErrorsFrom, type FieldErrorTranslator } from './field-errors';

/**
 * Client-side pass of the SAME zod schema the Server Action enforces — the
 * server stays the trust boundary; this only saves the round trip and fixes
 * the error-feedback timing ("reward early, punish late"):
 *
 * - submit: full parse; invalid → block the action, show every field error,
 *   focus the first offending input (keyboard/SR users included).
 * - blur:   validate just the left field, and only once it has a value —
 *   tabbing through an empty form stays quiet until submit.
 * - change: a field already in error re-validates as the user types, so the
 *   message disappears the moment the value is fixed.
 * - server: when the action returns `fieldErrors` (it re-validates + knows
 *   things the client can't), they replace the client picture and focus moves
 *   to the first offending field again.
 *
 * Wiring is event delegation on the <form> (focus/input events bubble in
 * React) — no per-field plumbing:
 *
 *   const { errors, formProps } = useFormValidation(schema, {
 *     serverErrors: state.fieldErrors, t,
 *   });
 *   <form action={formAction} {...formProps}>
 *     <Field name="username" error={errors.username} … />
 */
export function useFormValidation(
  schema: z.ZodType,
  {
    serverErrors,
    t,
  }: { serverErrors?: Record<string, string>; t: FieldErrorTranslator },
) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // The action's response is authoritative: replace whatever the client
  // believed. Render-time adjustment (not an effect) per the React
  // "adjusting state when a prop changes" pattern.
  const [seenServerErrors, setSeenServerErrors] = useState(serverErrors);
  if (serverErrors !== seenServerErrors) {
    setSeenServerErrors(serverErrors);
    if (serverErrors) setErrors(serverErrors);
  }

  // DOM focus is a genuine effect: keyboard/SR users get taken to the first
  // field the server rejected.
  useEffect(() => {
    if (serverErrors) focusFirstError(formRef.current, serverErrors);
  }, [serverErrors]);

  const validate = useCallback(
    (form: HTMLFormElement): Record<string, string> => {
      const parsed = schema.safeParse(Object.fromEntries(new FormData(form)));
      return parsed.success ? {} : fieldErrorsFrom(parsed.error, t);
    },
    [schema, t],
  );

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      const found = validate(event.currentTarget);
      if (Object.keys(found).length === 0) {
        setErrors({});
        return; // let the Server Action run
      }
      event.preventDefault();
      setErrors(found);
      focusFirstError(event.currentTarget, found);
    },
    [validate],
  );

  const onBlur = useCallback(
    (event: React.FocusEvent<HTMLFormElement>) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || !target.name) return;
      if (!target.value) return; // empty fields stay quiet until submit
      const message = validate(event.currentTarget)[target.name];
      setErrors((prev) => withField(prev, target.name, message));
    },
    [validate],
  );

  const onChange = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || !target.name) return;
      // Only re-judge fields already showing an error — typing in a clean
      // field never interrupts. Validate NOW, inside the dispatch, while
      // `event.currentTarget` is still alive — a state updater runs after
      // React has recycled the synthetic event.
      if (!errors[target.name]) return;
      const message = validate(event.currentTarget)[target.name];
      setErrors((prev) => withField(prev, target.name, message));
    },
    [errors, validate],
  );

  return {
    errors,
    formProps: {
      ref: formRef,
      // Browser bubbles are untranslated and off-style; our messages replace them.
      noValidate: true,
      onSubmit,
      onBlur,
      onChange,
    },
  };
}

function withField(
  errors: Record<string, string>,
  name: string,
  message: string | undefined,
): Record<string, string> {
  if (!message) {
    if (!(name in errors)) return errors;
    const rest = { ...errors };
    delete rest[name];
    return rest;
  }
  return { ...errors, [name]: message };
}

function focusFirstError(
  form: HTMLFormElement | null,
  errors: Record<string, string>,
): void {
  if (!form) return;
  for (const element of Array.from(form.elements)) {
    if (
      element instanceof HTMLInputElement &&
      element.type !== 'hidden' && // e.g. referralCode — not focusable
      errors[element.name]
    ) {
      element.focus();
      return;
    }
  }
}
