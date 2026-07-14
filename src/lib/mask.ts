/**
 * PII masking — one home so "how do we mask a value before logging or showing
 * it" has a single obvious answer.
 *
 * Phone masking has two variants on purpose: log masking keeps more of the
 * prefix so a fraud-investigation timeline stays legible; display masking
 * shows the minimum that still lets the user confirm which number a message
 * went to.
 */

/** `0981958280` → `0981xxx280` — fraud-investigation trail (signup logs). */
export function maskPhoneForLog(phone: string): string {
  return phone.length < 7 ? '***' : `${phone.slice(0, 4)}xxx${phone.slice(-3)}`;
}

/** `0981958280` → `09•••••280` — confirms where the Zalo message went (shown to the user). */
export function maskPhoneForDisplay(phone: string): string {
  if (phone.length < 6) return phone;
  return `${phone.slice(0, 2)}${'•'.repeat(phone.length - 5)}${phone.slice(-3)}`;
}

/** `012345678901` → `••• ••• 901` — CCCD on the account page (owner already knows it). */
export function maskIdCard(idCard: string): string {
  return idCard.length <= 3 ? idCard : `••• ••• ${idCard.slice(-3)}`;
}
