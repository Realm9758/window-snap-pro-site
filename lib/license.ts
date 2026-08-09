import { randomBytes } from "crypto";

/**
 * Licence key format.
 *
 * `RDK` is the current prefix. `WSP` predates the Window Snap Pro → Redock
 * rename and must stay accepted indefinitely: a key someone paid for cannot
 * stop validating because the product changed its name. The macOS app applies
 * the same rule (see `LicenseFormat` in ProActivationView.swift) — change one
 * and you must change the other.
 */
export const LICENSE_PREFIXES = ["RDK", "WSP"] as const;
export const CURRENT_LICENSE_PREFIX = LICENSE_PREFIXES[0];

const KEY_PATTERN = new RegExp(
  `^(${LICENSE_PREFIXES.join("|")})-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$`
);

/** Cryptographically secure key in RDK-XXXX-XXXX-XXXX format. */
export function generateLicenseKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segment = (len: number): string => {
    const bytes = randomBytes(len * 2);
    return Array.from({ length: len }, (_, i) => chars[bytes[i] % chars.length]).join("");
  };
  return `${CURRENT_LICENSE_PREFIX}-${segment(4)}-${segment(4)}-${segment(4)}`;
}

/**
 * Normalises user input into canonical form, preserving whichever known prefix
 * the key carries. Handles missing hyphens, lowercase and stray whitespace.
 */
export function normalizeLicenseKey(raw: string): string {
  const stripped = raw.trim().toUpperCase().replace(/[\s\-]/g, "");
  const prefix = LICENSE_PREFIXES.find((p) => stripped.startsWith(p));
  if (prefix && stripped.length === 15) {
    return `${prefix}-${stripped.slice(3, 7)}-${stripped.slice(7, 11)}-${stripped.slice(11, 15)}`;
  }
  // Unrecognised shape — hand it back for validation to reject.
  return raw.trim().toUpperCase();
}

/** True only for an exactly-formed key with a known prefix. */
export function isValidLicenseKeyFormat(key: string): boolean {
  return KEY_PATTERN.test(key);
}
