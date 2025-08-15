/**
 * Normalizes certificate data by converting escaped newlines to proper newlines
 * and handling empty/whitespace-only strings.
 *
 * This utility is commonly needed when handling certificate data from form inputs
 * where newlines may be escaped as \\n instead of proper \n characters.
 *
 * @param certData - The certificate data string to normalize
 * @returns Normalized certificate data with proper newlines, or null if empty/whitespace-only
 */
export function normalizeCertificateNewlines(certData: string): string | null {
  if (!certData) return null;
  const normalized = certData.replace(/\\n/g, '\n').trim();
  return normalized || null;
}
