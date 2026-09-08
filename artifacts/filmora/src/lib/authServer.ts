import crypto from "crypto";

/**
 * Lightweight Gmail-OTP auth for MOVIE BOX.
 * - OTP is emailed through Gmail SMTP (nodemailer).
 * - Session is a signed cookie (HMAC-SHA256), no extra service required.
 * - Users are persisted in MongoDB when MONGODB_URI is configured,
 *   otherwise kept in an in-memory map (dev / demo mode).
 */

const SECRET = process.env.AUTH_SECRET ?? "movie-box-dev-secret-change-me";
export const SESSION_COOKIE = "mb_session";
export const OTP_TTL_MS = 10 * 60 * 1000;
export const SESSION_TTL_S = 60 * 60 * 24 * 30;

export interface SessionUser {
  email: string;
  name: string;
  picture?: string;
}

/* ── signed cookie ─────────────────────────────────────────── */

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function createSessionToken(user: SessionUser): string {
  const body = Buffer.from(
    JSON.stringify({ ...user, exp: Date.now() + SESSION_TTL_S * 1000 })
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function readSessionToken(token?: string | null): (SessionUser & { exp: number }) | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

/* ── OTP store ─────────────────────────────────────────────── */

interface OtpRecord {
  hash: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
}

const globalStore = globalThis as unknown as { __mbOtp?: Map<string, OtpRecord> };
const otpStore: Map<string, OtpRecord> = globalStore.__mbOtp ?? new Map();
globalStore.__mbOtp = otpStore;

export const hashOtp = (email: string, code: string) =>
  crypto.createHmac("sha256", SECRET).update(`${email.toLowerCase()}:${code}`).digest("hex");

export function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export function saveOtp(email: string, code: string) {
  otpStore.set(email.toLowerCase(), {
    hash: hashOtp(email, code),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    lastSentAt: Date.now(),
  });
}

export function canResend(email: string): boolean {
  const rec = otpStore.get(email.toLowerCase());
  return !rec || Date.now() - rec.lastSentAt > 45_000;
}

export type VerifyResult = "ok" | "expired" | "invalid" | "too_many";

export function verifyOtp(email: string, code: string): VerifyResult {
  const key = email.toLowerCase();
  const rec = otpStore.get(key);
  if (!rec) return "expired";
  if (rec.expiresAt < Date.now()) {
    otpStore.delete(key);
    return "expired";
  }
  if (rec.attempts >= 5) {
    otpStore.delete(key);
    return "too_many";
  }
  rec.attempts += 1;
  if (rec.hash !== hashOtp(email, code)) return "invalid";
  otpStore.delete(key);
  return "ok";
}

export const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
