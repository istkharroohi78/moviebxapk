import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "fw_admin_tok";
export const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h

export function computeAdminToken(): string {
  const email = process.env.ADMIN_EMAIL ?? "admin@moviebox.com";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const secret = process.env.ADMIN_SECRET ?? "fw-default-admin-secret";
  return createHmac("sha256", secret).update(`${email}::${password}`).digest("hex");
}

export function verifyAdminToken(value: string | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  const expected = computeAdminToken();
  try {
    const a = Buffer.from(value, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL ?? "admin@moviebox.com",
    password: process.env.ADMIN_PASSWORD ?? "admin123",
  };
}
