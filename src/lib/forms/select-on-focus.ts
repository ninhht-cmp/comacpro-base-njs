import type { FocusEvent } from 'react';

/**
 * Type-to-replace for auth forms (attach as the form's `onFocus`): a rejected
 * value (a phone, a name) is usually retyped whole, so focusing a filled
 * input selects its content — the first keystroke replaces it. A second
 * click still places the caret for surgical edits (the input is already
 * focused, so no new focus event fires).
 */
export function selectOnFocus(event: FocusEvent<HTMLFormElement>) {
  const target = event.target;
  if (target instanceof HTMLInputElement && target.value) target.select();
}
