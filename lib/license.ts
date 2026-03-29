import { randomBytes } from "crypto";

/**
 * Generates a cryptographically secure license key in WSP-XXXX-XXXX-XXXX format.
 */
export function generateLicenseKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segment = (len: number): string => {
    const bytes = randomBytes(len * 2);
    return Array.from({ length: len }, (_, i) => chars[bytes[i] % chars.length]).join("");
  };
  return `WSP-${segment(4)}-${segment(4)}-${segment(4)}`;
}

/**
 * Normalises user input into the canonical WSP-XXXX-XXXX-XXXX form.
 * Handles missing hyphens, lowercase, and extra whitespace.
 */
export function normalizeLicenseKey(raw: string): string {
  const stripped = raw.trim().toUpperCase().replace(/[\s\-]/g, "");
  if (stripped.startsWith("WSP") && stripped.length === 15) {
    return `WSP-${stripped.slice(3, 7)}-${stripped.slice(7, 11)}-${stripped.slice(11, 15)}`;
  }
  // Return original uppercased trimmed value if format doesn't match — let validation reject it
  return raw.trim().toUpperCase();
}

/**
 * Returns true only when the key exactly matches WSP-XXXX-XXXX-XXXX.
 */
export function isValidLicenseKeyFormat(key: string): boolean {
  return /^WSP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key);
}
