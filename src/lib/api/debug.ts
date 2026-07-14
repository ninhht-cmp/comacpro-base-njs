/**
 * Build a copy-paste `curl` for a serverFetch call so a failing backend
 * request can be reproduced and handed to the BE/FE team as-is. The bearer
 * token is REDACTED to a placeholder — logs must never carry a live
 * credential, and the recipient substitutes their own.
 */
const TOKEN_PLACEHOLDER = '$TOKEN';

export function buildCurl(
  method: string,
  url: string,
  headers: Record<string, string>,
  jsonBody?: unknown,
): string {
  const parts = [`curl -X ${method.toUpperCase()} '${url}'`];
  for (const [key, value] of Object.entries(headers)) {
    const safe = /^authorization$/i.test(key)
      ? `Bearer ${TOKEN_PLACEHOLDER}`
      : value;
    parts.push(`-H '${key}: ${safe}'`);
  }
  if (jsonBody !== undefined) {
    parts.push(`-d '${JSON.stringify(jsonBody)}'`);
  }
  // One flag per line — long requests stay readable when pasted into a shell.
  return parts.join(' \\\n  ');
}
