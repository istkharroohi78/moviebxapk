import crypto from "crypto";

/**
 * Simple "are you human?" math check (number addition) for MOVIE BOX.
 * Stateless: the challenge is an HMAC-signed token, so it works on any server.
 */

const SECRET = process.env.AUTH_SECRET ?? "movie-box-dev-secret-change-me";
const TTL_MS = 5 * 60 * 1000;

function sign(body: string) {
  return crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
}

export interface HumanChallenge {
  a: number;
  b: number;
  token: string;
}

export function createHumanChallenge(): HumanChallenge {
  const a = 1 + Math.floor(Math.random() * 9);
  const b = 1 + Math.floor(Math.random() * 9);
  const body = Buffer.from(JSON.stringify({ s: a + b, exp: Date.now() + TTL_MS })).toString(
    "base64url"
  );
  return { a, b, token: `${body}.${sign(body)}` };
}

export function verifyHumanChallenge(token?: string | null, answer?: unknown): boolean {
  if (!token) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  const expected = sign(body);
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as {
      s: number;
      exp: number;
    };
    if (Date.now() > data.exp) return false;
    return Number(answer) === data.s;
  } catch {
    return false;
  }
}
